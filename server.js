require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const { pool } = require('./config/db');
const { authMiddleware, requireRole } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const orderRoutes = require('./routes/order');
const medicineRoutes = require('./routes/medicine');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const orderModel = require('./models/orderModel');


const app = express();

// ═══ DELIVERY TRACKING SIMULATION ═════════════════════════
let deliveryLocation = { lat: 13.0827, lng: 80.2707 }; // initial
app.get("/api/delivery-location", (req, res) => {
  res.json(deliveryLocation);
});
setInterval(() => {
  // Simulate movement
  deliveryLocation.lat += 0.0005;
  deliveryLocation.lng += 0.0005;
}, 5000);
// ══════════════════════════════════════════════════════════



// app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);

app.use('/api', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', orderRoutes);
app.use('/api', medicineRoutes);
app.use('/api', notificationRoutes);
app.use('/api', adminRoutes);

// Protected static pages
app.get('/pages/user.html', requireRole('USER'), (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'user.html'));
});
app.get('/pages/pharmacy.html', requireRole('PHARMACY'), (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'pharmacy.html'));
});
app.get('/pages/admin.html', requireRole('ADMIN'), (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin.html'));
});

app.use(express.static(path.join(__dirname)));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ═══ DEMO PAYMENT ROUTES (no real payment gateway needed) ═══
app.post("/create-order", async (req, res) => {
  // Return a fake order object for demo purposes
  const { amount } = req.body;
  res.json({
    id: "demo_order_" + Date.now(),
    amount: Math.round((amount || 0) * 100),
    currency: "INR"
  });
});

app.post('/api/payment/verify', async (req, res) => {
  // Demo: always succeed and confirm the orders in DB
  const { orderIds } = req.body;
  try {
    if (orderIds) {
      const ids = String(orderIds).split(',');
      for (const id of ids) {
        const parsed = parseInt(id.trim(), 10);
        if (!isNaN(parsed)) {
          await orderModel.updateOrderStatus(parsed, 'CONFIRMED');
        }
      }
    }
    res.json({ success: true, message: "Demo payment verified successfully" });
  } catch (err) {
    // On hosted demos (e.g. Render), MySQL may be unavailable. Payment flow should still work.
    res.json({
      success: true,
      message: "Payment verified (demo). Database update skipped.",
      dbUpdated: false,
    });
  }
});

app.post('/save-order', async (req, res) => {
  const { orderIds, amount, selectedPharmacy } = req.body || {};
  if (!orderIds) {
    return res.status(400).json({ success: false, message: 'orderIds is required' });
  }

  try {
    const ids = String(orderIds)
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !Number.isNaN(id));

    for (const id of ids) {
      await orderModel.updateOrderStatus(id, 'CONFIRMED');
    }

    return res.json({
      success: true,
      message: 'Order saved successfully',
      savedOrders: ids.length,
      amount: Number(amount || 0),
      pharmacy: selectedPharmacy || null,
    });
  } catch (err) {
    return res.json({
      success: true,
      message: 'Order saved (demo). Database update skipped.',
      savedOrders: 0,
      amount: Number(amount || 0),
      pharmacy: selectedPharmacy || null,
      dbUpdated: false,
    });
  }
});
app.use((req, res) => res.status(404).send('Not found'));

const port = config.port;

async function start() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅ MySQL connected');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }

  app.listen(port, () => {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   💊  MediFind v3  –  Express Server          ║');
    console.log(`║   ➜   http://localhost:${port}`.padEnd(46) + '║');
    console.log('║                                               ║');
    console.log('║   Features: JWT auth · MVC routes · AI suggest║');
    console.log('║   Press Ctrl+C to stop                       ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
  });
}

start();
