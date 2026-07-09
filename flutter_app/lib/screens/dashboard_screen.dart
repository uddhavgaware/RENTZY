import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // User Header
          Row(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: Colors.indigo.withOpacity(0.1),
                backgroundImage: user?['profilePhoto'] != null ? NetworkImage(user!['profilePhoto']) : null,
                child: user?['profilePhoto'] == null ? const Icon(Icons.person, size: 40, color: Colors.indigo) : null,
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?['name'] ?? 'User Name',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?['email'] ?? 'email@example.com',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                onPressed: () {
                  context.go('/complete-profile');
                },
              ),
            ],
          ),
          const SizedBox(height: 40),

          const Text('ACCOUNT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 16),
          
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Personal Details'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/complete-profile'),
          ),
          
          if (auth.isAdmin) ...[
            const Divider(),
            ListTile(
              leading: const Icon(Icons.admin_panel_settings_outlined, color: Colors.indigo),
              title: const Text('Admin Dashboard', style: TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold)),
              trailing: const Icon(Icons.chevron_right, color: Colors.indigo),
              onTap: () => context.go('/admin'),
            ),
          ],

          const SizedBox(height: 24),
          const Text('SETTINGS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 16),

          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notifications'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Privacy & Security'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),

          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                auth.logout();
              },
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text('Log out', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),

          const SizedBox(height: 32),

          // ── Version Badge ──────────────────────────────────────────
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.verified, color: Colors.white, size: 16),
                      SizedBox(width: 8),
                      Text(
                        'RentXY v19.2.1',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Build: July 2026 • Full Featured Release',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Listings • Roommates • Chat • Split Expenses • Movers',
                  style: TextStyle(color: Colors.grey, fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
