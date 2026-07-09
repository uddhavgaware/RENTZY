import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/listing_model.dart';

class PropertyCard extends StatelessWidget {
  final Listing listing;
  final VoidCallback? onFavoriteTap;
  final bool isFavorite;

  const PropertyCard({
    Key? key,
    required this.listing,
    this.onFavoriteTap,
    this.isFavorite = false,
  }) : super(key: key);

  String get _imageUrl {
    if (listing.images.isNotEmpty) {
      return listing.images.first;
    }
    return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/listing/${listing.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.withOpacity(0.1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image Area
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: Image.network(
                    _imageUrl,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => Container(
                      height: 200,
                      color: Colors.grey[200],
                      child: const Icon(Icons.broken_image, color: Colors.grey, size: 40),
                    ),
                  ),
                ),
                Positioned(
                  top: 16,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF4F46E5), Color(0xFF4338CA)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      listing.type,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ),
                Positioned(
                  top: 16,
                  right: 16,
                  child: GestureDetector(
                    onTap: onFavoriteTap,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.grey,
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            // Content Area
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${listing.price.toInt()}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF4F46E5),
                        ),
                      ),
                      Text(
                        '/ month',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    listing.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, color: Colors.grey, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          listing.location,
                          style: const TextStyle(color: Colors.grey, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Divider(height: 1),
                  ),
                  Row(
                    children: [
                      if (listing.configuration != null) ...[
                        Icon(Icons.king_bed_outlined, color: Colors.grey[600], size: 18),
                        const SizedBox(width: 4),
                        Text(listing.configuration!, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
                        const SizedBox(width: 16),
                      ],
                      if (listing.furnishing != null) ...[
                        Icon(Icons.chair_outlined, color: Colors.grey[600], size: 18),
                        const SizedBox(width: 4),
                        Text(listing.furnishing!, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
                      ],
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
