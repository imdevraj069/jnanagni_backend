# Jnanagni Backend API - Node.js/Express

A comprehensive REST API for the Jnanagni event management system built with Node.js, Express, MongoDB, and modern development practices.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Environment Variables](#environment-variables)
6. [Running the Server](#running-the-server)
7. [Key Features](#key-features)
8. [Authentication & Authorization](#authentication--authorization)
9. [API Endpoints](#api-endpoints)
10. [Database Models](#database-models)
11. [Docker Deployment](#docker-deployment)

---

## Overview

The Jnanagni backend provides a complete REST API for managing:

- **User Management** - Registration, authentication, profiles, roles
- **Event Management** - Create, update, browse events with categories
- **Event Registration** - User event registration with custom forms
- **Team Management** - Group event registrations with team invitations
- **Admin Dashboard** - Manage events, categories, users, and registrations
- **File Uploads** - Posters, rulesets, and submission files
- **Email Services** - Verification, password reset, notifications
- **Role-Based Access Control** - Different permissions for admin, coordinators, volunteers

---

## Tech Stack

- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer with custom templates
- **Validation**: Custom middleware
- **Error Handling**: Centralized error middleware
- **Environment**: dotenv for configuration
- **Package Manager**: pnpm

---

## Setup & Installation

### Prerequisites

- Node.js v16+ 
- MongoDB v5.0+
- npm or pnpm
- Nodemailer setup (for email services)

### Installation Steps

```bash
# Navigate to node directory
cd /srv/containers/jnanagni-full/node

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run the server
pnpm dev          # Development with hot reload
pnpm start        # Production mode
```

---

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Server
PORT=8001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://mongodb:27017/jnanagni

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Admin Access
ADMIN_SECRET=secure-admin-secret

# Email Service (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URLs (for email links)
FRONTEND_URL=http://localhost:3000
```

---

## Project Structure

```
src/
├── apis/                    # Route definitions
│   ├── auth.api.js         # Authentication routes
│   ├── user.api.js         # User management routes
│   ├── event.api.js        # Event & registration routes
│   └── admin.api.js        # Admin management routes
├── controllers/             # Business logic
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── event.controller.js
│   └── registration.controller.js
├── models/                  # Database schemas
│   ├── user.model.js
│   ├── event.model.js
│   ├── eventcategory.model.js
│   └── registration.model.js
├── middlewares/             # Express middleware
│   ├── auth.middleware.js   # JWT verification
│   ├── access.middleware.js # Role-based access control
│   ├── ownership.middleware.js
│   ├── error.middleware.js
│   └── upload.middleware.js # File upload handling
├── services/                # External services
│   └── email.service.js     # Email sending
├── templates/               # Email templates
├── utils/                   # Helper functions
│   ├── ApiError.js
│   ├── ApiResponse.js
│   └── asyncHandler.js
├── app.js                   # Express app setup
└── server.js                # Entry point
```

---

## Authentication

### JWT Token Structure

```javascript
{
  id: "user_mongodb_id",
  email: "user@example.com",
  role: "student",
  expiresIn: "7d"
}
```

### Authorization Header

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

### Token Expiration

- **Duration**: 7 days (configurable via `JWT_EXPIRES_IN`)
- **Stored in**: HTTP-only cookies (recommended) or localStorage
- **Transmitted**: Authorization header for API calls

### User Roles

#### Primary Roles
- `student` - Default student role
- `gkvian` - GKV alumni
- `fetian` - FET campus student
- `faculty` - Faculty member

#### Special Roles (from `specialRoles` array)
- `admin` - Full system access
- `event_coordinator` - Manage specific events
- `category_lead` - Manage event category
- `volunteer` - Help with event management
- `finance_team` - Handle payments
- `None` - No special role

---

## API Endpoints

### 1. AUTHENTICATION ROUTES

#### Register User
```
POST /api/v1/auth/register
```

**Public** - No token required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "contactNo": "+91-9876543210",
  "whatsappNo": "+91-9876543210",
  "college": "Delhi University",
  "branch": "Computer Science",
  "campus": "FET",
  "role": "student",
  "adminSecret": "optional-admin-secret"
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "data": {
    "jnanagniId": "JGN26-A1B2"
  },
  "message": "Registration successful. Please check your email to verify account."
}
```

**Error Response (400 - Bad Request):**
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

---

#### Login User
```
POST /api/v1/auth/login
```

**Public** - No token required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "role": "student",
      "specialRoles": ["None"],
      "college": "Delhi University",
      "isVerified": true,
      "paymentStatus": "pending"
    }
  },
  "message": "Login successful"
}
```

**Error Response (403 - Forbidden):**
```json
{
  "success": false,
  "message": "Email not verified",
  "data": {
    "email": "john@example.com"
  }
}
```

---

#### Verify Email
```
POST /api/v1/auth/verify-email
```

**Public** - No token required

**Request Body:**
```json
{
  "jnanagniId": "JGN26-A1B2",
  "token": "verification-token-from-email"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "isVerified": true
    }
  },
  "message": "Email verified successfully"
}
```

---

#### Resend Verification Email
```
POST /api/v1/auth/resend-verification
```

**Public** - No token required

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your email."
}
```

---

#### Get Current User
```
GET /api/v1/auth/me
```

**Protected** - Requires valid JWT token

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "role": "student",
      "specialRoles": ["None"],
      "college": "Delhi University",
      "branch": "Computer Science",
      "campus": "FET",
      "isVerified": true,
      "paymentStatus": "pending",
      "createdAt": "2025-12-24T10:00:00Z"
    }
  }
}
```

---

#### Forgot Password
```
POST /api/v1/auth/forgot-password
```

**Public** - No token required

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

---

#### Reset Password
```
POST /api/v1/auth/reset-password
```

**Public** - No token required

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "NewSecurePassword123!"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 2. USER ROUTES

#### Get User by Jnanagni ID (Scan)
```
GET /api/v1/users/scan/:jnanagniId
```

**Protected** - Requires token  
**Authorized Roles**: admin, event_coordinator, volunteer, category_lead

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "jnanagniId": "JGN26-A1B2",
    "email": "john@example.com",
    "college": "Delhi University",
    "paymentStatus": "verified",
    "isVerified": true
  }
}
```

