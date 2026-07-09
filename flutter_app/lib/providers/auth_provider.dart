import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  
  bool get isOwner => _user?['role'] == 'OWNER';
  bool get isAdmin => _user?['role'] == 'ADMIN';

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    if (token != null) {
      try {
        await _fetchProfile();
      } catch (e) {
        await prefs.remove('token');
        _isAuthenticated = false;
      }
    } else {
      _isAuthenticated = false;
    }
    
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _fetchProfile() async {
    final response = await apiService.client.get('/users/me');
    _user = response.data;
    _isAuthenticated = true;
  }

  Future<void> _handleAuthResponse(Response response) async {
    final token = response.data['token'];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await _fetchProfile();
    _registerFcmToken(); // Fire-and-forget — non-blocking
    notifyListeners();
  }

  /// Sends the device's FCM push token to the backend so the server can
  /// dispatch push notifications to this specific device.
  Future<void> _registerFcmToken() async {
    try {
      // firebase_messaging.FirebaseMessaging.instance.getToken() gives us the device token.
      // When firebase_messaging is fully initialized, uncomment the lines below:
      //
      // final messaging = firebase_messaging.FirebaseMessaging.instance;
      // await messaging.requestPermission();
      // final fcmToken = await messaging.getToken();
      // if (fcmToken != null) {
      //   await apiService.client.patch('/users/me/fcm-token', data: {'fcmToken': fcmToken});
      //   debugPrint('FCM token registered: $fcmToken');
      // }
      debugPrint('FCM registration placeholder — set up firebase_messaging to activate.');
    } catch (e) {
      debugPrint('Failed to register FCM token: $e');
    }
  }

  Future<void> refreshUser() async {
    try {
      await _fetchProfile();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to refresh user profile: $e');
    }
  }

  Future<void> loginWithEmail(String email, String password) async {
    try {
      final response = await apiService.client.post(
        '/auth/authenticate',
        data: {'email': email, 'password': password},
      );
      await _handleAuthResponse(response);
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Login failed';
    }
  }

  Future<void> loginWithGoogle(String tokenId) async {
    try {
      final response = await apiService.client.post(
        '/auth/google',
        data: {'tokenId': tokenId},
      );
      await _handleAuthResponse(response);
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Google Login failed';
    }
  }

  Future<void> loginWithTruecaller(String payload, String signature, String signatureAlgorithm) async {
    try {
      final response = await apiService.client.post(
        '/auth/truecaller',
        data: {
          'payload': payload,
          'signature': signature,
          'signatureAlgorithm': signatureAlgorithm,
        },
      );
      await _handleAuthResponse(response);
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Truecaller Login failed';
    }
  }

  /// New OAuth 2.0 flow: sends authorization code + code verifier to backend
  /// which exchanges them with Truecaller's token endpoint for user info.
  Future<void> loginWithTruecallerOAuth(String authorizationCode, String codeVerifier) async {
    try {
      final response = await apiService.client.post(
        '/auth/truecaller/oauth',
        data: {
          'authorizationCode': authorizationCode,
          'codeVerifier': codeVerifier,
        },
      );
      await _handleAuthResponse(response);
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Truecaller OAuth Login failed';
    }
  }

  Future<void> loginWithOtp(String phone, String otp) async {
    try {
      final response = await apiService.client.post(
        '/auth/verify-otp',
        data: {'phone': phone, 'otp': otp},
      );
      await _handleAuthResponse(response);
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'OTP Login failed';
    }
  }

  Future<void> register(String name, String email, String password, String role) async {
    try {
      await apiService.client.post(
        '/auth/register',
        data: {'name': name, 'email': email, 'password': password, 'role': role},
      );
      // Not logged in yet, wait for OTP
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Registration failed';
    }
  }

  Future<void> verifyEmailOtp(String email, String otp) async {
    try {
      final response = await apiService.client.post(
        '/auth/verify-email-otp',
        data: {'email': email, 'otp': otp},
      );
      await _handleAuthResponse(response);
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Email verification failed';
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
