# API Specification - Muslimah Travel

Base URL: `http://localhost:3000`

---

## Authentication Endpoints

### 1. Register

**URL**: `/user/register`

**Method**: `POST`

**Auth required**: NO

**Body**:
```json
{
  "fullname": "Siti Muslimah",
  "email": "siti@example.com",
  "phone_number": "081234567890",
  "password": "password123",
  "confirm_password": "password123"
}
```

**Success Response**

**Code**: `201 Created`

**Content**:
```json
{
  "status": 201,
  "message": "Register success",
  "data": {
    "id": "uuid",
    "fullname": "Siti Muslimah",
    "email": "siti@example.com",
    "phone_number": "081234567890",
    "role": "user"
  }
}
```

**Error Response**

**Condition**: Email sudah dipakai

**Code**: `403 Forbidden`

**Content**:
```json
{
  "status": 403,
  "message": "Email is already used"
}
```

**Condition**: Password tidak match

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Password and confirm password do not match"
}
```

---

### 2. Login

**URL**: `/user/login`

**Method**: `POST`

**Auth required**: NO

**Body**:
```json
{
  "email": "siti@example.com",
  "password": "password123"
}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Login success",
  "data": {
    "id": "uuid",
    "fullname": "Siti Muslimah",
    "email": "siti@example.com",
    "phone_number": "081234567890",
    "role": "user",
    "avatar_url": "https://cloudinary.com/...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response**

**Condition**: Email salah

**Code**: `403 Forbidden`

**Content**:
```json
{
  "status": 403,
  "message": "Email is invalid"
}
```

**Condition**: Password salah

**Code**: `403 Forbidden`

**Content**:
```json
{
  "status": 403,
  "message": "Password is invalid"
}
```

---

### 3. Forgot Password

**URL**: `/user/forgot-password`

**Method**: `POST`

**Auth required**: NO

**Body**:
```json
{
  "email": "siti@example.com"
}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Reset token generated",
  "data": {
    "resetToken": "uuid-reset-token"
  }
}
```

**Error Response**

**Condition**: Email tidak ditemukan

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Email not found"
}
```

---

### 4. Reset Password

**URL**: `/user/reset-password`

**Method**: `POST`

**Auth required**: NO

**Body**:
```json
{
  "token": "uuid-reset-token",
  "newPassword": "newpassword456"
}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Password updated successfully"
}
```

**Error Response**

**Condition**: Token invalid atau expired

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Invalid or expired token"
}
```

---

## User Profile Endpoints

### 5. Get User Profile

**URL**: `/user/profile`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "fullname": "Siti Muslimah",
    "email": "siti@example.com",
    "phone_number": "081234567890",
    "avatar_url": "https://cloudinary.com/...",
    "role": "user",
    "created_at": "2024-11-01T10:30:00.000Z"
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

### 6. Update User Profile

**URL**: `/user/profile`

**Method**: `PUT`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```json
{
  "fullname": "Siti Muslimah Updated",
  "phone_number": "081234567899"
}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "fullname": "Siti Muslimah Updated",
    "email": "siti@example.com",
    "phone_number": "081234567899",
    "avatar_url": "https://cloudinary.com/...",
    "role": "user"
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

### 7. Upload Avatar

**URL**: `/user/avatar`

**Method**: `POST`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body** (multipart/form-data):
```
avatar (required) = file (jpg/png/jpeg, max 2MB)
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar_url": "https://cloudinary.com/avatars/uuid-filename.jpg"
  }
}
```

**Error Response**

**Condition**: File terlalu besar

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Avatar size must be less than 2MB"
}
```

**Condition**: Format file salah

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Only jpg, jpeg, and png files are allowed"
}
```

---

### 8. Delete Avatar

**URL**: `/user/avatar`

**Method**: `DELETE`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Avatar deleted successfully",
  "data": {
    "avatar_url": null
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

## Dashboard Endpoints

### 9. Get Featured Packages

**URL**: `/packages/featured`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
limit (optional) = 3
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "name": "Paket Desember 2025 Wisata Korea Tour",
      "image_url": "https://cloudinary.com/...",
      "start_date": "2025-12-01",
      "duration_days": 10,
      "price": 25000000,
      "destination": {
        "name": "Korea Selatan",
        "location": "Seoul"
      }
    }
  ]
}
```

**Error Response**

**Code**: `500 Internal Server Error`

**Content**:
```json
{
  "status": 500,
  "message": "Server error"
}
```

---

