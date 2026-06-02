import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../utils/constants.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter/services.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _fadeAnimation =
        Tween<double>(begin: 0.0, end: 1.0).animate(_animationController);
    _animationController.forward();

    // initState dan to'g'ridan-to'g'ri Future chaqirib bo'lmaydi,
    // addPostFrameCallback ishlatildi
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeApp();
    });
  }

  Future<void> _initializeApp() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.checkLoginStatus();
    if (!mounted) return;

    if (!authProvider.isAuthenticated) {
      _goToLogin();
      return;
    }

    // Biometrik tekshiruv (ixtiyoriy)
    bool authenticated = await _checkBiometrics();
    if (!mounted) return;

    if (authenticated) {
      _goToHome();
    } else {
      await authProvider.logout();
      _goToLogin();
    }
  }

  Future<bool> _checkBiometrics() async {
    final LocalAuthentication auth = LocalAuthentication();
    try {
      final bool canCheck = await auth.canCheckBiometrics;
      final bool isSupported = await auth.isDeviceSupported();

      if (!canCheck && !isSupported) return true; // Qurilma qo'llab-quvvatlamasa o'tkazib yuboramiz

      return await auth.authenticate(
        localizedReason:
            'Ilovaga kirish uchun barmoq izingizni yoki yuzingizni tasdiqlang',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException catch (e) {
      debugPrint('Biometrik xatolik: $e');
      return true; // Xatolik bo'lsa parolsiz o'tkazaveramiz
    }
  }

  void _goToLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _goToHome() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.check_circle_outline, size: 100, color: Colors.white),
              SizedBox(height: 20),
              Text(
                'StaffCheck',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1.5,
                ),
              ),
              SizedBox(height: 10),
              Text(
                'Xodimlar boshqaruvi tizimi',
                style: TextStyle(fontSize: 16, color: Colors.white70),
              ),
              SizedBox(height: 48),
              CircularProgressIndicator(
                color: Colors.white54,
                strokeWidth: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
