const express = require('express');
const { getNotifications, readNotification, readAllNotifications } = require('../controllers/notificationController');

const router = express.Router();
router.get('/notifications', getNotifications);
router.post('/notifications/read', readNotification);
router.post('/notifications/readall', readAllNotifications);
module.exports = router;
