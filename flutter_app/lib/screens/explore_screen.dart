import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';
import '../models/listing_model.dart';
import '../widgets/property_card.dart';

class ExploreScreen extends StatefulWidget {
  final String? initialType;
  final String? initialLocation;

  const ExploreScreen({Key? key, this.initialType, this.initialLocation}) : super(key: key);

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _searchController = TextEditingController();
  bool _isLoading = true;
  List<Listing> _listings = [];
  String _activeType = 'all';

  final List<Map<String, String>> _types = [
    {'id': 'all', 'label': 'All'},
    {'id': 'PG', 'label': 'PGs'},
    {'id': 'Hostel', 'label': 'Hostels'},
    {'id': 'Flat', 'label': 'Flats'},
    {'id': 'Apartment', 'label': 'Apartments'},
    {'id': 'Independent House', 'label': 'Houses'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialType != null) {
      _activeType = widget.initialType!;
    }
    if (widget.initialLocation != null) {
      _searchController.text = widget.initialLocation!;
    }
    _fetchListings();
  }

  Future<void> _fetchListings() async {
    setState(() => _isLoading = true);
    try {
      final Map<String, dynamic> queryParams = {};
      if (_searchController.text.isNotEmpty) {
        queryParams['location'] = _searchController.text.trim();
      }
      if (_activeType != 'all') {
        queryParams['type'] = _activeType;
      }

      final response = await apiService.client.get(
        '/listings',
        queryParameters: queryParams,
      );
      
      final List<dynamic> data = response.data;
      setState(() {
        _listings = data.map((json) => Listing.fromJson(json)).toList();
      });
    } on DioException catch (e) {
      debugPrint('Failed to fetch listings: ${e.message}');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSearchSubmit(String value) {
    _fetchListings();
  }

  void _onTypeSelect(String type) {
    setState(() => _activeType = type);
    _fetchListings();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Explore', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by location (e.g., Pune, Mumbai)',
                    prefixIcon: const Icon(Icons.search, color: Colors.grey),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.tune),
                      onPressed: () {
                        // TODO: Implement filters
                      },
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                  onSubmitted: _onSearchSubmit,
                  textInputAction: TextInputAction.search,
                ),
                const SizedBox(height: 16),
                
                // Categories/Types row
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _types.length,
                    itemBuilder: (context, index) {
                      final type = _types[index];
                      final isActive = _activeType == type['id'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(type['label']!),
                          selected: isActive,
                          onSelected: (_) => _onTypeSelect(type['id']!),
                          selectedColor: const Color(0xFF4F46E5),
                          labelStyle: TextStyle(
                            color: isActive ? Colors.white : Colors.black87,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                          ),
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _listings.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text('No properties found', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _listings.length,
                  itemBuilder: (context, index) {
                    final listing = _listings[index];
                    return PropertyCard(
                      listing: listing,
                      onFavoriteTap: () {
                        // TODO: Toggle wishlist
                      },
                    );
                  },
                ),
    );
  }
}
