# Maher Marriage Bureau — Backend Reference

Complete reference for building the **public website** and the **admin panel** against this NestJS + MySQL backend. Every endpoint, request body, query param, role requirement, and response shape is documented here.

---

## 1. Tech stack & architecture

- **Framework:** NestJS 10 (Express)
- **Database:** MySQL 8 via TypeORM
- **Auth:** JWT (access + refresh), Passport JWT strategy
- **Validation:** `class-validator` global pipe (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)
- **Security:** Helmet, CORS (`origin: true`, credentials), rate limiting (`@nestjs/throttler`)
- **File uploads:** Multer (in-memory), JPEG/PNG/WebP only, ≤ 5 MB each. Persisted via a pluggable **storage driver** — either **Hostinger FTP** (`STORAGE_DRIVER=ftp`) or **local disk** under `/uploads` (`STORAGE_DRIVER=local`, served statically at `/uploads/*`). See §8.
- **API docs (Swagger):** `GET /api/docs`

### Account model (two separate tables)

There are **two distinct account types stored in separate tables**:

| Account | Table | Login endpoint | Role claim |
|---------|-------|----------------|------------|
| Website user (a profile) | `users` | `POST /api/auth/login` | `user` |
| Admin (staff) | `admins` | `POST /api/auth/admin/login` | `admin` |

A **website user IS a matrimony profile** — there is no separate `profiles` table. The `users` row holds both the account/auth fields and the matrimony profile fields. A user that has filled in their matrimony details has `hasProfile = true`.

**Field privacy (public vs private):** some fields are **never returned on the public endpoints** (`GET /api/profiles` and `GET /api/profiles/:id`). They are only included for the **profile owner** (`GET /api/profiles/me/own`) and **admins** (`/api/admin/*`). Private fields: `lastName`/`surname`, `email`, `phone`, `currentAddress`, `motherPhone`, `fatherPhone`, `otherPhone`, `coordinatorNumber`. On public endpoints `name` is the **first name only** (the surname is private).

**Strict separation (important):**

- The two account types live in **different tables** and authenticate at **different endpoints**. `POST /api/auth/login` only checks the `users` table; `POST /api/auth/admin/login` only checks the `admins` table.
- An **admin cannot log in on the website**, and a **user cannot log in to the admin panel** — their email simply isn't found in the other table.
- Every `/api/admin/*` route is locked to `role = admin` (via `RolesGuard`), so a `user`-role token is rejected.
- Admins have **no matrimony profile** of their own. When the admin panel lists "users/profiles", it is showing the **website members' profiles for moderation** (list, verify, publish, edit, delete) — not admin accounts.

---

## 2. Running the backend

### Environment variables (`.env.development` / `.env.production`)

```
NODE_ENV=development
PORT=4000

JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>

DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
DB_SYNC_SCHEMA=true   # dev only: auto-create/update tables

# --- Image storage ---
# 'ftp'  -> uploads go to Hostinger over FTP (use this so images persist off the dev machine)
# 'local'-> uploads written to ./uploads and served at /uploads/*
STORAGE_DRIVER=ftp
FTP_HOST=...
FTP_PORT=21
FTP_USER=...
FTP_PASSWORD=...
FTP_SECURE=false                 # true = FTPS (explicit TLS)
FTP_UPLOAD_DIR=public_html/uploads        # dir (relative to FTP login root) files are written to
UPLOADS_PUBLIC_BASE_URL=https://<host>/uploads   # public base URL prepended to the stored filename
```

> **Storage notes**
> - With `STORAGE_DRIVER=ftp`, the stored image `url` is an **absolute** URL (`UPLOADS_PUBLIC_BASE_URL` + filename); with `local` it is a **relative** path (`/uploads/<file>`).
> - `FTP_UPLOAD_DIR` must point at the directory that `UPLOADS_PUBLIC_BASE_URL` actually serves. If the public URL returns 404/500, the upload succeeded but the path/serving URL are mismatched — verify where that host serves static files from.
> - The driver is auto-detected when `STORAGE_DRIVER` is unset: it uses `ftp` if `FTP_HOST` is set, otherwise `local`.

### Commands

```bash
npm run start:dev    # watch mode
npm run build        # compile to dist/
npm run start:prod   # run compiled build
npm run seed         # create the bootstrap admin (SEED_SYNC_SCHEMA=true)
npm test             # unit tests
```

### Seed

The seed creates **only the bootstrap admin** (no demo users/profiles):

```
Admin -> admin@maher.local / Admin@123
```

---

## 3. Global API conventions

### Base URL & prefix

All routes are prefixed with `/api` (declared per-controller). Example full URL:

