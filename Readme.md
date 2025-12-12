#  Seleema Tour API - Muslimah Travel Platform

> RESTful API untuk platform travel khusus muslimah yang menyediakan paket umroh, tour halal, dan layanan perjalanan islami.


**Production URL:** `https://seleema-tour-api.vercel.app`  
**API Documentation:** `https://seleema-tour-api.vercel.app/api-docs`

---

## Deskripsi

Seleema Tour API adalah backend sistem manajemen travel yang dikhususkan untuk perjalanan muslimah. API ini menyediakan fitur-fitur lengkap untuk:

- **Autentikasi & Autorisasi** - JWT-based authentication dengan role management
- **Paket Travel** - CRUD untuk paket umroh, tour, dan perjalanan islami
- **Booking & Payment** - Sistem pemesanan dan pembayaran terintegrasi
- **Review & Rating** - Ulasan dari customer dengan moderasi admin
- **Article/Blog** - CMS untuk konten edukatif dan informasi travel
- **Community Forum** - Forum diskusi untuk jamaah
- **Wishlist** - Simpan paket favorit
- **Admin Dashboard** - Dashboard analytics dan manajemen

---

## Fitur Utama

###  Authentication & Authorization
- Register & Login dengan email
- JWT access token & refresh token
- Password reset via email token
- Role-based access control (Admin, User)
- Protected routes dengan middleware

### Package Management
- CRUD paket travel (Umroh, Halal Tour, Wisata Islami)
- Filter by kategori, harga, destinasi
- Upload gambar paket (Cloudinary integration)
- Status published/unpublished
- Pagination & search

### Booking System
- Create booking dengan validasi
- Multiple payment methods
- Upload bukti pembayaran
- Status tracking (pending, confirmed, completed, cancelled)
- Generate e-ticket PDF
- Booking history

### Review & Rating
- Submit review dengan rating (1-5)
- Upload foto/video review (max 5 media)
- Admin moderation (approve/reject)
- Filter published reviews only

### Content Management
- CRUD artikel/blog
- Kategori & tags
- Featured articles
- Upload cover image
- Draft/Published status

### Community Features
- Forum diskusi
- Post, comment, like system
- Share pengalaman perjalanan

### Admin Dashboard
- Total bookings statistics
- Revenue analytics
- Top packages performance
- Booking status overview
- User management

---

## Tech Stack

**Runtime & Framework:**
- Node.js v18+
- Express.js v5.1.0

**Database:**
- PostgreSQL 14+
- pg (node-postgres) v8.16.3

**Authentication:**
- JSON Web Token (JWT)
- bcryptjs untuk password hashing

**File Upload:**
- Multer v2.0.2
- Cloudinary v1.41.3

**Documentation:**
- Swagger UI Express v5.0.1
- Swagger JSDoc v6.2.8

**Security:**
- Helmet v8.1.0
- CORS v2.8.5
- Express Rate Limit v8.2.1

**Other Tools:**
- PDFKit v0.17.2 (E-ticket generation)
- Morgan (HTTP logger)
- Express Validator v7.3.1
- dotenv v17.2.3

---

