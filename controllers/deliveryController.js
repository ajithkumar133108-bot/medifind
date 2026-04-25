const deliveryModel = require('../models/deliveryModel');
const orderModel = require('../models/orderModel');

async function assignDelivery(req, res) {
  if (!req.user || !['PHARMACY', 'ADMIN'].includes(req.user.role)) {
    return res.status(401).json({ error: 'Not authorised.' });
  }
  const { orderId, deliveryEmail } = req.body || {};
  if (!orderId || !deliveryEmail) return res.status(400).json({ error: 'orderId and deliveryEmail required.' });
  try {
    const agent = await deliveryModel.findDeliveryPersonByEmail(String(deliveryEmail).trim());
    if (!agent) return res.status(404).json({ error: 'Delivery person not found.' });
    await deliveryModel.assignDelivery(parseInt(orderId, 10), agent.id);
    await orderModel.updateOrderStatus(parseInt(orderId, 10), 'DISPATCHED');
    return res.json({ success: true, deliveryPersonId: agent.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function myDeliveries(req, res) {
  if (!req.user || req.user.role !== 'DELIVERY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  try {
    let rows = await deliveryModel.listAssignedDeliveries(req.user.id);
    if (!rows.length) {
      try {
        await deliveryModel.claimUnassignedDispatchedOrders(req.user.id, 5);
      } catch (claimError) {
        // Keep endpoint stable even if auto-assignment query fails on some MySQL setups.
        // eslint-disable-next-line no-console
        console.error('Auto-claim deliveries failed:', claimError.message);
      }
      rows = await deliveryModel.listAssignedDeliveries(req.user.id);
    }
    return res.json({ success: true, deliveries: rows });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('myDeliveries failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

async function updateMyDelivery(req, res) {
  if (!req.user || req.user.role !== 'DELIVERY') {
    return res.status(401).json({ error: 'Login required.' });
  }
  const { orderId, status, lat, lng } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId required.' });
  try {
    await deliveryModel.updateDelivery(parseInt(orderId, 10), {
      status: status || null,
      lat: lat != null ? parseFloat(lat) : null,
      lng: lng != null ? parseFloat(lng) : null,
    });
    if (status === 'DELIVERED') {
      await orderModel.updateOrderStatus(parseInt(orderId, 10), 'DELIVERED');
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = { assignDelivery, myDeliveries, updateMyDelivery };

