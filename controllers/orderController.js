const medicineModel = require('../models/medicineModel');
const orderModel = require('../models/orderModel');
const notificationModel = require('../models/notificationModel');
const { sendEmail, emailOrderPlaced, emailOrderStatus, emailNewOrderToPharmacy } = require('../utils/email');

async function checkoutCart(req, res) {
  if (!req.user || req.user.role !== 'USER') {
    return res.status(401).json({ error: 'Login required.' });
  }
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  const placed = [];
  const failed = [];

  for (const item of items) {
    try {
      const medicine = await medicineModel.getMedicineById(parseInt(item.medicineId, 10));
      if (!medicine) {
        failed.push({ id: item.medicineId, reason: 'Medicine not found' });
        continue;
      }
      const quantity = parseInt(item.quantity, 10) || 1;
      if (medicine.stock_quantity < quantity) {
        failed.push({ id: item.medicineId, name: medicine.medicine_name, reason: 'Insufficient stock' });
        continue;
      }
      const total = parseFloat((medicine.price * quantity).toFixed(2));
      const orderId = await orderModel.createOrderHeader({
        user_id: req.user.id,
        pharmacy_id: medicine.pharmacy_id,
        total_price: total,
        delivery_type: item.deliveryType || 'PICKUP',
        delivery_address: item.deliveryAddress || '',
        status: 'PENDING',
      });
      await orderModel.createOrderItem({
        order_id: orderId,
        medicine_id: medicine.id,
        quantity,
        price: medicine.price,
      });
      await medicineModel.updateStock(medicine.id, quantity);

      const orderDetails = await orderModel.getOrderDetails(orderId);
      if (orderDetails) {
        await notificationModel.createNotification(req.user.id, null, `Your order #${orderId} for ${medicine.medicine_name} has been placed.`, 'ORDER_PLACED');
        await notificationModel.createNotification(null, medicine.pharmacy_id, `New order #${orderId} for ${medicine.medicine_name}.`, 'NEW_ORDER');
        await sendEmail(orderDetails.user_email, ...Object.values(emailOrderPlaced(orderDetails)));
        await sendEmail(orderDetails.pharmacy_email, ...Object.values(emailNewOrderToPharmacy(orderDetails)));
      }

      placed.push({ orderId, medicineName: medicine.medicine_name, total });
    } catch (error) {
      failed.push({ id: item.medicineId, reason: error.message });
    }
  }

  return res.json({ success: true, placed, failed });
}

async function getUserOrders(req, res) {
  if (!req.user || req.user.role !== 'USER') {
    return res.status(401).json({ error: 'Login required.' });
  }
  try {
    const rows = await orderModel.getUserOrders(req.user.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPharmacyOrders(req, res) {
  if (!req.user || req.user.role !== 'PHARMACY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  try {
    const rows = await orderModel.getPharmacyOrders(req.user.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  if (!req.user || !['PHARMACY', 'ADMIN'].includes(req.user.role)) {
    return res.status(401).json({ error: 'Not authorised.' });
  }
  const { orderId, status } = req.body;
  const allowed = ['CONFIRMED', 'REJECTED', 'DISPATCHED', 'DELIVERED'];
  if (!orderId || !allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  try {
    await orderModel.updateOrderStatus(parseInt(orderId, 10), status);
    const orderDetails = await orderModel.getOrderDetails(parseInt(orderId, 10));
    if (orderDetails) {
      const statusMessages = {
        CONFIRMED: `✅ Your order #${orderDetails.id} has been confirmed.`,
        REJECTED: `❌ Your order #${orderDetails.id} was rejected.`,
        DISPATCHED: `🚚 Your order #${orderDetails.id} has been dispatched.`,
        DELIVERED: `✅ Your order #${orderDetails.id} was delivered.`,
      };
      await notificationModel.createNotification(orderDetails.user_id, null, statusMessages[status], 'ORDER_UPDATE');
      await sendEmail(orderDetails.user_email, ...Object.values(emailOrderStatus(orderDetails)));
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { checkoutCart, getUserOrders, getPharmacyOrders, updateOrderStatus };
