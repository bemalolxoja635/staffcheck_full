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
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.front,
    torchEnabled: false,
  );
  
  final ApiService _apiService = ApiService();
  bool _isProcessing = false;

  Future<Position?> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lokatsiya xizmati faol emas.')));
      return null;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lokatsiyaga ruxsat berilmadi.')));
        return null;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lokatsiya butunlay man etilgan.')));
      return null;
    }

    return await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }

  void _onDetect(BarcodeCapture capture) async {
    final List<Barcode> barcodes = capture.barcodes;
    if (_isProcessing || barcodes.isEmpty) return;
    
    setState(() => _isProcessing = true);
    final String code = barcodes.first.rawValue ?? '---';
    
    // Position checks (Geofencing constraint)
    Position? position = await _getCurrentLocation();
    
    double lat = position?.latitude ?? 0.0;
    double lng = position?.longitude ?? 0.0;

    try {
      final response = await _apiService.post('/attendance/qr/', {
        'qr_token': code,
        'lat': lat,
        'lng': lng,
      });

      if (mounted) {
        if (response.statusCode == 200 || response.statusCode == 201) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Davomat muvaffaqiyatli saqlandi!'), backgroundColor: Colors.green));
        } else {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Xatolik: ${response.statusCode}'), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Tarmoq xatosi: $e'), backgroundColor: Colors.red));
      }
    }

    // Prevents double scanning rapidly
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) {
       setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Skaner (Qorovullik)'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _onDetect,
          ),
          if (_isProcessing)
            Container(
              color: Colors.black45,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text('Davomat ishlanmoqda...', style: TextStyle(color: Colors.white)),
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