### 10. Get Latest Articles

**URL**: `/articles/latest`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
limit (optional) = 2
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "title": "5 Tips Packing Syar'i: Apa yang Wajib Ada di Koper Muslimah?",
      "category": "Tips Travel",
      "cover_image_url": "https://cloudinary.com/...",
      "excerpt": "Berlibur tetap nyaman dengan packing yang tepat...",
      "created_at": "2024-12-01T10:30:00.000Z"
    }
  ]
}
```

**Error Response**

**Code**: `500 Internal Server Error`

**Content**:
```json
{
  "status": 500,
  "message": "Server error"
}
```

---

### 11. Search Destinations

**URL**: `/destinations/search`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
from (optional)    = Jakarta
to (optional)      = Korea
date (optional)    = 2025-12-01
keyword (optional) = halal
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "name": "Korea Selatan",
      "location": "Seoul",
      "image_url": "https://cloudinary.com/...",
      "rating": 4.8,
      "is_halal_friendly": true
    }
  ]
}
```

**Error Response**

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "No destinations found"
}
```

---

### 12. Get Locations

**URL**: `/locations`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
popular (optional) = true
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "name": "Jakarta",
      "country": "Indonesia",
      "is_popular": true
    }
  ]
}
```

**Error Response**

**Code**: `500 Internal Server Error`

**Content**:
```json
{
  "status": 500,
  "message": "Server error"
}
```

---

### 13. Get Testimonials

**URL**: `/testimonials`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
limit (optional) = 3
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "user_name": "Virly Maryam",
      "user_location": "Palembang, Syar'i",
      "message": "Ini bukan sekadar liburan, ini adalah perjalanan yang berbeda...",
      "photo_url": "https://cloudinary.com/..."
    }
  ]
}
```

**Error Response**

**Code**: `500 Internal Server Error`

**Content**:
```json
{
  "status": 500,
  "message": "Server error"
}
```

---

### 14. Get User Wishlist

**URL**: `/wishlists`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "destination": {
        "name": "Masjid Istiqlal",
        "location": "Jakarta",
        "image_url": "https://cloudinary.com/...",
        "rating": 4.9
      }
    }
  ]
}
```

**Error Response**

**Condition**: If token is invalid or missing

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

### 15. Get Booking History

**URL**: `/bookings/history`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "package": {
        "name": "Paket Umroh November 2024",
        "image_url": "https://cloudinary.com/..."
      },
      "booking_date": "2024-11-15",
      "total_participants": 2,
      "total_price": 45000000,
      "status": "confirmed"
    }
  ]
}
```

**Error Response**

**Condition**: If token is invalid or missing

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

## Review/Ulasan Endpoints

### 16. Get Booking for Review

**URL**: `/bookings/:booking_id/review-form`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
```
booking_id (required) = uuid booking
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "booking_id": "uuid",
    "package": {
      "id": "uuid",
      "name": "Paket Desember 2025",
      "subtitle": "Korea Halal Tour 2025",
      "image_url": "https://cloudinary.com/...",
      "rating": 4.8
    },
    "destination": {
      "id": "uuid",
      "name": "Korea Selatan",
      "location": "Seoul"
    },
    "trip_date": "2025-12-01",
    "status": "completed",
    "can_review": true,
    "already_reviewed": false
  }
}
```

**Error Response**

**Condition**: Booking belum selesai

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Cannot review, trip not completed yet"
}
```

**Condition**: Sudah pernah review

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "You already reviewed this booking"
}
```

---

### 17. Submit Review

**URL**: `/reviews`

**Method**: `POST`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body** (multipart/form-data):
```
booking_id (required)      = uuid
destination_id (required)  = uuid
package_id (optional)      = uuid
rating (required)          = 5 (1-5)
comment (required)         = "Pengalaman yang luar biasa..."
photo (optional)           = file (jpg/png/jpeg, max 5MB)
```

**Success Response**

**Code**: `201 Created`

**Content**:
```json
{
  "status": 201,
  "message": "Review submitted successfully",
  "data": {
    "id": "uuid",
    "booking_id": "uuid",
    "user_id": "uuid",
    "destination_id": "uuid",
    "package_id": "uuid",
    "rating": 5,
    "comment": "Pengalaman yang luar biasa...",
    "photo_url": "https://cloudinary.com/...",
    "created_at": "2024-12-02T10:30:00.000Z"
  }
}
```

**Error Response**

**Condition**: Rating invalid

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Rating must be between 1 and 5"
}
```

