# Jnanagni API Documentation

## Overview
This document provides comprehensive documentation for all API routes with their request and response structures. The API is built with Express.js and uses JWT authentication for protected routes.

**Base URL:** `http://localhost:PORT/api/v1`

---

## Table of Contents
1. [Authentication API](#authentication-api)
2. [User API](#user-api)
3. [Event API](#event-api)
4. [Admin API](#admin-api)
5. [Query API](#query-api)
6. [Volunteer Request API](#volunteer-request-api)

---

## Authentication API

### Base Path: `/auth`

#### 1. Register User
- **Endpoint:** `POST /auth/register`
- **Authentication:** None (Public)
- **Description:** Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "contactNo": "9876543210",
  "whatsappNo": "9876543210",
  "college": "GKV",
  "branch": "CSE",
  "campus": "Haridwar",
  "role": "student",
  "adminSecret": "optional_admin_secret"
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "jnanagniId": "JGN26-A1B2"
  },
  "message": "Registration successful. Please check your email to verify account."
}
```

**Error Responses:**
- `400 Bad Request` - User already exists with this email
- `500 Internal Server Error` - Failed to send verification email

---

#### 2. Login
- **Endpoint:** `POST /auth/login`
- **Authentication:** None (Public)
- **Description:** Login user and get authentication token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "role": "student",
      "specialRoles": ["None"],
      "paymentStatus": "verified",
      "isVerified": true,
      "college": "GKV",
      "branch": "CSE",
      "campus": "Haridwar"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid credentials
- `404 Not Found` - User not found

---

#### 3. Verify Email
- **Endpoint:** `POST /auth/verify-email`
- **Authentication:** None (Public)
- **Description:** Verify user email with token from verification link

**Request Body:**
```json
{
  "jnanagniId": "JGN26-A1B2",
  "token": "verification_token_from_email"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Email verified successfully!"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired verification link

---

#### 4. Resend Verification Email
- **Endpoint:** `POST /auth/resend-verification`
- **Authentication:** None (Public)
- **Description:** Resend verification email to user

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

OR

```json
{
  "jnanagniId": "JGN26-A1B2"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Verification link resent successfully"
}
```

**Error Responses:**
- `404 Not Found` - User not found
- `400 Bad Request` - User already verified

---

#### 5. Forgot Password
- **Endpoint:** `POST /auth/forgot-password`
- **Authentication:** None (Public)
- **Description:** Request password reset email

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password reset link sent to your email"
}
```

---

#### 6. Reset Password
- **Endpoint:** `POST /auth/reset-password`
- **Authentication:** None (Public)
- **Description:** Reset password using token from reset email

**Request Body:**
```json
{
  "jnanagniId": "JGN26-A1B2",
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password reset successfully"
}
```

---

#### 7. Get Current User
- **Endpoint:** `GET /auth/me`
- **Authentication:** Required (Bearer Token)
- **Description:** Get current authenticated user details

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "jnanagniId": "JGN26-A1B2",
    "role": "student",
    "specialRoles": ["None"],
    "paymentStatus": "verified",
    "isVerified": true,
    "college": "GKV",
    "branch": "CSE",
    "campus": "Haridwar"
  },
  "message": "User details fetched successfully"
}
```

---

## User API

### Base Path: `/users`

#### 1. Get User by Jnanagni ID (Scanner)
- **Endpoint:** `GET /users/scan/:jnanagniId`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `event_coordinator`, `volunteer`, `category_lead`
- **Description:** Scan and fetch user details by Jnanagni ID (used at event entry desks)

**URL Parameters:**
- `jnanagniId` (string) - User's Jnanagni ID (e.g., JGN26-A1B2)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "jnanagniId": "JGN26-A1B2",
    "role": "student",
    "specialRoles": ["None"],
    "paymentStatus": "verified",
    "college": "GKV",
    "branch": "CSE",
    "campus": "Haridwar"
  },
  "message": "User details fetched successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Jnanagni ID is required
- `404 Not Found` - User not found

---

#### 2. Verify Payment Status
- **Endpoint:** `GET /users/payment-status/:jnanagniId`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `finance_team`, `event_coordinator`, `volunteer`
- **Description:** Check payment status of a user

**URL Parameters:**
- `jnanagniId` (string) - User's Jnanagni ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "jnanagniId": "JGN26-A1B2",
    "name": "John Doe",
    "email": "john@example.com",
    "paymentStatus": "verified"
  },
  "message": "Payment status fetched successfully"
}
```

---

#### 3. Get User by ID
- **Endpoint:** `GET /users/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `event_coordinator`
- **Description:** Get user details by database ID

**URL Parameters:**
- `id` (string) - User's database ID (MongoDB ObjectID)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "jnanagniId": "JGN26-A1B2",
    "role": "student",
    "specialRoles": ["None"],
    "paymentStatus": "verified"
  },
  "message": "User details fetched successfully"
}
```

---

#### 4. Get All Users (Paginated)
- **Endpoint:** `GET /users/all/users`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Get all users with pagination

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Results per page (default: 10)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "jnanagniId": "JGN26-A1B2",
        "role": "student",
        "paymentStatus": "verified"
      }
    ],
    "pagination": {
      "totalDocs": 150,
      "totalPages": 15,
      "currentPage": 1,
      "limit": 10
    }
  },
  "message": "All users fetched successfully"
}
```

