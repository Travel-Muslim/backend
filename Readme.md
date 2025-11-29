# Postman Testing Guide - Muslimah Travel API

Base URL: `http://localhost:4000`

---

## 1. REGISTER

**Method:** `POST`  
**URL:** `http://localhost:4000/user/register`  
**Headers:** 
- Content-Type: application/json

**Body (raw - JSON):**
```json
{
  "fullname": "Siti Muslimah",
  "email": "siti@example.com",
  "password": "password123"
}
```

---

## 2. LOGIN

**Method:** `POST`  
**URL:** `http://localhost:4000/user/login`  
**Headers:**
- Content-Type: application/json

**Body (raw - JSON):**
```json
{
  "email": "siti@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Login success",
  "data": {
    "id": "...",
    "fullname": "Siti Muslimah",
    "email": "siti@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**❗ SIMPAN TOKEN INI - AKAN DIPAKAI UNTUK ENDPOINT SELANJUTNYA**

---

## 3. FORGOT PASSWORD

**Method:** `POST`  
**URL:** `http://localhost:4000/user/forgot-password`  
**Headers:**
- Content-Type: application/json

**Body (raw - JSON):**
```json
{
  "email": "siti@example.com"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Reset token generated",
  "data": {
    "resetToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**❗ SIMPAN resetToken INI**

---

## 4. RESET PASSWORD

**Method:** `POST`  
**URL:** `http://localhost:4000/user/reset-password`  
**Headers:**
- Content-Type: application/json

**Body (raw - JSON):**
```json
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "newPassword": "newpassword456"
}
```

---

## 5. GET PROFILE (Butuh Token)

**Method:** `GET`  
**URL:** `http://localhost:4000/user/profile`  
**Headers:**
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Cara masukkan Bearer Token di Postman:**
1. Tab "Authorization"
2. Type: pilih "Bearer Token"
3. Token: paste token dari login (tanpa kata "Bearer")

**ATAU di tab Headers:**
- Key: `Authorization`
- Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 6. GET ALL USERS (Admin Only)

**Method:** `GET`  
**URL:** `http://localhost:4000/user/users`  
**Headers:**
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Catatan:** User harus role admin. Cara jadiin admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'siti@example.com';
```

---

## 7. UPDATE USER (Admin Only)

**Method:** `PUT`  
**URL:** `http://localhost:4000/user/users/uuid-user-yang-mau-diupdate`  
**Headers:**
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

**Body (raw - JSON):**
```json
{
  "fullname": "Siti Updated",
  "email": "siti.new@example.com"
}
```

**Contoh URL lengkap:**
```
http://localhost:4000/user/users/123e4567-e89b-12d3-a456-426614174000
```

---

## 8. DELETE USER (Admin Only)

**Method:** `DELETE`  
**URL:** `http://localhost:4000/user/users/uuid-user-yang-mau-dihapus`  
**Headers:**
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Contoh URL lengkap:**
```
http://localhost:4000/user/users/123e4567-e89b-12d3-a456-426614174000
```

---

## Cara Dapat UUID User

1. Login sebagai admin
2. Hit endpoint GET /user/users
3. Copy id user yang mau diupdate/delete

---

## Urutan Testing

1. Register → dapat akun baru
2. Login → dapat token
3. Get Profile → test token works
4. Forgot Password → dapat reset token  
5. Reset Password → ganti password
6. Login lagi → dengan password baru
7. Jadiin admin (manual di database)
8. Get All Users → lihat semua user
9. Update User → edit user
10. Delete User → hapus user