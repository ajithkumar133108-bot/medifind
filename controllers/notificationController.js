const notificationModel = require('../models/notificationModel');

async function getNotifications(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Login required.' });
  try {
    if (req.user.role === 'USER') {
      return res.json(await notificationModel.getNotificationsForUser(req.user.id));
    }
    if (req.user.role === 'PHARMACY') {
      return res.json(await notificationModel.getNotificationsForPharmacy(req.user.id));
    }
    return res.json(await notificationModel.getAllNotifications());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function readNotification(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Login required.' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Notification ID required.' });
  try {
    await notificationModel.markNotificationRead(parseInt(id, 10));
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function readAllNotifications(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Login required.' });
  try {
    if (req.user.role === 'USER') await notificationModel.markAllReadForUser(req.user.id);
    else if (req.user.role === 'PHARMACY') await notificationModel.markAllReadForPharmacy(req.user.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getNotifications, readNotification, readAllNotifications };
