import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';
import '../models/listing_model.dart';
import '../widgets/property_card.dart';

class OwnerProfileScreen extends StatefulWidget {
  final String ownerId;
  const OwnerProfileScreen({Key? key, required this.ownerId}) : super(key: key);

  @override
  State<OwnerProfileScreen> createState() => _OwnerProfileScreenState();
}

class _OwnerProfileScreenState extends State<OwnerProfileScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _owner;
  List<Listing> _listings = [];

  @override
  void initState() {
    super.initState();
    _fetchOwnerDetails();
  }

  Future<void> _fetchOwnerDetails() async {
    try {
      // In a real scenario, this endpoint might be different
      final response = await apiService.client.get('/users/${widget.ownerId}');
      final listingsResponse = await apiService.client.get('/listings/owner/${widget.ownerId}');
      
      setState(() {
        _owner = response.data;
        _listings = (listingsResponse.data as List).map((j) => Listing.fromJson(j)).toList();
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Failed to load owner profile: ${e.message}');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_owner == null) return const Scaffold(body: Center(child: Text('Owner not found')));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(title: const Text('Owner Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 50,
              backgroundImage: _owner!['profilePhoto'] != null ? NetworkImage(_owner!['profilePhoto']) : null,
              child: _owner!['profilePhoto'] == null ? const Icon(Icons.person, size: 50) : null,
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_owner!['name'] ?? 'Owner Name', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                const Icon(Icons.verified, color: Colors.blue, size: 24),
              ],
            ),
            const SizedBox(height: 8),
            Text('Joined in 2026', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 32),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Active Listings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
            if (_listings.isEmpty)
              const Text('No active listings.')
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _listings.length,
                itemBuilder: (context, index) {
                  return PropertyCard(listing: _listings[index]);
                },
              ),
          ],
        ),
      ),
    );
  }
}
