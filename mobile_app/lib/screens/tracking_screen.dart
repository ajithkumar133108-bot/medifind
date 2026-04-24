import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class TrackingScreen extends StatefulWidget {
  @override
  _TrackingScreenState createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  LatLng deliveryLocation = const LatLng(13.0827, 80.2707);

  @override
  void initState() {
    super.initState();
    simulateMovement();
  }

  void simulateMovement() {
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          deliveryLocation = LatLng(
            deliveryLocation.latitude + 0.001,
            deliveryLocation.longitude + 0.001,
          );
        });
        simulateMovement();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Live Delivery Tracking")),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: deliveryLocation,
              zoom: 14,
            ),
            markers: {
              Marker(
                markerId: const MarkerId("delivery"),
                position: deliveryLocation,
                icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
              )
            },
          ),
          Positioned(
            top: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 5)],
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("🚚 Delivery Status", style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text("On the way...", style: TextStyle(color: Colors.green)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
