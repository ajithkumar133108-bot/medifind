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
const Razorpay = require('razorpay');
const crypto = require('crypto');
const orderModel = require('./models/orderModel');

const app = express();

const razorpay = new Razorpay({
  key_id: "YOUR_KEY_ID",
  key_secret: "YOUR_SECRET_KEY",
});

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

app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt: "order_rcptid_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/api/payment/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderIds } = req.body;
  
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", "YOUR_SECRET_KEY")
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment is authentic
    try {
      if (orderIds) {
        const ids = orderIds.split(',');
        for (const id of ids) {
          await orderModel.updateOrderStatus(parseInt(id, 10), 'CONFIRMED');
        }
      }
      res.json({ success: true, message: "Payment verified successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Database error" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
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