```
http://localhost:4000/api/auth/login
```

### Authentication

- A **global JWT guard** protects every route **except** those marked public.
- Send the access token as a Bearer header:

```
Authorization: Bearer <accessToken>
```

- **Public (no token):** signup, login, admin login, refresh, forgot/reset password, public profile list & detail, submit contact inquiry.
- **Admin-only:** everything under `/api/admin/*` and the contact management endpoints. Enforced by `RolesGuard` (requires `role = admin` in the JWT).

### Success responses

Responses are returned **as-is** (no global success envelope). Each endpoint section below shows the exact shape.

### Error responses

All errors share this shape (from the global exception filter):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "email must be an email" }],
  "timestamp": "2026-06-23T10:00:00.000Z",
  "path": "/api/auth/signup"
}
```

- `details` is only present for validation errors (array of field errors).
- Unknown/extra body fields are rejected with `400` (`forbidNonWhitelisted`).

### Pagination

List endpoints accept these query params:

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int ≥ 1 | `1` | |
| `limit` | int 1–100 | `12` | |
| `sortBy` | string | `createdAt` | column name |
| `order` | `asc` \| `desc` | `desc` | |

Paginated responses use:

```json
{
  "data": [ /* items */ ],
  "meta": {
    "total": 42, "page": 1, "limit": 12, "totalPages": 4,
    "hasNextPage": true, "hasPrevPage": false
  }
}
```

### Rate limits (HTTP 429 on exceed)

| Scope | Limit |
|-------|-------|
| Global default | 60 requests / minute |
| Signup, login, admin login | 5 / minute |
| Forgot/reset password, verify email/phone, resend OTP | 3 / 10 minutes |
| Admin forgot/reset password | 3 / 10 minutes |
| Submit contact inquiry | 3 / hour |

### Health check

**GET `/api/health` · public** — liveness/readiness probe (no token). Response `200`:
```json
{
  "status": "ok",
  "timestamp": "2026-06-23T10:00:00.000Z",
  "database": "connected",
  "uptime": 1234
}
```
- `database` is `"connected"` or `"disconnected"`.
- `uptime` is seconds since the process started.

---

## 4. Data models

### User (`users`) — account + matrimony profile

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `email` | string | unique |
| `phone` | string | unique |
| `passwordHash` | string | never returned |
| `firstName` | string | |
| `lastName` | string | |
| `gender` | `Male` \| `Female` | |
| `dateOfBirth` | date | |
| `isVerified` | boolean | email/account verified (OTP) |
| `isActive` | boolean | false = blocked/deactivated |
| `refreshToken` | string\|null | hashed, never returned |
| `profileNumber` | string\|null | e.g. `Maher001` |
| `hasProfile` | boolean | true once matrimony profile created |
| `age` | int\|null | auto-computed from `dateOfBirth` when the profile is created/updated |
| `religion` | string\|null | |
| `caste` | string\|null | |
| `city` | string\|null | |
| `state` | string\|null | |
| `education` | string\|null | |
| `occupation` | string\|null | |
| `income` | string\|null | |
| `height` | string\|null | |
| `about` | text\|null | |
| `familyType` | `Nuclear` \| `Joint` \| null | |
| `maritalStatus` | `Never_Married` \| `Divorced` \| `Widowed` \| null | |
| `motherTongue` | string\|null | |
| `interests` | string[]\|null | |
| `complexion` | string\|null | |
| `homeTown` | string\|null | |
| `educationCity` | string\|null | |
| `castePreference` | string\|null | |
| `languagesKnown` | string[]\|null | languages the person knows |
| `currentAddress` | string\|null | 🔒 **private** (complete address) |
| `addressCity` | string\|null | |
| `addressArea` | string\|null | |
| `motherPhone` | string\|null | 🔒 **private** |
| `fatherPhone` | string\|null | 🔒 **private** |
| `otherPhone` | string\|null | 🔒 **private** (other phone no. with name) |
| `coordinatorNumber` | string\|null | 🔒 **private** |
| `fatherName` | string\|null | |
| `fatherOccupation` | string\|null | |
| `motherName` | string\|null | |
| `motherOccupation` | string\|null | |
| `totalSiblings` | string\|null | e.g. `2 Brothers, 1 Sister` |
| `brotherEducation` | string\|null | |
| `sisterEducation` | string\|null | |
| `otherDetails` | text\|null | extra family/other notes |
| `isPublished` | boolean | profile visible on public site |
| `isProfileVerified` | boolean | admin-verified profile badge |
| `createdAt` / `updatedAt` | datetime | |

### Admin (`admins`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `email` | string | unique |
| `phone` | string\|null | unique |
| `passwordHash` | string | never returned |
| `firstName` / `lastName` | string | |
| `isActive` | boolean | |
| `refreshToken` | string\|null | hashed |
| `createdAt` / `updatedAt` | datetime | |

### ProfileImage (`profile_images`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `userId` | uuid | owner (the user/profile) |
| `url` | string | relative `/uploads/<file>` (local driver) or absolute `https://.../uploads/<file>` (FTP driver) |
| `isPrimary` | boolean | main photo |
| `isPrivate` | boolean | hidden from public listings (admin toggle) |
| `sortOrder` | int | display order |

