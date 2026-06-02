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
      // int maydon null bo'lmasligi uchun
      id: (json['id'] as num?)?.toInt() ?? 0,
      username: json['username'] as String? ?? '',
      firstname: json['firstname'] as String? ?? '',
      lastname: json['lastname'] as String? ?? '',
      // API 'full_name' yoki 'fullName' qaytarishi mumkin
      fullName: json['full_name'] as String? ??
          json['fullName'] as String? ??
          '${json['firstname'] ?? ''} ${json['lastname'] ?? ''}'.trim(),
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'user',
      status: json['status'] as String? ?? 'pending',
      position: json['position'] as String?,
      avatar: json['avatar'] as String?,
      // API 'qr_token' yoki 'qrToken' qaytarishi mumkin
      qrToken: json['qr_token'] as String? ?? json['qrToken'] as String?,
      telegramId: json['telegram_id'] as String? ?? json['telegramId'] as String?,
    );
  }

  bool get isAdmin => role == 'admin';
  bool get isActive => status == 'active';
  bool get isPending => status == 'pending';
  bool get isBanned => status == 'banned';

  String get displayName =>
      fullName.isNotEmpty ? fullName : username;

  String get avatarInitial =>
      firstname.isNotEmpty ? firstname[0].toUpperCase() : username[0].toUpperCase();
}