**Condition**: File terlalu besar

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Photo size must be less than 5MB"
}
```

**Condition**: Booking not found

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Booking not found"
}
```

---

### 18. Get User Reviews

**URL**: `/reviews/me`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
page (optional)  = 1
limit (optional) = 10
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "booking_id": "uuid",
      "destination": {
        "name": "Korea Selatan",
        "location": "Seoul"
      },
      "package": {
        "name": "Paket Desember 2025"
      },
      "rating": 5,
      "comment": "Pengalaman yang luar biasa...",
      "photo_url": "https://cloudinary.com/...",
      "created_at": "2024-12-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 15,
    "total_pages": 2
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---
## Booking Management Endpoints

### 19. Get Active Bookings (Pesanan Saya)

**URL**: `/bookings/active`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
page (optional)  = 1
limit (optional) = 10
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "booking_code": "BK-2024-12345",
      "package": {
        "id": "uuid",
        "name": "Tahun Berjalan Di Uzbekistan",
        "image_url": "https://cloudinary.com/..."
      },
      "destination": {
        "name": "Samarkhand, Uzbekistan"
      },
      "departure_date": "2024-12-28T13:00:00.000Z",
      "return_date": "2025-01-15T23:00:00.000Z",
      "total_participants": 1,
      "total_price": 35000000,
      "status": "confirmed",
      "payment_status": "paid",
      "facilities": {
        "accommodation": true,
        "transport": true,
        "flight": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 3,
    "total_pages": 1
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

### 20. Get Booking History (Riwayat Pembelian)

**URL**: `/bookings/history`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
page (optional)  = 1
limit (optional) = 10
status (optional) = completed | cancelled
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "booking_code": "BK-2024-12345",
      "package": {
        "name": "Paket Umroh November 2024",
        "image_url": "https://cloudinary.com/..."
      },
      "booking_date": "2024-11-15T10:00:00.000Z",
      "departure_date": "2024-12-01",
      "total_participants": 2,
      "total_price": 45000000,
      "status": "completed",
      "payment_status": "paid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 15,
    "total_pages": 2
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

### 21. Get Booking Detail

**URL**: `/bookings/:booking_id`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
```
booking_id (required) = uuid
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "booking_code": "BK-2024-12345",
    "user": {
      "fullname": "Lorem Ipsum dolor",
      "email": "lorem.ipsum@email.com",
      "phone_number": "08xxxxxxxxxx"
    },
    "package": {
      "id": "uuid",
      "name": "Tahun Berjalan Di Uzbekistan",
      "image_url": "https://cloudinary.com/..."
    },
    "destination": {
      "name": "Samarkhand, Uzbekistan",
      "location": "Uzbekistan"
    },
    "departure_date": "2024-12-28T13:00:00.000Z",
    "return_date": "2025-01-15T23:00:00.000Z",
    "total_participants": 1,
    "total_price": 35000000,
    "status": "confirmed",
    "payment_status": "paid",
    "payment_id": "6209813722",
    "facilities": {
      "accommodation": true,
      "transport": true,
      "flight": true
    },
    "created_at": "2024-11-20T10:00:00.000Z"
  }
}
```

**Error Response**

**Condition**: Booking not found

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Booking not found"
}
```

**Condition**: Not your booking

**Code**: `403 Forbidden`

**Content**:
```json
{
  "status": 403,
  "message": "You don't have access to this booking"
}
```

---

### 22. Download E-Ticket

**URL**: `/bookings/:booking_id/download-ticket`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
```
booking_id (required) = uuid
```

**Success Response**

**Code**: `200 OK`

**Content-Type**: `application/pdf`

**Headers**:
```
Content-Disposition: attachment; filename="ticket-BK-2024-12345.pdf"
```

**Response**: Binary PDF file

**Error Response**

**Condition**: Booking not paid yet

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Cannot download ticket, payment not completed"
}
```

**Condition**: Booking not found

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Booking not found"
}
```

---

### 23. Cancel Booking

**URL**: `/bookings/:booking_id/cancel`

**Method**: `PUT`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters**:
```
booking_id (required) = uuid
```

**Body**:
```json
{
  "cancel_reason": "Berhalangan hadir"
}
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Booking cancelled successfully",
  "data": {
    "id": "uuid",
    "booking_code": "BK-2024-12345",
    "status": "cancelled",
    "cancel_reason": "Berhalangan hadir",
    "cancelled_at": "2024-12-02T15:30:00.000Z"
  }
}
```

**Error Response**

**Condition**: Booking already started

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Cannot cancel, trip already started"
}
```

