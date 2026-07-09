import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class MoversScreen extends StatefulWidget {
  const MoversScreen({Key? key}) : super(key: key);
  @override
  State<MoversScreen> createState() => _MoversScreenState();
}

class _MoversScreenState extends State<MoversScreen> {
  bool _isLoading = true;
  List<dynamic> _movers = [];
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchMovers();
  }

  Future<void> _fetchMovers() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiService.client.get('/movers', queryParameters: _searchQuery.isNotEmpty ? {'query': _searchQuery} : {});
      setState(() => _movers = res.data is List ? res.data : []);
    } catch (_) {
      setState(() => _movers = []);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _bookMover(dynamic mover) async {
    final dateCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Book ${mover['name'] ?? 'Mover'}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Price: ₹${mover['pricePerKm'] ?? mover['price'] ?? 'N/A'}/km', style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            TextField(
              controller: dateCtrl,
              decoration: const InputDecoration(hintText: 'Preferred date (e.g. 15 July 2025)', prefixIcon: Icon(Icons.calendar_today)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              maxLines: 2,
              decoration: const InputDecoration(hintText: 'Notes (from/to location, items, etc.)', prefixIcon: Icon(Icons.note)),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5), padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                onPressed: () async {
                  try {
                    await apiService.client.post('/movers/${mover['id']}/book', data: {
                      'preferredDate': dateCtrl.text,
                      'notes': notesCtrl.text,
                    });
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Booking request sent!'), backgroundColor: Colors.green),
                      );
                    }
                  } catch (e) {
                    if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                  }
                },
                child: const Text('Send Booking Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Movers & Packers', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search movers by city...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _searchQuery = '');
                        _fetchMovers();
                      })
                    : null,
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
              onSubmitted: (v) {
                setState(() => _searchQuery = v);
                _fetchMovers();
              },
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _movers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.local_shipping_outlined, size: 72, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text('No movers found', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            Text('Try a different city', style: TextStyle(color: Colors.grey[400])),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchMovers,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _movers.length,
                          itemBuilder: (_, i) {
                            final m = _movers[i];
                            final rating = (m['rating'] ?? 4.5).toDouble();
                            final reviews = m['reviewCount'] ?? m['reviews'] ?? 0;
                            final services = (m['services'] as List?)?.join(', ') ?? 'Moving, Packing';
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 2,
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 56, height: 56,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF4F46E5).withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: m['logo'] != null
                                              ? ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(m['logo'], fit: BoxFit.cover))
                                              : const Icon(Icons.local_shipping, color: Color(0xFF4F46E5), size: 28),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(m['name'] ?? 'Mover', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                              Row(
                                                children: [
                                                  ...List.generate(5, (si) => Icon(
                                                    si < rating.floor() ? Icons.star : (si < rating ? Icons.star_half : Icons.star_border),
                                                    color: Colors.amber, size: 16)),
                                                  const SizedBox(width: 4),
                                                  Text('$rating ($reviews reviews)', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text('₹${m['pricePerKm'] ?? m['price'] ?? 'N/A'}', 
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF4F46E5))),
                                            const Text('per km', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                          ],
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Wrap(
                                      spacing: 6,
                                      children: services.split(', ').map((s) => Chip(
                                        label: Text(s, style: const TextStyle(fontSize: 11)),
                                        backgroundColor: Colors.grey[100],
                                        padding: EdgeInsets.zero,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      )).toList(),
                                    ),
                                    if (m['city'] != null || m['location'] != null) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on, size: 14, color: Colors.grey),
                                          const SizedBox(width: 4),
                                          Text(m['city'] ?? m['location'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                                        ],
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton(
                                        onPressed: () => _bookMover(m),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF4F46E5),
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                        ),
                                        child: const Text('Book Now', style: TextStyle(fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
