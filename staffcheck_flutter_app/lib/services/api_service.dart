import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';

class ApiService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // Timeout vaqti
  static const Duration _timeout = Duration(seconds: 30);

  // Sarlavhalar (headers)
  Future<Map<String, String>> _getHeaders({bool withAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (withAuth) {
      final token = await _storage.read(key: 'jwt_token');
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // Token yangilash (refresh)
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/auth/token/refresh/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh': refreshToken}),
      ).timeout(_timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storage.write(key: 'jwt_token', value: data['access']);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // POST so'rovi (token yangilash bilan)
  Future<http.Response> post(String endpoint, Map<String, dynamic> body,
      {bool withAuth = true}) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
    final headers = await _getHeaders(withAuth: withAuth);

    try {
      var response = await http
          .post(url, headers: headers, body: jsonEncode(body))
          .timeout(_timeout);

      // 401 bo'lsa token yangilash urinish
      if (response.statusCode == 401 && withAuth) {
        final refreshed = await _refreshToken();
        if (refreshed) {
          final newHeaders = await _getHeaders();
          response = await http
              .post(url, headers: newHeaders, body: jsonEncode(body))
              .timeout(_timeout);
        }
      }
      return response;
    } on SocketException {
      throw Exception('Internet aloqasi yo\'q. Tarmoqni tekshiring.');
    } on HttpException {
      throw Exception('Server bilan ulanishda xatolik.');
    } on FormatException {
      throw Exception('Serverdan noto\'g\'ri javob keldi.');
    } catch (e) {
      throw Exception('Xatolik: $e');
    }
  }

  // GET so'rovi (token yangilash bilan)
  Future<http.Response> get(String endpoint, {bool withAuth = true}) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
    final headers = await _getHeaders(withAuth: withAuth);

    try {
      var response = await http.get(url, headers: headers).timeout(_timeout);

      // 401 bo'lsa token yangilash urinish
      if (response.statusCode == 401 && withAuth) {
        final refreshed = await _refreshToken();
        if (refreshed) {
          final newHeaders = await _getHeaders();
          response = await http.get(url, headers: newHeaders).timeout(_timeout);
        }
      }
      return response;
    } on SocketException {
      throw Exception('Internet aloqasi yo\'q. Tarmoqni tekshiring.');
    } on HttpException {
      throw Exception('Server bilan ulanishda xatolik.');
    } on FormatException {
      throw Exception('Serverdan noto\'g\'ri javob keldi.');
    } catch (e) {
      throw Exception('Xatolik: $e');
    }
  }

  // DELETE so'rovi
  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
    final headers = await _getHeaders();

    try {
      return await http.delete(url, headers: headers).timeout(_timeout);
    } catch (e) {
      throw Exception('Xatolik: $e');
    }
  }

  // PATCH so'rovi
  Future<http.Response> patch(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
    final headers = await _getHeaders();

    try {
      return await http
          .patch(url, headers: headers, body: jsonEncode(body))
          .timeout(_timeout);
    } catch (e) {
      throw Exception('Xatolik: $e');
    }
  }
}
