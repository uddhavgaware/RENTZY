import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ listing, bookingId, onClose }) => {
  const [step, setStep] = useState('ready'); // ready | processing | success | error
  const [paymentMethod, setPaymentMethod] = useState('card'); // card | upi
  const [errorMsg, setErrorMsg] = useState('');

  const handlePay = async () => {
    setStep('processing');
    setErrorMsg('');

    try {
      // 1. Create a Razorpay order via backend
      const orderRes = await api.post('/payments/create-order', { bookingId });
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Open Razorpay Checkout with method configuration
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'RENTZY',
        description: listing.title,
        order_id: orderId,
        handler: async (response) => {
          // 3. Verify payment on backend
          try {
            await api.post('/payments/verify', {
              bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setStep('success');
          } catch (verifyErr) {
            console.error('Verification failed', verifyErr);
            setErrorMsg('Payment verification failed. Please contact support.');
            setStep('error');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        notes: {
          bookingId: bookingId,
        },
        theme: {
          color: '#6366f1',
        },
        // Configure to show specific payment methods based on user selection
        modal: {
          ondismiss: () => {
            setStep('ready');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed', response.error);
        setErrorMsg(response.error.description || 'Payment failed. Please try again.');
        setStep('error');
      });
      rzp.open();
    } catch (err) {
      console.error('Order creation failed', err);
      setErrorMsg('Could not initiate payment. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-500 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X size={22} />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider">RENTZY Secure Checkout</p>
              <p className="font-bold text-lg">{listing.title}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-white/80 text-sm">Total Amount</span>
            <span className="text-2xl font-bold">₹{(listing.price * 3)?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Step: Ready */}
        {step === 'ready' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Lock size={14} />
              <span>This is a <strong>test payment</strong> — no real money will be charged.</span>
            </div>

            {/* Payment Method Tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CreditCard size={16} />
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Smartphone size={16} />
                UPI
              </button>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Payment Summary</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Monthly Rent</span>
                <span className="font-semibold text-gray-900">₹{listing.price?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Security Deposit (2 months)</span>
                <span className="font-semibold text-gray-900">₹{(listing.price * 2)?.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="font-bold text-gray-800">Total Due Now</span>
                <span className="font-bold text-primary-700">₹{(listing.price * 3)?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Test info based on selected method */}
            {paymentMethod === 'card' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-700 font-medium mb-1">🧪 Test Card Details</p>
                <p className="text-xs text-blue-600 font-mono">Card: 4111 1111 1111 1111</p>
                <p className="text-xs text-blue-600 font-mono">Expiry: Any future date · CVV: Any 3 digits</p>
              </div>
            )}
            {paymentMethod === 'upi' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <p className="text-xs text-purple-700 font-medium mb-1">📱 UPI Payment</p>
                <p className="text-xs text-purple-600">Pay via Google Pay, PhonePe, Paytm or any UPI app.</p>
                <p className="text-xs text-purple-600 font-mono mt-1">Test UPI ID: success@razorpay</p>
              </div>
            )}

            <button
              onClick={handlePay}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-primary-600/25 mt-2"
            >
              {paymentMethod === 'upi' ? '📱' : '💳'} Pay ₹{(listing.price * 3)?.toLocaleString('en-IN')} via {paymentMethod === 'upi' ? 'UPI' : 'Card'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Secured by Razorpay · 256-bit SSL Encryption
            </p>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Loader2 size={56} className="text-primary-600 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Opening Razorpay Checkout...</h3>
            <p className="text-gray-500 text-sm">Please complete the payment in the popup window.</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 size={44} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed! 🎉</h3>
            <p className="text-gray-500 text-sm mb-2">
              Your booking for <strong>{listing.title}</strong> is confirmed.
            </p>
            <p className="text-gray-400 text-xs mb-8">
              Payment verified via Razorpay. The owner will contact you within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <X size={44} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep('ready')}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