---

#### 5. Get Unverified Users
- **Endpoint:** `GET /users/all/unverified`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Get users with unverified emails

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "isVerified": false
    }
  ],
  "message": "Unverified users fetched successfully"
}
```

---

#### 6. Get Users by Role
- **Endpoint:** `GET /users/role/:role`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Filter users by primary role

**URL Parameters:**
- `role` (string) - User role (student, fetian, gkvian, faculty)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  ],
  "message": "Users fetched by role successfully"
}
```

---

#### 7. Get Unverified Payments
- **Endpoint:** `GET /users/payments/pending`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `finance_team`
- **Description:** Get users with pending/unverified payments

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "paymentStatus": "pending"
    }
  ],
  "message": "Unverified payments fetched successfully"
}
```

---

#### 8. Verify User Payment
- **Endpoint:** `PUT /users/payments/verify/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `finance_team`
- **Description:** Mark a user's payment as verified

**URL Parameters:**
- `id` (string) - User's database ID

**Request Body:**
```json
{
  "paymentStatus": "verified"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "paymentStatus": "verified"
  },
  "message": "Payment verified successfully"
}
```

---

#### 9. Change User Role
- **Endpoint:** `PUT /users/:id/role`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Update user's primary and special roles

**URL Parameters:**
- `id` (string) - User's database ID

**Request Body:**
```json
{
  "role": "student",
  "specialRoles": ["event_coordinator", "volunteer"]
}
```

**Valid Roles:**
- **Primary Roles:** student, gkvian, fetian, faculty
- **Special Roles:** event_coordinator, volunteer, category_lead, admin, finance_team, None

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "role": "student",
    "specialRoles": ["event_coordinator"]
  },
  "message": "User role updated successfully"
}
```

---

#### 10. Delete User
- **Endpoint:** `DELETE /users/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Delete a user account

**URL Parameters:**
- `id` (string) - User's database ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User deleted successfully"
}
```

---

## Event API

### Base Path: `/events`

#### 1. Get All Event Categories
- **Endpoint:** `GET /events/categories`
- **Authentication:** None (Public)
- **Description:** Get all event categories

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Web Development",
      "description": "Web development competition",
      "slug": "web-development",
      "banner": "/uploads/images/banner.jpg",
      "lead": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Category Lead",
        "email": "lead@example.com"
      }
    }
  ],
  "message": "Event categories fetched successfully"
}
```

---

