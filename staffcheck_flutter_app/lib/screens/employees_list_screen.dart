import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user_model.dart';
import '../utils/constants.dart';

class EmployeesListScreen extends StatefulWidget {
  const EmployeesListScreen({Key? key}) : super(key: key);

  @override
  State<EmployeesListScreen> createState() => _EmployeesListScreenState();
}

class _EmployeesListScreenState extends State<EmployeesListScreen> {
  final ApiService _apiService = ApiService();
  List<UserModel> _employees = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchEmployees();
  }

  Future<void> _fetchEmployees() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.get('/users/'); // Django dagi URL
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _employees = data.map((json) => UserModel.fromJson(json)).toList();
        });
      } else {
        setState(() {
          _errorMessage = "Ro'yxatni yuklashda xatolik: ${response.statusCode}";
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Tarmoq xatosi: $e";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Barcha Xodimlar'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchEmployees,
          )
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Yangi xodim qo'shish ekraniga o'tish (ixtiyoriy)
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Yangi xodimni web-sayt orqali qo'shing")),
          );
        },
        backgroundColor: AppConstants.primaryColor,
        child: const Icon(Icons.person_add, color: Colors.white),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppConstants.primaryColor));
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchEmployees,
              child: const Text("Qayta urinish"),
            )
          ],
        ),
      );
    }

    if (_employees.isEmpty) {
      return const Center(child: Text("Hozircha xodimlar yo'q."));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _employees.length,
      itemBuilder: (context, index) {
        final emp = _employees[index];
        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
              backgroundImage: emp.avatar != null && emp.avatar!.isNotEmpty
                  ? NetworkImage(emp.avatar!)
                  : null,
              child: emp.avatar == null || emp.avatar!.isEmpty
                  ? Text(
                      emp.firstname.isNotEmpty ? emp.firstname[0].toUpperCase() : '?',
                      style: const TextStyle(color: AppConstants.primaryColor),
                    )
                  : null,
            ),
            title: Text(emp.fullName.isNotEmpty ? emp.fullName : emp.username,
                style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(emp.position ?? emp.role),
            trailing: _buildStatusBadge(emp.status),
            onTap: () {
              // TODO: Xodim profiliga kirish
            },
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor = Colors.white;
    String text;

    switch (status) {
      case 'active':
        bgColor = AppConstants.statusPresent;
        text = 'Faol';
        break;
      case 'banned':
        bgColor = AppConstants.statusAbsent;
        text = 'Bloklangan';
        break;
      default:
        bgColor = Colors.orange;
        text = 'Kutmoqda';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}
