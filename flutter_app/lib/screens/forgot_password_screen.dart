import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _success = false;

  Future<void> _handleSubmit() async {
    if (_emailController.text.isEmpty) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      await apiService.client.post('/auth/forgot-password', data: {'email': _emailController.text.trim()});
      setState(() {
        _success = true;
      });
    } on DioException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.response?.data['message'] ?? 'Failed to send reset email'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.go('/auth'),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Reset your password',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter your email and we\'ll send you a recovery link',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 40),
              
              if (_success) ...[
                const Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 16),
                const Text(
                  'Check your inbox',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'We\'ve sent a password reset link to ${_emailController.text}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => context.go('/auth'),
                  child: const Text('Back to login'),
                )
              ] else ...[
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    hintText: 'you@example.com',
                    prefixIcon: const Icon(Icons.email_outlined),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Send Recovery Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