### OtpVerification (`otp_verifications`)

`id`, `userId`, `otpCode`, `type` (`email` \| `phone` \| `password_reset`), `expiresAt`, `isUsed`.

### ContactInquiry (`contact_inquiries`)

`id`, `name`, `email`, `subject`, `message`, `isRead`, `respondedAt`, `createdAt`.

### AdminActivityLog (`admin_activity_logs`)

`id`, `adminId`, `action`, `entityType`, `entityId`, `details` (json), `createdAt`.

### Enums

| Enum | Values |
|------|--------|
| Gender | `Male`, `Female` |
| Role | `user`, `admin` |
| FamilyType | `Nuclear`, `Joint` |
| MaritalStatus | `Never_Married`, `Divorced`, `Widowed` |
| OtpType | `email`, `phone`, `password_reset` |

---

## 5. Auth endpoints — `/api/auth`

### POST `/api/auth/signup` — Register a website user · **public**

Body:
```json
{
  "firstName": "Priya",
  "lastName": "Sharma",
  "email": "priya@example.com",
  "phone": "9876543210",
  "gender": "Female",
  "dateOfBirth": "1998-05-15",
  "password": "Password123!"
}
```
Rules: `phone` = Indian 10-digit `^[6-9]\d{9}$`; `dateOfBirth` = `YYYY-MM-DD`, user must be ≥ 18; password ≥ 8 with upper/lower/number. An email OTP is generated on signup.