#### 2. Get Event Category by ID
- **Endpoint:** `GET /events/categories/:id`
- **Authentication:** None (Public)
- **Description:** Get specific event category details

**URL Parameters:**
- `id` (string) - Category ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Web Development",
    "description": "Web development competition",
    "slug": "web-development",
    "lead": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Category Lead"
    }
  },
  "message": "Event category fetched successfully"
}
```

---

#### 3. Get All Events
- **Endpoint:** `GET /events/`
- **Authentication:** None (Public)
- **Description:** Get all events with optional filters

**Query Parameters:**
- `page` (integer, optional) - Page number
- `limit` (integer, optional) - Results per page
- `category` (string, optional) - Filter by category ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Code Sprint 2025",
      "slug": "code-sprint-2025",
      "description": "24-hour coding competition",
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Web Development"
      },
      "participationType": "group",
      "maxTeamSize": 4,
      "minTeamSize": 1,
      "maxRegistrations": 50,
      "isRegistrationOpen": true,
      "eventDate": "2025-02-15",
      "eventTime": "10:00",
      "eventVenue": "Auditorium Hall",
      "poster": "/uploads/images/poster.jpg"
    }
  ],
  "message": "Events fetched successfully"
}
```

---

#### 4. Get Event by ID
- **Endpoint:** `GET /events/find/:id`
- **Authentication:** None (Public)
- **Description:** Get specific event details

**URL Parameters:**
- `id` (string) - Event ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Code Sprint 2025",
    "description": "24-hour coding competition",
    "category": "507f1f77bcf86cd799439011",
    "participationType": "group",
    "maxTeamSize": 4,
    "minTeamSize": 1,
    "maxRegistrations": 50,
    "isRegistrationOpen": true,
    "eventDate": "2025-02-15",
    "eventVenue": "Auditorium Hall"
  },
  "message": "Event details fetched successfully"
}
```

---

#### 5. Get Event by Slug
- **Endpoint:** `GET /events/slug/:slug`
- **Authentication:** None (Public)
- **Description:** Get event by URL-friendly slug

**URL Parameters:**
- `slug` (string) - Event slug (e.g., code-sprint-2025)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Code Sprint 2025",
    "slug": "code-sprint-2025",
    "description": "24-hour coding competition"
  },
  "message": "Event fetched successfully"
}
```

---

#### 6. Get Events by Category
- **Endpoint:** `GET /events/category/:categoryId`
- **Authentication:** None (Public)
- **Description:** Get all events in a specific category

**URL Parameters:**
- `categoryId` (string) - Category ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Code Sprint 2025",
      "category": "507f1f77bcf86cd799439011"
    }
  ],
  "message": "Events by category fetched successfully"
}
```

---

#### 7. Register for Event
- **Endpoint:** `POST /events/register`
- **Authentication:** Required (Bearer Token)
- **Description:** Register for an event (solo or as team leader)

**Request Body (FormData or JSON):**
```json
{
  "eventId": "507f1f77bcf86cd799439020",
  "teamName": "Team Alpha",
  "submissionData": {
    "githubLink": "https://github.com/user/project",
    "ideaDescription": "Our project idea"
  }
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "registeredBy": "507f1f77bcf86cd799439011",
  "event": "507f1f77bcf86cd799439020",
  "teamName": "Team Alpha",
  "teamMembers": [],
  "status": "active",
  "submissionData": {
    "githubLink": "https://github.com/user/project"
  },
  "createdAt": "2025-01-14T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Event not found, registration closed, or user already registered
- `403 Forbidden` - Payment not verified

---

#### 8. Get User's Registrations
- **Endpoint:** `GET /events/registrations/me/:userId`
- **Authentication:** Required (Bearer Token)
- **Description:** Get all event registrations for current user

**URL Parameters:**
- `userId` (string) - User's database ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "teamName": "Team Alpha",
      "event": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Code Sprint 2025"
      },
      "status": "active",
      "teamMembers": []
    }
  ],
  "message": "User registrations fetched successfully"
}
```

---

#### 9. Get Registration by ID
- **Endpoint:** `GET /events/registrations/:id`
- **Authentication:** Required (Bearer Token)
- **Description:** Get specific registration details

**URL Parameters:**
- `id` (string) - Registration ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "teamName": "Team Alpha",
    "registeredBy": "507f1f77bcf86cd799439011",
    "event": "507f1f77bcf86cd799439020",
    "teamMembers": [
      {
        "user": "507f1f77bcf86cd799439012",
        "status": "accepted"
      }
    ],
    "status": "active"
  },
  "message": "Registration fetched successfully"
}
```

