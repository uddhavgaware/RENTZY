import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'core/router.dart';

void main() {
  runZonedGuarded(() {
    WidgetsFlutterBinding.ensureInitialized();

    ErrorWidget.builder = (FlutterErrorDetails details) {
      return Material(
        child: Container(
          color: Colors.red,
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'App Crashed!',
                  style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                Text(
                  details.exceptionAsString(),
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                ),
                const SizedBox(height: 10),
                Text(
                  details.stack.toString(),
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );
    };

    runApp(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
        ],
        child: const RentXYApp(),
      ),
    );
  }, (error, stackTrace) {
    debugPrint('Fatal error: $error\n$stackTrace');
  });
}

class RentXYApp extends StatelessWidget {
  const RentXYApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = context.read<AuthProvider>();
    final router = createRouter(authProvider);

    return MaterialApp.router(
      title: 'RentXY',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5), // Indigo 600
          brightness: Brightness.light,
        ),
        fontFamily: 'Inter',
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          brightness: Brightness.dark,
        ),
        fontFamily: 'Inter',
      ),
      themeMode: ThemeMode.system,
    );
  }
}
