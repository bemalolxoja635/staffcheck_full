class UserModel {
  final int id;
  final String username;
  final String firstname;
  final String lastname;
  final String fullName;
  final String? phone;
  final String role;
  final String status;
  final String? position;
  final String? avatar;
  final String? qrToken;
  final String? telegramId;

  UserModel({
    required this.id,
    required this.username,
    required this.firstname,
    required this.lastname,
    required this.fullName,
    this.phone,
    required this.role,
    required this.status,
    this.position,
    this.avatar,
    this.qrToken,
    this.telegramId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'] ?? '',
      firstname: json['firstname'] ?? '',
      lastname: json['lastname'] ?? '',
      fullName: json['full_name'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'user',
      status: json['status'] ?? 'pending',
      position: json['position'],
      avatar: json['avatar'],
      qrToken: json['qr_token'],
      telegramId: json['telegram_id'],
    );
  }
}
