import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class UserDashboard extends StatelessWidget {
  const UserDashboard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return const Center(child: Text("Foydalanuvchi ma'lumotlari topilmadi"));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting header
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                child: Text(
                  user.firstname.isNotEmpty ? user.firstname[0].toUpperCase() : 'U',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.primaryColor,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Xush kelibsiz,',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                    Text(
                      user.fullName.isNotEmpty ? user.fullName : user.username,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          // Profile Info Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Profil Ma\'lumotlari',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Divider(height: 32),
                _buildInfoRow(Icons.work_outline, 'Lavozim', user.position ?? 'Kiritilmagan'),
                const SizedBox(height: 16),
                _buildInfoRow(Icons.phone_outlined, 'Telefon', user.phone ?? 'Kiritilmagan'),
                const SizedBox(height: 16),
                _buildInfoRow(Icons.security_outlined, 'Holat', user.status == 'active' ? 'Faol' : 'Kutmoqda', 
                  valueColor: user.status == 'active' ? AppConstants.statusPresent : AppConstants.statusLate),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Status Notification
          if (user.status == 'pending')
             Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.orange),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Akkauntingiz hozircha admin tomonidan tasdiqlanmagan. To\'liq ishlashi uchun kuting.',
                      style: TextStyle(color: Colors.orange),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {Color? valueColor}) {
    return Row(
      children: [
        Icon(icon, size: 24, color: AppConstants.textSecondary),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppConstants.textSecondary,
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: valueColor ?? AppConstants.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
