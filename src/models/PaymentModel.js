const pool = require('../config/db');

const PaymentModel = {
    findByBookingId: (bookingId) => {
        return pool.query(
            `SELECT 
                id, booking_id, amount,
                status as payment_status, payment_method, payment_proof_url,
                paid_at, created_at
             FROM payments 
             WHERE booking_id = $1`,
            [bookingId]
        );
    },

    create: (data) => {
        const { bookingId, amount } = data;
        return pool.query(
            `INSERT INTO payments (
                booking_id, amount, status
            ) VALUES ($1, $2, 'unpaid')
            RETURNING *`,
            [bookingId, amount]
        );
    },

    updatePaymentProof: (paymentId, proofUrl, paymentMethod) => {
        return pool.query(
            `UPDATE payments 
             SET payment_proof_url = $1,
                 payment_method = $2,
                 status = 'pending'
             WHERE id = $3
             RETURNING *`,
            [proofUrl, paymentMethod, paymentId]
        );
    }
};

module.exports = PaymentModel;