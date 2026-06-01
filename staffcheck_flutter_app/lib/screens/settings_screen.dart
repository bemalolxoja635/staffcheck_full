import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import 'login_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sozlamalar'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          const Text(
            'Tashqi ko\'rinish',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppConstants.textSecondary),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            title: const Text('Qorong\'u rejim (Dark Mode)'),
            subtitle: const Text('Tizim rangini qorong\'u qilish'),
            secondary: const Icon(Icons.dark_mode),
            value: themeProvider.isDarkMode,
            onChanged: (value) {
              themeProvider.toggleTheme();
            },
          ),
          const Divider(),
          const SizedBox(height: 16),
          const Text(
            'Boshqa',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppConstants.textSecondary),
          ),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('Ilova haqida'),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('StaffCheck v1.0.0')));
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Tizimdan chiqish', style: TextStyle(color: Colors.red)),
            onTap: () async {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
