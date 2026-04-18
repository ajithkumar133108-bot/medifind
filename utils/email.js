const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter = null;
if (config.email.enabled && config.email.gmail && config.email.appPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.email.gmail, pass: config.email.appPassword },
  });
  transporter.verify((err) => {
    if (err) console.error('Email setup error:', err.message);
    else console.log('Email transporter ready');
  });
}

async function sendEmail(to, subject, html) {
  if (!transporter || !to) return;
  try {
    await transporter.sendMail({ from: `"MediFind" <${config.email.gmail}>`, to, subject, html });
    console.log('Email sent to', to);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
}

function emailOrderPlaced(order) {
  return {
    subject: `✅ Order #${order.id} Placed – MediFind`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:#10b981;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">💊 MediFind</h1>
          <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px;">Order Confirmation</p>
        </div>
        <div style="padding:28px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Order #${order.id} Placed Successfully!</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;">Medicine</td><td style="font-weight:700;">${order.medicine_name} (${order.brand || ''})</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Pharmacy</td><td>${order.pharmacy_name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Quantity</td><td>${order.quantity} ${order.unit}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="color:#10b981;font-weight:700;">₹${parseFloat(order.total_price).toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Delivery</td><td>${order.delivery_type === 'HOME_DELIVERY' ? '🚚 Home Delivery' : '🏪 Pharmacy Pickup'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Status</td><td><span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">PENDING</span></td></tr>
          </table>
          <p style="color:#64748b;font-size:13px;margin-top:20px;">You will receive another email when the pharmacy confirms your order.</p>
        </div>
        <div style="background:#f1f5f9;padding:14px;text-align:center;font-size:12px;color:#94a3b8;">MediFind – Real-Time Medicine Booking</div>
      </div>`,
  };
}

function emailOrderStatus(order) {
  const statusColors = {
    CONFIRMED: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed ✅' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected ❌' },
    DISPATCHED: { bg: '#dbeafe', color: '#1e40af', label: 'Dispatched 🚚' },
    DELIVERED: { bg: '#d1fae5', color: '#065f46', label: 'Delivered ✅' },
  };
  const s = statusColors[order.status] || { bg: '#f1f5f9', color: '#334155', label: order.status };
  const msgs = {
    CONFIRMED: 'Great news! The pharmacy has confirmed your order and is preparing it.',
    REJECTED: 'Unfortunately your order was rejected by the pharmacy. Please try another pharmacy.',
    DISPATCHED: 'Your order is on the way! Expect delivery soon.',
    DELIVERED: 'Your order has been delivered successfully. Thank you for using MediFind!',
  };
  return {
    subject: `Order #${order.id} ${s.label} – MediFind`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:#10b981;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">💊 MediFind</h1>
          <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px;">Order Update</p>
        </div>
        <div style="padding:28px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">Order #${order.id} Update</h2>
          <span style="background:${s.bg};color:${s.color};padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;">${s.label}</span>
          <p style="color:#475569;margin:16px 0;">${msgs[order.status] || ''}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;">Medicine</td><td style="font-weight:700;">${order.medicine_name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Pharmacy</td><td>${order.pharmacy_name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="color:#10b981;font-weight:700;">₹${parseFloat(order.total_price).toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="background:#f1f5f9;padding:14px;text-align:center;font-size:12px;color:#94a3b8;">MediFind – Real-Time Medicine Booking</div>
      </div>`,
  };
}

function emailNewOrderToPharmacy(order) {
  return {
    subject: `🔔 New Order #${order.id} – MediFind`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <div style="background:#0f172a;padding:24px;text-align:center;">
          <h1 style="color:#10b981;margin:0;font-size:22px;">💊 MediFind</h1>
          <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">New Incoming Order</p>
        </div>
        <div style="padding:28px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">New Order #${order.id} Received!</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;">Customer</td><td style="font-weight:700;">${order.user_name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td>${order.user_phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Medicine</td><td style="font-weight:700;">${order.medicine_name} (${order.brand || ''})</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Quantity</td><td>${order.quantity} ${order.unit}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="color:#10b981;font-weight:700;">₹${parseFloat(order.total_price).toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Delivery</td><td>${order.delivery_type === 'HOME_DELIVERY' ? '🚚 Home Delivery' : '🏪 Pharmacy Pickup'}</td></tr>
            ${order.delivery_address ? `<tr><td style="padding:8px 0;color:#64748b;">Address</td><td>${order.delivery_address}</td></tr>` : ''}
          </table>
          <p style="color:#64748b;font-size:13px;margin-top:20px;">Login to MediFind to confirm or reject this order.</p>
        </div>
        <div style="background:#f1f5f9;padding:14px;text-align:center;font-size:12px;color:#94a3b8;">MediFind – Real-Time Medicine Booking</div>
      </div>`,
  };
}

module.exports = { sendEmail, emailOrderPlaced, emailOrderStatus, emailNewOrderToPharmacy };