---

#### Check Payment Status
```
GET /api/v1/users/payment-status/:jnanagniId
```

**Protected** - Requires token  
**Authorized Roles**: admin, finance_team, event_coordinator, volunteer

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "jnanagniId": "JGN26-A1B2",
    "paymentStatus": "verified",
    "email": "john@example.com"
  }
}
```

---

#### Get All Users
```
GET /api/v1/users/all/users
```

**Protected** - Requires token  
**Authorized Roles**: admin only

**Response (200 - OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "role": "student",
      "paymentStatus": "verified",
      "isVerified": true
    }
  ]
}
```

---

#### Get Unverified Users
```
GET /api/v1/users/all/unverified
```

**Protected** - Requires token  
**Authorized Roles**: admin only

**Response (200 - OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN26-A1B2",
      "isVerified": false
    }
  ]
}
```

---

#### Verify User Payment
```
PUT /api/v1/users/payments/verify/:id
```

**Protected** - Requires token  
**Authorized Roles**: admin, finance_team

**Request Body:**
```json
{
  "paymentStatus": "verified"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "paymentStatus": "verified"
  },
  "message": "Payment verified successfully"
}
```

---

### 3. EVENT ROUTES

#### Get All Event Categories
```
GET /api/v1/events/categories
```

**Public** - No token required

**Response (200 - OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Web Development",
      "description": "Web dev events",
      "categoryLead": "507f1f77bcf86cd799439011"
    }
  ]
}
```

---

#### Get Event Category by ID
```
GET /api/v1/events/categories/:id
```

**Public** - No token required

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Web Development",
    "description": "Web dev events"
  }
}
```

---

#### Get All Events
```
GET /api/v1/events
```

**Public** - No token required

**Query Parameters:**
- `category` - Filter by category ID
- `limit` - Results per page (default: 10)
- `page` - Page number (default: 1)

**Response (200 - OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Hackathon 2025",
      "description": "24-hour coding competition",
      "slug": "hackathon-2025",
      "category": "507f1f77bcf86cd799439012",
      "venue": "FET Main Hall",
      "date": "2025-12-25T09:00:00Z",
      "isRegistrationOpen": true,
      "formFields": [
        {
          "label": "Team Name",
          "fieldType": "text",
          "fieldName": "team_name",
          "required": true
        }
      ]
    }
  ]
}
```

