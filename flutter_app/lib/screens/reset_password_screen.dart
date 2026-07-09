import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String? token;
  const ResetPasswordScreen({Key? key, this.token}) : super(key: key);

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _success = false;

  Future<void> _handleSubmit() async {
    if (widget.token == null || widget.token!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invalid token'), backgroundColor: Colors.red));
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match'), backgroundColor: Colors.red));
      return;
    }
    
    setState(() => _isLoading = true);
    
    try {
      await apiService.client.post(
        '/auth/reset-password', 
        data: {'token': widget.token, 'newPassword': _passwordController.text.trim()}
      );
      setState(() => _success = true);
    } on DioException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.response?.data['message'] ?? 'Failed to reset password'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.token == null) {
      return const Scaffold(body: Center(child: Text("Invalid reset token")));
    }

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
                'Create new password',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Your new password must be different from previous used passwords.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 40),
              
              if (_success) ...[
                const Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 16),
                const Text(
                  'Password reset',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your password has been successfully reset.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.go('/auth'),
                  child: const Text('Continue to log in'),
                )
              ] else ...[
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'New Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Confirm Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
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
                    : const Text('Reset Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
