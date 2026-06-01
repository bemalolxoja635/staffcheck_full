import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String _errorMessage = '';
  UserModel? _currentUser;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  UserModel? get currentUser => _currentUser;

  // Ilova ishga tushganda tokenni tekshirish
  Future<void> checkLoginStatus() async {
    String? token = await _storage.read(key: 'jwt_token');
    if (token != null && token.isNotEmpty) {
      _isAuthenticated = true;
      await fetchUser();
    } else {
      _isAuthenticated = false;
    }
    notifyListeners();
  }

  // Kirish (Login)
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final response = await _apiService.post('/auth/login/', {
        'username': username, 
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data.containsKey('access')) {
          await _storage.write(key: 'jwt_token', value: data['access']);
          if (data.containsKey('refresh')) {
            await _storage.write(key: 'refresh_token', value: data['refresh']);
          }
          _isAuthenticated = true;
          await fetchUser();
          
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
      
      _errorMessage = 'Login yoki parol xato.';
      _isLoading = false;
      notifyListeners();
      return false;
      
    } catch (e) {
      _errorMessage = 'Tizimga ulanishda xatolik yuz berdi.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Foydalanuvchi ma'lumotlarini olish
  Future<void> fetchUser() async {
    try {
      final response = await _apiService.get('/auth/me/');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentUser = UserModel.fromJson(data);
      } else {
        // Tokendagi xatolik sabab login ekranga chiqarish kerak bo'lishi mumkin
        await logout();
      }
    } catch (e) {
      print('Fetch user error: $e');
    }
  }

  // Chiqish (Logout)
  Future<void> logout() async {
    await _storage.delete(key: 'jwt_token');
    await _storage.delete(key: 'refresh_token');
    _isAuthenticated = false;
    _currentUser = null;
    notifyListeners();
  }
}
