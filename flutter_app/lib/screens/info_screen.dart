import 'package:flutter/material.dart';

class InfoScreen extends StatelessWidget {
  final String title;
  
  const InfoScreen({Key? key, required this.title}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Text(
          _getContent(title),
          style: const TextStyle(fontSize: 16, height: 1.6),
        ),
      ),
    );
  }
  
  String _getContent(String title) {
    switch (title.toLowerCase()) {
      case 'about us':
        return 'Welcome to RentXY. We are dedicated to making property hunting simple and broker-free. Our mission is to connect tenants directly with verified owners...';
      case 'privacy policy':
        return 'We value your privacy. Your data is encrypted and stored securely. We do not sell your personal information to third parties...';
      case 'terms & conditions':
        return 'By using RentXY, you agree to our terms of service. Users must provide accurate information and respect the community guidelines...';
      case 'faq':
        return 'Q: Is it really zero brokerage?\nA: Yes! We connect you directly with owners.\n\nQ: How does KYC verification work?\nA: Owners must upload valid government ID which our team verifies before listing properties.';
      default:
        return 'Information not available.';
    }
  }
}