---

#### 10. Invite Team Member
- **Endpoint:** `POST /events/team/:registrationId/invite`
- **Authentication:** Required (Bearer Token)
- **Description:** Send team invite to another user (team leader only)

**URL Parameters:**
- `registrationId` (string) - Registration ID

**Request Body:**
```json
{
  "memberId": "507f1f77bcf86cd799439012"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "teamMembers": [
      {
        "user": "507f1f77bcf86cd799439012",
        "status": "pending"
      }
    ]
  },
  "message": "Invitation sent successfully"
}
```

---

#### 11. Respond to Team Invite
- **Endpoint:** `POST /events/team/:registrationId/respond`
- **Authentication:** Required (Bearer Token)
- **Description:** Accept or reject team invite

**URL Parameters:**
- `registrationId` (string) - Registration ID

**Request Body:**
```json
{
  "action": "accept"
}
```

**Valid Actions:** `accept`, `reject`

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "teamMembers": [
      {
        "user": "507f1f77bcf86cd799439012",
        "status": "accepted"
      }
    ]
  },
  "message": "Invite response recorded"
}
```

---

#### 12. Remove Team Member
- **Endpoint:** `DELETE /events/team/:registrationId/remove/:memberId`
- **Authentication:** Required (Bearer Token)
- **Description:** Remove member from team (team leader only)

**URL Parameters:**
- `registrationId` (string) - Registration ID
- `memberId` (string) - Team member's user ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "teamMembers": []
  },
  "message": "Team member removed successfully"
}
```

---

#### 13. Get My Invites
- **Endpoint:** `GET /events/my-invites`
- **Authentication:** Required (Bearer Token)
- **Description:** Get all pending team invites for current user

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "teamName": "Team Alpha",
      "registeredBy": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Team Leader"
      },
      "event": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Code Sprint 2025"
      }
    }
  ],
  "message": "Invites fetched successfully"
}
```

---

#### 14. Delete Registration
- **Endpoint:** `DELETE /events/registrations/:id`
- **Authentication:** Required (Bearer Token)
- **Description:** Cancel/dissolve team registration

**URL Parameters:**
- `id` (string) - Registration ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Registration deleted successfully"
}
```

---

#### 15. Update Registration Submission
- **Endpoint:** `PUT /events/registrations/:id/submission`
- **Authentication:** Required (Bearer Token)
- **Description:** Update submission data (e.g., adding github link later)

**URL Parameters:**
- `id` (string) - Registration ID

**Request Body:**
```json
{
  "submissionData": {
    "githubLink": "https://github.com/user/project",
    "description": "Updated description"
  }
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "submissionData": {
      "githubLink": "https://github.com/user/project"
    }
  },
  "message": "Submission updated successfully"
}
```

---

#### 16. Submit Volunteer Request
- **Endpoint:** `POST /events/:eventId/volunteer-requests`
- **Authentication:** Required (Bearer Token)
- **Description:** Apply to volunteer for an event

**URL Parameters:**
- `eventId` (string) - Event ID

