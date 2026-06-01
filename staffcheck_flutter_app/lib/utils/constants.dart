import 'package:flutter/material.dart';

class AppConstants {
  // API URL
  // O'zgartirish ehtiyoji bo'lsa shu yerdan barcha so'rovlar uchun o'zgaradi
  static const String apiBaseUrl = 'https://staffcheck-production-9034.up.railway.app/api/v1'; 
  static const String telegramBotLink = 'https://t.me/your_bot_username'; // Admin tomonidan bot username kiritiladi

  // Asosiy Ranglar (Colors)
  static const Color primaryColor = Color(0xFF2563EB); // Blue 600
  static const Color secondaryColor = Color(0xFF3B82F6); // Blue 500
  static const Color accentColor = Color(0xFFF59E0B); // Amber 500
  
  // Orqa fon va matn ranglari
  static const Color backgroundColor = Color(0xFFF8FAFC); // Slate 50
  static const Color darkBackgroundColor = Color(0xFF0F172A); // Slate 900
  static const Color cardColor = Colors.white;
  static const Color darkCardColor = Color(0xFF1E293B); // Slate 800
  
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  // Status Ranglari (Davomat turlari uchun)
  static const Color statusPresent = Color(0xFF10B981); // Emerald 500 - Kelgan
  static const Color statusAbsent = Color(0xFFEF4444);  // Red 500 - Kelmagan
  static const Color statusLate = Color(0xFFF59E0B);    // Amber 500 - Kech qolgan
  static const Color statusLeave = Color(0xFF8B5CF6);   // Violet 500 - Javob olgan

  // Shrift o'lchamlari
  static const double titleFontSize = 24.0;
  static const double subtitleFontSize = 18.0;
  static const double bodyFontSize = 14.0;
}
