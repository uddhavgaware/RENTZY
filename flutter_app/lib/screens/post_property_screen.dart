import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../core/api_service.dart';

class PostPropertyScreen extends StatefulWidget {
  const PostPropertyScreen({Key? key}) : super(key: key);

  @override
  State<PostPropertyScreen> createState() => _PostPropertyScreenState();
}

class _PostPropertyScreenState extends State<PostPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  String _type = 'Flat';
  String _configuration = '1BHK';
  String _furnishing = 'Semi Furnished';
  
  final List<String> _types = ['Flat', 'Apartment', 'Independent House', 'Villa', 'PG', 'Hostel', 'Co-living Space', 'Office Space', 'Warehouse'];
  final List<String> _configs = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'Studio Apartment'];
  final List<String> _furnishings = ['Fully Furnished', 'Semi Furnished', 'Unfurnished'];

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      final data = {
        'title': _titleController.text.trim(),
        'price': double.tryParse(_priceController.text) ?? 0,
        'location': _locationController.text.trim(),
        'type': _type,
        'configuration': _configuration,
        'furnishing': _furnishing,
        'description': _descriptionController.text.trim(),
        'amenities': [], // Simplified for now
        'images': [],    // Requires multipart upload or image pickers natively
      };

      await apiService.client.post('/listings', data: data);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property Posted Successfully!')));
        context.go('/');
      }
    } on DioException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message ?? 'Failed to post property')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Post Property'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Basic Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(labelText: 'Property Title', border: OutlineInputBorder()),
                      validator: (v) => v!.isEmpty ? 'Title is required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _priceController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Monthly Rent (₹)', border: OutlineInputBorder()),
                      validator: (v) => v!.isEmpty ? 'Price is required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _locationController,
                      decoration: const InputDecoration(labelText: 'Location/Address', border: OutlineInputBorder()),
                      validator: (v) => v!.isEmpty ? 'Location is required' : null,
                    ),
                    const SizedBox(height: 24),
                    const Text('Property Type', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _type,
                      items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                      onChanged: (v) => setState(() => _type = v!),
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _configuration,
                            items: _configs.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                            onChanged: (v) => setState(() => _configuration = v!),
                            decoration: const InputDecoration(labelText: 'Config', border: OutlineInputBorder()),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _furnishing,
                            items: _furnishings.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                            onChanged: (v) => setState(() => _furnishing = v!),
                            decoration: const InputDecoration(labelText: 'Furnishing', border: OutlineInputBorder()),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text('Description & Photos', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.indigo.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.indigo.withOpacity(0.2), style: BorderStyle.solid),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.add_photo_alternate, size: 48, color: Colors.indigo),
                          SizedBox(height: 8),
                          Text('Tap to upload photos (Placeholder)'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: _submitForm,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Post Property', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ),
            ),
    );
  }
}
