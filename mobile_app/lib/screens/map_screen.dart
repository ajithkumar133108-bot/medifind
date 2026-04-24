import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MapScreen extends StatefulWidget {
  @override
  _MapScreenState createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late GoogleMapController mapController;

  final LatLng userLocation = const LatLng(13.0827, 80.2707);

  final Set<Marker> markers = {
    const Marker(
      markerId: MarkerId("pharmacy1"),
      position: LatLng(13.0850, 80.2750),
      infoWindow: InfoWindow(title: "Nearby Pharmacy"),
    ),
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Medifind Pharmacy Map")),
      body: GoogleMap(
        initialCameraPosition: CameraPosition(
          target: userLocation,
          zoom: 14,
        ),
        markers: markers,
        onMapCreated: (controller) {
          mapController = controller;
        },
      ),
    );
  }
}