---

#### Get Event by ID
```
GET /api/v1/events/:id
```

**Public** - No token required

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Hackathon 2025",
    "description": "24-hour coding competition",
    "formFields": [
      {
        "label": "Team Name",
        "fieldType": "text",
        "fieldName": "team_name",
        "required": true
      },
      {
        "label": "GitHub Link",
        "fieldType": "text",
        "fieldName": "github_url",
        "required": false
      }
    ]
  }
}
```

---

#### Register for Event
```
POST /api/v1/events/register
Content-Type: multipart/form-data
```

**Protected** - Requires token

**Request Body (Form Data):**
```
event_id: "507f1f77bcf86cd799439013"
team_name: "CodeMasters"
github_url: "https://github.com/example"
resume: <file>
```

**Response (201 - Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "user": "507f1f77bcf86cd799439011",
    "event": "507f1f77bcf86cd799439013",
    "status": "pending",
    "submissionData": {
      "team_name": "CodeMasters",
      "github_url": "https://github.com/example",
      "resume_url": "uploads/resume-123.pdf"
    },
    "createdAt": "2025-12-24T10:00:00Z"
  },
  "message": "Registration successful"
}
```

---

#### Get My Registrations
```
GET /api/v1/events/registrations/me/:userId
```

**Protected** - Requires token

**Response (200 - OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe"
      },
      "event": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Hackathon 2025"
      },
      "status": "pending",
      "submissionData": {
        "team_name": "CodeMasters"
      },
      "createdAt": "2025-12-24T10:00:00Z"
    }
  ]
}
```

---

#### Get Registration Details
```
GET /api/v1/events/registrations/:id
```

**Protected** - Requires token

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "user": "507f1f77bcf86cd799439011",
    "event": "507f1f77bcf86cd799439013",
    "status": "approved",
    "submissionData": {
      "team_name": "CodeMasters",
      "github_url": "https://github.com/example"
    }
  }
}
```

---

#### Update Registration Submission
```
PUT /api/v1/events/registrations/:id/submission
```

**Protected** - Requires token

**Request Body:**
```json
{
  "submissionData": {
    "github_url": "https://github.com/updated-link"
  }
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "submissionData": {
      "team_name": "CodeMasters",
      "github_url": "https://github.com/updated-link"
    }
  },
  "message": "Submission updated successfully"
}
```

---

### 4. ADMIN ROUTES

All admin routes require `protect` middleware (token authentication).

#### Create Event Category
```
POST /api/v1/admin/categories
```

**Authorized Roles**: admin, category_lead

**Request Body:**
```json
{
  "name": "Web Development",
  "description": "All web development related events"
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Web Development",
    "description": "All web development related events",
    "categoryLead": "507f1f77bcf86cd799439011"
  }
}
```

---

#### Update Event Category
```
PUT /api/v1/admin/categories/:id
```

**Authorized Roles**: admin, category_lead (owner only)

**Request Body:**
```json
{
  "name": "Web Development 2025",
  "description": "Updated description"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Web Development 2025"
  }
}
```

---

#### Create Event
```
POST /api/v1/admin/events
```

**Authorized Roles**: admin, category_lead

**Request Body:**
```json
{
  "name": "Hackathon 2025",
  "description": "24-hour coding competition",
  "slug": "hackathon-2025",
  "categoryId": "507f1f77bcf86cd799439012",
  "venue": "FET Main Hall",
  "date": "2025-12-25T09:00:00Z",
  "isRegistrationOpen": true,
  "formFields": [
    {
      "label": "Team Name",
      "fieldType": "text",
      "fieldName": "team_name",
      "required": true
    },
    {
      "label": "GitHub Link",
      "fieldType": "text",
      "fieldName": "github_url",
      "required": false
    }
  ]
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Hackathon 2025",
    "category": "507f1f77bcf86cd799439012",
    "coordinators": [],
    "volunteers": [],
    "formFields": [...]
  }
}
```

