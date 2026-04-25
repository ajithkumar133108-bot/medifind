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
const deliveryRoutes = require('./routes/delivery');
const orderModel = require('./models/orderModel');
const notificationModel = require('./models/notificationModel');

// ═══ TRACKING (DEMO) ════════════════════════════════════════
// In-memory sessions keyed by orderIds string.
// This avoids DB dependency for hosted demos.
const trackingSessions = new Map();

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function toNum(v) {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeTracking(session) {
  const now = Date.now();
  const elapsedMs = Math.max(0, now - session.startedAt);

  if (session.manual) {
    return {
      orderIds: session.orderIds,
      startedAt: session.startedAt,
      elapsedMs,
      status: session.manual.status || 'On the way',
      from: session.from || null,
      to: session.to || null,
      agent: session.manual.agent || null,
      manual: true,
    };
  }

  // Timeline (ms)
  const T_ASSIGNED = 8000;
  const T_PICKED = 20000;
  const T_ONTHEWAY_START = 20000;

  let status = 'Assigned';
  if (elapsedMs >= T_ASSIGNED) status = 'Picked';
  if (elapsedMs >= T_PICKED) status = 'On the way';
  if (session.deliveredByAgent) status = 'Delivered';

  const from = session.from;
  const to = session.to;

  // Move agent from pharmacy -> user during "On the way"
  let agent = null;
  if (from && to && from.lat != null && from.lng != null && to.lat != null && to.lng != null) {
    const t = clamp01((elapsedMs - T_ONTHEWAY_START) / 60000);
    agent = {
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    };
  }

  return {
    orderIds: session.orderIds,
    startedAt: session.startedAt,
    elapsedMs,
    status,
    deliveredByAgent: !!session.deliveredByAgent,
    receivedByUser: !!session.receivedByUser,
    from,
    to,
    agent,
  };
}


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
app.use('/api', deliveryRoutes);

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
app.get('/pages/delivery-man.html', requireRole('DELIVERY'), (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'delivery-man.html'));
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
  const { orderIds, amount, selectedPharmacy, userLocation } = req.body || {};
  if (!orderIds) {
    return res.status(400).json({ success: false, message: 'orderIds is required' });
  }

  // Create/refresh tracking session (demo)
  try {
    const from = {
      lat: toNum(selectedPharmacy?.latitude) ?? toNum(selectedPharmacy?.lat),
      lng: toNum(selectedPharmacy?.longitude) ?? toNum(selectedPharmacy?.lng),
      name: selectedPharmacy?.name || selectedPharmacy?.pharmacy_name || null,
      address: selectedPharmacy?.address || null,
    };
    const to = {
      lat: toNum(userLocation?.lat),
      lng: toNum(userLocation?.lng),
    };
    trackingSessions.set(String(orderIds), {
      orderIds: String(orderIds),
      startedAt: Date.now(),
      deliveredByAgent: false,
      receivedByUser: false,
      from: (from.lat != null && from.lng != null) ? from : null,
      to: (to.lat != null && to.lng != null) ? to : null,
    });
  } catch {}

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

app.get('/api/tracking', async (req, res) => {
  const orderIds = req.query.orderIds;
  if (!orderIds) return res.status(400).json({ success: false, message: 'orderIds is required' });
  const session = trackingSessions.get(String(orderIds));
  if (!session) {
    return res.json({
      success: true,
      status: 'Assigned',
      message: 'Tracking session not found yet. Complete payment first.',
      agent: deliveryLocation,
    });
  }
  // If DB delivery updates exist, use them for agent/status (more "real").
  // This is optional and falls back to the demo simulation.
  let tracking = computeTracking(session);
  try {
    const ids = String(orderIds).split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n));
    const orderId = ids[0];
    if (orderId) {
      const deliveryModel = require('./models/deliveryModel');
      const d = await deliveryModel.getDeliveryByOrderId(orderId);
      if (d) {
        const statusMap = {
          ASSIGNED: 'Assigned',
          ACCEPTED: 'Assigned',
          PICKED: 'Picked',
          ON_THE_WAY: 'On the way',
          DELIVERED: 'Delivered',
        };
        tracking = {
          ...tracking,
          status: statusMap[d.status] || tracking.status,
          deliveredByAgent: d.status === 'DELIVERED' ? true : tracking.deliveredByAgent,
          agent: (d.current_latitude != null && d.current_longitude != null)
            ? { lat: Number(d.current_latitude), lng: Number(d.current_longitude) }
            : tracking.agent,
          manual: true,
        };
      }
    }
  } catch {}
  return res.json({ success: true, ...tracking, agent: tracking.agent || deliveryLocation });
});

