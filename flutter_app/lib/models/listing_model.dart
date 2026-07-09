class Listing {
  final int id;
  final String title;
  final double price;
  final String location;
  final String type;
  final String? configuration;
  final String? furnishing;
  final List<String> images;
  final String? description;
  final List<String> amenities;
  final String status;
  final double? latitude;
  final double? longitude;

  Listing({
    required this.id,
    required this.title,
    required this.price,
    required this.location,
    required this.type,
    this.configuration,
    this.furnishing,
    required this.images,
    this.description,
    required this.amenities,
    required this.status,
    this.latitude,
    this.longitude,
  });

  factory Listing.fromJson(Map<String, dynamic> json) {
    return Listing(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      location: json['location'] ?? '',
      type: json['type'] ?? '',
      configuration: json['configuration'],
      furnishing: json['furnishing'],
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      description: json['description'],
      amenities: json['amenities'] != null ? List<String>.from(json['amenities']) : [],
      status: json['status'] ?? 'ACTIVE',
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
    );
  }
}
