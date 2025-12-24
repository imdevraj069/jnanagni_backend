# Jnanagni Backend API Documentation

This document provides comprehensive API documentation for the Jnanagni Backend Node.js application.

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)
- [Event Management](#event-management)
- [Admin Operations](#admin-operations)

## Base URL
```
http://localhost:3000/api
```

## Authentication

### Register User
- **Route**: `POST /auth/register`
- **Description**: Register a new user account
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