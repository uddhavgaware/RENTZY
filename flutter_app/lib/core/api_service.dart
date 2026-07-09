import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  late Dio _dio;
  
  ApiService() {
    _dio = Dio(
      BaseOptions(
        // Production URL from --dart-define, or emulator fallback for debug
        baseUrl: _getBaseUrl(),
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            // Handle token expiration globally
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove('token');
            // TODO: dispatch logout event to auth provider
          }
          return handler.next(e);
        },
      ),
    );
  }

  static String _getBaseUrl() {
    // Allow overriding via --dart-define=API_BASE_URL=https://your-api.com/api
    const envUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (envUrl.isNotEmpty) return envUrl;

    // In release mode, use the production API
    if (kReleaseMode) {
      return 'https://rentxybookings.onrender.com/api';
    }

    // Debug mode: use emulator-accessible localhost
    return 'http://10.0.2.2:8080/api';
  }

  Dio get client => _dio;
}

// Global instance
final apiService = ApiService();
