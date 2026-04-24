import 'package:flutter/material.dart';

class CartScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Your Cart")),
      body: Center(
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.teal,
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
          ),
          onPressed: () {
            // Navigate to payment logic
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Processing Payment...")),
            );
          },
          child: const Text("Proceed to Payment", style: TextStyle(fontSize: 16)),
        ),
      ),
    );
  }
}
