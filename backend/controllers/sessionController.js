const { query } = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { encrypt, decrypt } = require('../utils/encryption');
const { generateUUID, generateBookingId } = require('../utils/helpers');
const { SESSION_STATUS } = require('../config/constants');

/**
 * GET /api/sessions
 */
const getSessions = async (req, res) => {
    const { page = 1, limit = 12, vendor, topic } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [`ls.status IN ('${SESSION_STATUS.UPCOMING}', '${SESSION_STATUS.LIVE}')`, 'ls.scheduled_at >= NOW()'];
    const params = [];

    if (vendor) { params.push(vendor); conditions.push(`ls.vendor_id = $${params.length}`); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    params.push(Number(limit), offset);

    const [dataRes, countRes] = await Promise.all([
        query(`SELECT ls.id as "_id", ls.title, ls.description, ls.status, ls.tags, ls.thumbnail,
                     ls.scheduled_at as "scheduledAt",
                     ls.duration_minutes as "duration",
                     ls.max_participants as "maxParticipants",
                     ls.registered_users as "bookedUsers",
                     ls.is_featured as "isFeatured",
                     v.shop_name, v.logo as vendor_avatar FROM live_sessions ls
               LEFT JOIN vendors v ON v.id = ls.vendor_id ${where}
               ORDER BY ls.scheduled_at ASC LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
        query(`SELECT COUNT(*) FROM live_sessions ls ${where}`, params.slice(0, params.length - 2)),
    ]);

    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * GET /api/sessions/:id
 */
const getSession = async (req, res) => {
    const result = await query(
        `SELECT ls.id as "_id", ls.title, ls.description, ls.status, ls.tags, ls.thumbnail,
                ls.scheduled_at as "scheduledAt",
                ls.duration_minutes as "duration",
                ls.max_participants as "maxParticipants",
                ls.registered_users as "bookedUsers",
                ls.is_featured as "isFeatured",
                ls.vendor_id as "vendorId",
                v.shop_name, v.logo as vendor_avatar, v.description as vendor_description
         FROM live_sessions ls LEFT JOIN vendors v ON v.id = ls.vendor_id WHERE ls.id = $1`,
        [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 404, 'Session not found.');

    const sessionData = { ...result.rows[0] };

    if (req.user) {
        const booking = await query(
            `SELECT id FROM bookings WHERE session_id = $1 AND user_id = $2 AND booking_status = 'Confirmed'`,
            [result.rows[0].id, req.user.id]
        );
        if (booking.rows.length > 0) {
            sessionData.videoLink = decrypt(sessionData.meeting_link || '');
            sessionData.isBooked = true;
        } else {
            sessionData.isBooked = false;
        }
    }

    delete sessionData.meeting_link;
    return successResponse(res, 200, 'Session fetched.', sessionData);
};

/**
 * POST /api/vendor/sessions
 */
const createSession = async (req, res) => {
    const { title, description, scheduledAt, duration, maxParticipants, videoLink, price, tags } = req.body;

    if (!title || !scheduledAt) return errorResponse(res, 400, 'Title and scheduled date are required.');
    if (!videoLink || !videoLink.trim()) return errorResponse(res, 400, 'Meeting link is required.');

    const result = await query(
        `INSERT INTO live_sessions (title, description, vendor_id, scheduled_at, duration_minutes, max_participants, meeting_link, tags, is_featured, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 'upcoming')
         RETURNING
           id as "_id", title, description, status, tags, thumbnail,
           scheduled_at as "scheduledAt",
           duration_minutes as "duration",
           max_participants as "maxParticipants",
           registered_users as "bookedUsers",
           is_featured as "isFeatured",
           vendor_id as "vendorId",
           created_at as "createdAt",
           updated_at as "updatedAt"`,
        [title, description, req.user.id, new Date(scheduledAt),
            duration || 60, maxParticipants || 50,
            encrypt(videoLink), tags || []]
    );
    return successResponse(res, 201, 'Live session created.', result.rows[0]);
};

/**
 * PUT /api/vendor/sessions/:id
 */
const updateSession = async (req, res) => {
    const existing = await query('SELECT vendor_id FROM live_sessions WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return errorResponse(res, 404, 'Session not found.');
    if (existing.rows[0].vendor_id !== req.user.id) return errorResponse(res, 403, 'Not authorized.');

    const { title, description, scheduledAt, duration, maxParticipants, videoLink, tags, status } = req.body;

    if (!videoLink || !videoLink.trim()) return errorResponse(res, 400, 'Meeting link is required.');

    const result = await query(
        `UPDATE live_sessions SET
         title = COALESCE($1, title), description = COALESCE($2, description),
         scheduled_at = COALESCE($3, scheduled_at), duration_minutes = COALESCE($4, duration_minutes),
         max_participants = COALESCE($5, max_participants),
         meeting_link = CASE WHEN $6::text IS NOT NULL THEN $6 ELSE meeting_link END,
         tags = COALESCE($7, tags), status = COALESCE($8, status), updated_at = NOW()
         WHERE id = $9
         RETURNING
           id as "_id", title, description, status, tags, thumbnail,
           scheduled_at as "scheduledAt",
           duration_minutes as "duration",
           max_participants as "maxParticipants",
           registered_users as "bookedUsers",
           is_featured as "isFeatured",
           vendor_id as "vendorId",
           created_at as "createdAt",
           updated_at as "updatedAt"`,
        [title, description, scheduledAt ? new Date(scheduledAt) : null, duration || null, maxParticipants || null,
            videoLink ? encrypt(videoLink) : null, tags || null, status || null, req.params.id]
    );
    return successResponse(res, 200, 'Session updated.', result.rows[0]);
};

/**
 * DELETE /api/vendor/sessions/:id
 */
const deleteSession = async (req, res) => {
    const existing = await query('SELECT vendor_id FROM live_sessions WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return errorResponse(res, 404, 'Session not found.');
    if (existing.rows[0].vendor_id !== req.user.id) return errorResponse(res, 403, 'Not authorized.');

    await query(`UPDATE live_sessions SET status = 'Cancelled', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    return successResponse(res, 200, 'Session cancelled.');
};

/**
 * GET /api/vendor/sessions
 */
const getVendorSessions = async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const [dataRes, countRes] = await Promise.all([
        query(
            `SELECT
                id as "_id", title, description, status, tags, thumbnail,
                scheduled_at as "scheduledAt",
                duration_minutes as "duration",
                max_participants as "maxParticipants",
                registered_users as "bookedUsers",
                is_featured as "isFeatured",
                vendor_id as "vendorId",
                created_at as "createdAt",
                updated_at as "updatedAt"
             FROM live_sessions WHERE vendor_id = $1
             ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [req.user.id, Number(limit), offset]
        ),
        query('SELECT COUNT(*) FROM live_sessions WHERE vendor_id = $1', [req.user.id]),
    ]);
    return paginatedResponse(res, dataRes.rows, Number(page), Number(limit), Number(countRes.rows[0].count));
};

/**
 * POST /api/sessions/:id/book
 */
const bookSession = async (req, res) => {
    const sessionRes = await query('SELECT * FROM live_sessions WHERE id = $1', [req.params.id]);
    const session = sessionRes.rows[0];
    if (!session) return errorResponse(res, 404, 'Session not found or unavailable.');
    if (new Date(session.scheduled_at) < new Date()) return errorResponse(res, 400, 'Cannot book a past session.');

    const bookingsCountRes = await query('SELECT COUNT(*) FROM bookings WHERE session_id = $1', [session.id]);
    if (Number(bookingsCountRes.rows[0].count) >= session.max_participants) {
        return errorResponse(res, 400, 'Session is fully booked.');
    }

    const existing = await query('SELECT id FROM bookings WHERE user_id = $1 AND session_id = $2', [req.user.id, session.id]);
    if (existing.rows.length > 0) return errorResponse(res, 409, 'You have already booked this session.');

    const result = await query(
        `INSERT INTO bookings (user_id, session_id, booking_status, payment_status) VALUES ($1, $2, 'Confirmed', 'Paid') RETURNING id as "_id", *`,
        [req.user.id, session.id]
    );
    return successResponse(res, 201, 'Session booked successfully!', result.rows[0]);
};

/**
 * GET /api/sessions/my-bookings
 */
const getUserBookings = async (req, res) => {
    const result = await query(
        `SELECT b.id as "_id", b.*, ls.id as "sessionId", ls.title, ls.scheduled_at as "scheduledAt", ls.duration_minutes as "durationMinutes", v.shop_name as "shopName"
         FROM bookings b
         JOIN live_sessions ls ON ls.id = b.session_id
         LEFT JOIN vendors v ON v.id = ls.vendor_id
         WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
        [req.user.id]
    );
    return successResponse(res, 200, 'Bookings fetched.', result.rows);
};

/**
 * GET /api/sessions/:id/join
 */
const joinSession = async (req, res) => {
    const sessionRes = await query('SELECT * FROM live_sessions WHERE id = $1', [req.params.id]);
    if (!sessionRes.rows[0]) return errorResponse(res, 404, 'Session not found.');

    const bookingRes = await query(
        `SELECT id FROM bookings WHERE session_id = $1 AND user_id = $2 AND booking_status = 'Confirmed'`,
        [req.params.id, req.user.id]
    );
    if (!bookingRes.rows[0]) return errorResponse(res, 403, 'You are not booked for this session.');

    const videoLink = decrypt(sessionRes.rows[0].meeting_link || '');
    return successResponse(res, 200, 'Join link retrieved.', {
        videoLink,
        session: { title: sessionRes.rows[0].title, scheduledAt: sessionRes.rows[0].scheduled_at, duration: sessionRes.rows[0].duration_minutes },
    });
};

module.exports = { getSessions, getSession, createSession, updateSession, deleteSession, getVendorSessions, bookSession, getUserBookings, joinSession };
