import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'admin_dashboard.dart';
import 'user_dashboard.dart';
import 'employees_list_screen.dart';
import 'reports_screen.dart';
import '../utils/constants.dart';

import 'profile_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  void _handleLogout(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    
    if (context.mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    final List<Widget> userPages = [
      const UserDashboard(),
      const ProfileScreen(),
    ];

    final List<Widget> adminPages = [
      const AdminDashboard(),
      const EmployeesListScreen(),
      const ReportsScreen(),
      const ProfileScreen(), 
    ];

    final isAdmin = user?.role == 'admin';
    final pages = isAdmin ? adminPages : userPages;

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: Text(
          isAdmin ? 'Admin Panel' : (_currentIndex == 0 ? 'Boshqaruv Paneli' : 'Profil'), 
          style: const TextStyle(fontWeight: FontWeight.bold)
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
            tooltip: 'Sozlamalar',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _handleLogout(context),
            tooltip: 'Tizimdan chiqish',
          ),
        ],
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator(color: AppConstants.primaryColor))
          : pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: AppConstants.primaryColor,
        unselectedItemColor: AppConstants.textSecondary,
        items: isAdmin
            ? const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Monitor'),
                BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Xodimlar'),
                BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'Stats'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
              ]
            : const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Asosiy'),
                BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'QR & Profil'),
              ],
      ),
    );
  }
}
