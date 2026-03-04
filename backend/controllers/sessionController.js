const LiveSession = require('../models/LiveSession');
const Booking = require('../models/Booking');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { generateBookingId } = require('../utils/helpers');
const { encrypt, decrypt } = require('../utils/encryption');
const { SESSION_STATUS } = require('../config/constants');

/**
 * GET /api/sessions
 * Get all active upcoming sessions (public)
 */
const getSessions = async (req, res) => {
    const { page = 1, limit = 12, vendor, topic } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {
        isEnabled: true,
        status: { $in: [SESSION_STATUS.UPCOMING, SESSION_STATUS.LIVE] },
        scheduledAt: { $gte: new Date() },
    };

    if (vendor) query.vendor = vendor;
    if (topic) query.topic = topic;

    const [sessions, total] = await Promise.all([
        LiveSession.find(query)
            .sort('scheduledAt')
            .skip(skip)
            .limit(Number(limit))
            .populate('vendor', 'shopName avatar name'),
        LiveSession.countDocuments(query),
    ]);

    return paginatedResponse(res, sessions, Number(page), Number(limit), total);
};

/**
 * GET /api/sessions/:id
 * Get session detail (video link only for booked users)
 */
const getSession = async (req, res) => {
    const session = await LiveSession.findById(req.params.id)
        .populate('vendor', 'shopName avatar name shopDescription');

    if (!session) return errorResponse(res, 404, 'Session not found.');

    const sessionData = session.toObject();

    // Check if user is booked — reveal video link
    if (req.user) {
        const booking = await Booking.findOne({
            session: session._id,
            user: req.user.id,
            status: 'confirmed',
        });

        if (booking) {
            // Decrypt and reveal video link
            sessionData.videoLink = decrypt(session.videoLinkEncrypted);
            sessionData.isBooked = true;
        } else {
            sessionData.isBooked = false;
        }
    }

    delete sessionData.videoLinkEncrypted;
    return successResponse(res, 200, 'Session fetched.', sessionData);
};

/**
 * POST /api/vendor/sessions
 * Create a live session (vendor only)
 */
const createSession = async (req, res) => {
    const { title, description, scheduledAt, duration, maxParticipants, videoLink, platform, topic, price, tags, thumbnail } = req.body;

    // Encrypt video link before storing
    const videoLinkEncrypted = encrypt(videoLink || '');

    const session = await LiveSession.create({
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration,
        maxParticipants: maxParticipants || 50,
        videoLinkEncrypted,
        platform,
        topic,
        price: price || 0,
        tags,
        thumbnail,
        vendor: req.user.id,
    });

    return successResponse(res, 201, 'Live session created.', session);
};

/**
 * PUT /api/vendor/sessions/:id
 * Update session (vendor only)
 */
const updateSession = async (req, res) => {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return errorResponse(res, 404, 'Session not found.');
    if (session.vendor.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized to update this session.');
    }

    const updateData = { ...req.body };
    if (req.body.videoLink) {
        updateData.videoLinkEncrypted = encrypt(req.body.videoLink);
        delete updateData.videoLink;
    }

    const updated = await LiveSession.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
    });

    return successResponse(res, 200, 'Session updated.', updated);
};

/**
 * DELETE /api/vendor/sessions/:id
 * Delete session (vendor)
 */
const deleteSession = async (req, res) => {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return errorResponse(res, 404, 'Session not found.');
    if (session.vendor.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized.');
    }

    await LiveSession.findByIdAndUpdate(req.params.id, {
        status: SESSION_STATUS.CANCELLED,
        isEnabled: false,
    });

    return successResponse(res, 200, 'Session cancelled.');
};

/**
 * GET /api/vendor/sessions
 * Get vendor's sessions
 */
const getVendorSessions = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [sessions, total] = await Promise.all([
        LiveSession.find({ vendor: req.user.id })
            .sort('-createdAt')
            .skip(skip)
            .limit(Number(limit)),
        LiveSession.countDocuments({ vendor: req.user.id }),
    ]);

    return paginatedResponse(res, sessions, Number(page), Number(limit), total);
};

/**
 * POST /api/sessions/:id/book
 * Book a live session (user)
 */
const bookSession = async (req, res) => {
    const session = await LiveSession.findById(req.params.id);
    if (!session || !session.isEnabled) {
        return errorResponse(res, 404, 'Session not found or unavailable.');
    }
    if (new Date(session.scheduledAt) < new Date()) {
        return errorResponse(res, 400, 'Cannot book a past session.');
    }
    if (session.currentParticipants >= session.maxParticipants) {
        return errorResponse(res, 400, 'Session is fully booked.');
    }

    // Check duplicate booking
    const existing = await Booking.findOne({ user: req.user.id, session: session._id });
    if (existing) return errorResponse(res, 409, 'You have already booked this session.');

    const booking = await Booking.create({
        bookingId: generateBookingId(),
        user: req.user.id,
        session: session._id,
        vendor: session.vendor,
        isPaid: session.price === 0,
    });

    // Add user to session's bookedUsers
    await LiveSession.findByIdAndUpdate(session._id, {
        $push: { bookedUsers: req.user.id },
        $inc: { currentParticipants: 1 },
    });

    return successResponse(res, 201, 'Session booked successfully!', booking);
};

/**
 * GET /api/sessions/my-bookings
 * Get user's bookings
 */
const getUserBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id })
        .sort('-createdAt')
        .populate({
            path: 'session',
            populate: { path: 'vendor', select: 'shopName avatar' },
        });

    return successResponse(res, 200, 'Bookings fetched.', bookings);
};

/**
 * GET /api/sessions/:id/join
 * Join session — get video link if booked and session is live/upcoming
 */
const joinSession = async (req, res) => {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return errorResponse(res, 404, 'Session not found.');

    // Check if session has expired
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        return errorResponse(res, 410, 'Session link has expired.');
    }

    const booking = await Booking.findOne({
        session: session._id,
        user: req.user.id,
        status: 'confirmed',
    });

    if (!booking) return errorResponse(res, 403, 'You are not booked for this session.');

    // Update booking joinedAt
    await Booking.findByIdAndUpdate(booking._id, { joinedAt: new Date() });

    const videoLink = decrypt(session.videoLinkEncrypted);

    return successResponse(res, 200, 'Join link retrieved.', {
        videoLink,
        session: {
            title: session.title,
            scheduledAt: session.scheduledAt,
            duration: session.duration,
            platform: session.platform,
        },
    });
};

module.exports = {
    getSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    getVendorSessions,
    bookSession,
    getUserBookings,
    joinSession,
};
