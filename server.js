// ══════════════════════════════════════════════════════════════
//  MediFind v3  –  server.js
//  Features: Cart, Order Management, Email Notifications
//  Run: node server.js  |  Open: http://localhost:5000
// ══════════════════════════════════════════════════════════════

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");

// ════════════════════════════════════════════════════════
//  ▼▼▼  CONFIGURATION  –  EDIT THESE  ▼▼▼
// ════════════════════════════════════════════════════════

const CONFIG = {
  // MySQL – read from environment variables (Railway provides these)
  db: {
    host: process.env.MYSQLHOST_PUBLIC || process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT_PUBLIC || process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "root",
    database: process.env.MYSQLDATABASE || "medifind_db",
  },

  email: {
    enabled: false,
    gmail: process.env.GMAIL || "",
    appPassword: process.env.GMAIL_PASS || "",
  },

  server: {
    port: process.env.PORT || 5000,
  },
};
// ════════════════════════════════════════════════════════
//  DATABASE
// ════════════════════════════════════════════════════════
const pool = mysql.createPool({
  ...CONFIG.db,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error("\n❌  MySQL Error:", err.message);
    console.error("    → Check your password in CONFIG.db.password\n");
  } else {
    console.log("   ✅  MySQL connected");
    conn.release();
  }
});

function q(sql, params) {
  return new Promise((res, rej) => {
    pool.query(sql, params || [], (err, rows) => {
      if (err) rej(err);
      else res(rows);
    });
  });
}

// ════════════════════════════════════════════════════════
//  EMAIL
// ════════════════════════════════════════════════════════
let transporter = null;
if (CONFIG.email.enabled) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: CONFIG.email.gmail, pass: CONFIG.email.appPassword },
  });
  transporter.verify((err) => {
    if (err) console.error("   ❌  Email error:", err.message);
    else console.log("   ✅  Email (Gmail) ready");
  });
}

async function sendEmail(to, subject, html) {
  if (!transporter || !to) return;
  try {
    await transporter.sendMail({
      from: `"MediFind 💊" <${CONFIG.email.gmail}>`,
      to,
      subject,
      html,
    });
    console.log("   📧  Email sent to", to);
  } catch (e) {
    console.error("   ❌  Email failed:", e.message);
  }
}

// Email templates
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
            <tr><td style="padding:8px 0;color:#64748b;">Medicine</td><td style="font-weight:700;">${order.medicine_name} (${order.brand || ""})</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Pharmacy</td><td>${order.pharmacy_name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Quantity</td><td>${order.quantity} ${order.unit}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="color:#10b981;font-weight:700;">₹${parseFloat(order.total_price).toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Delivery</td><td>${order.delivery_type === "HOME_DELIVERY" ? "🚚 Home Delivery" : "🏪 Pharmacy Pickup"}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Status</td><td><span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">PENDING</span></td></tr>
          </table>
          <p style="color:#64748b;font-size:13px;margin-top:20px;">You will receive another email when the pharmacy confirms your order.</p>
        </div>
        <div style="background:#f1f5f9;padding:14px;text-align:center;font-size:12px;color:#94a3b8;">MediFind – Real-Time Medicine Booking</div>
      </div>`,
  };
}

function emailOrderStatus(order, userEmail) {
  const statusColors = {
    CONFIRMED: { bg: "#d1fae5", color: "#065f46", label: "Confirmed ✅" },
    REJECTED: { bg: "#fee2e2", color: "#991b1b", label: "Rejected ❌" },
    DISPATCHED: { bg: "#dbeafe", color: "#1e40af", label: "Dispatched 🚚" },
    DELIVERED: { bg: "#d1fae5", color: "#065f46", label: "Delivered ✅" },
  };
  const s = statusColors[order.status] || {
    bg: "#f1f5f9",
    color: "#334155",
    label: order.status,
  };
  const msgs = {
    CONFIRMED:
      "Great news! The pharmacy has confirmed your order and is preparing it.",
    REJECTED:
      "Unfortunately your order was rejected by the pharmacy. Please try another pharmacy.",
    DISPATCHED: "Your order is on the way! Expect delivery soon.",
    DELIVERED:
      "Your order has been delivered successfully. Thank you for using MediFind!",
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
          <p style="color:#475569;margin:16px 0;">${msgs[order.status] || ""}</p>
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
            <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td>${order.user_phone || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Medicine</td><td style="font-weight:700;">${order.medicine_name} (${order.brand || ""})</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Quantity</td><td>${order.quantity} ${order.unit}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="color:#10b981;font-weight:700;">₹${parseFloat(order.total_price).toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Delivery</td><td>${order.delivery_type === "HOME_DELIVERY" ? "🚚 Home Delivery" : "🏪 Pharmacy Pickup"}</td></tr>
            ${order.delivery_address ? `<tr><td style="padding:8px 0;color:#64748b;">Address</td><td>${order.delivery_address}</td></tr>` : ""}
          </table>
          <p style="color:#64748b;font-size:13px;margin-top:20px;">Login to MediFind to confirm or reject this order.</p>
        </div>
        <div style="background:#f1f5f9;padding:14px;text-align:center;font-size:12px;color:#94a3b8;">MediFind – Real-Time Medicine Booking</div>
      </div>`,
  };
}