**Request Body (FormData with optional file):**
```json
{
  "motivation": "I want to help and learn from the event",
  "availability": "All days",
  "skills": "Event management, coordination"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439040",
  "user": "507f1f77bcf86cd799439011",
  "event": "507f1f77bcf86cd799439020",
  "motivation": "I want to help and learn",
  "availability": "All days",
  "status": "pending",
  "createdAt": "2025-01-14T10:30:00Z"
}
```

---

#### 17. Get My Volunteer Requests
- **Endpoint:** `GET /events/my-volunteer-requests`
- **Authentication:** Required (Bearer Token)
- **Description:** Get all volunteer requests submitted by current user

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "event": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Code Sprint 2025"
      },
      "status": "pending",
      "motivation": "I want to help"
    }
  ],
  "message": "Volunteer requests fetched successfully"
}
```

---

## Admin API

### Base Path: `/admin` (Protected with `protect` middleware)

#### 1. Get Dashboard Stats
- **Endpoint:** `GET /admin/stats/overview`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `finance_team`
- **Description:** Get dashboard statistics overview

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "totalUsers": 250,
    "totalEvents": 15,
    "totalRegistrations": 450,
    "pendingPayments": 45
  },
  "message": "Dashboard stats fetched successfully"
}
```

---

#### 2. Get Analytics Data
- **Endpoint:** `GET /admin/stats/analytics`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Get detailed analytics for charts and reports

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "userGrowth": [
      {
        "_id": "2025-01",
        "count": 50
      },
      {
        "_id": "2025-02",
        "count": 75
      }
    ],
    "registrationsByCategory": [
      {
        "_id": "Web Development",
        "count": 120
      },
      {
        "_id": "Mobile Development",
        "count": 100
      }
    ],
    "paymentStats": [
      {
        "_id": "verified",
        "count": 205
      },
      {
        "_id": "pending",
        "count": 45
      }
    ],
    "collegeStats": [
      {
        "_id": "GKV",
        "count": 150
      }
    ]
  },
  "message": "Analytics data fetched successfully"
}
```

---

#### 3. Admin Verify User Email
- **Endpoint:** `POST /admin/users/verify-email`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Admin can manually verify a user's email

**Request Body:**
```json
{
  "jnanagniId": "JGN26-A1B2"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "jnanagniId": "JGN26-A1B2",
    "isVerified": true
  },
  "message": "User email verified by admin"
}
```

---

#### 4. Create Event Category
- **Endpoint:** `POST /admin/categories`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`
- **Description:** Create a new event category

**Request Body (FormData with optional banner file):**
```json
{
  "name": "Web Development",
  "description": "Web development competitions",
  "leaduserId": "507f1f77bcf86cd799439012"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Web Development",
  "description": "Web development competitions",
  "slug": "web-development",
  "lead": "507f1f77bcf86cd799439012",
  "banner": "/uploads/images/banner.jpg"
}
```

---

#### 5. Update Event Category
- **Endpoint:** `PUT /admin/categories/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`
- **Ownership Check:** Category lead can only update their own categories
- **Description:** Update event category

**URL Parameters:**
- `id` (string) - Category ID

**Request Body (FormData with optional banner file):**
```json
{
  "name": "Web Development 2025",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Web Development 2025",
  "description": "Updated description"
}
```

---

#### 6. Delete Event Category
- **Endpoint:** `DELETE /admin/categories/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Delete an event category

**URL Parameters:**
- `id` (string) - Category ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Event category deleted successfully"
}
```

---

