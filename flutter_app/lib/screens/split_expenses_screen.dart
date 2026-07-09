import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class SplitExpensesScreen extends StatefulWidget {
  const SplitExpensesScreen({Key? key}) : super(key: key);
  @override
  State<SplitExpensesScreen> createState() => _SplitExpensesScreenState();
}

class _SplitExpensesScreenState extends State<SplitExpensesScreen> {
  bool _isLoading = true;
  List<dynamic> _groups = [];

  @override
  void initState() {
    super.initState();
    _fetchGroups();
  }

  Future<void> _fetchGroups() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiService.client.get('/split/groups/my');
      setState(() => _groups = res.data is List ? res.data : []);
    } catch (_) {
      setState(() => _groups = []);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _createGroup() async {
    final nameCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Create Group', style: TextStyle(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: nameCtrl,
          decoration: const InputDecoration(
            hintText: 'Group name (e.g. Flat 3B)',
            prefixIcon: Icon(Icons.group),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
            onPressed: () async {
              if (nameCtrl.text.isEmpty) return;
              try {
                await apiService.client.post('/split/groups', data: {'name': nameCtrl.text});
                if (ctx.mounted) Navigator.pop(ctx);
                _fetchGroups();
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              }
            },
            child: const Text('Create', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _joinGroup() async {
    final codeCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Join Group', style: TextStyle(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: codeCtrl,
          decoration: const InputDecoration(
            hintText: 'Enter invite code',
            prefixIcon: Icon(Icons.link),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
            onPressed: () async {
              if (codeCtrl.text.isEmpty) return;
              try {
                await apiService.client.post('/split/groups/join/${codeCtrl.text}');
                if (ctx.mounted) Navigator.pop(ctx);
                _fetchGroups();
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              }
            },
            child: const Text('Join', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Color _groupColor(int index) {
    final colors = [
      const Color(0xFF4F46E5), const Color(0xFF7C3AED), const Color(0xFF0891B2),
      const Color(0xFF059669), const Color(0xFFD97706), const Color(0xFFDC2626),
    ];
    return colors[index % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Split Expenses', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.group_add_outlined), onPressed: _joinGroup, tooltip: 'Join Group'),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchGroups,
              child: _groups.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long, size: 72, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text('No groups yet', style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Text('Create or join a group to split expenses', style: TextStyle(color: Colors.grey[400])),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              ElevatedButton.icon(
                                onPressed: _createGroup,
                                icon: const Icon(Icons.add, color: Colors.white),
                                label: const Text('Create', style: TextStyle(color: Colors.white)),
                                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
                              ),
                              const SizedBox(width: 12),
                              OutlinedButton.icon(
                                onPressed: _joinGroup,
                                icon: const Icon(Icons.link),
                                label: const Text('Join'),
                                style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF4F46E5)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _groups.length,
                      itemBuilder: (_, i) {
                        final g = _groups[i];
                        final color = _groupColor(i);
                        final members = g['members'] ?? [];
                        return GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(
                            builder: (_) => GroupDetailScreen(groupId: g['id']?.toString() ?? '', groupName: g['name'] ?? 'Group'),
                          )).then((_) => _fetchGroups()),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.1),
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
                                        child: const Icon(Icons.group, color: Colors.white, size: 24),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(g['name'] ?? 'Group', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                                            Text('${members.length} member${members.length == 1 ? '' : 's'}',
                                              style: TextStyle(color: color, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                      Icon(Icons.chevron_right, color: color),
                                    ],
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      _statChip(Icons.receipt, '${g['expenseCount'] ?? 0} expenses', Colors.orange),
                                      const SizedBox(width: 8),
                                      _statChip(Icons.currency_rupee, 'You owe: ₹${g['youOwe']?.toStringAsFixed(0) ?? '0'}', 
                                        (g['youOwe'] ?? 0) > 0 ? Colors.red : Colors.green),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createGroup,
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Group', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _statChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class GroupDetailScreen extends StatefulWidget {
  final String groupId;
  final String groupName;
  const GroupDetailScreen({Key? key, required this.groupId, required this.groupName}) : super(key: key);
  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _group = {};
  List<dynamic> _expenses = [];
  List<dynamic> _balances = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        apiService.client.get('/split/groups/${widget.groupId}'),
        apiService.client.get('/split/groups/${widget.groupId}/expenses'),
        apiService.client.get('/split/groups/${widget.groupId}/balances').catchError((_) => Response(data: [], requestOptions: RequestOptions())),
      ]);
      setState(() {
        _group = results[0].data ?? {};
        _expenses = results[1].data is List ? results[1].data : [];
        _balances = results[2].data is List ? results[2].data : [];
      });
    } catch (_) {} finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _addExpense() async {
    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
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
            const Text('Add Expense', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(hintText: 'What was it for? (e.g. Groceries)', prefixIcon: Icon(Icons.receipt)),
              autofocus: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'Amount (₹)', prefixIcon: Icon(Icons.currency_rupee)),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5), padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                onPressed: () async {
                  if (titleCtrl.text.isEmpty || amountCtrl.text.isEmpty) return;
                  try {
                    await apiService.client.post('/split/groups/${widget.groupId}/expenses', data: {
                      'description': titleCtrl.text,
                      'amount': double.tryParse(amountCtrl.text) ?? 0,
                    });
                    if (ctx.mounted) Navigator.pop(ctx);
                    _fetchData();
                  } catch (e) {
                    if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                  }
                },
                child: const Text('Add Expense', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
        title: Text(widget.groupName, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Balances
                    if (_balances.isNotEmpty) ...[
                      const Text('Who owes what', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      ..._balances.map((b) {
                        final amount = (b['amount'] ?? 0).toDouble();
                        final isPositive = amount >= 0;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isPositive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(isPositive ? Icons.arrow_downward : Icons.arrow_upward, 
                                color: isPositive ? Colors.green : Colors.red, size: 20),
                              const SizedBox(width: 8),
                              Expanded(child: Text(b['description'] ?? '${b['userName']} ${isPositive ? 'gets back' : 'owes'} ₹${amount.abs().toStringAsFixed(0)}',
                                style: TextStyle(color: isPositive ? Colors.green[800] : Colors.red[800], fontWeight: FontWeight.w600))),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 24),
                    ],
                    // Expenses list
                    const Text('Expenses', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    if (_expenses.isEmpty)
                      Center(child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text('No expenses yet. Add the first one!', style: TextStyle(color: Colors.grey[500])),
                      ))
                    else
                      ..._expenses.map((e) {
                        final paidBy = e['paidBy'] ?? e['payer'] ?? {};
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: const Color(0xFF4F46E5).withOpacity(0.1), shape: BoxShape.circle),
                              child: const Icon(Icons.receipt, color: Color(0xFF4F46E5)),
                            ),
                            title: Text(e['description'] ?? e['title'] ?? 'Expense', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('Paid by ${paidBy['name'] ?? 'Unknown'}'),
                            trailing: Text('₹${(e['amount'] ?? 0).toStringAsFixed(0)}', 
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF4F46E5))),
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addExpense,
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Expense', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
