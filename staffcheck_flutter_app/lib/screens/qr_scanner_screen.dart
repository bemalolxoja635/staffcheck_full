import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({Key? key}) : super(key: key);

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  late final MobileScannerController controller;
  final ApiService _apiService = ApiService();
  bool _isProcessing = false;
  bool _flashOn = false;

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back, // TUZATILDI: Orqa kamera QR uchun to'g'riroq
      torchEnabled: false,
    );
  }

  Future<Position?> _getCurrentLocation() async {
    // Joylashuv xizmatini tekshirish
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showSnack('GPS o\'chirilgan. Sozlamalarga o\'ting.', isError: true);
      return null;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      _showSnack('Joylashuv ruxsati berilmadi.', isError: true);
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (e) {
      return null; // Lokatsiya olinmasa ham davomat saqlaymiz (lat/lng = 0)
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing || capture.barcodes.isEmpty) return;
    final rawValue = capture.barcodes.first.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    setState(() => _isProcessing = true);

    // Joylashuvni olish
    final position = await _getCurrentLocation();
    final lat = position?.latitude ?? 0.0;
    final lng = position?.longitude ?? 0.0;

    try {
      final response = await _apiService.post('/attendance/qr/', {
        'qr_token': rawValue,
        'lat': lat,
        'lng': lng,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSnack('✅ Davomat muvaffaqiyatli saqlandi!');
      } else if (response.statusCode == 400) {
        _showSnack('❌ Noto\'g\'ri QR kod yoki davomat allaqachon belgilangan.', isError: true);
      } else if (response.statusCode == 403) {
        _showSnack('❌ Siz bu joydan davomatzlatira olmaysiz (Geofencing).', isError: true);
      } else {
        _showSnack('❌ Xatolik: ${response.statusCode}', isError: true);
      }
    } catch (e) {
      _showSnack('❌ ${e.toString().replaceFirst('Exception: ', '')}', isError: true);
    }

    // 3 soniya kutib qayta skanerlash
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) setState(() => _isProcessing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('QR Skaner'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_flashOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () {
              controller.toggleTorch();
              setState(() => _flashOn = !_flashOn);
            },
            tooltip: 'Chiroq',
          ),
        ],
      ),
      body: Stack(
        children: [
          // Kamera oynasi
          MobileScanner(controller: controller, onDetect: _onDetect),

          // Markerli ramka
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: AppConstants.primaryColor, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text(
                  'QR kodni ramka ichiga joylashtiring',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ),
            ),
          ),

          // Yuklanish holati
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Davomat saqlanmoqda...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