#### 7. Create Event
- **Endpoint:** `POST /admin/events`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`
- **Ownership Check:** Category lead must own the category
- **Description:** Create a new event

**Request Body (FormData with poster and ruleset files):**
```json
{
  "name": "Code Sprint 2025",
  "description": "24-hour coding competition",
  "categoryId": "507f1f77bcf86cd799439011",
  "participationType": "group",
  "maxTeamSize": 4,
  "minTeamSize": 1,
  "maxRegistrations": 50,
  "eventDate": "2025-02-15",
  "eventTime": "10:00",
  "eventVenue": "Auditorium Hall",
  "rules": "1. No plagiarism\n2. Original code only"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Code Sprint 2025",
  "slug": "code-sprint-2025",
  "description": "24-hour coding competition",
  "category": "507f1f77bcf86cd799439011",
  "participationType": "group",
  "maxTeamSize": 4,
  "isRegistrationOpen": true,
  "poster": "/uploads/images/poster.jpg"
}
```

---

#### 8. Update Event
- **Endpoint:** `PUT /admin/events/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`
- **Ownership Check:** Coordinators/leads can only update their own events
- **Description:** Update event details

**URL Parameters:**
- `id` (string) - Event ID

**Request Body (FormData with optional poster and ruleset):**
```json
{
  "name": "Code Sprint 2025 - Final",
  "maxRegistrations": 60,
  "isRegistrationOpen": false
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Code Sprint 2025 - Final",
  "maxRegistrations": 60,
  "isRegistrationOpen": false
}
```

---

#### 9. Delete Event
- **Endpoint:** `DELETE /admin/events/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`
- **Ownership Check:** Lead can delete events in their category
- **Description:** Delete an event

**URL Parameters:**
- `id` (string) - Event ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Event deleted successfully"
}
```

---

#### 10. Add Event Coordinator
- **Endpoint:** `POST /admin/events/:id/coordinator`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`
- **Ownership Check:** Only category lead can add coordinators
- **Description:** Assign a coordinator to an event

**URL Parameters:**
- `id` (string) - Event ID

**Request Body:**
```json
{
  "coordinatorId": "507f1f77bcf86cd799439012"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "coordinators": ["507f1f77bcf86cd799439012"]
}
```

---

#### 11. Add Event Volunteer
- **Endpoint:** `POST /admin/events/:id/volunteer`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`
- **Ownership Check:** Must have authority over the event
- **Description:** Assign a volunteer to an event

**URL Parameters:**
- `id` (string) - Event ID

**Request Body:**
```json
{
  "volunteerId": "507f1f77bcf86cd799439013"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "volunteers": ["507f1f77bcf86cd799439013"]
}
```

---

#### 12. Get Event Registrations
- **Endpoint:** `GET /admin/events/:eventId/registrations`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`, `volunteer`
- **Ownership Check:** Can only view registrations for assigned events
- **Description:** Get all registrations for an event

**URL Parameters:**
- `eventId` (string) - Event ID

**Query Parameters:**
- `status` (string, optional) - Filter by status (active, completed, rejected)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "teamName": "Team Alpha",
      "registeredBy": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Team Leader"
      },
      "teamMembers": [],
      "status": "active"
    }
  ],
  "message": "Event registrations fetched successfully"
}
```

---

#### 13. Update Registration Status
- **Endpoint:** `PUT /admin/registrations/:id/status`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`
- **Description:** Update registration status (mark completed, rejected, etc.)

**URL Parameters:**
- `id` (string) - Registration ID

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Statuses:** `active`, `completed`, `rejected`

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "status": "completed"
}
```

---

#### 14. Delete Registration
- **Endpoint:** `DELETE /admin/registrations/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Force delete a registration

**URL Parameters:**
- `id` (string) - Registration ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Registration deleted successfully"
}
```

---

#### 15. Get My Categories (Category Lead)
- **Endpoint:** `GET /admin/my-categories`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`
- **Description:** Get categories managed by the lead

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Web Development",
      "lead": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Category Lead"
      }
    }
  ],
  "message": "Categories fetched successfully"
}
```

---

#### 16. Get My Events (Coordinator/Lead)
- **Endpoint:** `GET /admin/my-events`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`
- **Description:** Get events assigned to the coordinator/lead

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Code Sprint 2025",
      "coordinators": ["507f1f77bcf86cd799439012"]
    }
  ],
  "message": "Events fetched successfully"
}
```

---