**Condition**: Already cancelled

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Booking already cancelled"
}
```

---

### 24. Create Booking

**URL**: `/bookings`

**Method**: `POST`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```json
{
  "package_id": "uuid",
  "departure_date": "2024-12-28",
  "total_participants": 2,
  "passenger_details": [
    {
      "fullname": "Siti Muslimah",
      "id_number": "3201234567890123",
      "phone_number": "081234567890",
      "email": "siti@example.com"
    },
    {
      "fullname": "Fatimah Zahra",
      "id_number": "3201234567890124",
      "phone_number": "081234567891",
      "email": "fatimah@example.com"
    }
  ],
  "special_requests": "Butuh kursi roda"
}
```

**Success Response**

**Code**: `201 Created`

**Content**:
```json
{
  "status": 201,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "booking_code": "BK-2024-12345",
    "package_id": "uuid",
    "user_id": "uuid",
    "departure_date": "2024-12-28",
    "total_participants": 2,
    "total_price": 50000000,
    "status": "pending",
    "payment_status": "unpaid",
    "payment_deadline": "2024-12-03T15:30:00.000Z",
    "created_at": "2024-12-02T15:30:00.000Z"
  }
}
```

**Error Response**

**Condition**: Package not available

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Package not found"
}
```

**Condition**: Quota full

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Package quota is full"
}
```

---

### 25. Get Bookings with Filters

**URL**: `/bookings`

**Method**: `GET`

**Auth required**: YES

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
page (optional)       = 1
limit (optional)      = 10
status (optional)     = pending | confirmed | completed | cancelled
date_from (optional)  = 2024-12-01
date_to (optional)    = 2025-01-15
search (optional)     = Uzbekistan
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "booking_code": "BK-2024-12345",
      "package": {
        "name": "Tahun Berjalan Di Uzbekistan"
      },
      "departure_date": "2024-12-28",
      "status": "confirmed",
      "total_price": 35000000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 5,
    "total_pages": 1
  }
}
```

**Error Response**

**Code**: `401 Unauthorized`

**Content**:
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

---

## Article Management Endpoints

### 26. Get All Articles

**URL**: `/articles`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
page (optional)     = 1
limit (optional)    = 12
category (optional) = Tips Travel | Destinasi | Kuliner | Budaya
search (optional)   = packing
sort (optional)     = latest | popular | oldest
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "title": "5 Tips Packing Syar'i: Apa yang Wajib Ada di Koper Muslimah?",
      "slug": "5-tips-packing-syari",
      "category": "Tips Travel",
      "cover_image_url": "https://cloudinary.com/...",
      "excerpt": "Berlibur tetap nyaman dengan packing yang tepat...",
      "author": {
        "name": "Admin Saleema",
        "avatar_url": "https://cloudinary.com/..."
      },
      "views": 1250,
      "read_time": "5 min",
      "created_at": "2024-12-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total_items": 48,
    "total_pages": 4
  }
}
```

**Error Response**

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "No articles found"
}
```

---

### 27. Get Article by ID/Slug

**URL**: `/articles/:id_or_slug`

**Method**: `GET`

**Auth required**: NO

**URL Parameters**:
```
id_or_slug (required) = uuid OR slug-artikel
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "title": "5 Tips Packing Syar'i: Apa yang Wajib Ada di Koper Muslimah?",
    "slug": "5-tips-packing-syari",
    "category": "Tips Travel",
    "cover_image_url": "https://cloudinary.com/...",
    "content": "Full article content in HTML...",
    "excerpt": "Berlibur tetap nyaman dengan packing yang tepat...",
    "author": {
      "id": "uuid",
      "name": "Admin Saleema",
      "avatar_url": "https://cloudinary.com/..."
    },
    "tags": ["packing", "travel tips", "syari"],
    "views": 1250,
    "read_time": "5 min",
    "created_at": "2024-12-01T10:30:00.000Z",
    "updated_at": "2024-12-01T10:30:00.000Z",
    "related_articles": [
      {
        "id": "uuid",
        "title": "Destinasi Halal Friendly di Asia",
        "slug": "destinasi-halal-friendly-asia",
        "cover_image_url": "https://cloudinary.com/..."
      }
    ]
  }
}
```

**Error Response**

