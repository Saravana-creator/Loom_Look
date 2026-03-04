const express = require('express');
const router = express.Router();
const {
    getSessions, getSession, createSession, updateSession, deleteSession,
    getVendorSessions, bookSession, getUserBookings, joinSession,
} = require('../controllers/sessionController');
const { authenticate, authorize } = require('../middleware/auth');
const { sessionValidator } = require('../middleware/validators');

// Public — list & detail (video link protected)
router.get('/', getSessions);
router.get('/my-bookings', authenticate, authorize('user'), getUserBookings);
router.get('/:id', authenticate, getSession);
router.get('/:id/join', authenticate, authorize('user'), joinSession);

// User — book session
router.post('/:id/book', authenticate, authorize('user'), bookSession);

// Vendor — manage sessions
router.get('/vendor/my-sessions', authenticate, authorize('vendor'), getVendorSessions);
router.post('/vendor/create', authenticate, authorize('vendor'), sessionValidator, createSession);
router.put('/vendor/:id', authenticate, authorize('vendor'), updateSession);
router.delete('/vendor/:id', authenticate, authorize('vendor'), deleteSession);

module.exports = router;
