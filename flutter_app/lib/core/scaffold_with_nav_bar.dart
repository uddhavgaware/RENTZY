import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ScaffoldWithNavBar extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const ScaffoldWithNavBar({
    Key? key,
    required this.navigationShell,
  }) : super(key: key);

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: NavigationBar(
          height: 65,
          elevation: 0,
          backgroundColor: Colors.white,
          indicatorColor: const Color(0xFFEEF2FF),
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: _onTap,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.home_rounded, color: Color(0xFF4F46E5)),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.search_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.search_rounded, color: Color(0xFF4F46E5)),
              label: 'Explore',
            ),
            NavigationDestination(
              icon: Icon(Icons.favorite_outline_rounded, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.favorite_rounded, color: Color(0xFF4F46E5)),
              label: 'Saved',
            ),
            NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.chat_bubble_rounded, color: Color(0xFF4F46E5)),
              label: 'Inbox',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.person_rounded, color: Color(0xFF4F46E5)),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
