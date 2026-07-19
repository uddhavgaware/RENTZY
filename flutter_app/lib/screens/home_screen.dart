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
  
  final List<Map<String, dynamic>> _stats = [
    {'value': '2,500+', 'label': 'Properties'},
    {'value': '10,000+', 'label': 'Tenants'},
    {'value': '25+', 'label': 'Cities'},
    {'value': '₹0', 'label': 'Brokerage'},
  ];

  final List<Map<String, dynamic>> _categories = [
    {
      'label': 'Flats & Apartments',
      'tag': 'Independent',
      'emoji': '🏢',
      'type': 'Flat',
      'gradient': [Color(0xFF2563EB), Color(0xFF1E3A8A)],
    },
    {
      'label': 'PGs & Hostels',
      'tag': 'Budget-Friendly',
      'emoji': '🏨',
      'type': 'PG',
      'gradient': [Color(0xFF7C3AED), Color(0xFF4C1D95)],
    },
    {
      'label': 'Find Roommates',
      'tag': 'Community',
      'emoji': '🤝',
      'route': '/roommates',
      'gradient': [Color(0xFFF43F5E), Color(0xFF881337)],
    },
    {
      'label': 'Split Expenses',
      'tag': 'Finance',
      'emoji': '💸',
      'route': '/split-expenses',
      'gradient': [Color(0xFF059669), Color(0xFF064E3B)],
    },
    {
      'label': 'Packing & Moving',
      'tag': 'Relocation',
      'emoji': '🚚',
      'route': '/movers',
      'gradient': [Color(0xFFEA580C), Color(0xFF7C2D12)],
    },
    {
      'label': 'Office Spaces',
      'tag': 'Commercial',
      'emoji': '💼',
      'type': 'Office',
      'gradient': [Color(0xFF0D9488), Color(0xFF134E4A)],
    },
  ];

  final List<Map<String, dynamic>> _howItWorks = [
    {'step': '01', 'title': 'Search Area', 'desc': 'Filter locality & price', 'icon': Icons.search_rounded},
    {'step': '02', 'title': 'KYC Verified', 'desc': 'Direct verified owners', 'icon': Icons.verified_user_rounded},
    {'step': '03', 'title': 'Chat Directly', 'desc': 'Zero broker middleman', 'icon': Icons.chat_bubble_rounded},
    {'step': '04', 'title': 'Move In!', 'desc': 'Book & move instantly', 'icon': Icons.home_rounded},
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

      setState(() {
        _featuredListings = content.map((json) => Listing.fromJson(json)).take(5).toList();
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Failed to fetch listings: ${e.message}');
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
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.apartment, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'RentXY',
              style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 22, letterSpacing: -0.5),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text('ZERO BROKERAGE', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.w800, fontSize: 9)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Color(0xFF0F172A)),
            onPressed: () => context.go('/explore'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchListings,
        color: const Color(0xFF4F46E5),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Banner with Stats
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF312E81)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF1E1B4B).withOpacity(0.4), blurRadius: 16, offset: const Offset(0, 8)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.shield_outlined, color: Color(0xFF34D399), size: 14),
                          SizedBox(width: 4),
                          Text('100% Zero Brokerage Platform', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Find your next home\ndirectly from owners.',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        height: 1.2,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => context.go('/explore'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.search, color: Color(0xFF4F46E5), size: 20),
                            SizedBox(width: 10),
                            Text('Search Pune, Mumbai, Bangalore...', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500, fontSize: 13)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Stats Grid inside Hero
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: _stats.map((s) => Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s['value']!, style: const TextStyle(color: Color(0xFF818CF8), fontSize: 16, fontWeight: FontWeight.w900)),
                          Text(s['label']!, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w500)),
                        ],
                      )).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Explore Categories
              const Text('What are you looking for?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.55,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final List<Color> gradient = cat['gradient'];
                  return GestureDetector(
                    onTap: () {
                      if (cat['route'] != null) {
                        context.go(cat['route']);
                      } else if (cat['type'] != null) {
                        context.go('/explore?type=${cat['type']}');
                      } else {
                        context.go('/explore');
                      }
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(color: gradient.first.withOpacity(0.25), blurRadius: 8, offset: const Offset(0, 4)),
                        ],
                      ),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(cat['emoji'], style: const TextStyle(fontSize: 22)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                                child: Text(cat['tag'], style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          Text(
                            cat['label'],
                            style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 28),

              // How It Works
              const Text('How RentXY Works', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
              const SizedBox(height: 12),
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _howItWorks.length,
                  itemBuilder: (context, index) {
                    final item = _howItWorks[index];
                    return Container(
                      width: 140,
                      margin: const EdgeInsets.only(right: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Icon(item['icon'] as IconData, color: const Color(0xFF4F46E5), size: 20),
                              Text(item['step'] as String, style: const TextStyle(color: Color(0xFFC7D2FE), fontWeight: FontWeight.w900, fontSize: 12)),
                            ],
                          ),
                          const Spacer(),
                          Text(item['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A))),
                          Text(item['desc'] as String, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 28),
              
              // Featured Properties
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
      ),
    );
  }
}