**Condition**: Article not found

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Article not found"
}
```

---

### 28. Search Articles

**URL**: `/articles/search`

**Method**: `GET`

**Auth required**: NO

**Query Parameters**:
```
q (required)        = packing syari
page (optional)     = 1
limit (optional)    = 12
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "title": "5 Tips Packing Syar'i: Apa yang Wajib Ada di Koper Muslimah?",
      "slug": "5-tips-packing-syari",
      "category": "Tips Travel",
      "cover_image_url": "https://cloudinary.com/...",
      "excerpt": "Berlibur tetap nyaman dengan packing yang tepat...",
      "created_at": "2024-12-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total_items": 5,
    "total_pages": 1
  }
}
```

**Error Response**

**Condition**: No search query provided

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Search query is required"
}
```

---

### 29. Get Articles by Category

**URL**: `/articles/category/:category`

**Method**: `GET`

**Auth required**: NO

**URL Parameters**:
```
category (required) = Tips Travel | Destinasi | Kuliner | Budaya
```

**Query Parameters**:
```
page (optional)  = 1
limit (optional) = 12
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "title": "5 Tips Packing Syar'i: Apa yang Wajib Ada di Koper Muslimah?",
      "slug": "5-tips-packing-syari",
      "category": "Tips Travel",
      "cover_image_url": "https://cloudinary.com/...",
      "excerpt": "Berlibur tetap nyaman dengan packing yang tepat...",
      "created_at": "2024-12-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total_items": 15,
    "total_pages": 2
  }
}
```

**Error Response**

**Condition**: Invalid category

**Code**: `400 Bad Request`

**Content**:
```json
{
  "status": 400,
  "message": "Invalid category"
}
```

---

### 30. Get Article Categories

**URL**: `/articles/categories`

**Method**: `GET`

**Auth required**: NO

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "name": "Tips Travel",
      "slug": "tips-travel",
      "description": "Tips dan trik untuk perjalanan yang nyaman",
      "article_count": 15,
      "icon_url": "https://cloudinary.com/..."
    },
    {
      "id": "uuid",
      "name": "Destinasi",
      "slug": "destinasi",
      "description": "Rekomendasi destinasi halal friendly",
      "article_count": 20,
      "icon_url": "https://cloudinary.com/..."
    },
    {
      "id": "uuid",
      "name": "Kuliner",
      "slug": "kuliner",
      "description": "Kuliner halal di berbagai destinasi",
      "article_count": 12,
      "icon_url": "https://cloudinary.com/..."
    },
    {
      "id": "uuid",
      "name": "Budaya",
      "slug": "budaya",
      "description": "Budaya dan tradisi islami",
      "article_count": 8,
      "icon_url": "https://cloudinary.com/..."
    }
  ]
}
```

**Error Response**

**Code**: `500 Internal Server Error`

**Content**:
```json
{
  "status": 500,
  "message": "Server error"
}
```

---

### 31. Increment Article Views

**URL**: `/articles/:id/view`

**Method**: `POST`

**Auth required**: NO

**URL Parameters**:
```
id (required) = uuid
```

**Success Response**

**Code**: `200 OK`

**Content**:
```json
{
  "status": 200,
  "message": "View counted",
  "data": {
    "article_id": "uuid",
    "total_views": 1251
  }
}
```

**Error Response**

**Code**: `404 Not Found`

**Content**:
```json
{
  "status": 404,
  "message": "Article not found"
}
```
---

## Summary

### Authentication (4 endpoints)
- POST /user/register
- POST /user/login
- POST /user/forgot-password
- POST /user/reset-password

### User Profile (4 endpoints - perlu token)
- GET /user/profile
- PUT /user/profile
- POST /user/avatar
- DELETE /user/avatar

### Public Endpoints (11 endpoints - tidak perlu token)
- GET /packages/featured
- GET /articles/latest
- GET /articles
- GET /articles/:id_or_slug
- GET /articles/search
- GET /articles/category/:category
- GET /articles/categories
- POST /articles/:id/view
- GET /destinations/search
- GET /locations
- GET /testimonials

### Protected Endpoints - Wishlist & Reviews (5 endpoints - perlu token)
- GET /wishlists
- GET /bookings/:booking_id/review-form
- POST /reviews
- GET /reviews/me

### Booking Management (7 endpoints - perlu token)
- GET /bookings/active
- GET /bookings/history
- GET /bookings/:booking_id
- GET /bookings/:booking_id/download-ticket
- PUT /bookings/:booking_id/cancel
- POST /bookings
- GET /bookings (with filters)