---

#### Update Event
```
PUT /api/v1/admin/events/:id
```

**Authorized Roles**: admin, category_lead, event_coordinator (owner)

**Request Body:**
```json
{
  "name": "Hackathon 2025 - Updated",
  "isRegistrationOpen": false
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Hackathon 2025 - Updated"
  }
}
```

---

#### Add Event Coordinator
```
POST /api/v1/admin/events/:id/coordinator
```

**Authorized Roles**: admin, category_lead

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439015"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "coordinators": ["507f1f77bcf86cd799439015"]
  },
  "message": "Coordinator added successfully"
}
```

---

#### Get Registrations by Event
```
GET /api/v1/admin/registrations/event/:eventId
```

**Authorized Roles**: admin, event_coordinator (for their events)

**Response (200 - OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "event": "507f1f77bcf86cd799439013",
      "status": "pending",
      "submissionData": {...}
    }
  ]
}
```

---

#### Update Registration Status
```
PUT /api/v1/admin/registrations/:id/status
```

**Authorized Roles**: admin, event_coordinator

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "approved"
  },
  "message": "Registration status updated"
}
```

---

## Database Models

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  contactNo: String,
  whatsappNo: String,
  college: String,
  branch: String,
  campus: String (enum: ["FET", "University", "KGC"]),
  role: String (enum: ["student", "gkvian", "fetian", "faculty"]),
  specialRoles: [String] (enum: ["admin", "event_coordinator", "volunteer", "category_lead", "finance_team", "None"]),
  jnanagniId: String (unique),
  isVerified: Boolean,
  verificationToken: String,
  verificationExpire: Date,
  paymentStatus: String (enum: ["pending", "verified", "failed"]),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model

```javascript
{
  name: String,
  description: String,
  slug: String (unique),
  category: ObjectId (ref: EventCategory),
  coordinators: [ObjectId] (ref: User),
  volunteers: [ObjectId] (ref: User),
  formFields: [{
    label: String,
    fieldType: String (enum: ["text", "number", "email", "file", "dropdown"]),
    fieldName: String,
    required: Boolean,
    options: [String]
  }],
  ruleset: String,
  venue: String,
  date: Date,
  isRegistrationOpen: Boolean,
  createdby: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Registration Model

```javascript
{
  user: ObjectId (ref: User),
  event: ObjectId (ref: Event),
  submissionData: Map,
  status: String (enum: ["pending", "approved", "rejected"]),
  createdAt: Date,
  updatedAt: Date
}
```

### EventCategory Model

```javascript
{
  name: String,
  description: String,
  categoryLead: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User not authorized for this action |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., email) |
| 500 | Server Error | Internal server error |

---

## Running the Server

### Development Mode
```bash
cd /srv/containers/jnanagni-full/node
pnpm dev
```

The server will start on `http://localhost:8001` with hot reload enabled.

### Production Mode
```bash
cd /srv/containers/jnanagni-full/node
pnpm start
```

### Docker Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
EXPOSE 8001
CMD ["pnpm", "start"]
```

**Run with Docker Compose:**
```yaml
services:
  backend:
    build: ./node
    ports:
      - "8001:8001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/jnanagni
      - JWT_SECRET=secret-key
    depends_on:
      - mongodb
    volumes:
      - ./node:/app
      - /app/node_modules
```

---

## Testing Endpoints

Use tools like:
- **Postman**: Import API collection
- **Thunder Client**: VS Code extension
- **cURL**: Command-line testing

### Example cURL Request

```bash
# Register
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "contactNo": "+91-9876543210",
    "whatsappNo": "+91-9876543210",
    "college": "Delhi University",
    "branch": "CS",
    "campus": "FET"
  }'

# Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Get current user (Protected)
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Support & Contact

For issues or questions:
- Create an issue in the repository
- Contact: devraj@blackbirdcodelabs.com

---

