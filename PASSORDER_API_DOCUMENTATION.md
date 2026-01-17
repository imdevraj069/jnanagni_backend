# PassOrder API Documentation

## Overview
The PassOrder API handles all pass purchases and upgrades for users. It tracks transactions, payment details, and upgrade history from one pass to another (specifically to Supersaver).

## Base URL
```
/api/v1/pass-orders
```

## Database Schema

### PassOrder Model
```javascript
{
  userId: ObjectId,              // Reference to User (required)
  passId: ObjectId,              // Reference to the purchased/upgraded pass (required)
  amountPaid: Number,            // Amount paid for this order (required)
  transactionType: String,       // "purchase" or "upgrade" (required)
  previousPassId: ObjectId,      // For upgrades: the pass being upgraded from
  creditedAmount: Number,        // Amount credited from previous pass (for upgrades)
  paymentMethod: String,         // "card", "upi", "netbanking", "wallet", "cash" (required)
  paymentStatus: String,         // "pending", "completed", "failed", "refunded"
  transactionId: String,         // External payment gateway transaction ID
  remarks: String,               // Additional notes
  createdAt: Date,               // Order creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Endpoints

### 1. Purchase a New Pass
**POST** `/purchase`

Purchase a new pass for a user.

#### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "userId": "64a1c2d3e4f5g6h7i8j9k0l1",
  "passId": "64b2d3e4f5g6h7i8j9k0l1m2",
  "amountPaid": 500,
  "paymentMethod": "card",
  "transactionId": "TXN12345678",
  "remarks": "First pass purchase"
}
```

#### Response (201 Created)
```json
{
  "statusCode": 201,
  "data": {
    "_id": "64c3e4f5g6h7i8j9k0l1m2n3",
    "userId": {
      "_id": "64a1c2d3e4f5g6h7i8j9k0l1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "passId": {
      "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
      "name": "Gamer's Pass",
      "type": "egames",
      "price": 500
    },
    "amountPaid": 500,
    "transactionType": "purchase",
    "previousPassId": null,
    "creditedAmount": 0,
    "paymentMethod": "card",
    "paymentStatus": "completed",
    "transactionId": "TXN12345678",
    "remarks": "First pass purchase",
    "createdAt": "2025-01-17T10:30:00.000Z",
    "updatedAt": "2025-01-17T10:30:00.000Z"
  },
  "message": "Pass 'Gamer's Pass' purchased successfully"
}
```

---

### 2. Upgrade to Supersaver
**POST** `/upgrade`

Upgrade an existing pass to Supersaver with credit from the previous pass.

#### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "userId": "64a1c2d3e4f5g6h7i8j9k0l1",
  "currentPassId": "64b2d3e4f5g6h7i8j9k0l1m2",
  "newPassId": "64d4e5f6g7h8i9j0k1l2m3n4",
  "creditedAmount": 500,
  "amountPaid": 1000,
  "paymentMethod": "upi",
  "transactionId": "TXN87654321",
  "remarks": "Upgraded from Gamer's Pass to Supersaver"
}
```

#### Validation Rules
- `creditedAmount`: Amount to credit from the old pass
- `amountPaid`: Must equal `newPass.price - creditedAmount`
- User must own the current pass
- User cannot already own Supersaver
- New pass must be of type "supersaver"

#### Response (201 Created)
```json
{
  "statusCode": 201,
  "data": {
    "_id": "64e5f6g7h8i9j0k1l2m3n4o5",
    "userId": {
      "_id": "64a1c2d3e4f5g6h7i8j9k0l1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "passId": {
      "_id": "64d4e5f6g7h8i9j0k1l2m3n4",
      "name": "All Access",
      "type": "supersaver",
      "price": 1500
    },
    "previousPassId": {
      "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
      "name": "Gamer's Pass",
      "type": "egames",
      "price": 500
    },
    "amountPaid": 1000,
    "creditedAmount": 500,
    "transactionType": "upgrade",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "transactionId": "TXN87654321",
    "remarks": "Upgraded from Gamer's Pass to Supersaver",
    "createdAt": "2025-01-17T11:45:00.000Z",
    "updatedAt": "2025-01-17T11:45:00.000Z"
  },
  "message": "Pass upgraded to 'All Access' successfully"
}
```

---

### 3. Get User Pass Status & Upgrade Options
**GET** `/status/:userId`

Get current passes owned by user and available upgrade paths.

#### Request Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "statusCode": 200,
  "data": {
    "userId": "64a1c2d3e4f5g6h7i8j9k0l1",
    "currentPasses": [
      {
        "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
        "name": "Gamer's Pass",
        "type": "egames",
        "price": 500,
        "description": "Access to e-games events"
      },
      {
        "_id": "64c3f4g5h6i7j8k9l0m1n2o3",
        "name": "Workshop Pass",
        "type": "workshop",
        "price": 800,
        "description": "Access to all workshop events"
      }
    ],
    "hasSupersaver": false,
    "upgradeOptions": [
      {
        "currentPass": {
          "id": "64b2d3e4f5g6h7i8j9k0l1m2",
          "name": "Gamer's Pass",
          "type": "egames",
          "price": 500
        },
        "upgradeTo": {
          "id": "64d4e5f6g7h8i9j0k1l2m3n4",
          "name": "All Access",
          "type": "supersaver",
          "price": 1500,
          "remainingAmount": 1000
        }
      },
      {
        "currentPass": {
          "id": "64c3f4g5h6i7j8k9l0m1n2o3",
          "name": "Workshop Pass",
          "type": "workshop",
          "price": 800
        },
        "upgradeTo": {
          "id": "64d4e5f6g7h8i9j0k1l2m3n4",
          "name": "All Access",
          "type": "supersaver",
          "price": 1500,
          "remainingAmount": 700
        }
      }
    ]
  },
  "message": "User pass status fetched"
}
```

