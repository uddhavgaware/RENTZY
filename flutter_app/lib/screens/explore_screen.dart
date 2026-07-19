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
    {'id': 'all', 'label': 'All Properties'},
    {'id': 'PG', 'label': 'PGs & Hostels'},
    {'id': 'Flat', 'label': 'Flats'},
    {'id': 'Apartment', 'label': 'Apartments'},
    {'id': 'Independent House', 'label': 'Houses & Villas'},
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
      
      final rawData = response.data;
      final List<dynamic> content = rawData is Map
          ? (rawData['content'] ?? [])
          : (rawData is List ? rawData : []);

      setState(() {
        _listings = content.map((json) => Listing.fromJson(json)).toList();
      });
    } on DioException catch (e) {
      debugPrint('Failed to fetch listings: ${e.message}');
    } catch (e) {
      debugPrint('Error: $e');
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text('Explore Properties', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 20)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(116),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                // Mobile-first Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search city or area (e.g. Pune, Bandra)...',
                    hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF4F46E5)),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                            onPressed: () {
                              _searchController.clear();
                              _fetchListings();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onSubmitted: _onSearchSubmit,
                  textInputAction: TextInputAction.search,
                ),
                const SizedBox(height: 12),
                
                // Categories Horizontal Filter Bar
                SizedBox(
                  height: 38,
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
                            color: isActive ? Colors.white : const Color(0xFF334155),
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                            fontSize: 12,
                          ),
                          backgroundColor: Colors.white,
                          side: BorderSide(color: isActive ? Colors.transparent : const Color(0xFFE2E8F0)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : _listings.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(color: Color(0xFFEEF2FF), shape: BoxShape.circle),
                          child: const Icon(Icons.search_off_rounded, size: 48, color: Color(0xFF4F46E5)),
                        ),
                        const SizedBox(height: 16),
                        const Text('No properties match your search', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                        const SizedBox(height: 6),
                        const Text('Try clearing your filters or searching a different area.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _listings.length,
                  itemBuilder: (context, index) {
                    final listing = _listings[index];
                    return PropertyCard(
                      listing: listing,
                      onFavoriteTap: () {},
                    );
                  },
                ),
    );
  }
}