#### 17. Get My Registrations (Volunteer/Staff)
- **Endpoint:** `GET /admin/my-registrations`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `volunteer`, `event_coordinator`, `category_lead`
- **Description:** Get registrations for events where user is assigned staff

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "teamName": "Team Alpha",
      "event": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Code Sprint 2025"
      }
    }
  ],
  "message": "Registrations fetched successfully"
}
```

---

#### 18. Get Volunteer Requests for Event
- **Endpoint:** `GET /admin/events/:eventId/volunteer-requests`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`
- **Ownership Check:** Can only view for assigned events
- **Description:** Get all volunteer requests for an event

**URL Parameters:**
- `eventId` (string) - Event ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Volunteer Name",
        "email": "volunteer@example.com"
      },
      "motivation": "I want to help organize",
      "status": "pending"
    }
  ],
  "message": "Volunteer requests fetched successfully"
}
```

---

#### 19. Update Volunteer Request Status
- **Endpoint:** `PUT /admin/volunteer-requests/:id/status`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`
- **Description:** Approve or reject volunteer request

**URL Parameters:**
- `id` (string) - Volunteer request ID

**Request Body:**
```json
{
  "status": "approved"
}
```

**Valid Statuses:** `pending`, `approved`, `rejected`

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439040",
  "status": "approved"
}
```

---

#### 20. Get All Registrations (Finance Team)
- **Endpoint:** `GET /admin/registrations`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `finance_team`
- **Description:** Get all registrations across all events

**Query Parameters:**
- `page` (integer, optional) - Page number
- `limit` (integer, optional) - Results per page

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "registrations": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "teamName": "Team Alpha",
        "event": "507f1f77bcf86cd799439020"
      }
    ],
    "pagination": {
      "totalDocs": 450,
      "totalPages": 45,
      "currentPage": 1
    }
  },
  "message": "All registrations fetched successfully"
}
```

---

## Query/Support API

### Base Path: `/queries`

#### 1. Create Query
- **Endpoint:** `POST /queries/create`
- **Authentication:** None (Public)
- **Description:** Submit a support query or feedback

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Registration Issue",
  "message": "I'm unable to register for the event",
  "queryType": "technical_support"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439050",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Registration Issue",
  "status": "open",
  "createdAt": "2025-01-14T10:30:00Z"
}
```

---

#### 2. Get All Queries
- **Endpoint:** `GET /queries/`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Get all support queries

**Query Parameters:**
- `status` (string, optional) - Filter by status (open, resolved, closed)
- `page` (integer, optional) - Page number

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Registration Issue",
      "status": "open",
      "createdAt": "2025-01-14T10:30:00Z"
    }
  ],
  "message": "Queries fetched successfully"
}
```

---

#### 3. Get Query by ID
- **Endpoint:** `GET /queries/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Get specific query details

**URL Parameters:**
- `id` (string) - Query ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Registration Issue",
    "message": "I'm unable to register for the event",
    "status": "open",
    "createdAt": "2025-01-14T10:30:00Z"
  },
  "message": "Query fetched successfully"
}
```

---

#### 4. Mark Query as Resolved
- **Endpoint:** `PATCH /queries/:id/resolve`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Mark a query as resolved

**URL Parameters:**
- `id` (string) - Query ID

**Request Body:**
```json
{
  "adminResponse": "Your issue has been resolved. Please check your email for confirmation."
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "status": "resolved",
    "adminResponse": "Your issue has been resolved..."
  },
  "message": "Query marked as resolved"
}
```

---

#### 5. Delete Query
- **Endpoint:** `DELETE /queries/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`
- **Description:** Delete a query

