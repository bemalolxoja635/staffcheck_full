import 'dart:convert';
import 'package:flutter/foundation.dart';
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
    try {
      final token = await _storage.read(key: 'jwt_token');
      if (token != null && token.isNotEmpty) {
        await fetchUser();
        // fetchUser ichida xatolik bo'lsa logout qiladi
      } else {
        _isAuthenticated = false;
      }
    } catch (_) {
      _isAuthenticated = false;
    }
    notifyListeners();
  }

  // Login
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/login/',
        {'username': username, 'password': password},
        withAuth: false,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data.containsKey('access')) {
          await _storage.write(key: 'jwt_token', value: data['access']);
          if (data.containsKey('refresh')) {
            await _storage.write(key: 'refresh_token', value: data['refresh']);
          }
          await fetchUser();
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } else if (response.statusCode == 401) {
        _errorMessage = 'Login yoki parol xato.';
      } else if (response.statusCode == 400) {
        final data = jsonDecode(response.body);
        _errorMessage = data['detail'] ?? 'Noto\'g\'ri ma\'lumotlar kiritildi.';
      } else {
        _errorMessage = 'Server xatosi (${response.statusCode}). Qayta urinib ko\'ring.';
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Foydalanuvchi ma'lumotlarini serverdan olish
  Future<void> fetchUser() async {
    try {
      final response = await _apiService.get('/auth/me/');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentUser = UserModel.fromJson(data);
        _isAuthenticated = true;
      } else {
        // Token yaroqsiz yoki muddati o'tgan
        await logout();
      }
    } catch (e) {
      debugPrint('fetchUser xatosi: $e');
      await logout();
    }
  }

  // Logout
  Future<void> logout() async {
    await _storage.delete(key: 'jwt_token');
    await _storage.delete(key: 'refresh_token');
    _isAuthenticated = false;
    _currentUser = null;
    notifyListeners();
  }

  // Xato xabarini tozalash
  void clearError() {
    _errorMessage = '';
    notifyListeners();
  }
}
