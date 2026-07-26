import api from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function setupPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser');
    return;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);

    // 2. Request permission if not already granted
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    // 3. Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 4. Fetch VAPID public key from backend
      const res = await api.get('/notifications/vapid-public-key');
      const vapidPublicKey = res.data.publicKey;

      // 5. Subscribe to Push Manager
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      console.log('Successfully subscribed to Web Push!');
    }

    // 6. Extract raw key buffers and base64url encode them manually for VAPID spec compatibility
    const rawP256dh = subscription.getKey('p256dh');
    const rawAuth = subscription.getKey('auth');
    
    const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(rawP256dh)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuth)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const formattedSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh,
        auth
      }
    };

    await api.post('/notifications/subscribe', formattedSub);
    console.log('Web Push subscription registered with backend!');
  } catch (err) {
    console.error('Error setting up push notifications:', err);
  }
}
