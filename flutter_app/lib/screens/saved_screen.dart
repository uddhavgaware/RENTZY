import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';
import '../models/listing_model.dart';
import '../widgets/property_card.dart';

class SavedScreen extends StatefulWidget {
  const SavedScreen({Key? key}) : super(key: key);

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  bool _isLoading = true;
  List<Listing> _savedListings = [];

  @override
  void initState() {
    super.initState();
    _fetchWishlist();
  }

  Future<void> _fetchWishlist() async {
    try {
      final response = await apiService.client.get('/wishlist');
      final rawData = response.data;
      final List<dynamic> content = rawData is List ? rawData : (rawData is Map ? (rawData['content'] ?? []) : []);
      setState(() {
        _savedListings = content.map((json) => Listing.fromJson(json)).toList();
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Error fetching wishlist: ${e.message}');
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text('Saved Properties', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 20)),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchWishlist,
        color: const Color(0xFF4F46E5),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
            : _savedListings.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: const BoxDecoration(color: Color(0xFFFEE2E2), shape: BoxShape.circle),
                            child: const Icon(Icons.favorite_border_rounded, size: 48, color: Color(0xFFEF4444)),
                          ),
                          const SizedBox(height: 16),
                          const Text('No saved properties yet', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                          const SizedBox(height: 6),
                          const Text('Tap the heart icon on any property to save it to your favorites.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _savedListings.length,
                    itemBuilder: (context, index) {
                      final listing = _savedListings[index];
                      return PropertyCard(
                        listing: listing,
                        isFavorite: true,
                        onFavoriteTap: () {
                          // Toggle wishlist item
                        },
                      );
                    },
                  ),
      ),
    );
  }
}
