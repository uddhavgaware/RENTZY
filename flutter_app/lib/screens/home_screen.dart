import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';
import '../models/listing_model.dart';
import '../widgets/property_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  List<Listing> _featuredListings = [];
  
  final List<Map<String, dynamic>> _categories = [
    {'label': 'Flats & Apartments', 'icon': Icons.apartment, 'color': Colors.blue},
    {'label': 'PGs & Hostels', 'icon': Icons.hotel, 'color': Colors.purple},
    {'label': 'Find Roommates', 'icon': Icons.people, 'color': Colors.pink},
    {'label': 'Office Spaces', 'icon': Icons.business_center, 'color': Colors.teal},
  ];

  @override
  void initState() {
    super.initState();
    _fetchListings();
  }

  Future<void> _fetchListings() async {
    try {
      final response = await apiService.client.get('/listings'); // Get featured/recent listings
      final List<dynamic> data = response.data;
      setState(() {
        _featuredListings = data.map((json) => Listing.fromJson(json)).take(5).toList();
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Failed to fetch listings: ${e.message}');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.indigo.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.apartment, color: Colors.indigo, size: 24),
            ),
            const SizedBox(width: 12),
            const Text(
              'RentXY',
              style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF111827), fontSize: 24),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Colors.black),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchListings,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF3730A3)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Find your next\nperfect home',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/explore'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF4F46E5),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Explore Now', style: TextStyle(fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Categories
              const Text('What are you looking for?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.5,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  return GestureDetector(
                    onTap: () => context.go('/explore'),
                    child: Container(
                      decoration: BoxDecoration(
                        color: (cat['color'] as Color).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: (cat['color'] as Color).withOpacity(0.2)),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(cat['icon'], color: cat['color'], size: 32),
                          const Spacer(),
                          Text(
                            cat['label'],
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: cat['color'],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),
              
              // Featured Properties
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Featured Properties', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  TextButton(
                    onPressed: () => context.go('/explore'),
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              if (_isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator()))
              else if (_featuredListings.isEmpty)
                const Text('No featured properties available.')
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _featuredListings.length,
                  itemBuilder: (context, index) {
                    final listing = _featuredListings[index];
                    return PropertyCard(
                      listing: listing,
                      onFavoriteTap: () {
                        // TODO: Implement toggle favorite
                      },
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