**URL Parameters:**
- `id` (string) - Query ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Query deleted successfully"
}
```

---

## Volunteer Request API

### Base Path: `/volunteer-requests`

#### 1. Submit Volunteer Request
- **Endpoint:** `POST /volunteer-requests/submit/:eventId`
- **Authentication:** Required (Bearer Token)
- **Description:** Student submits volunteer request for an event

**URL Parameters:**
- `eventId` (string) - Event ID

**Request Body (FormData with optional file):**
```json
{
  "motivation": "I'm passionate about organizing events",
  "availability": "Weekends and evenings",
  "skills": "Event management, communication, problem-solving"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439040",
  "user": "507f1f77bcf86cd799439011",
  "event": "507f1f77bcf86cd799439020",
  "motivation": "I'm passionate about organizing events",
  "availability": "Weekends and evenings",
  "skills": "Event management, communication",
  "status": "pending",
  "createdAt": "2025-01-14T10:30:00Z"
}
```

---

#### 2. Get Volunteer Requests for Event
- **Endpoint:** `GET /volunteer-requests/event/:eventId`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`, `volunteer`
- **Ownership Check:** Can only view for assigned events
- **Description:** Get all volunteer requests for an event

**URL Parameters:**
- `eventId` (string) - Event ID

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Volunteer Name",
        "email": "volunteer@example.com",
        "jnanagniId": "JGN26-A1B2"
      },
      "motivation": "I want to help",
      "status": "pending"
    }
  ],
  "message": "Volunteer requests fetched successfully"
}
```

---

#### 3. Update Volunteer Request Status
- **Endpoint:** `PUT /volunteer-requests/:id`
- **Authentication:** Required (Bearer Token)
- **Authorization:** `admin`, `category_lead`, `event_coordinator`, `volunteer`
- **Ownership Check:** Must have event staff access
- **Description:** Approve or reject volunteer request

**URL Parameters:**
- `id` (string) - Volunteer request ID

**Request Body:**
```json
{
  "status": "approved"
}
```

**Valid Statuses:** `pending`, `approved`, `rejected`

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439040",
  "status": "approved",
  "message": "Volunteer request status updated"
}
```

---

#### 4. Get My Volunteer Requests
- **Endpoint:** `GET /volunteer-requests/my-requests`
- **Authentication:** Required (Bearer Token)
- **Description:** Get all volunteer requests submitted by current user

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "event": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Code Sprint 2025"
      },
      "status": "pending",
      "motivation": "I want to help organize"
    }
  ],
  "message": "My volunteer requests fetched successfully"
}
```

---

## Authentication & Error Handling

### Authentication Header
All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Standard Response Format
All API responses follow this format:

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have required authorization
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Authorization Levels
- **Admin:** Full access to all admin endpoints
- **Category Lead:** Manage event categories and events within their category
- **Event Coordinator:** Manage event registrations and volunteers for assigned events
- **Finance Team:** Manage payments and financial data
- **Volunteer:** View and manage event registrations for events they're assigned to
- **Student:** Register for events and submit volunteer requests

---

## File Uploads

Several endpoints support file uploads via FormData:

### Supported Endpoints:
1. **Event Creation/Update:** poster and ruleset files
2. **Category Creation/Update:** banner image
3. **Event Registration:** submission files
4. **Volunteer Request:** supporting documents

### File Upload Example:
```bash
curl -X POST http://localhost:PORT/api/v1/admin/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Event Name" \
  -F "description=Description" \
  -F "categoryId=507f1f77bcf86cd799439011" \
  -F "poster=@/path/to/poster.jpg" \
  -F "rulesetFile=@/path/to/rules.pdf"
```

---

## Pagination

Endpoints that support pagination use the following parameters:

- `page` - Page number (1-indexed, default: 1)
- `limit` - Items per page (default: 10)

**Pagination Response:**
```json
{
  "users": [...],
  "pagination": {
    "totalDocs": 250,
    "totalPages": 25,
    "currentPage": 1,
    "limit": 10
  }
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Please implement appropriate rate limiting for production.

---

## Version History

- **v1** - Current API version with all endpoints

---

## Support

For API issues and questions, please create a support query at `POST /queries/create` or contact the development team.

---

**Last Updated:** January 14, 2025
