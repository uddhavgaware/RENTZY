import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:google_sign_in/google_sign_in.dart';
import '../providers/auth_provider.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _emailOtpSent = false;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();
  
  String _role = 'TENANT'; // Default role for signup
  bool _isLoading = false;

  @override
  void dispose() {
    super.dispose();
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Future<void> _handleSubmit() async {
    setState(() => _isLoading = true);
    final auth = context.read<AuthProvider>();
    
    try {
      if (_emailOtpSent) {
        await auth.verifyEmailOtp(_emailController.text.trim(), _otpController.text.trim());
      } else if (_isLogin) {
        await auth.loginWithEmail(_emailController.text.trim(), _passwordController.text.trim());
      } else {
        await auth.register(
          _nameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text.trim(),
          _role,
        );
        setState(() {
          _emailOtpSent = true;
        });
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    try {
      final googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
        // serverClientId is your Web Client ID from Google Cloud Console.
        // This is REQUIRED to get an idToken on Android.
        // It must be the Web application type client ID (not Android).
        serverClientId: const String.fromEnvironment(
          'GOOGLE_SERVER_CLIENT_ID',
          defaultValue: '', // Set via --dart-define=GOOGLE_SERVER_CLIENT_ID=xxx when building
        ),
      );
      final account = await googleSignIn.signIn();
      if (account != null) {
        final auth = await account.authentication;
        if (auth.idToken != null) {
          await context.read<AuthProvider>().loginWithGoogle(auth.idToken!);
        } else {
          _showError('Google Sign-In failed: Could not obtain idToken. Make sure GOOGLE_SERVER_CLIENT_ID is configured.');
        }
      }
    } catch (e) {
      _showError("Google Sign-In failed: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleTruecallerLogin() async {
    _showError("Truecaller login is currently available on the website only.");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Center(
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF4338CA)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.apartment, color: Colors.white, size: 32),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _emailOtpSent ? 'Verify Email' : (_isLogin ? 'Welcome back' : 'Create an account'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF111827)),
              ),
              const SizedBox(height: 40),
              
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    if (_emailOtpSent) ...[
                      TextField(
                        controller: _otpController,
                        decoration: InputDecoration(
                          hintText: 'Enter OTP',
                          prefixIcon: const Icon(Icons.password, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                    ] else ...[
                      if (!_isLogin) ...[
                        TextField(
                          controller: _nameController,
                          decoration: InputDecoration(
                            hintText: 'Full Name',
                            prefixIcon: const Icon(Icons.person_outline, color: Colors.grey),
                            filled: true,
                            fillColor: const Color(0xFFF9FAFB),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          hintText: 'Email address',
                          prefixIcon: const Icon(Icons.email_outlined, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          hintText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                      if (!_isLogin) ...[
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _role,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.work_outline, color: Colors.grey),
                            filled: true,
                            fillColor: const Color(0xFFF9FAFB),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'TENANT', child: Text('Looking for property (Tenant)')),
                            DropdownMenuItem(value: 'OWNER', child: Text('List a property (Owner)')),
                          ],
                          onChanged: (v) => setState(() => _role = v!),
                        ),
                      ],
                    ],
                    
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isLoading 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(_emailOtpSent ? 'Verify OTP' : (_isLogin ? 'Sign in' : 'Create Account'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    
                    if (!_emailOtpSent) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Row(
                          children: [
                            Expanded(child: Divider()),
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 16),
                              child: Text('Or continue with', style: TextStyle(color: Colors.grey, fontSize: 12)),
                            ),
                            Expanded(child: Divider()),
                          ],
                        ),
                      ),
                      

                      
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton.icon(
                          onPressed: _isLoading ? null : _handleGoogleLogin,
                          icon: const Icon(Icons.g_mobiledata, size: 28),
                          label: const Text('Sign in with Google', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.black12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _isLogin = !_isLogin;
                            _emailOtpSent = false; // Reset if toggling
                          });
                        },
                        child: Text(
                          _isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in',
                          style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold),
                        ),
                      ),
                    ]
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