app.get('/api/tracking/sessions', (req, res) => {
  const sessions = Array.from(trackingSessions.values()).map((s) => {
    const t = computeTracking(s);
    return {
      orderIds: s.orderIds,
      status: t.status,
      startedAt: s.startedAt,
      from: s.from || null,
      to: s.to || null,
      manual: !!s.manual,
    };
  });
  res.json({ success: true, sessions });
});

app.post('/api/tracking/update', (req, res) => {
  const { orderIds, lat, lng, status, done } = req.body || {};
  if (!orderIds) return res.status(400).json({ success: false, message: 'orderIds is required' });

  const session = trackingSessions.get(String(orderIds));
  if (!session) return res.status(404).json({ success: false, message: 'Tracking session not found' });

  if (done) {
    session.deliveredByAgent = true;
    session.manual = { status: 'Delivered', agent: session.manual?.agent || null };
    return res.json({ success: true });
  }

  const agentLat = toNum(lat);
  const agentLng = toNum(lng);
  session.manual = {
    status: status || session.manual?.status || 'On the way',
    agent: (agentLat != null && agentLng != null) ? { lat: agentLat, lng: agentLng } : (session.manual?.agent || null),
    updatedAt: Date.now(),
  };
  trackingSessions.set(String(orderIds), session);
  return res.json({ success: true });
});

app.post('/api/tracking/confirm-received', async (req, res) => {
  if (!req.user || req.user.role !== 'USER') {
    return res.status(401).json({ success: false, message: 'Login required.' });
  }
  const { orderIds } = req.body || {};
  if (!orderIds) {
    return res.status(400).json({ success: false, message: 'orderIds is required' });
  }

  const session = trackingSessions.get(String(orderIds));
  if (session) {
    session.receivedByUser = true;
    trackingSessions.set(String(orderIds), session);
  }

  const ids = String(orderIds)
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !Number.isNaN(id));

  try {
    for (const id of ids) {
      await orderModel.updateOrderStatus(id, 'DELIVERED');
      const details = await orderModel.getOrderDetails(id);
      if (details && details.pharmacy_id) {
        await notificationModel.createNotification(
          null,
          details.pharmacy_id,
          `✅ User confirmed medicine received for order #${id}. Pharmacy delivery completed.`,
          'ORDER_UPDATE'
        );
      }
    }
  } catch (_) {}

  return res.json({
    success: true,
    message: 'Medicine received confirmed. Pharmacy has been notified.',
  });
});
app.use((req, res) => res.status(404).send('Not found'));

const port = config.port;

async function ensureDeliveryQuickLogin() {
  const email = 'delivery@test.com';
  const password = 'delivery123';
  try {
    await pool.execute(
      `INSERT INTO delivery_persons (full_name, email, password, phone, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         password = VALUES(password),
         phone = VALUES(phone),
         is_active = 1`,
      ['Delivery Agent', email, password, '9000000099'],
    );
    console.log('✅ Delivery quick-login account ensured');
  } catch (error) {
    console.warn('⚠️ Could not ensure delivery quick-login account:', error.message);
  }
}

async function start() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅ MySQL connected');
    await ensureDeliveryQuickLogin();
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