**Last Updated**: December 24, 2025
- **Authorization**: None (Public)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "contactNo": "string",
    "whatsappNo": "string",
    "college": "string",
    "branch": "string",
    "campus": "string",
    "role": "string (optional, default: 'student')",
    "adminSecret": "string (optional, for admin registration)"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "jnanagniId": "string"
    },
    "message": "Registration successful. Please check your email to verify account.",
    "success": true
  }
  ```

### Login User
- **Route**: `POST /auth/login`
- **Description**: Authenticate user and get access token
- **Authorization**: None (Public)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": true,
        "paymentStatus": false
      },
      "token": "string"
    },
    "message": "User logged in successfully",
    "success": true
  }
  ```

### Verify Email
- **Route**: `POST /auth/verify-email`
- **Description**: Verify user email using verification token
- **Authorization**: None (Public)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "jnanagniId": "string",
    "token": "string"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": true,
        "paymentStatus": false
      },
      "token": "string"
    },
    "message": "Email verified successfully!",
    "success": true
  }
  ```

### Resend Verification
- **Route**: `POST /auth/resend-verification`
- **Description**: Resend email verification link
- **Authorization**: None (Public)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "string (optional)",
    "jnanagniId": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "Verification link resent successfully",
    "success": true
  }
  ```

### Forgot Password
- **Route**: `POST /auth/forgot-password`
- **Description**: Send password reset OTP to email
- **Authorization**: None (Public)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "string"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "Verification code sent to email",
    "success": true
  }
  ```

### Reset Password
- **Route**: `POST /auth/reset-password`
- **Description**: Reset password using OTP
- **Authorization**: None (Public)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "string",
    "otp": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "Password reset successfully. You can now login.",
    "success": true
  }
  ```

### Get Current User
- **Route**: `GET /auth/me`
- **Description**: Get current authenticated user profile
- **Authorization**: Bearer token required
- **Roles**: Any authenticated user
- **Body Required**: No
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": true,
        "paymentStatus": false
      }
    },
    "message": "User profile fetched successfully",
    "success": true
  }
  ```

## User Management

### Get User by Jnanagni ID
- **Route**: `GET /users/scan/:jnanagniId`
- **Description**: Get user details by Jnanagni ID (for scanning)
- **Authorization**: Bearer token required
- **Roles**: admin, event_coordinator, volunteer, category_lead
- **Body Required**: No
- **Parameters**: `jnanagniId` (path)
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "jnanagniId": "string",
      "role": "string",
      "specialRoles": ["string"],
      "isVerified": true,
      "paymentStatus": false
    },
    "message": "User details fetched successfully",
    "success": true
  }
  ```

### Get Payment Status
- **Route**: `GET /users/payment-status/:jnanagniId`
- **Description**: Check payment status of a user
- **Authorization**: Bearer token required
- **Roles**: admin, finance_team, event_coordinator, volunteer
- **Body Required**: No
- **Parameters**: `jnanagniId` (path)
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "paymentStatus": false,
      "name": "string",
      "email": "string",
      "jnanagniId": "string"
    },
    "message": "Payment status fetched successfully",
    "success": true
  }
  ```

### Get User by ID
- **Route**: `GET /users/:id`
- **Description**: Get user details by database ID
- **Authorization**: Bearer token required
- **Roles**: admin, event_coordinator
- **Body Required**: No
- **Parameters**: `id` (path)
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "jnanagniId": "string",
      "role": "string",
      "specialRoles": ["string"],
      "isVerified": true,
      "paymentStatus": false
    },
    "message": "User details fetched successfully",
    "success": true
  }
  ```

### Get All Users
- **Route**: `GET /users/all/users`
- **Description**: Get paginated list of all users
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "users": [
        {
          "id": "string",
          "name": "string",
          "email": "string",
          "jnanagniId": "string",
          "role": "string",
          "specialRoles": ["string"],
          "isVerified": true,
          "paymentStatus": false
        }
      ],
      "pagination": {
        "totalDocs": 100,
        "totalPages": 10,
        "currentPage": 1,
        "limit": 10
      }
    },
    "message": "All users fetched successfully",
    "success": true
  }
  ```

### Get Unverified Users
- **Route**: `GET /users/all/unverified`
- **Description**: Get all users with unverified emails
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": false,
        "paymentStatus": false
      }
    ],
    "message": "Unverified users fetched successfully",
    "success": true
  }
  ```

