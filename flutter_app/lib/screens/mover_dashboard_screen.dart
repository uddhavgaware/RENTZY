import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class MoverDashboardScreen extends StatefulWidget {
  const MoverDashboardScreen({Key? key}) : super(key: key);

  @override
  State<MoverDashboardScreen> createState() => _MoverDashboardScreenState();
}

class _MoverDashboardScreenState extends State<MoverDashboardScreen> {
  bool _isLoading = true;
  List<dynamic> _requests = [];

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    try {
      final response = await apiService.client.get('/moving/provider/requests');
      setState(() {
        _requests = response.data;
        _isLoading = false;
      });
    } on DioException catch (e) {
      debugPrint('Failed to load mover requests: ${e.message}');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Mover Dashboard'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _requests.isEmpty
              ? const Center(child: Text('No moving requests yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _requests.length,
                  itemBuilder: (context, index) {
                    final request = _requests[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  request['status'] ?? 'PENDING',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: request['status'] == 'ACCEPTED' ? Colors.green : Colors.orange,
                                  ),
                                ),
                                Text(request['movingDate'] ?? 'No Date', style: const TextStyle(color: Colors.grey)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                const Icon(Icons.location_on, color: Colors.blue, size: 20),
                                const SizedBox(width: 8),
                                Expanded(child: Text(request['pickupAddress'] ?? 'Pickup Address')),
                              ],
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                              child: Icon(Icons.arrow_downward, color: Colors.grey, size: 16),
                            ),
                            Row(
                              children: [
                                const Icon(Icons.location_on, color: Colors.red, size: 20),
                                const SizedBox(width: 8),
                                Expanded(child: Text(request['dropAddress'] ?? 'Drop Address')),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () {},
                                    child: const Text('Decline'),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {},
                                    child: const Text('Accept'),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