---

### 4. Get All Pass Orders for a User
**GET** `/user/:userId`

Retrieve all pass orders (purchase and upgrade history) for a specific user.

#### Request Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "64c3e4f5g6h7i8j9k0l1m2n3",
      "userId": {
        "_id": "64a1c2d3e4f5g6h7i8j9k0l1",
        "name": "John Doe"
      },
      "passId": {
        "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
        "name": "Gamer's Pass",
        "type": "egames",
        "price": 500
      },
      "amountPaid": 500,
      "transactionType": "purchase",
      "paymentStatus": "completed",
      "createdAt": "2025-01-17T10:30:00.000Z"
    },
    {
      "_id": "64e5f6g7h8i9j0k1l2m3n4o5",
      "userId": {
        "_id": "64a1c2d3e4f5g6h7i8j9k0l1",
        "name": "John Doe"
      },
      "passId": {
        "_id": "64d4e5f6g7h8i9j0k1l2m3n4",
        "name": "All Access",
        "type": "supersaver",
        "price": 1500
      },
      "previousPassId": {
        "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
        "name": "Gamer's Pass"
      },
      "amountPaid": 1000,
      "creditedAmount": 500,
      "transactionType": "upgrade",
      "paymentStatus": "completed",
      "createdAt": "2025-01-17T11:45:00.000Z"
    }
  ],
  "message": "Retrieved 2 pass orders for user"
}
```

---

### 5. Get Pass Order Details
**GET** `/:orderId`

Retrieve detailed information about a specific pass order.

#### Request Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64c3e4f5g6h7i8j9k0l1m2n3",
    "userId": {
      "_id": "64a1c2d3e4f5g6h7i8j9k0l1",
      "name": "John Doe",
      "email": "john@example.com",
      "contactNo": "9876543210"
    },
    "passId": {
      "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
      "name": "Gamer's Pass",
      "type": "egames",
      "price": 500
    },
    "amountPaid": 500,
    "transactionType": "purchase",
    "previousPassId": null,
    "creditedAmount": 0,
    "paymentMethod": "card",
    "paymentStatus": "completed",
    "transactionId": "TXN12345678",
    "remarks": "First pass purchase",
    "createdAt": "2025-01-17T10:30:00.000Z",
    "updatedAt": "2025-01-17T10:30:00.000Z"
  },
  "message": "Order details fetched"
}
```

---

### 6. Get All Pass Orders (Admin)
**GET** `/`

Retrieve all pass orders with pagination and filtering options (Admin only).

#### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Query Parameters
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of records per page
- `transactionType` (optional): Filter by "purchase" or "upgrade"
- `paymentStatus` (optional): Filter by "pending", "completed", "failed", or "refunded"

#### Example Request
```
GET /api/v1/pass-orders?page=1&limit=10&transactionType=upgrade&paymentStatus=completed
```

#### Response (200 OK)
```json
{
  "statusCode": 200,
  "data": {
    "passOrders": [
      {
        "_id": "64c3e4f5g6h7i8j9k0l1m2n3",
        "userId": {
          "_id": "64a1c2d3e4f5g6h7i8j9k0l1",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "passId": {
          "_id": "64b2d3e4f5g6h7i8j9k0l1m2",
          "name": "Gamer's Pass",
          "type": "egames",
          "price": 500
        },
        "amountPaid": 500,
        "transactionType": "purchase",
        "paymentStatus": "completed",
        "createdAt": "2025-01-17T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 47,
      "limit": 10
    }
  },
  "message": "Pass orders retrieved successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Insufficient payment. Pass costs ₹1500, but only ₹1000 was paid"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "data": null,
  "message": "User not found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Authentication token is missing or invalid"
}
```

---

## Usage Examples

### Example 1: User Purchases a Pass
```bash
curl -X POST http://localhost:5000/api/v1/pass-orders/purchase \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64a1c2d3e4f5g6h7i8j9k0l1",
    "passId": "64b2d3e4f5g6h7i8j9k0l1m2",
    "amountPaid": 500,
    "paymentMethod": "card",
    "transactionId": "TXN12345678"
  }'
```

### Example 2: User Upgrades to Supersaver
```bash
curl -X POST http://localhost:5000/api/v1/pass-orders/upgrade \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64a1c2d3e4f5g6h7i8j9k0l1",
    "currentPassId": "64b2d3e4f5g6h7i8j9k0l1m2",
    "newPassId": "64d4e5f6g7h8i9j0k1l2m3n4",
    "creditedAmount": 500,
    "amountPaid": 1000,
    "paymentMethod": "upi",
    "transactionId": "TXN87654321"
  }'
```

### Example 3: Check User's Pass Status
```bash
curl -X GET http://localhost:5000/api/v1/pass-orders/status/64a1c2d3e4f5g6h7i8j9k0l1 \
  -H "Authorization: Bearer <token>"
```

---

## Business Logic Notes

1. **Purchase Requirements**:
   - User must not already own the pass
   - Amount paid must be ≥ pass price
   - Creates a new PassOrder record
   - Adds pass to user's purchasedPasses array

2. **Upgrade Requirements**:
   - Can only upgrade TO Supersaver (not from Supersaver)
   - User must already own the current pass
   - New pass must be of type "supersaver"
   - Amount paid = Supersaver price - credited amount
   - Replaces old pass with Supersaver in user's purchasedPasses

3. **Payment Methods Accepted**:
   - card
   - upi
   - netbanking
   - wallet
   - cash

4. **Supersaver Benefits**:
   - Grants access to all event types
   - Users can upgrade from any other pass by paying the difference
   - Only one Supersaver per user
