import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  Future<void> _launchTelegramBot(String? qrToken) async {
    if (qrToken == null || qrToken.isEmpty) return;
    
    final Uri url = Uri.parse('${AppConstants.telegramBotLink}?start=$qrToken');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      debugPrint('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mening Profilim'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar
              CircleAvatar(
                radius: 50,
                backgroundColor: AppConstants.primaryColor.withOpacity(0.2),
                backgroundImage: user.avatar != null && user.avatar!.isNotEmpty
                    ? NetworkImage(user.avatar!)
                    : null,
                child: user.avatar == null || user.avatar!.isEmpty
                    ? Text(
                        user.firstname.isNotEmpty ? user.firstname[0].toUpperCase() : 'U',
                        style: const TextStyle(fontSize: 40, color: AppConstants.primaryColor),
                      )
                    : null,
              ),
              const SizedBox(height: 16),
              
              // Ism va Lavozim
              Text(
                user.fullName.isNotEmpty ? user.fullName : user.username,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              if (user.position != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    user.position!,
                    style: const TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ),
                
              const SizedBox(height: 32),
              
              // QR Kod
              const Text(
                'Sizning QR Kodingiz:',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      spreadRadius: 2,
                    )
                  ],
                ),
                child: user.qrToken != null && user.qrToken!.isNotEmpty 
                  ? QrImageView(
                      data: user.qrToken!,
                      version: QrVersions.auto,
                      size: 200.0,
                    )
                  : const SizedBox(
                      height: 200,
                      width: 200,
                      child: Center(child: Text("Hozircha QR kod biriktirilmagan")),
                    ),
              ),
              
              const SizedBox(height: 32),
              
              // Telegram Bot integratsiyasi
              const Text(
                'Bot orqali davomat bildirishnomalarini oling:',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: (user.qrToken != null && user.qrToken!.isNotEmpty)
                    ? () => _launchTelegramBot(user.qrToken)
                    : null,
                icon: const Icon(Icons.telegram),
                label: const Text('Telegram Botga Ulanish'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0088cc), // Telegram color
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
