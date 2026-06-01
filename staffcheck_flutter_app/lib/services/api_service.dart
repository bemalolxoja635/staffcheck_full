import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';

class ApiService {
  final storage = const FlutterSecureStorage();

  // Umumiy sarlavhalar (headers)
  Future<Map<String, String>> _getHeaders() async {
    String? token = await storage.read(key: 'jwt_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // POST so'rovi
  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
    final headers = await _getHeaders();
    
    try {
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
      return response;
    } catch (e) {
      throw Exception('Tarmoq xatosi: $e');
    }
  }

  // GET so'rovi
  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
    final headers = await _getHeaders();
    
    try {
      final response = await http.get(
        url,
        headers: headers,
      );
      return response;
    } catch (e) {
      throw Exception('Tarmoq xatosi: $e');
    }
  }
}