Response `201`:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "uuid", "email": "...", "firstName": "...", "lastName": "...", "role": "user" }
}
```

### POST `/api/auth/login` — Website user login · **public**
Body: `{ "email": "...", "password": "..." }` → same response shape as signup (`role: "user"`). Invalid credentials → `401`.

### POST `/api/auth/admin/login` — Admin login · **public**
Body: `{ "email": "...", "password": "..." }` → response with `role: "admin"`. Only matches accounts in the `admins` table.

### POST `/api/auth/refresh` — Rotate tokens · **public**
Body: `{ "refreshToken": "..." }` → `{ "accessToken": "...", "refreshToken": "..." }`. Works for both user and admin tokens (routed by the `role` claim). Invalid/expired → `401`.

### POST `/api/auth/logout` — Invalidate refresh token · **auth (user or admin)**
No body. Clears the stored refresh token for the caller. → `{ "message": "Logged out successfully" }`.

### POST `/api/auth/forgot-password` — Request reset OTP · **public**
Body: `{ "email": "..." }`. Always returns a generic message (no account enumeration). Users only.

### POST `/api/auth/reset-password` — Reset password with OTP · **public**
Body: `{ "email": "...", "otp": "123456", "newPassword": "NewPassword123!" }` → `{ "message": "Password reset successfully" }`. Invalid/expired OTP → `400`.

### POST `/api/auth/admin/forgot-password` — Request admin reset OTP · **public**
Body: `{ "email": "..." }`. Admins only — looks up the `admins` table. Always returns the same generic message (no account enumeration); an OTP is only generated for an existing, active admin. → `{ "message": "If the email is registered, you will receive a password reset OTP" }`. Rate limited 3 / 10 min.

### POST `/api/auth/admin/reset-password` — Reset admin password with OTP · **public**
Body: `{ "email": "...", "otp": "123456", "newPassword": "NewPassword123!" }` → `{ "message": "Password reset successfully" }`. Resets the password for the matching account in the `admins` table and clears its refresh token. Invalid/expired OTP → `400`. Rate limited 3 / 10 min.

### POST `/api/auth/verify-email` — Verify email · **auth (user)**
Body: `{ "otp": "123456" }` → `{ "message": "Verification successful" }`. Sets `isVerified = true`.

### POST `/api/auth/verify-phone` — Verify phone · **auth (user)**
Body: `{ "otp": "123456" }` → `{ "message": "Verification successful" }`.

### POST `/api/auth/resend-otp` — Resend OTP · **auth (user)**
Body: `{ "type": "email" }` (or `phone`). Max 3 per hour → otherwise `400`.

---

## 6. Current user endpoints — `/api/users` · **auth (user)**

### GET `/api/users/me` — Current user info
Response:
```json
{
  "id": "uuid",
  "email": "...", "phone": "...",
  "firstName": "...", "lastName": "...",
  "gender": "Female", "dateOfBirth": "1998-05-15",
  "isVerified": true,
  "createdAt": "...",
  "profile": { "id": "uuid", "profileNumber": "Maher001", "isPublished": true, "isVerified": false } 
}
```
`profile` is `null` when `hasProfile = false`. (`profile.isVerified` = profile verification badge.)

### PATCH `/api/users/me` — Update name / phone
Body (all optional): `{ "firstName": "...", "lastName": "...", "phone": "9876543210" }`. Duplicate phone → `409`.

### PATCH `/api/users/me/password` — Change password
Body: `{ "currentPassword": "...", "newPassword": "NewPassword123!" }`. Wrong current password → `400`.

### DELETE `/api/users/me` — Deactivate account
Sets `isActive = false` and clears refresh token. → `{ "message": "Account deactivated successfully" }`.

---

## 7. Profile endpoints — `/api/profiles`

### POST `/api/profiles` — Create own matrimony profile · **auth (user)**
Body (`CreateProfileDto`):
```json
{
  "religion": "Hindu",
  "caste": "Brahmin",
  "city": "Mumbai",
  "state": "Maharashtra",
  "education": "MBA - Finance",
  "occupation": "Investment Banker",
  "income": "₹15-20 LPA",
  "height": "5'4\"",
  "about": "A passionate professional looking for a like-minded partner.",
  "familyType": "Nuclear",
  "maritalStatus": "Never_Married",
  "motherTongue": "Hindi",
  "interests": ["Traveling", "Reading"],
  "complexion": "Fair",
  "homeTown": "Lucknow",
  "languagesKnown": ["Hindi", "English"],
  "currentAddress": "12 MG Road, Near City Mall",
  "addressCity": "Mumbai",
  "addressArea": "Andheri West",
  "fatherName": "Ramesh Sharma",
  "motherName": "Sunita Sharma",
  "totalSiblings": "2 Brothers, 1 Sister"
}
```
Validation: `about` 20–1000 chars; `interests` 1–10 items. **`age` is not part of the body — it is computed automatically from the account's `dateOfBirth`** (set at signup). Assigns a `profileNumber`, sets `hasProfile = true`. If a profile already exists → `409`.

**Optional fields** (all nullable; may be sent on create/update): `complexion`, `homeTown`, `educationCity`, `castePreference`, `languagesKnown` (string[], max 10), `currentAddress` 🔒, `addressCity`, `addressArea`, `motherPhone` 🔒, `fatherPhone` 🔒, `otherPhone` 🔒, `coordinatorNumber` 🔒, `fatherName`, `fatherOccupation`, `motherName`, `motherOccupation`, `totalSiblings`, `brotherEducation`, `sisterEducation`, `otherDetails`. (`firstName`/`lastName`/`email`/`phone`/`dateOfBirth`/`gender` come from the account, set at signup — not in this body.)

Response: the formatted profile object (see GET `/api/profiles/:id` shape, includes private images for the owner).

### PUT `/api/profiles/me` — Create or replace own profile (upsert) · **auth (user)**
Same body as create. Creates if none exists, otherwise overwrites.

### PATCH `/api/profiles/me` — Partial update own profile · **auth (user)**
Body: any subset of `CreateProfileDto` fields. → formatted profile.

### GET `/api/profiles/me/own` — Get own full profile · **auth (user)**
Returns the owner's profile **including private images**. `404` if no profile yet.

### GET `/api/profiles/me/completion` — Profile completion summary · **auth (user)**
Response:
```json
{
  "hasProfile": true,
  "profileId": "uuid",
  "profileNumber": "Maher001",
  "isPublished": true,
  "isVerified": false,
  "imageCount": 2,
  "overallPercentage": 80,
  "totalCompleted": 12,
  "totalRequired": 15,
  "sections": [
    { "section": "basic", "completed": 4, "total": 4, "percentage": 100, "missingFields": [] },
    { "section": "religious_family", "...": "..." },
    { "section": "career", "...": "..." },
    { "section": "about_interests", "...": "..." },
    { "section": "photos", "...": "..." }
  ]
}
```
When `hasProfile = false`, returns `{ "hasProfile": false, "profileNumber": null, ...progress }`.

### DELETE `/api/profiles/me` — Delete own profile · **auth (user)**
Clears all matrimony fields, deletes images, sets `hasProfile/isPublished/isProfileVerified = false`. The login account is kept. → `{ "message": "Profile deleted successfully" }`.

### GET `/api/profiles` — Public list / search · **public**
Returns only `isPublished = true` profiles. Query params (all optional) on top of pagination:

| Param | Type | Notes |
|-------|------|-------|
| `profileNumber` | string | partial match |
| `gender` | `Male`\|`Female` | |
| `ageMin` / `ageMax` | int | |
| `religion`, `city`, `state`, `motherTongue`, `education` | string | partial match |
| `maritalStatus` | enum | |
| `search` | string | matches name / city / occupation |

Each item (public — private fields and surname are excluded; `name` is the first name only):
```json
{
  "id": "uuid",
  "profileNumber": "Maher001",
  "name": "Aisha",
  "age": 28, "gender": "Female", "complexion": "Fair",
  "religion": "Islam", "caste": "Syed", "castePreference": "...",
  "city": "Mumbai", "state": "Maharashtra", "homeTown": "Lucknow",
  "addressCity": "Mumbai", "addressArea": "Andheri West",
  "education": "MBA", "educationCity": "Mumbai", "occupation": "Product Manager",
  "income": "18 LPA", "height": "5'4\"",
  "about": "...",
  "image": "/uploads/...jpg",
  "images": ["/uploads/...jpg"],
  "interests": ["Reading"], "languagesKnown": ["Hindi", "English"],
  "fatherName": "...", "fatherOccupation": "...", "motherName": "...", "motherOccupation": "...",
  "totalSiblings": "2 Brothers, 1 Sister", "brotherEducation": "...", "sisterEducation": "...", "otherDetails": "...",
  "familyType": "Nuclear", "maritalStatus": "Never_Married", "motherTongue": "Urdu"
}
```
Private images are excluded from public listings.

### GET `/api/profiles/:id` — Public profile detail · **public**
`:id` may be the user id **or** the `profileNumber`. Returns `404` if not found or not published. Surname, email, phone, `currentAddress` and the contact numbers (`motherPhone`/`fatherPhone`/`otherPhone`/`coordinatorNumber`) are **private** and only returned to the owner (`/api/profiles/me/own`) or admins. Public shape:
```json
{
  "id": "uuid", "profileNumber": "Maher001", "userId": "uuid",
  "name": "Aisha", "firstName": "Aisha",
  "dateOfBirth": "...",
  "age": 28, "gender": "Female", "complexion": "Fair",
  "religion": "Islam", "caste": "Syed", "castePreference": "...",
  "city": "Mumbai", "state": "Maharashtra", "homeTown": "Lucknow",
  "addressCity": "Mumbai", "addressArea": "Andheri West",
  "education": "MBA", "educationCity": "Mumbai", "occupation": "Product Manager", "income": "18 LPA", "height": "5'4\"",
  "about": "...", "familyType": "Nuclear", "maritalStatus": "Never_Married",
  "motherTongue": "Urdu", "interests": ["Reading"], "languagesKnown": ["Hindi", "English"],
  "fatherName": "...", "fatherOccupation": "...", "motherName": "...", "motherOccupation": "...",
  "totalSiblings": "2 Brothers, 1 Sister", "brotherEducation": "...", "sisterEducation": "...", "otherDetails": "...",
  "isPublished": true, "isVerified": true,
  "image": "/uploads/...jpg",
  "images": [{ "id": "uuid", "url": "...", "isPrimary": true, "isPrivate": false, "sortOrder": 0 }],
  "createdAt": "...", "updatedAt": "..."
}
```

---

## 8. Profile image endpoints

A profile must exist first (`hasProfile = true`), max **5 images**.

**Storage:** uploads are validated in memory (JPEG/PNG/WebP, ≤ 5 MB), given a generated unique filename, and persisted through the configured **storage driver** (Hostinger FTP or local disk — see §2). The returned `url` is absolute when the FTP driver is active, relative (`/uploads/<file>`) when local.

There are **two groups** of routes:

- **Own profile** (`role = user`) — the caller manages **their own** images. The target is taken from the JWT, so these **do not work for admins** (an admin has no matrimony profile → `404 "Profile not found"`).
- **Specific user** (`role = admin`) — staff manage **another user's** images by passing that user's id in the path. These are **admin-only** (`403` for non-admins). Use this group from the admin panel's user-edit screen.

### 8a. Own profile — `/api/profiles/images` · **auth (user)**

#### POST `/api/profiles/images` — Upload image(s) to **own** profile
`multipart/form-data`, field name **`images`** (up to 5 files). Allowed: JPEG/PNG/WebP, ≤ 5 MB each. First image becomes primary if none exist. → array of created image records.

#### PATCH `/api/profiles/images/:id/primary` — Set primary image (own)
`:id` = the **image id**. → `{ "message": "Primary image updated" }`. Image not owned → `403`.

#### PATCH `/api/profiles/images/reorder` — Reorder images (own)

Body **must** be an object with a non-empty `images` array; each item requires the keys **`id`** (the image's `id`, a string — not the URL) and **`sortOrder`** (an integer ≥ 0):

```json
{
  "images": [
    { "id": "<imageId>", "sortOrder": 0 },
    { "id": "<imageId>", "sortOrder": 1 }
  ]
}
```

→ `{ "message": "Images reordered successfully" }`.

**Validation (strict):** the payload is fully validated, so a wrong shape returns `400` (not a silent no-op):

- Sending a bare array (`[ { ... } ]`) instead of `{ "images": [ ... ] }` → `400 "images must be an array"`.
- Wrong item keys (e.g. `imageId`/`order`) → `400` listing the offending fields (`...property imageId should not exist`, `id must be a string`, `sortOrder must be an integer number`).
- Empty array (`"images": []`) → `400 "images should not be empty"`.

Items whose `id` does not belong to the caller's profile are ignored (no error). Send the full ordered list of the profile's images for predictable results.

#### DELETE `/api/profiles/images/:id` — Delete image (own)
`:id` = the **image id**. → `{ "message": "Image deleted successfully" }`. Not owned → `403`.

### 8b. Specific user — `/api/profiles/images/:id/...` · **admin only**

For the admin panel managing a member's photos. In every route below, **`:id` = the target user id** (the member whose profile is being edited, e.g. from `/users/:id/edit`). All require an **admin** token (`403` otherwise). The target user must already have a profile (`hasProfile = true`, otherwise `404`).

#### POST `/api/profiles/images/:id` — Upload image(s) to the user's profile
`multipart/form-data`, field name **`images`**. Same JPEG/PNG/WebP + 5 MB validation, storage driver, unique filename, and 5-image cap as the own-profile upload. Exceeding 5 images → `400`. → array of created image records.

#### PATCH `/api/profiles/images/:id/reorder` — Reorder the user's images
Same body shape and validation as the own-profile reorder above. → `{ "message": "Images reordered successfully" }`.

#### PATCH `/api/profiles/images/:id/primary/:imageId` — Set the user's primary image
`:id` = user id, `:imageId` = image id. → `{ "message": "Primary image updated" }`. Image not on that user → `403`.

#### DELETE `/api/profiles/images/:id/:imageId` — Delete one of the user's images
`:id` = user id, `:imageId` = image id. → `{ "message": "Image deleted successfully" }`. Image not on that user → `403`.

---

## 9. Contact endpoints — `/api/contact`

### POST `/api/contact` — Submit inquiry · **public**
Body: `{ "name": "...", "email": "...", "subject": "...", "message": "..." }` (`message` 20–2000 chars). → `{ "message": "Inquiry submitted successfully", "id": "uuid" }`. Rate limited to 3/hour.

### GET `/api/contact` — List inquiries · **admin** (paginated)
### GET `/api/contact/:id` — Inquiry detail · **admin**
### PATCH `/api/contact/:id/read` — Mark as read · **admin** (sets `respondedAt`)
### DELETE `/api/contact/:id` — Delete inquiry · **admin**

---

## 10. Admin endpoints — `/api/admin/*` · **admin only**

All require a valid admin access token (`role = admin`).

### GET `/api/admin/dashboard` — Stats
```json
{
  "totalUsers": 120,
  "totalProfiles": 90,
  "verifiedProfiles": 40,
  "pendingVerification": 50,
  "totalInquiries": 12,
  "unreadInquiries": 3,
  "newUsersToday": 2,
  "newUsersThisWeek": 9,
  "genderBreakdown": { "Male": 45, "Female": 45 },
  "topCities": [{ "city": "Mumbai", "count": 20 }]
}
```

### GET `/api/admin/users` — List users · paginated
Each item: account fields + `profile` summary (`{ id, profileNumber, isPublished, isVerified }` or `null`).

### GET `/api/admin/users/:id` — User detail
Account fields (without `passwordHash`/`refreshToken`) + `profile` (full matrimony fields + `images`) or `null`.

### GET `/api/admin/users/bulk/template` — Download CSV import template
Returns a ready-to-fill CSV (`text/csv`, `Content-Disposition: attachment`) containing the header row and an example row. Use this as the starting point for a bulk import. The download button in the admin panel should hit this endpoint.

### POST `/api/admin/users/bulk` — Bulk create users/profiles from CSV
`multipart/form-data`, field name **`file`** (a single `.csv` file, ≤ 2 MB, max **500** data rows).

Each CSV row creates **one website user** (account). When matrimony fields are supplied, that user also becomes a **profile** (`hasProfile = true`, a `profileNumber` is assigned).

**Columns** (the header row must match these names; order does not matter):

| Column | Required | Notes |
|--------|----------|-------|
| `firstName` | ✅ | |
| `lastName` | ✅ | |
| `email` | ✅ | must be unique |
| `phone` | ✅ | Indian 10-digit `^[6-9]\d{9}$`, unique |
| `gender` | ✅ | `Male` \| `Female` |
| `dateOfBirth` | ✅ | `YYYY-MM-DD`, user must be ≥ 18 |
| `password` | ⛔ optional | ≥ 8 chars with upper/lower/number. **If left blank, a secure password is generated and returned in the response** |
| `age` | — | **not a column** — it is auto-computed from `dateOfBirth` |
| `religion`, `caste`, `city`, `state`, `education`, `occupation`, `income`, `height`, `about`, `motherTongue` | ⛔ optional | free text. Supplying any profile field makes the row a profile |
| `complexion`, `homeTown`, `educationCity`, `castePreference` | ⛔ optional | free text |
| `addressCity`, `addressArea` | ⛔ optional | free text (public) |
| `currentAddress` | ⛔ optional | 🔒 private (complete address) |
| `motherPhone`, `fatherPhone`, `otherPhone`, `coordinatorNumber` | ⛔ optional | 🔒 private contact numbers |
| `fatherName`, `fatherOccupation`, `motherName`, `motherOccupation`, `totalSiblings`, `brotherEducation`, `sisterEducation`, `otherDetails` | ⛔ optional | family details (public) |
| `familyType` | ⛔ optional | `Nuclear` \| `Joint` |
| `maritalStatus` | ⛔ optional | `Never_Married` \| `Divorced` \| `Widowed` |
| `interests` | ⛔ optional | separate items with `\|` or `;` (e.g. `Traveling\|Reading`), max 10 |
| `languagesKnown` | ⛔ optional | separate items with `\|` or `;` (e.g. `Hindi\|English`), max 10 |
| `isPublished` | ⛔ optional | `true`/`1`/`yes` to publish the profile on the public site |
| `isVerified` | ⛔ optional | `true`/`1`/`yes` to mark the account email-verified |

CSV notes: values containing commas, quotes, or newlines must be wrapped in double quotes (`"..."`); escape a literal `"` by doubling it (`""`). A UTF-8 BOM is tolerated.

**Per-row processing:** rows are validated and inserted independently — one bad row does **not** abort the import. Each row is reported back as either created or failed (with the reason). Logs a single `bulk_create_users` activity entry.

Response `201`:
```json
{
  "total": 3,
  "created": 2,
  "failed": 1,
  "createdUsers": [
    {
      "row": 2,
      "id": "uuid",
      "email": "priya@example.com",
      "profileNumber": "Maher010",
      "generatedPassword": null
    },
    {
      "row": 3,
      "id": "uuid",
      "email": "arjun@example.com",
      "profileNumber": "Maher011",
      "generatedPassword": "Kp7tRm2xQ9"
    }
  ],
  "errors": [
    { "row": 4, "email": "dup@example.com", "message": "Email already registered" }
  ]
}
```
- `row` is the 1-based line number in the CSV (the header is row 1, so the first data row is `2`).
- `generatedPassword` is non-null only when the `password` column was left blank — surface it in the admin UI so staff can share the credentials.
- Whole-file errors (no file, empty file, no data rows, > 500 rows, non-CSV file) return `400`.

### PATCH `/api/admin/users/:id/block` — Block / unblock
Toggles `isActive`, clears refresh token. → `{ "message": "User blocked/unblocked successfully" }`.

### DELETE `/api/admin/users/:id` — Delete user
Deletes the user and their images. → `{ "message": "User deleted successfully" }`.

### GET `/api/admin/profiles` — List all profiles (incl. unpublished) · paginated
Same filter params as the public list. Returns full user/profile rows (without secrets) + a representative image. Only `hasProfile = true` rows.

### GET `/api/admin/profiles/:id` — Profile detail
`:id` = user id or `profileNumber`. Returns profile fields + `images`.

### GET `/api/admin/profiles/:id/completion` — Completion summary
Same section breakdown as the user-facing completion endpoint.

### PATCH `/api/admin/profiles/:id` — Admin edit profile
Body: subset of `CreateProfileDto`. Logs `update_profile`. → updated row.

### PATCH `/api/admin/profiles/:id/verify` — Toggle profile verified badge
Toggles `isProfileVerified`. → `{ "message": "Profile verified/unverified successfully" }`.

### PATCH `/api/admin/profiles/:id/publish` — Toggle published
Toggles `isPublished`. → `{ "message": "Profile published/unpublished successfully" }`.

### DELETE `/api/admin/profiles/:id` — Delete a profile
`:id` = user id or `profileNumber`. Clears all matrimony fields, deletes the profile's images, and resets `hasProfile`/`isPublished`/`isProfileVerified` to `false` and `profileNumber` to `null`. **The login account is kept** (the user can create a fresh profile later) — to remove the account entirely use `DELETE /api/admin/users/:id`. `404` if the user has no profile. Logs `delete_profile`. → `{ "message": "Profile deleted successfully" }`.

### PATCH `/api/admin/profiles/images/:id/private` — Toggle image privacy
Toggles `isPrivate` on an image (hides/shows it on the public site). → `{ "message": "Image marked private/made public successfully" }`.

### GET `/api/admin/logs` — Activity logs · paginated
Each log: `{ ...log, admin: { id, firstName, lastName, email } }`.

---

## 11. Website functionality map

| Feature | Endpoint(s) |
|---------|-------------|
| Register | `POST /api/auth/signup` |
| Login / logout | `POST /api/auth/login`, `POST /api/auth/logout` |
| Token refresh | `POST /api/auth/refresh` |
| Verify email/phone | `POST /api/auth/verify-email`, `/verify-phone`, `/resend-otp` |
| Forgot / reset password | `POST /api/auth/forgot-password`, `/reset-password` |
| Account info & settings | `GET/PATCH /api/users/me`, `PATCH /api/users/me/password`, `DELETE /api/users/me` |
| Create / edit my profile | `POST /api/profiles`, `PUT /api/profiles/me`, `PATCH /api/profiles/me`, `DELETE /api/profiles/me` |
| My profile + completion | `GET /api/profiles/me/own`, `GET /api/profiles/me/completion` |
| Manage my photos | `POST/PATCH/DELETE /api/profiles/images...` |
| Upload photos to a member (staff tooling) | `POST /api/profiles/images/:id` |
| Browse / search profiles | `GET /api/profiles` |
| View a profile | `GET /api/profiles/:id` |
| Contact us | `POST /api/contact` |

## 12. Admin panel functionality map

| Feature | Endpoint(s) |
|---------|-------------|
| Admin login | `POST /api/auth/admin/login` |
| Admin forgot / reset password (OTP) | `POST /api/auth/admin/forgot-password`, `/admin/reset-password` |
| Dashboard / stats | `GET /api/admin/dashboard` |
| Users list & detail | `GET /api/admin/users`, `GET /api/admin/users/:id` |
| Block / delete users | `PATCH /api/admin/users/:id/block`, `DELETE /api/admin/users/:id` |
| Bulk import profiles (CSV) | `GET /api/admin/users/bulk/template`, `POST /api/admin/users/bulk` |
| Profiles list & detail | `GET /api/admin/profiles`, `GET /api/admin/profiles/:id`, `/completion` |
| Edit / verify / publish profiles | `PATCH /api/admin/profiles/:id`, `/verify`, `/publish` |
| Delete a profile (keep account) | `DELETE /api/admin/profiles/:id` |
| Image moderation | `PATCH /api/admin/profiles/images/:id/private` |
| Upload photos for a member | `POST /api/profiles/images/:id` (lock to admin in the gateway/UI) |
| Inquiries | `GET /api/contact`, `GET /api/contact/:id`, `PATCH /api/contact/:id/read`, `DELETE /api/contact/:id` |
| Activity logs | `GET /api/admin/logs` |

---

## 13. Frontend integration notes

- **Two login flows:** the website calls `/api/auth/login`; the admin panel calls `/api/auth/admin/login`. Both return `{ accessToken, refreshToken, user }` — store both tokens and the `role`.
- **Token lifecycle:** access token expires in **15 min**, refresh token in **7 days**. On `401`, call `/api/auth/refresh` with the stored refresh token, then retry.
- **Auth header:** `Authorization: Bearer <accessToken>` on every protected request.
- **Images:** image `url` values are relative (`/uploads/...`). Prefix with the API origin to render.
- **Profile identifiers:** public profile routes accept either the user `id` or the `profileNumber` (e.g. `Maher001`) — handy for shareable URLs.
- **Validation:** do not send fields outside the documented DTOs — the API rejects unknown fields with `400`.
- **Swagger:** live, interactive schema at `GET /api/docs`.