// ════════════════════════════════════════════════════════
//  IN-APP NOTIFICATIONS (stored in DB)
// ════════════════════════════════════════════════════════
async function createNotification(userId, pharmacyId, message, type) {
  try {
    await q(
      "INSERT INTO notifications (user_id, pharmacy_id, message, type) VALUES (?,?,?,?)",
      [userId || null, pharmacyId || null, message, type || "INFO"],
    );
  } catch (e) {
    /* notifications are non-critical */
  }
}

// ════════════════════════════════════════════════════════
//  SESSIONS
// ════════════════════════════════════════════════════════
const SESSIONS = {};

function makeSession(data) {
  const id = "S" + Date.now() + Math.random().toString(36).slice(2);
  SESSIONS[id] = data;
  return id;
}
function getSession(req) {
  const raw = req.headers["cookie"] || "";
  for (const part of raw.split(";")) {
    const t = part.trim();
    if (t.startsWith("sid=")) return SESSIONS[t.slice(4)] || null;
  }
  return null;
}
function killSession(req) {
  const raw = req.headers["cookie"] || "";
  for (const part of raw.split(";")) {
    const t = part.trim();
    if (t.startsWith("sid=")) {
      delete SESSIONS[t.slice(4)];
      break;
    }
  }
}

// ════════════════════════════════════════════════════════
//  BODY PARSER
// ════════════════════════════════════════════════════════
function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371,
    r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r,
    dLng = (lng2 - lng1) * r;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return parseFloat(
    (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2),
  );
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// ════════════════════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════════════════════
async function handleAPI(req, res, pname) {
  const M = req.method;

  // ── /api/me ──
  if (pname === "/api/me") {
    return json(res, 200, getSession(req) || { role: null });
  }

  // ── /api/logout ──
  if (pname === "/api/logout") {
    killSession(req);
    res.writeHead(302, {
      Location: "/",
      "Set-Cookie": "sid=;Path=/;Max-Age=0",
    });
    return res.end();
  }

  // ── /api/login ──
  if (pname === "/api/login" && M === "POST") {
    const b = await readBody(req);
    const role = (b.role || "USER").toUpperCase();
    const email = (b.email || "").trim();
    const pass = (b.password || "").trim();
    if (!email || !pass)
      return json(res, 400, { error: "Email and password required." });

    try {
      if (role === "ADMIN") {
        if (email === "admin" && pass === "admin123") {
          const sid = makeSession({
            role: "ADMIN",
            name: "Administrator",
            id: 0,
          });
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Set-Cookie": `sid=${sid};Path=/;HttpOnly;Max-Age=86400`,
          });
          return res.end(
            JSON.stringify({
              success: true,
              role: "ADMIN",
              name: "Administrator",
            }),
          );
        }
        return json(res, 401, { error: "Wrong admin credentials." });
      }
      if (role === "PHARMACY") {
        const rows = await q(
          "SELECT * FROM pharmacies WHERE email=? AND password=?",
          [email, pass],
        );
        if (!rows.length)
          return json(res, 401, { error: "Wrong email or password." });
        if (!rows[0].is_active)
          return json(res, 401, { error: "Account deactivated by admin." });
        const p = rows[0];
        const sid = makeSession({
          role: "PHARMACY",
          name: p.pharmacy_name,
          id: p.id,
          email: p.email,
        });
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Set-Cookie": `sid=${sid};Path=/;HttpOnly;Max-Age=86400`,
        });
        return res.end(
          JSON.stringify({
            success: true,
            role: "PHARMACY",
            name: p.pharmacy_name,
            id: p.id,
          }),
        );
      }
      const rows = await q("SELECT * FROM users WHERE email=? AND password=?", [
        email,
        pass,
      ]);
      if (!rows.length)
        return json(res, 401, { error: "Wrong email or password." });
      const u = rows[0];
      const sid = makeSession({
        role: "USER",
        name: u.full_name,
        id: u.id,
        email: u.email,
      });
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": `sid=${sid};Path=/;HttpOnly;Max-Age=86400`,
      });
      return res.end(
        JSON.stringify({
          success: true,
          role: "USER",
          name: u.full_name,
          id: u.id,
        }),
      );
    } catch (e) {
      return json(res, 500, { error: "DB error: " + e.message });
    }
  }

  // ── /api/register/user ──
  if (pname === "/api/register/user" && M === "POST") {
    const b = await readBody(req);
    if (!b.fullName || !b.email || !b.password)
      return json(res, 400, { error: "Name, email, password required." });
    try {
      const ex = await q("SELECT id FROM users WHERE email=?", [b.email]);
      if (ex.length)
        return json(res, 409, { error: "Email already registered." });
      const r = await q(
        "INSERT INTO users (full_name,email,password,phone,address,latitude,longitude) VALUES (?,?,?,?,?,?,?)",
        [
          b.fullName.trim(),
          b.email.trim(),
          b.password,
          b.phone || "",
          b.address || "",
          parseFloat(b.latitude) || 0,
          parseFloat(b.longitude) || 0,
        ],
      );
      return json(res, 200, { success: true, id: r.insertId });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/register/pharmacy ──
  if (pname === "/api/register/pharmacy" && M === "POST") {
    const b = await readBody(req);
    if (!b.ownerName || !b.pharmacyName || !b.email || !b.password)
      return json(res, 400, { error: "All fields required." });
    try {
      const ex = await q("SELECT id FROM pharmacies WHERE email=?", [b.email]);
      if (ex.length)
        return json(res, 409, { error: "Email already registered." });
      const r = await q(
        "INSERT INTO pharmacies (owner_name,pharmacy_name,email,password,phone,address,city,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          b.ownerName.trim(),
          b.pharmacyName.trim(),
          b.email.trim(),
          b.password,
          b.phone || "",
          b.address || "",
          b.city || "",
          parseFloat(b.latitude) || 0,
          parseFloat(b.longitude) || 0,
        ],
      );
      return json(res, 200, { success: true, id: r.insertId });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/search ──
  if (pname === "/api/search" && M === "GET") {
    const qs = url.parse(req.url, true).query;
    const name = (qs.medicine || "").trim();
    const uLat = parseFloat(qs.lat) || 0;
    const uLng = parseFloat(qs.lng) || 0;
    const radius = parseFloat(qs.radius) || 50;
    if (!name) return json(res, 400, { error: "Medicine name required." });
    try {
      const rows = await q(
        `SELECT m.id,m.medicine_name,m.brand,m.category,m.price,m.stock_quantity,
                m.unit,m.requires_prescription,m.delivery_available,m.description,m.pharmacy_id,
                p.pharmacy_name,p.address AS pharmacy_address,p.phone AS pharmacy_phone,
                p.latitude AS plat,p.longitude AS plng
         FROM medicines m JOIN pharmacies p ON m.pharmacy_id=p.id
         WHERE LOWER(m.medicine_name) LIKE ? AND m.stock_quantity>0 AND p.is_active=1
         ORDER BY m.medicine_name`,
        ["%" + name.toLowerCase() + "%"],
      );
      let results = rows.map((r) => ({
        ...r,
        distanceKm: uLat && uLng ? haversine(uLat, uLng, +r.plat, +r.plng) : 0,
      }));
      if (uLat && uLng) {
        results = results.filter((r) => r.distanceKm <= radius);
        results.sort((a, b) => a.distanceKm - b.distanceKm);
      }
      return json(res, 200, { count: results.length, results });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/cart/checkout  (place multiple items from cart) ──
  if (pname === "/api/cart/checkout" && M === "POST") {
    const s = getSession(req);
    if (!s || s.role !== "USER")
      return json(res, 401, { error: "Login required." });
    const b = await readBody(req);
    // b.items = [{ medicineId, quantity, deliveryType, deliveryAddress }]
    if (!b.items || !b.items.length)
      return json(res, 400, { error: "Cart is empty." });

    const placed = [],
      failed = [];
    for (const item of b.items) {
      try {
        const meds = await q("SELECT * FROM medicines WHERE id=?", [
          parseInt(item.medicineId),
        ]);
        if (!meds.length) {
          failed.push({ id: item.medicineId, reason: "Medicine not found" });
          continue;
        }
        const med = meds[0];
        const qty = parseInt(item.quantity) || 1;
        if (med.stock_quantity < qty) {
          failed.push({
            id: item.medicineId,
            name: med.medicine_name,
            reason: "Insufficient stock",
          });
          continue;
        }

        const total = parseFloat((med.price * qty).toFixed(2));
        const r = await q(
          "INSERT INTO orders (user_id,pharmacy_id,medicine_id,quantity,total_price,delivery_type,delivery_address,status) VALUES (?,?,?,?,?,?,?,?)",
          [
            s.id,
            med.pharmacy_id,
            med.id,
            qty,
            total,
            item.deliveryType || "PICKUP",
            item.deliveryAddress || "",
            "PENDING",
          ],
        );
        await q(
          "UPDATE medicines SET stock_quantity=stock_quantity-? WHERE id=?",
          [qty, med.id],
        );

        // Get full order details for emails
        const [ord] = await q(
          `SELECT o.*,m.medicine_name,m.brand,m.unit,
                  p.pharmacy_name,p.email AS pharmacy_email,
                  u.full_name AS user_name,u.email AS user_email,u.phone AS user_phone
           FROM orders o
           JOIN medicines m ON o.medicine_id=m.id
           JOIN pharmacies p ON o.pharmacy_id=p.id
           JOIN users u ON o.user_id=u.id
           WHERE o.id=?`,
          [r.insertId],
        );

        // Notifications
        await createNotification(
          s.id,
          null,
          `Your order #${r.insertId} for ${med.medicine_name} has been placed.`,
          "ORDER_PLACED",
        );
        await createNotification(
          null,
          med.pharmacy_id,
          `New order #${r.insertId} from ${s.name} for ${med.medicine_name}.`,
          "NEW_ORDER",
        );

        // Emails
        if (ord) {
          const ue = emailOrderPlaced(ord);
          await sendEmail(ord.user_email, ue.subject, ue.html);
          const pe = emailNewOrderToPharmacy(ord);
          await sendEmail(ord.pharmacy_email, pe.subject, pe.html);
        }

        placed.push({
          orderId: r.insertId,
          medicineName: med.medicine_name,
          total,
        });
      } catch (e) {
        failed.push({ id: item.medicineId, reason: e.message });
      }
    }
    return json(res, 200, { success: true, placed, failed });
  }

  // ── /api/orders/user ──
  if (pname === "/api/orders/user" && M === "GET") {
    const s = getSession(req);
    if (!s || s.role !== "USER")
      return json(res, 401, { error: "Login required." });
    try {
      const rows = await q(
        `SELECT o.id,o.quantity,o.total_price,o.delivery_type,o.delivery_address,o.status,o.order_date,
                m.medicine_name,m.brand,m.unit,p.pharmacy_name,p.phone AS pharmacy_phone
         FROM orders o
         JOIN medicines m ON o.medicine_id=m.id
         JOIN pharmacies p ON o.pharmacy_id=p.id
         WHERE o.user_id=? ORDER BY o.order_date DESC`,
        [s.id],
      );
      return json(res, 200, rows);
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/orders/pharmacy ──
  if (pname === "/api/orders/pharmacy" && M === "GET") {
    const s = getSession(req);
    if (!s || s.role !== "PHARMACY")
      return json(res, 401, { error: "Login required." });
    try {
      const rows = await q(
        `SELECT o.id,o.quantity,o.total_price,o.delivery_type,o.delivery_address,o.status,o.order_date,
                m.medicine_name,m.brand,m.unit,
                u.full_name AS user_name,u.email AS user_email,u.phone AS user_phone
         FROM orders o
         JOIN medicines m ON o.medicine_id=m.id
         JOIN users u ON o.user_id=u.id
         WHERE o.pharmacy_id=? ORDER BY o.order_date DESC`,
        [s.id],
      );
      return json(res, 200, rows);
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/order/status  (pharmacy updates status) ──
  if (pname === "/api/order/status" && M === "POST") {
    const s = getSession(req);
    if (!s || (s.role !== "PHARMACY" && s.role !== "ADMIN"))
      return json(res, 401, { error: "Not authorised." });
    const b = await readBody(req);
    const allowed = ["CONFIRMED", "REJECTED", "DISPATCHED", "DELIVERED"];
    if (!b.orderId || !allowed.includes(b.status))
      return json(res, 400, { error: "Invalid request." });
    try {
      await q("UPDATE orders SET status=? WHERE id=?", [b.status, +b.orderId]);

      // Get full order for notifications + email
      const [ord] = await q(
        `SELECT o.*,m.medicine_name,m.brand,m.unit,
                p.pharmacy_name,p.email AS pharmacy_email,
                u.full_name AS user_name,u.email AS user_email,u.phone AS user_phone
         FROM orders o
         JOIN medicines m ON o.medicine_id=m.id
         JOIN pharmacies p ON o.pharmacy_id=p.id
         JOIN users u ON o.user_id=u.id
         WHERE o.id=?`,
        [+b.orderId],
      );

      if (ord) {
        const statusMsg = {
          CONFIRMED: `✅ Your order #${ord.id} for ${ord.medicine_name} has been CONFIRMED by ${ord.pharmacy_name}.`,
          REJECTED: `❌ Your order #${ord.id} for ${ord.medicine_name} was REJECTED by ${ord.pharmacy_name}.`,
          DISPATCHED: `🚚 Your order #${ord.id} for ${ord.medicine_name} has been DISPATCHED.`,
          DELIVERED: `✅ Your order #${ord.id} for ${ord.medicine_name} has been DELIVERED.`,
        };
        await createNotification(
          ord.user_id,
          null,
          statusMsg[b.status],
          "ORDER_UPDATE",
        );
        const em = emailOrderStatus(ord);
        await sendEmail(ord.user_email, em.subject, em.html);
      }

      return json(res, 200, { success: true });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/notifications ──
  if (pname === "/api/notifications" && M === "GET") {
    const s = getSession(req);
    if (!s) return json(res, 401, { error: "Login required." });
    try {
      let rows;
      if (s.role === "USER")
        rows = await q(
          "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
          [s.id],
        );
      else if (s.role === "PHARMACY")
        rows = await q(
          "SELECT * FROM notifications WHERE pharmacy_id=? ORDER BY created_at DESC LIMIT 20",
          [s.id],
        );
      else
        rows = await q(
          "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30",
        );
      return json(res, 200, rows);
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/notifications/read ──
  if (pname === "/api/notifications/read" && M === "POST") {
    const s = getSession(req);
    if (!s) return json(res, 401, { error: "Login required." });
    const b = await readBody(req);
    try {
      await q("UPDATE notifications SET is_read=1 WHERE id=?", [+b.id]);
      return json(res, 200, { success: true });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/notifications/readall ──
  if (pname === "/api/notifications/readall" && M === "POST") {
    const s = getSession(req);
    if (!s) return json(res, 401, { error: "Login required." });
    try {
      if (s.role === "USER")
        await q("UPDATE notifications SET is_read=1 WHERE user_id=?", [s.id]);
      else if (s.role === "PHARMACY")
        await q("UPDATE notifications SET is_read=1 WHERE pharmacy_id=?", [
          s.id,
        ]);
      return json(res, 200, { success: true });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/medicines (pharmacy) ──
  if (pname === "/api/medicines" && M === "GET") {
    const s = getSession(req);
    if (!s || s.role !== "PHARMACY")
      return json(res, 401, { error: "Login required." });
    try {
      return json(
        res,
        200,
        await q(
          "SELECT * FROM medicines WHERE pharmacy_id=? ORDER BY medicine_name",
          [s.id],
        ),
      );
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/medicines/add ──
  if (pname === "/api/medicines/add" && M === "POST") {
    const s = getSession(req);
    if (!s || s.role !== "PHARMACY")
      return json(res, 401, { error: "Login required." });
    const b = await readBody(req);
    if (
      !b.medicineName ||
      b.price === undefined ||
      b.stockQuantity === undefined
    )
      return json(res, 400, { error: "Name, price and stock required." });
    try {
      const r = await q(
        "INSERT INTO medicines (pharmacy_id,medicine_name,brand,category,price,stock_quantity,unit,requires_prescription,delivery_available,description) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
          s.id,
          b.medicineName.trim(),
          b.brand || "",
          b.category || "General",
          parseFloat(b.price),
          parseInt(b.stockQuantity),
          b.unit || "Tablet",
          b.requiresPrescription ? 1 : 0,
          b.deliveryAvailable !== false ? 1 : 0,
          b.description || "",
        ],
      );
      return json(res, 200, { success: true, id: r.insertId });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/medicines/update ──
  if (pname === "/api/medicines/update" && M === "POST") {
    const s = getSession(req);
    if (!s || s.role !== "PHARMACY")
      return json(res, 401, { error: "Login required." });
    const b = await readBody(req);
    if (!b.id) return json(res, 400, { error: "ID required." });
    try {
      await q(
        "UPDATE medicines SET medicine_name=?,brand=?,category=?,price=?,stock_quantity=?,unit=?,requires_prescription=?,delivery_available=?,description=? WHERE id=? AND pharmacy_id=?",
        [
          b.medicineName.trim(),
          b.brand || "",
          b.category || "General",
          parseFloat(b.price),
          parseInt(b.stockQuantity),
          b.unit || "Tablet",
          b.requiresPrescription ? 1 : 0,
          b.deliveryAvailable !== false ? 1 : 0,
          b.description || "",
          +b.id,
          s.id,
        ],
      );
      return json(res, 200, { success: true });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── /api/medicines/delete ──
  if (pname === "/api/medicines/delete" && M === "POST") {
    const s = getSession(req);
    if (!s || s.role !== "PHARMACY")
      return json(res, 401, { error: "Login required." });
    const b = await readBody(req);
    try {
      await q("DELETE FROM medicines WHERE id=? AND pharmacy_id=?", [
        +b.id,
        s.id,
      ]);
      return json(res, 200, { success: true });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ── ADMIN ROUTES ──
  if (pname.startsWith("/api/admin/")) {
    const s = getSession(req);
    if (!s || s.role !== "ADMIN")
      return json(res, 401, { error: "Admin access required." });

    if (pname === "/api/admin/stats") {
      const [[u], [p], [m], [o]] = await Promise.all([
        q("SELECT COUNT(*) c FROM users"),
        q("SELECT COUNT(*) c FROM pharmacies"),
        q("SELECT COUNT(*) c FROM medicines"),
        q("SELECT COUNT(*) c FROM orders"),
      ]);
      return json(res, 200, {
        users: u.c,
        pharmacies: p.c,
        medicines: m.c,
        orders: o.c,
      });
    }
    if (pname === "/api/admin/users")
      return json(
        res,
        200,
        await q(
          "SELECT id,full_name,email,phone,address,created_at FROM users ORDER BY created_at DESC",
        ),
      );
    if (pname === "/api/admin/pharmacies")
      return json(
        res,
        200,
        await q(
          "SELECT id,pharmacy_name,owner_name,email,city,phone,is_active FROM pharmacies ORDER BY pharmacy_name",
        ),
      );
    if (pname === "/api/admin/medicines")
      return json(
        res,
        200,
        await q(
          "SELECT m.*,p.pharmacy_name FROM medicines m JOIN pharmacies p ON m.pharmacy_id=p.id ORDER BY p.pharmacy_name,m.medicine_name",
        ),
      );
    if (pname === "/api/admin/orders")
      return json(
        res,
        200,
        await q(
          `SELECT o.id,o.quantity,o.total_price,o.delivery_type,o.status,o.order_date,m.medicine_name,m.brand,p.pharmacy_name,u.full_name AS user_name FROM orders o JOIN medicines m ON o.medicine_id=m.id JOIN pharmacies p ON o.pharmacy_id=p.id JOIN users u ON o.user_id=u.id ORDER BY o.order_date DESC`,
        ),
      );
    if (pname === "/api/admin/pharmacy/toggle" && M === "POST") {
      const b = await readBody(req);
      await q("UPDATE pharmacies SET is_active=? WHERE id=?", [
        b.active ? 1 : 0,
        +b.id,
      ]);
      return json(res, 200, { success: true });
    }
  }

  return json(res, 404, { error: "Route not found: " + pname });
}

// ════════════════════════════════════════════════════════
//  STATIC FILES
// ════════════════════════════════════════════════════════
const MIME = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

function serveStatic(res, fp) {
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(fp)] || "text/plain",
    });
    res.end(data);
  });
}

// ════════════════════════════════════════════════════════
//  HTTP SERVER
// ════════════════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const pname = url.parse(req.url).pathname;

  if (pname.startsWith("/api/")) {
    try {
      await handleAPI(req, res, pname);
    } catch (e) {
      console.error("API Error:", e);
      json(res, 500, { error: e.message });
    }
    return;
  }

  const fp = path.join(
    __dirname,
    pname === "/" ? "index.html" : pname.split("?")[0],
  );
  if (!fp.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end();
  }
  serveStatic(res, fp);
});

server.listen(CONFIG.server.port, () => {
  console.log("\n  ╔═══════════════════════════════════════════════╗");
  console.log("  ║   💊  MediFind v3  –  Server Running          ║");
  console.log(
    `  ║   ➜   http://localhost:${CONFIG.server.port}                 ║`,
  );
  console.log("  ║                                               ║");
  console.log("  ║   Features: Cart · Orders · Email Alerts      ║");
  console.log("  ║   Press Ctrl+C to stop                       ║");
  console.log("  ╚═══════════════════════════════════════════════╝\n");
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE")
    console.error(
      `\n❌  Port ${CONFIG.server.port} busy. Close other server.\n`,
    );
  else console.error(e);
});