### Get Users by Role
- **Route**: `GET /users/role/:role`
- **Description**: Get users by primary role
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Parameters**: `role` (path) - student, gkvian, fetian, faculty
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": true,
        "paymentStatus": false
      }
    ],
    "message": "Users with role student fetched successfully",
    "success": true
  }
  ```

### Get Users by Special Role
- **Route**: `GET /users/special-role/:specialRole`
- **Description**: Get users by special role
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Parameters**: `specialRole` (path) - event_coordinator, volunteer, category_lead, admin, finance_team, None
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": true,
        "paymentStatus": false
      }
    ],
    "message": "Users with special role admin fetched successfully",
    "success": true
  }
  ```

### Get Users with Unverified Payments
- **Route**: `GET /users/payments/pending`
- **Description**: Get users with unverified payments
- **Authorization**: Bearer token required
- **Roles**: admin, finance_team
- **Body Required**: No
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "jnanagniId": "string",
        "role": "string",
        "specialRoles": ["string"],
        "isVerified": true,
        "paymentStatus": false
      }
    ],
    "message": "Users with unverified payments fetched successfully",
    "success": true
  }
  ```

### Verify User Payment
- **Route**: `PUT /users/payments/verify/:id`
- **Description**: Mark user payment as verified
- **Authorization**: Bearer token required
- **Roles**: admin, finance_team
- **Body Required**: No
- **Parameters**: `id` (path) - User database ID
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "jnanagniId": "string",
      "role": "string",
      "specialRoles": ["string"],
      "isVerified": true,
      "paymentStatus": true
    },
    "message": "User payment verified successfully",
    "success": true
  }
  ```

### Change User Role
- **Route**: `PUT /users/role/:id`
- **Description**: Update user role
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: Yes
- **Parameters**: `id` (path) - User database ID
- **Request Body**:
  ```json
  {
    "role": "string (optional)",
    "specialRoles": "string or array (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "jnanagniId": "string",
      "role": "string",
      "specialRoles": ["string"],
      "isVerified": true,
      "paymentStatus": false
    },
    "message": "User role updated successfully",
    "success": true
  }
  ```

### Delete User
- **Route**: `DELETE /users/:id`
- **Description**: Delete a user account
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Parameters**: `id` (path) - User database ID
- **Response**:
  ```json
  {
    "statusCode": 200,
    "data": null,
    "message": "User deleted successfully",
    "success": true
  }
  ```

## Event Management

### Get All Event Categories
- **Route**: `GET /events/categories`
- **Description**: Get all event categories
- **Authorization**: None (Public)
- **Body Required**: No
- **Response**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "slug": "string",
      "lead": {
        "name": "string",
        "email": "string"
      },
      "createdby": {
        "name": "string",
        "email": "string"
      }
    }
  ]
  ```

### Get Event Category by ID
- **Route**: `GET /events/categories/:id`
- **Description**: Get specific event category
- **Authorization**: None (Public)
- **Body Required**: No
- **Parameters**: `id` (path) - Category ID
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "lead": {
      "name": "string",
      "email": "string"
    },
    "createdby": {
      "name": "string",
      "email": "string"
    }
  }
  ```

### Get All Events
- **Route**: `GET /events`
- **Description**: Get paginated list of all events
- **Authorization**: None (Public)
- **Body Required**: No
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "slug": "string",
        "date": "2025-12-14T00:00:00.000Z",
        "venue": "string",
        "category": {
          "id": "string",
          "name": "string",
          "description": "string"
        },
        "createdby": {
          "name": "string",
          "email": "string"
        }
      }
    ],
    "pagination": {
      "totalDocs": 50,
      "totalPages": 5,
      "currentPage": 1,
      "limit": 10
    }
  }
  ```

### Get Event by ID
- **Route**: `GET /events/:id`
- **Description**: Get specific event details
- **Authorization**: None (Public)
- **Body Required**: No
- **Parameters**: `id` (path) - Event ID
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "date": "2025-12-14T00:00:00.000Z",
    "venue": "string",
    "category": {
      "id": "string",
      "name": "string",
      "description": "string"
    },
    "createdby": {
      "name": "string",
      "email": "string"
    }
  }
  ```

