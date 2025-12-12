const {
    findByBookingId,
    updatePaymentProof
} = require('../models/PaymentModel');
const { findById: findBookingById } = require('../models/BookingModel');
const commonHelper = require('../helpers/common');

const PaymentController = {
    getPaymentDetail: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const userId = req.user.id;

            const booking = await findBookingById(booking_id);
            if (!booking) {
                return commonHelper.notFound(res, 'Booking not found');
            }
            if (booking.user_id !== userId) {
                return commonHelper.forbidden(res, 'You do not have access to this payment');
            }

            const { rows: [payment] } = await findByBookingId(booking_id);
            if (!payment) {
                return commonHelper.notFound(res, 'Payment not found');
            }

            const whatsappNumber = '6281765219854'; 
            const bookingCode = booking.booking_code;
            const packageName = booking.package_name;
            const totalPrice = booking.total_price;
            
            const message = `Halo Saleema Tour, saya ingin melanjutkan pembayaran untuk:%0A%0AKode Booking: ${bookingCode}%0APaket: ${packageName}%0ATotal Pembayaran: Rp ${totalPrice.toLocaleString('id-ID')}%0A%0ATerima kasih!`;
            
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

            commonHelper.success(res, {
                booking_id: booking.id,
                booking_code: bookingCode,
                package_name: packageName,
                total_price: totalPrice,
                payment_status: payment.status,
                payment_deadline: booking.payment_deadline,
                payment_proof_url: payment.payment_proof_url || null,
                
                payment_method: 'whatsapp',
                whatsapp_contact: '081765219854',
                whatsapp_url: whatsappUrl,
                payment_instructions: 'Klik tombol WhatsApp untuk melanjutkan pembayaran. Tim kami akan memandu Anda melalui WhatsApp.'
            }, 'Get payment detail successful');
        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    // uploadPaymentProof: async (req, res) => {
    //     try {
    //         const { booking_id } = req.params;
    //         const { payment_method } = req.body;
    //         const userId = req.user.id;

    //         if (!req.file) {
    //             return commonHelper.badRequest(res, "Payment proof file is required");
    //         }

    //         const booking = await findBookingById(booking_id);
    //         if (!booking) {
    //             return commonHelper.notFound(res, "Booking not found");
    //         }

    //         if (booking.user_id !== userId) {
    //             return commonHelper.forbidden(res, "Forbidden");
    //         }

    //         const { rows } = await findByBookingId(booking_id);
    //         if (!rows.length) {
    //             return commonHelper.notFound(res, "Payment not found");
    //         }

    //         const paymentProofUrl = req.file.path;

    //         const { rows: [updatedPayment] } = await updatePaymentProof(
    //             rows[0].id,
    //             paymentProofUrl,
    //             payment_method || "bank_transfer"
    //         );

    //         return commonHelper.success(res, {
    //             payment_status: updatedPayment.status,
    //             payment_proof_url: updatedPayment.payment_proof_url,
    //             message: 'Bukti pembayaran berhasil diupload. Tim kami akan memverifikasi dalam 1x24 jam.'
    //         }, "Payment proof uploaded successfully");

    //     } catch (error) {
    //         console.log(error);
    //         return commonHelper.error(res, "Server error", 500);
    //     }
    // }
};

module.exports = PaymentController;