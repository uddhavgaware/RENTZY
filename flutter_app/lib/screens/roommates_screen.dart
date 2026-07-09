import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../core/api_service.dart';

class RoommatesScreen extends StatefulWidget {
  const RoommatesScreen({Key? key}) : super(key: key);
  @override
  State<RoommatesScreen> createState() => _RoommatesScreenState();
}

class _RoommatesScreenState extends State<RoommatesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<dynamic> _feed = [];
  List<dynamic> _myRequests = [];
  List<dynamic> _received = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAll() async {
    setState(() => _isLoading = true);
    await Future.wait([_fetchFeed(), _fetchMy(), _fetchReceived()]);
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchFeed() async {
    try {
      final res = await apiService.client.get('/roommates', queryParameters: {'page': 0, 'size': 20});
      final data = res.data;
      _feed = data is Map ? (data['content'] ?? []) : (data is List ? data : []);
    } catch (_) {}
  }

  Future<void> _fetchMy() async {
    try {
      final res = await apiService.client.get('/roommates/my');
      final data = res.data;
      _myRequests = data is Map ? (data['content'] ?? []) : (data is List ? data : []);
    } catch (_) {}
  }

  Future<void> _fetchReceived() async {
    try {
      final res = await apiService.client.get('/roommates/received');
      final data = res.data;
      _received = data is Map ? (data['content'] ?? []) : (data is List ? data : []);
    } catch (_) {}
  }

  Future<void> _sendRequest(BuildContext ctx) async {
    final formKey = GlobalKey<FormState>();
    final locationCtrl = TextEditingController();
    final budgetCtrl = TextEditingController();
    final bioCtrl = TextEditingController();

    await showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Post Roommate Request', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextFormField(
                controller: locationCtrl,
                decoration: _inputDeco('Preferred Location (e.g. Pune, Kothrud)', Icons.location_on),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: budgetCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDeco('Budget (₹/month)', Icons.currency_rupee),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: bioCtrl,
                maxLines: 3,
                decoration: _inputDeco('About you / preferences', Icons.info_outline),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    try {
                      await apiService.client.post('/roommates', data: {
                        'location': locationCtrl.text,
                        'budget': double.tryParse(budgetCtrl.text) ?? 0,
                        'bio': bioCtrl.text,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      _fetchAll();
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Request posted!'), backgroundColor: Colors.green),
                        );
                      }
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                        );
                      }
                    }
                  },
                  child: const Text('Post Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDeco(String hint, IconData icon) => InputDecoration(
    hintText: hint,
    prefixIcon: Icon(icon, color: Colors.grey),
    filled: true,
    fillColor: Colors.grey[100],
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  Widget _buildFeedCard(dynamic r) {
    final user = r['user'] ?? {};
    final name = user['name'] ?? 'User';
    final photo = user['profilePhoto'];
    final location = r['location'] ?? '';
    final budget = r['budget'];
    final bio = r['bio'] ?? '';
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
                CircleAvatar(
                  radius: 28,
                  backgroundImage: photo != null ? NetworkImage(photo) : null,
                  backgroundColor: const Color(0xFF4F46E5),
                  child: photo == null ? Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)) : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Expanded(child: Text(location, style: const TextStyle(color: Colors.grey, fontSize: 13))),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('₹${budget?.toStringAsFixed(0) ?? 'N/A'}/mo',
                    style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold, fontSize: 13)),
                ),
              ],
            ),
            if (bio.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(bio, style: const TextStyle(color: Colors.black87, fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.push('/chat/${r['id'] ?? ''}'),
                    icon: const Icon(Icons.chat_bubble_outline, size: 16),
                    label: const Text('Message'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF4F46E5),
                      side: const BorderSide(color: Color(0xFF4F46E5)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      try {
                        await apiService.client.post('/roommates/${r['id']}/connect');
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Request sent!'), backgroundColor: Colors.green),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.person_add, size: 16),
                    label: const Text('Connect'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyCard(dynamic r) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF4F46E5).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.home_work, color: Color(0xFF4F46E5)),
        ),
        title: Text(r['location'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('₹${r['budget']?.toStringAsFixed(0) ?? 'N/A'}/mo • ${r['status'] ?? 'active'}'),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.red),
          onPressed: () async {
            try {
              await apiService.client.delete('/roommates/${r['id']}');
              _fetchAll();
            } catch (_) {}
          },
        ),
      ),
    );
  }

  Widget _buildReceivedCard(dynamic req) {
    final sender = req['sender'] ?? req['user'] ?? {};
    final name = sender['name'] ?? 'User';
    final photo = sender['profilePhoto'];
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              backgroundImage: photo != null ? NetworkImage(photo) : null,
              backgroundColor: const Color(0xFF4F46E5),
              child: photo == null ? Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white)) : null,
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(req['message'] ?? 'Wants to connect', style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            )),
            Column(
              children: [
                IconButton(
                  icon: const Icon(Icons.check_circle, color: Colors.green),
                  onPressed: () async {
                    try {
                      await apiService.client.put('/roommates/requests/${req['id']}/accept');
                      _fetchAll();
                    } catch (_) {}
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.cancel, color: Colors.red),
                  onPressed: () async {
                    try {
                      await apiService.client.put('/roommates/requests/${req['id']}/reject');
                      _fetchAll();
                    } catch (_) {}
                  },
                ),
              ],
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
        title: const Text('Find Roommates', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF4F46E5),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF4F46E5),
          tabs: const [
            Tab(text: 'Feed'),
            Tab(text: 'My Posts'),
            Tab(text: 'Received'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                // Feed
                RefreshIndicator(
                  onRefresh: _fetchAll,
                  child: _feed.isEmpty
                      ? const Center(child: Text('No roommate posts yet.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _feed.length,
                          itemBuilder: (_, i) => _buildFeedCard(_feed[i]),
                        ),
                ),
                // My Posts
                RefreshIndicator(
                  onRefresh: _fetchAll,
                  child: _myRequests.isEmpty
                      ? const Center(child: Text('You have no active posts.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _myRequests.length,
                          itemBuilder: (_, i) => _buildMyCard(_myRequests[i]),
                        ),
                ),
                // Received
                RefreshIndicator(
                  onRefresh: _fetchAll,
                  child: _received.isEmpty
                      ? const Center(child: Text('No connection requests yet.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _received.length,
                          itemBuilder: (_, i) => _buildReceivedCard(_received[i]),
                        ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _sendRequest(context),
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Post Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
