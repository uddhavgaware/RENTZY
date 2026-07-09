import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../core/scaffold_with_nav_bar.dart';

import '../screens/auth_screen.dart';
import '../screens/home_screen.dart';
import '../screens/explore_screen.dart';
import '../screens/saved_screen.dart';
import '../screens/inbox_screen.dart';
import '../screens/dashboard_screen.dart'; // The profile tab
import '../screens/complete_profile_screen.dart';
import '../screens/forgot_password_screen.dart';
import '../screens/reset_password_screen.dart';
import '../screens/admin_dashboard_screen.dart';
import '../screens/listing_details_screen.dart';
import '../screens/roommates_screen.dart';
import '../screens/split_expenses_screen.dart';
import '../screens/movers_screen.dart';
import '../screens/post_property_screen.dart';
// ChatScreen is now in inbox_screen.dart
import '../screens/owner_profile_screen.dart';
import '../screens/info_screen.dart';
import '../screens/join_split_group_screen.dart';
import '../screens/mover_dashboard_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _homeNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final GlobalKey<NavigatorState> _exploreNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'explore');
final GlobalKey<NavigatorState> _savedNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'saved');
final GlobalKey<NavigatorState> _inboxNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'inbox');
final GlobalKey<NavigatorState> _profileNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'profile');

GoRouter createRouter(AuthProvider authProvider) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final isAuthenticated = authProvider.isAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth') || 
                          state.matchedLocation.startsWith('/forgot-password') || 
                          state.matchedLocation.startsWith('/reset-password');

      if (authProvider.isLoading) return null;

      if (!isAuthenticated && !isAuthRoute) {
        return '/auth';
      }

      if (isAuthenticated && isAuthRoute) {
        return '/';
      }

      // Check for Admin access
      if (state.matchedLocation.startsWith('/admin') && !authProvider.isAdmin) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => ResetPasswordScreen(token: state.uri.queryParameters['token']),
      ),
      GoRoute(
        path: '/complete-profile',
        builder: (context, state) => const CompleteProfileScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/listing/:id',
        builder: (context, state) => ListingDetailsScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/roommates',
        builder: (context, state) => const RoommatesScreen(),
      ),
      GoRoute(
        path: '/split-expenses',
        builder: (context, state) => const SplitExpensesScreen(),
      ),
      GoRoute(
        path: '/movers',
        builder: (context, state) => const MoversScreen(),
      ),
      GoRoute(
        path: '/post-property',
        builder: (context, state) => const PostPropertyScreen(),
      ),
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) => ChatScreen(
          chatId: state.pathParameters['id']!,
          otherName: state.uri.queryParameters['name'] ?? 'Chat',
          otherPhoto: state.uri.queryParameters['photo'],
        ),
      ),
      GoRoute(
        path: '/owner/:id',
        builder: (context, state) => OwnerProfileScreen(ownerId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/info',
        builder: (context, state) {
          final title = state.uri.queryParameters['title'] ?? 'Info';
          return InfoScreen(title: title);
        },
      ),
      GoRoute(
        path: '/join-group/:token',
        builder: (context, state) => JoinSplitGroupScreen(token: state.pathParameters['token']!),
      ),
      GoRoute(
        path: '/mover-dashboard',
        builder: (context, state) => const MoverDashboardScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _homeNavigatorKey,
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _exploreNavigatorKey,
            routes: [
              GoRoute(
                path: '/explore',
                builder: (context, state) {
                  return ExploreScreen(
                    initialType: state.uri.queryParameters['type'],
                    initialLocation: state.uri.queryParameters['location'],
                  );
                },
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _savedNavigatorKey,
            routes: [
              GoRoute(
                path: '/saved',
                builder: (context, state) => const SavedScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _inboxNavigatorKey,
            routes: [
              GoRoute(
                path: '/inbox',
                builder: (context, state) => const InboxScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _profileNavigatorKey,
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