### Get Events by Category
- **Route**: `GET /events/category/:categoryId`
- **Description**: Get events in a specific category
- **Authorization**: None (Public)
- **Body Required**: No
- **Parameters**: `categoryId` (path) - Category ID
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "slug": "string",
        "date": "2025-12-14T00:00:00.000Z",
        "venue": "string",
        "category": {
          "id": "string",
          "name": "string",
          "description": "string"
        },
        "createdby": {
          "name": "string",
          "email": "string"
        }
      }
    ],
    "pagination": {
      "totalDocs": 10,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10
    }
  }
  ```

### Register for Event
- **Route**: `POST /events/register`
- **Description**: Register user for an event
- **Authorization**: Bearer token required
- **Roles**: Any authenticated user
- **Body Required**: Yes (multipart/form-data)
- **Request Body**:
  ```json
  {
    "eventId": "string",
    "submissionData": "object (optional)"
  }
  ```
- **Files**: Optional file uploads (resume, etc.)
- **Response**:
  ```json
  {
    "id": "string",
    "user": "string",
    "event": "string",
    "submissionData": {},
    "status": "pending",
    "createdAt": "2025-12-14T00:00:00.000Z"
  }
  ```

### Get User Registrations
- **Route**: `GET /events/registrations/me/:userId`
- **Description**: Get all registrations for a user
- **Authorization**: Bearer token required
- **Roles**: Any authenticated user
- **Body Required**: No
- **Parameters**: `userId` (path) - User ID
- **Response**:
  ```json
  [
    {
      "id": "string",
      "user": "string",
      "event": {
        "title": "string",
        "date": "2025-12-14T00:00:00.000Z",
        "venue": "string"
      },
      "submissionData": {},
      "status": "pending",
      "createdAt": "2025-12-14T00:00:00.000Z"
    }
  ]
  ```

### Get Registration by ID
- **Route**: `GET /events/registrations/:id`
- **Description**: Get specific registration details
- **Authorization**: Bearer token required
- **Roles**: Any authenticated user
- **Body Required**: No
- **Parameters**: `id` (path) - Registration ID
- **Response**:
  ```json
  {
    "id": "string",
    "user": {
      "name": "string",
      "email": "string"
    },
    "event": {
      "title": "string",
      "date": "2025-12-14T00:00:00.000Z",
      "venue": "string"
    },
    "submissionData": {},
    "status": "pending",
    "createdAt": "2025-12-14T00:00:00.000Z"
  }
  ```

### Update Registration Submission Data
- **Route**: `PUT /events/registrations/:id/submission`
- **Description**: Update submission data for a registration
- **Authorization**: Bearer token required
- **Roles**: Any authenticated user
- **Body Required**: Yes
- **Parameters**: `id` (path) - Registration ID
- **Request Body**:
  ```json
  {
    "submissionData": "object"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "user": "string",
    "event": "string",
    "submissionData": {},
    "status": "pending",
    "createdAt": "2025-12-14T00:00:00.000Z"
  }
  ```

## Admin Operations

### Create Event Category
- **Route**: `POST /admin/categories`
- **Description**: Create a new event category
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "leaduserId": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "lead": "string",
    "createdby": "string"
  }
  ```

### Update Event Category
- **Route**: `PUT /admin/categories/:id`
- **Description**: Update an event category
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead (must own the category)
- **Body Required**: Yes
- **Parameters**: `id` (path) - Category ID
- **Request Body**:
  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)",
    "lead": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "lead": "string",
    "createdby": "string"
  }
  ```

### Delete Event Category
- **Route**: `DELETE /admin/categories/:id`
- **Description**: Delete an event category
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Parameters**: `id` (path) - Category ID
- **Response**:
  ```json
  {
    "message": "Event category deleted successfully"
  }
  ```

### Create Event
- **Route**: `POST /admin/events`
- **Description**: Create a new event
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead (must own the category)
- **Body Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "date": "string (ISO date)",
    "venue": "string",
    "categoryId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "date": "2025-12-14T00:00:00.000Z",
    "venue": "string",
    "category": "string",
    "createdby": "string"
  }
  ```

