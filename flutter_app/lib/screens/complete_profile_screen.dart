import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../providers/auth_provider.dart';
import '../core/api_service.dart';

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({Key? key}) : super(key: key);

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _confirmPhoneController;
  
  String _gender = 'Male';
  String _occupation = 'Working Professional';
  String _role = 'TENANT';
  
  bool _isLoading = false;
  String? _profilePhotoUrl;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _nameController = TextEditingController(text: user?['name'] ?? '');
    _emailController = TextEditingController(text: user?['email'] ?? '');
    _phoneController = TextEditingController(text: user?['phone'] ?? '');
    _confirmPhoneController = TextEditingController(text: user?['phone'] ?? '');
    _role = user?['role'] ?? 'TENANT';
    if (_role == 'ADMIN') _role = 'ADMIN'; // Preserve admin role if present
    _profilePhotoUrl = user?['profilePhoto'];
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _confirmPhoneController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Future<void> _pickAndCropImage() async {
    // We will use image_picker here
    // final ImagePicker picker = ImagePicker();
    // final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    // if (image != null) {
    //   // TODO: add image cropper later if needed, for now just set url or upload
    //   setState(() => _profilePhotoUrl = image.path); // Displaying local path requires FileImage
    // }
    _showError("Image picking requires actual device/emulator.");
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_phoneController.text != _confirmPhoneController.text) {
      _showError("Phone numbers do not match.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final data = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'gender': _gender,
        'occupation': _occupation,
        'role': _role,
        'profilePhoto': _profilePhotoUrl,
      };

      await apiService.client.put('/users/me', data: data);
      await context.read<AuthProvider>().refreshUser();
      if (mounted) context.go('/');
    } on DioException catch (e) {
      _showError(e.response?.data['message'] ?? 'Failed to update profile');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Complete Profile')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  GestureDetector(
                    onTap: _pickAndCropImage,
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.grey[200],
                      backgroundImage: _profilePhotoUrl != null ? NetworkImage(_profilePhotoUrl!) : null,
                      child: _profilePhotoUrl == null ? const Icon(Icons.camera_alt, size: 40, color: Colors.grey) : null,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
                    enabled: false, // Usually email shouldn't be changed here easily
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
                    keyboardType: TextInputType.phone,
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _confirmPhoneController,
                    decoration: const InputDecoration(labelText: 'Confirm Phone Number', border: OutlineInputBorder()),
                    keyboardType: TextInputType.phone,
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    value: _gender,
                    decoration: const InputDecoration(labelText: 'Gender', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'Male', child: Text('Male')),
                      DropdownMenuItem(value: 'Female', child: Text('Female')),
                      DropdownMenuItem(value: 'Other', child: Text('Other')),
                    ],
                    onChanged: (v) => setState(() => _gender = v!),
                  ),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    value: _occupation,
                    decoration: const InputDecoration(labelText: 'Occupation', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'Student', child: Text('Student')),
                      DropdownMenuItem(value: 'Working Professional', child: Text('Working Professional')),
                      DropdownMenuItem(value: 'Business/Self-employed', child: Text('Business/Self-employed')),
                      DropdownMenuItem(value: 'Home Maker', child: Text('Home Maker')),
                    ],
                    onChanged: (v) => setState(() => _occupation = v!),
                  ),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    value: _role,
                    decoration: const InputDecoration(labelText: 'I am a...', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'TENANT', child: Text('Tenant (Looking for properties)')),
                      DropdownMenuItem(value: 'OWNER', child: Text('Owner (Listing properties)')),
                      DropdownMenuItem(value: 'MOVER', child: Text('Mover (Packers & Movers)')),
                    ],
                    onChanged: (v) => setState(() => _role = v!),
                  ),
                  const SizedBox(height: 24),
                  
                  ElevatedButton(
                    onPressed: _submit,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Save Profile'),
                  ),
                ],
              ),
            ),
          ),
    );
  }
}
