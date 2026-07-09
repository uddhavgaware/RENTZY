import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';
import '../models/listing_model.dart';

class ListingDetailsScreen extends StatefulWidget {
  final String id;
  const ListingDetailsScreen({Key? key, required this.id}) : super(key: key);

  @override
  State<ListingDetailsScreen> createState() => _ListingDetailsScreenState();
}

class _ListingDetailsScreenState extends State<ListingDetailsScreen> {
  bool _isLoading = true;
  Listing? _listing;
  Map<String, dynamic>? _owner;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      final response = await apiService.client.get('/listings/${widget.id}');
      setState(() {
        _listing = Listing.fromJson(response.data);
        _owner = response.data['owner'];
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Failed to load listing: ${e.message}');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    if (_listing == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Listing not found')),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300.0,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: _listing!.images.isNotEmpty
                  ? Image.network(
                      _listing!.images.first,
                      fit: BoxFit.cover,
                    )
                  : Container(color: Colors.grey[300], child: const Icon(Icons.home, size: 64, color: Colors.grey)),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.favorite_border),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.share),
                onPressed: () {},
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4F46E5).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _listing!.type,
                          style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 20),
                          const SizedBox(width: 4),
                          const Text('4.5', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _listing!.title,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(_listing!.location, style: const TextStyle(color: Colors.grey, fontSize: 16)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Text(
                        '₹${_listing!.price.toInt()}',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF4F46E5)),
                      ),
                      const Text(' / month', style: TextStyle(color: Colors.grey, fontSize: 16)),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Divider(),
                  ),
                  const Text('Overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      if (_listing!.configuration != null)
                        _buildFeature(Icons.king_bed, _listing!.configuration!),
                      if (_listing!.furnishing != null)
                        _buildFeature(Icons.chair, _listing!.furnishing!),
                      _buildFeature(Icons.square_foot, '1200 sqft'), // Placeholder
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Divider(),
                  ),
                  const Text('Description', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Text(
                    _listing!.description ?? 'No description provided.',
                    style: const TextStyle(color: Colors.black87, height: 1.5),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Divider(),
                  ),
                  const Text('Amenities', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _listing!.amenities.map((a) {
                      return Chip(
                        label: Text(a),
                        backgroundColor: Colors.grey[100],
                        side: BorderSide.none,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Color(0xFF4F46E5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Chat', style: TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Book Visit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeature(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: Colors.grey[700], size: 20),
        ),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }
}