### Update Event
- **Route**: `PUT /admin/events/:id`
- **Description**: Update an event
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead, event_coordinator (must have authority)
- **Body Required**: Yes
- **Parameters**: `id` (path) - Event ID
- **Request Body**:
  ```json
  {
    "title": "string (optional)",
    "description": "string (optional)",
    "date": "string (optional)",
    "venue": "string (optional)",
    "categoryId": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "date": "2025-12-14T00:00:00.000Z",
    "venue": "string",
    "category": "string",
    "createdby": "string"
  }
  ```

### Delete Event
- **Route**: `DELETE /admin/events/:id`
- **Description**: Delete an event
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead (must have authority)
- **Body Required**: No
- **Parameters**: `id` (path) - Event ID
- **Response**:
  ```json
  {
    "message": "Event deleted successfully"
  }
  ```

### Add Coordinator to Event
- **Route**: `POST /admin/events/:id/coordinator`
- **Description**: Assign a coordinator to an event
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead (must own the category)
- **Body Required**: Yes
- **Parameters**: `id` (path) - Event ID
- **Request Body**:
  ```json
  {
    "coordinatorId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "slug": "string",
    "date": "2025-12-14T00:00:00.000Z",
    "venue": "string",
    "category": "string",
    "coordinators": ["string"],
    "volunteers": ["string"],
    "createdby": "string"
  }
  ```

### Add Volunteer to Event
- **Route**: `POST /admin/events/:id/volunteer`
- **Description**: Assign a volunteer to an event
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead, event_coordinator (must have authority)
- **Body Required**: Yes
- **Parameters**: `id` (path) - Event ID
- **Request Body**:
  ```json
  {
    "volunteerId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Volunteer added successfully",
    "event": {
      "id": "string",
      "name": "string",
      "description": "string",
      "slug": "string",
      "date": "2025-12-14T00:00:00.000Z",
      "venue": "string",
      "category": "string",
      "coordinators": ["string"],
      "volunteers": ["string"],
      "createdby": "string"
    }
  }
  ```

### Get Registrations by Event
- **Route**: `GET /admin/events/:eventId/registrations`
- **Description**: Get all registrations for an event
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead, event_coordinator, volunteer (must have access)
- **Body Required**: No
- **Parameters**: `eventId` (path) - Event ID
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)
- **Response**:
  ```json
  {
    "registrations": [
      {
        "id": "string",
        "user": {
          "name": "string",
          "email": "string",
          "jnanagniId": "string",
          "contactNo": "string"
        },
        "event": {
          "title": "string",
          "date": "2025-12-14T00:00:00.000Z"
        },
        "submissionData": {},
        "status": "pending",
        "createdAt": "2025-12-14T00:00:00.000Z"
      }
    ],
    "pagination": {
      "totalDocs": 50,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 20
    }
  }
  ```

### Update Registration Status
- **Route**: `PUT /admin/registrations/:id/status`
- **Description**: Update the status of a registration
- **Authorization**: Bearer token required
- **Roles**: admin, category_lead, event_coordinator
- **Body Required**: Yes
- **Parameters**: `id` (path) - Registration ID
- **Request Body**:
  ```json
  {
    "status": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "user": "string",
    "event": "string",
    "submissionData": {},
    "status": "approved",
    "createdAt": "2025-12-14T00:00:00.000Z"
  }
  ```

### Delete Registration
- **Route**: `DELETE /admin/registrations/:id`
- **Description**: Delete a registration
- **Authorization**: Bearer token required
- **Roles**: admin
- **Body Required**: No
- **Parameters**: `id` (path) - Registration ID
- **Response**:
  ```json
  {
    "message": "Registration deleted successfully"
  }
  ```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication Notes

- Include the JWT token in the `Authorization` header as `Bearer <token>`
- Tokens are obtained from the login endpoint
- Protected routes require valid tokens
- Role-based access control is enforced on admin and restricted endpoints</content>
<parameter name="filePath">/home/lucifer/Documents/projects/jnanagni/web/backend/node/README.md