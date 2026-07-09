import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../core/api_service.dart';

class JoinSplitGroupScreen extends StatefulWidget {
  final String token;
  const JoinSplitGroupScreen({Key? key, required this.token}) : super(key: key);

  @override
  State<JoinSplitGroupScreen> createState() => _JoinSplitGroupScreenState();
}

class _JoinSplitGroupScreenState extends State<JoinSplitGroupScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _groupInfo;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchGroupInfo();
  }

  Future<void> _fetchGroupInfo() async {
    try {
      final response = await apiService.client.get('/split/groups/invite/${widget.token}');
      setState(() {
        _groupInfo = response.data;
        _isLoading = false;
      });
    } on DioException catch (e) {
      setState(() {
        _error = e.response?.data['message'] ?? 'Invalid or expired invitation link.';
        _isLoading = false;
      });
    }
  }

  Future<void> _joinGroup() async {
    setState(() => _isLoading = true);
    try {
      await apiService.client.post('/split/groups/join/${widget.token}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Successfully joined the group!')));
        context.go('/split-expenses');
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.response?.data['message'] ?? 'Failed to join group')));
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Join Group'),
      ),
      body: Center(
        child: _isLoading
            ? const CircularProgressIndicator()
            : _error != null
                ? Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 64, color: Colors.red),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, color: Colors.red)),
                      ],
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10)),
                            ],
                          ),
                          child: Column(
                            children: [
                              const CircleAvatar(
                                radius: 40,
                                backgroundColor: Color(0xFF4F46E5),
                                child: Icon(Icons.group, color: Colors.white, size: 40),
                              ),
                              const SizedBox(height: 16),
                              const Text('You have been invited to join', style: TextStyle(color: Colors.grey)),
                              const SizedBox(height: 8),
                              Text(
                                _groupInfo?['name'] ?? 'Split Group',
                                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: _joinGroup,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    backgroundColor: const Color(0xFF4F46E5),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text('Accept & Join', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                ),
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
}
