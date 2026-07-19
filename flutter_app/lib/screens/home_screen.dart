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
  final TextEditingController _locationController = TextEditingController();
  String _selectedType = 'All Types';
  bool _showAiBanner = true;

  final List<String> _typeOptions = ['All Types', 'Flat', 'PG', 'Roommate', 'Hostel', 'Office'];

  final List<Map<String, String>> _categoryPills = [
    {'label': 'Browse All', 'emoji': '🏠', 'type': ''},
    {'label': 'PGs & Hostels', 'emoji': '🏨', 'type': 'PG'},
    {'label': 'Flats', 'emoji': '🏢', 'type': 'Flat'},
    {'label': 'Roommates', 'emoji': '🤝', 'route': '/roommates'},
    {'label': 'Split Expenses', 'emoji': '💸', 'route': '/split-expenses'},
    {'label': 'Movers', 'emoji': '🚚', 'route': '/movers'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchListings();
  }

  Future<void> _fetchListings() async {
    try {
      final response = await apiService.client.get('/listings');
      final rawData = response.data;
      final List<dynamic> content = rawData is Map
          ? (rawData['content'] ?? [])
          : (rawData is List ? rawData : []);

      List<Listing> fetched = content.map((json) => Listing.fromJson(json)).take(6).toList();
      
      if (fetched.isEmpty) {
        fetched = _getFallbackListings();
      }

      setState(() {
        _featuredListings = fetched;
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Failed to fetch listings: ${e.message}');
      if (mounted) setState(() {
        _featuredListings = _getFallbackListings();
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _featuredListings = _getFallbackListings();
        _isLoading = false;
      });
    }
  }

  List<Listing> _getFallbackListings() {
    return [
      Listing(
        id: 101,
        title: 'Modern 2 BHK Apartment in Koregaon Park',
        description: 'Spacious furnished flat with balcony, modular kitchen & high-speed Wi-Fi.',
        price: 24000.0,
        location: 'Koregaon Park, Pune',
        type: 'Flat',
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'],
        amenities: ['Wi-Fi', 'Parking', 'AC', 'Gym'],
        configuration: '2 BHK',
        furnishing: 'Fully Furnished',
        status: 'AVAILABLE',
      ),
      Listing(
        id: 102,
        title: 'Luxury Women PG with Food & Laundry',
        description: 'Single and double sharing AC rooms with 3-time meals and daily housekeeping.',
        price: 9500.0,
        location: 'Viman Nagar, Pune',
        type: 'PG',
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800'],
        amenities: ['Food Included', 'Wi-Fi', 'Laundry', 'Security'],
        configuration: 'Single / Twin',
        furnishing: 'Fully Furnished',
        status: 'AVAILABLE',
      ),
      Listing(
        id: 103,
        title: '3 BHK Independent Villa with Garden',
        description: 'Gated community villa with private garden, covered parking, and 24/7 power backup.',
        price: 45000.0,
        location: 'Bandra West, Mumbai',
        type: 'Flat',
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800'],
        amenities: ['Garden', 'Security', 'Clubhouse', 'Power Backup'],
        configuration: '3 BHK',
        furnishing: 'Semi-Furnished',
        status: 'AVAILABLE',
      ),
    ];
  }

  void _onSearchSubmit() {
    final Map<String, String> queryParams = {};
    if (_locationController.text.trim().isNotEmpty) {
      queryParams['location'] = _locationController.text.trim();
    }
    if (_selectedType != 'All Types') {
      queryParams['type'] = _selectedType;
    }
    final uri = Uri(path: '/explore', queryParameters: queryParams.isEmpty ? null : queryParams);
    context.go(uri.toString());
  }

  @override
  Widget build(BuildContext context) {
    final statsCount = _featuredListings.length > 0 ? _featuredListings.length : 6;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: const Color(0xFF334155),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.apartment_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'RentXY',
              style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 22, letterSpacing: -0.5),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF065F46).withOpacity(0.8),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF34D399).withOpacity(0.4)),
              ),
              child: const Text('ZERO BROKERAGE', style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w800, fontSize: 9)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Colors.white),
            onPressed: () => context.go('/explore'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchListings,
        color: const Color(0xFF4F46E5),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ═══════════════════════════════════════
              // CINEMATIC HERO SECTION WITH VILLA IMAGE
              // ═══════════════════════════════════════
              Stack(
                children: [
                  // Villa Background Image
                  Image.network(
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80',
                    height: 520,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => Container(height: 520, color: const Color(0xFF0F172A)),
                  ),
                  // Dark Vignette Gradient Overlay
                  Container(
                    height: 520,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF0F172A).withOpacity(0.95),
                          const Color(0xFF0F172A).withOpacity(0.70),
                          const Color(0xFF0F172A).withOpacity(0.95),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  // Hero Content
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 12),
                        // Title with Highlighted Gradient Text
                        RichText(
                          textAlign: TextAlign.center,
                          text: const TextSpan(
                            style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, height: 1.1, color: Colors.white),
                            children: [
                              TextSpan(text: 'Find Your '),
                              TextSpan(
                                text: 'Perfect Stay',
                                style: TextStyle(
                                  color: Color(0xFFA855F7), // Purple Highlight
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'PGs · Flats · Hostels · Roommates — No brokers, no hidden fees. Just verified listings and direct connections.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.4, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 24),
                        
                        // Integrated Search Card (Matching Web Form Responsive Layout)
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final isDesktop = constraints.maxWidth > 580;
                            return Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: Colors.white.withOpacity(0.2)),
                              ),
                              child: isDesktop
                                  ? Row(
                                      children: [
                                        // Location Input (Expanded)
                                        Expanded(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(16),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.location_on_outlined, color: Color(0xFFA855F7), size: 20),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: TextField(
                                                    controller: _locationController,
                                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                                                    decoration: const InputDecoration(
                                                      hintText: "Try 'Women PG with Food'...",
                                                      hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                                      border: InputBorder.none,
                                                    ),
                                                    onSubmitted: (_) => _onSearchSubmit(),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        // Dropdown Selector
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: DropdownButtonHideUnderline(
                                            child: DropdownButton<String>(
                                              value: _selectedType,
                                              dropdownColor: const Color(0xFF1E293B),
                                              icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                              items: _typeOptions.map((opt) => DropdownMenuItem(
                                                value: opt,
                                                child: Text(opt, style: const TextStyle(color: Colors.white)),
                                              )).toList(),
                                              onChanged: (val) {
                                                if (val != null) setState(() => _selectedType = val);
                                              },
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        // Search Button
                                        ElevatedButton(
                                          onPressed: _onSearchSubmit,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF4F46E5),
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                            elevation: 4,
                                          ),
                                          child: const Row(
                                            children: [
                                              Icon(Icons.search, size: 18),
                                              SizedBox(width: 6),
                                              Text('Search', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    )
                                  : Column(
                                      children: [
                                        // Location Input
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.location_on_outlined, color: Color(0xFFA855F7), size: 20),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: TextField(
                                                  controller: _locationController,
                                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                                                  decoration: const InputDecoration(
                                                    hintText: "Try 'Women PG with Food'...",
                                                    hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                                    border: InputBorder.none,
                                                  ),
                                                  onSubmitted: (_) => _onSearchSubmit(),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                                decoration: BoxDecoration(
                                                  color: Colors.white.withOpacity(0.15),
                                                  borderRadius: BorderRadius.circular(16),
                                                ),
                                                child: DropdownButtonHideUnderline(
                                                  child: DropdownButton<String>(
                                                    value: _selectedType,
                                                    dropdownColor: const Color(0xFF1E293B),
                                                    icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
                                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                                    items: _typeOptions.map((opt) => DropdownMenuItem(
                                                      value: opt,
                                                      child: Text(opt, style: const TextStyle(color: Colors.white)),
                                                    )).toList(),
                                                    onChanged: (val) {
                                                      if (val != null) setState(() => _selectedType = val);
                                                    },
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            ElevatedButton(
                                              onPressed: _onSearchSubmit,
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF4F46E5),
                                                foregroundColor: Colors.white,
                                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                                elevation: 4,
                                              ),
                                              child: const Row(
                                                children: [
                                                  Icon(Icons.search, size: 18),
                                                  SizedBox(width: 6),
                                                  Text('Search', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                            );
                          },
                        ),
                        const SizedBox(height: 20),

                        // Horizontal Scrollable Category Pills (Browse All, PGs, Flats, Roommates...)
                        SizedBox(
                          height: 38,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: _categoryPills.length,
                            itemBuilder: (context, index) {
                              final pill = _categoryPills[index];
                              return GestureDetector(
                                onTap: () {
                                  if (pill['route'] != null) {
                                    context.go(pill['route']!);
                                  } else if (pill['type'] != null && pill['type']!.isNotEmpty) {
                                    context.go('/explore?type=${pill['type']}');
                                  } else {
                                    context.go('/explore');
                                  }
                                },
                                child: Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withOpacity(0.15)),
                                  ),
                                  child: Row(
                                    children: [
                                      Text(pill['emoji']!, style: const TextStyle(fontSize: 13)),
                                      const SizedBox(width: 6),
                                      Text(pill['label']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),

                        // AI Recommendations Banner
                        if (_showAiBanner)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E1B4B).withOpacity(0.8),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.4)),
                            ),
                            child: Row(
                              children: [
                                const Text('📍', style: TextStyle(fontSize: 14)),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Get AI-Powered Local Recommendations', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                                      Text('Allow location to see best properties near you', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
                                    ],
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    context.go('/explore');
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(color: const Color(0xFF4F46E5), borderRadius: BorderRadius.circular(10)),
                                    child: const Text('Allow', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                GestureDetector(
                                  onTap: () => setState(() => _showAiBanner = false),
                                  child: const Text('Skip', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),

              // ═══════════════════════════════════════
              // PURPLE FULL-WIDTH PLATFORM STATS RIBBON
              // ═══════════════════════════════════════
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF4338CA)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem('$statsCount+', 'Properties Listed'),
                    _buildStatDivider(),
                    _buildStatItem('${statsCount * 3}+', 'Happy Tenants'),
                    _buildStatDivider(),
                    _buildStatItem('3', 'Cities Covered'),
                    _buildStatDivider(),
                    _buildStatItem('₹0', 'Brokerage Fee'),
                  ],
                ),
              ),

              // ═══════════════════════════════════════
              // FEATURED PROPERTIES LIST SECTION
              // ═══════════════════════════════════════
              Container(
                color: const Color(0xFFF8FAFC),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Featured Properties', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                        TextButton(
                          onPressed: () => context.go('/explore'),
                          child: const Text('View All →', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    
                    if (_isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator(color: Color(0xFF4F46E5))))
                    else if (_featuredListings.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                        child: const Center(child: Text('No properties listed yet.', style: TextStyle(color: Colors.grey))),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _featuredListings.length,
                        itemBuilder: (context, index) {
                          final listing = _featuredListings[index];
                          return PropertyCard(
                            listing: listing,
                            onFavoriteTap: () {},
                          );
                        },
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Color(0xFFC7D2FE), fontSize: 10, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(
      height: 28,
      width: 1,
      color: Colors.white.withOpacity(0.2),
    );
  }
}
