# API Documentation

## Base URL
```
https://api.jnanagni.in/api/v1
```

---

# 1. ATTENDANCE MANAGEMENT ENDPOINTS

## 1.1 Mark User Attendance

**Endpoint:** `POST /api/v1/attendance/mark`

**Accessibility:** 
- ✅ Admin
- ✅ Event Coordinator
- ✅ Volunteer
- ✅ Category Lead
- ❌ Faculty
- ❌ Student
- **Requires:** Authentication Token

**Purpose:** Mark a user present for an event round with automatic qualification validation

**Request Body:**
```json
{
  "jnanagniId": "JGN2025001",
  "eventId": "evt_1234567890abcdef",
  "roundId": "rnd_1234567890abcdef",
  "force": false
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jnanagniId | string | Yes | User's JnanagniId |
| eventId | string | Yes | Event ID from MongoDB |
| roundId | string | Yes | Round ID from event.rounds array |
| force | boolean | No | Override team size validation (default: false) |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "success",
    "user": "John Doe",
    "teamName": "Team Alpha",
    "roundName": "Preliminary",
    "isRegistrationValid": true,
    "isPhysicalTeamComplete": true,
    "teamStatus": "Present: 3/3 [COMPLETE]",
    "timestamp": "2026-01-23T10:30:00Z"
  },
  "message": "Attendance marked successfully"
}
```

**Response (Already Checked In - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "already_checked_in",
    "user": "John Doe",
    "checkInTime": "2026-01-23T10:25:00Z"
  },
  "message": "User already checked in for this round"
}
```

**Error Responses:**

1. **User not found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

2. **User not registered (403)**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "User is not registered for this event"
}
```

3. **Did not qualify (403)**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Your team did not qualify from the Semi-Final round"
}
```

4. **Team size below minimum (409)**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Team size below minimum. Allow anyway?",
  "data": {
    "requiresConfirmation": true,
    "teamName": "Team Alpha",
    "currentSize": 2,
    "minRequired": 3,
    "warning": "Team size below minimum. Allow anyway?"
  }
}
```

5. **Previous round results not published (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Results for 'Semi-Final' must be published first"
}
```

**Side Effects:**
- ✅ Creates attendance record
- ✅ Creates/updates participation certificate with `roundReached`
- ✅ Increments present count for the round

---

## 1.2 Mark User Absent (Remove Attendance)

**Endpoint:** `POST /api/v1/attendance/unmark`

**Accessibility:** 
- ✅ Admin
- ✅ Event Coordinator
- ❌ Volunteer
- ❌ Category Lead
- ❌ Faculty
- ❌ Student
- **Requires:** Authentication Token

**Purpose:** Remove attendance record and downgrade or delete certificate

**Request Body:**
```json
{
  "jnanagniId": "JGN2025001",
  "eventId": "evt_1234567890abcdef",
  "roundId": "rnd_1234567890abcdef"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jnanagniId | string | Yes | User's JnanagniId |
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": "John Doe",
    "removedFrom": "Semi-Final",
    "action": "Attendance removed and certificate updated"
  },
  "message": "Attendance removed for John Doe"
}
```

**Error Responses:**

1. **No attendance record found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "No attendance record found"
}
```

**Side Effects:**
- ✅ Deletes attendance record
- ✅ Downgrades certificate to previous round (if exists)
- ✅ Deletes certificate if no previous round

---

## 1.3 Get Attendance Statistics for a Round

**Endpoint:** `GET /api/v1/attendance/stats/:eventId/:roundId`

**Accessibility:** 
- ✅ Admin
- ✅ Event Coordinator
- ✅ Category Lead
- ❌ Volunteer
- ❌ Faculty
- ❌ Student
- **Requires:** Authentication Token

**Purpose:** Get summary statistics of attendance for a specific round

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "registrationId": "reg_123",
      "teamName": "Team Alpha",
      "presentCount": 3
    },
    {
      "registrationId": "reg_124",
      "teamName": "Team Beta",
      "presentCount": 2
    }
  ],
  "message": "Attendance stats fetched"
}
```

**Error Responses:**

1. **Event not found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found"
}
```

---

## 1.4 Get Detailed Attendance List (Event & Round Wise)

**Endpoint:** `GET /api/v1/attendance/:eventId/:roundId/list`

**Accessibility:** 
- ✅ Admin
- ✅ Event Coordinator
- ✅ Category Lead
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token

**Purpose:** Get complete attendance list with user details, grouped by team

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "event": {
      "eventId": "evt_123",
      "eventName": "Hackathon 2026"
    },
    "round": {
      "roundId": "rnd_123",
      "roundName": "Preliminary",
      "sequenceNumber": 1
    },
    "summary": {
      "totalPresent": 45,
      "totalTeamsPresent": 15
    },
    "attendanceList": [
      {
        "registrationId": "reg_123",
        "teamName": "Team Alpha",
        "registeredBy": "user_id",
        "presentCount": 3,
        "checkInTime": "2026-01-23T10:15:00Z",
        "presentMembers": [
          {
            "userId": "user_1",
            "name": "John Doe",
            "email": "john@example.com",
            "jnanagniId": "JGN2025001",
            "college": "ABC College",
            "scannedAt": "2026-01-23T10:15:00Z",
            "scannedBy": {
              "name": "Admin Name",
              "email": "admin@example.com"
            }
          },
          {
            "userId": "user_2",
            "name": "Jane Smith",
            "email": "jane@example.com",
            "jnanagniId": "JGN2025002",
            "college": "ABC College",
            "scannedAt": "2026-01-23T10:16:00Z",
            "scannedBy": {
              "name": "Admin Name",
              "email": "admin@example.com"
            }
          }
        ]
      }
    ]
  },
  "message": "Attendance list fetched successfully"
}
```

---

# 2. RESULTS MANAGEMENT ENDPOINTS

## 2.1 Create Round

**Endpoint:** `POST /api/v1/results/:eventId/rounds`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Create a new round for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Request Body:**
```json
{
  "name": "Semi-Final"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the round (e.g., "Preliminary", "Semi-Final", "Final") |

**Response (Success - 201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "_id": "rnd_1234567890abcdef",
    "name": "Semi-Final",
    "sequenceNumber": 2,
    "isActive": false,
    "resultsPublished": false
  },
  "message": "Round created successfully"
}
```

**Error Responses:**

1. **Round name is empty (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Round name is required"
}
```

2. **Event not found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Event not found"
}
```

---

## 2.2 Get All Rounds for an Event

**Endpoint:** `GET /api/v1/results/:eventId/rounds`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token

**Purpose:** Retrieve all rounds for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "rnd_001",
      "name": "Preliminary",
      "sequenceNumber": 1,
      "isActive": false,
      "resultsPublished": true
    },
    {
      "_id": "rnd_002",
      "name": "Semi-Final",
      "sequenceNumber": 2,
      "isActive": true,
      "resultsPublished": false
    },
    {
      "_id": "rnd_003",
      "name": "Final",
      "sequenceNumber": 3,
      "isActive": false,
      "resultsPublished": false
    }
  ],
  "message": "Rounds fetched successfully"
}
```

---

## 2.3 Activate a Round

**Endpoint:** `PUT /api/v1/results/:eventId/rounds/:roundId/activate`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Activate a round (only one round can be active at a time)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID to activate |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "rnd_002",
    "name": "Semi-Final",
    "sequenceNumber": 2,
    "isActive": true,
    "resultsPublished": false
  },
  "message": "Round activated successfully"
}
```

---

## 2.4 Create Results (Draft)

**Endpoint:** `POST /api/v1/results/:eventId/round/:roundId`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Create results in draft state (unpublished)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Request Body:**
```json
{
  "results": [
    {
      "registrationId": "reg_001",
      "rank": 1,
      "score": "95/100"
    },
    {
      "registrationId": "reg_002",
      "rank": 2,
      "score": "87/100"
    },
    {
      "registrationId": "reg_003",
      "rank": 3,
      "score": "82/100"
    }
  ],
  "qualifiedRegistrations": ["reg_001", "reg_002", "reg_005"]
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| results | array | Yes | Array of results with rank, score |
| results[].registrationId | string | Yes | Registration ID |
| results[].rank | number | No | Rank of the team (auto-assigned if not provided) |
| results[].score | string | No | Score or performance metric |
| qualifiedRegistrations | array | Conditional | Array of registration IDs that qualify for next round. **Required for non-final rounds** |

**Response (Success - 201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "_id": "res_123",
    "event": "evt_123",
    "roundId": "rnd_002",
    "roundName": "Semi-Final",
    "roundSequenceNumber": 2,
    "results": [
      {
        "rank": 1,
        "registration": "reg_001",
        "score": "95/100",
        "won": false
      },
      {
        "rank": 2,
        "registration": "reg_002",
        "score": "87/100",
        "won": false
      }
    ],
    "qualifiedForNextRound": ["reg_001", "reg_002", "reg_005"],
    "published": false,
    "publishedBy": null,
    "publishedAt": null,
    "createdBy": "admin_user_id",
    "createdAt": "2026-01-23T10:30:00Z"
  },
  "message": "Results created successfully (unpublished)"
}
```

**Error Responses:**

1. **Results list is empty (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Results list cannot be empty"
}
```

2. **Invalid registrations (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or inactive registrations detected"
}
```

3. **Unqualified teams included (403)** - *Non-final rounds only*
```json
{
  "success": false,
  "statusCode": 403,
  "message": "2 registration(s) did not qualify from the previous round and cannot participate in this round"
}
```

4. **qualifiedRegistrations not specified (400)** - *Non-final rounds*
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Must specify which registrations qualify for next round"
}
```

---

## 2.5 Publish Results

**Endpoint:** `PUT /api/v1/results/:eventId/round/:roundId/publish`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Publish results from draft state (triggers certificate auto-generation for final rounds)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Request Body:**
```
(empty body)
```

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "res_123",
    "event": "evt_123",
    "roundId": "rnd_002",
    "roundName": "Semi-Final",
    "published": true,
    "publishedBy": "admin_user_id",
    "publishedAt": "2026-01-23T10:35:00Z",
    "results": [...],
    "qualifiedForNextRound": ["reg_001", "reg_002", "reg_005"]
  },
  "message": "Results published successfully"
}
```

**Special Behavior for FINAL Round:**
- Winner certificates are automatically generated for top 3
- Rank 1: `type="excellence"`, `winnerRank=1`
- Rank 2 & 3: `type="completion"`, `winnerRank=2/3`

**Error Responses:**

1. **Results not found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Results not found. Please create results first"
}
```

2. **Already published (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Results are already published"
}
```

---

## 2.6 Unpublish Results (Toggle to Draft)

**Endpoint:** `PUT /api/v1/results/:eventId/round/:roundId/unpublish`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Move published results back to draft state for re-editing

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "res_123",
    "roundId": "rnd_002",
    "roundName": "Semi-Final",
    "published": false,
    "publishedBy": null,
    "publishedAt": null
  },
  "message": "Results unpublished successfully (moved to draft)"
}
```

**Error Responses:**

1. **Already in draft state (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Results are already in draft state"
}
```

---

## 2.7 Get All Results for an Event (Admin View)

**Endpoint:** `GET /api/v1/results/:eventId/all-results`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** View all results (published and draft) with status for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "event": {
      "eventId": "evt_123",
      "eventName": "Hackathon 2026",
      "totalRounds": 3
    },
    "results": [
      {
        "_id": "res_001",
        "roundId": "rnd_001",
        "roundName": "Preliminary",
        "roundSequenceNumber": 1,
        "published": true,
        "publishStatus": "published",
        "publishedBy": {
          "_id": "user_123",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "publishedAt": "2026-01-22T14:30:00Z",
        "createdBy": {
          "_id": "user_123",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "results": [...],
        "qualifiedForNextRound": ["reg_001", "reg_002"]
      },
      {
        "_id": "res_002",
        "roundId": "rnd_002",
        "roundName": "Semi-Final",
        "roundSequenceNumber": 2,
        "published": false,
        "publishStatus": "draft",
        "publishedBy": null,
        "publishedAt": null,
        "createdBy": {...},
        "results": [...]
      }
    ],
    "summary": {
      "totalResults": 2,
      "publishedCount": 1,
      "draftCount": 1
    }
  },
  "message": "All results fetched successfully"
}
```

---

## 2.8 Get Results for a Round (Admin View)

**Endpoint:** `GET /api/v1/results/:eventId/round/:roundId/admin`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Get detailed results for a specific round (admin view with full data)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "res_123",
    "event": {
      "_id": "evt_123",
      "name": "Hackathon 2026"
    },
    "roundId": "rnd_002",
    "roundName": "Semi-Final",
    "published": false,
    "results": [
      {
        "rank": 1,
        "registration": {
          "_id": "reg_001",
          "teamName": "Team Alpha",
          "registeredBy": {
            "_id": "user_1",
            "name": "John Doe",
            "email": "john@example.com",
            "jnanagniId": "JGN2025001",
            "college": "ABC College"
          },
          "teamMembers": [
            {
              "user": {
                "_id": "user_2",
                "name": "Jane Smith",
                "email": "jane@example.com",
                "jnanagniId": "JGN2025002"
              },
              "status": "accepted"
            }
          ]
        },
        "score": "95/100",
        "won": false
      }
    ],
    "qualifiedForNextRound": [
      {
        "_id": "reg_001",
        "teamName": "Team Alpha",
        "registeredBy": "user_1"
      }
    ]
  },
  "message": "Results fetched successfully"
}
```

**Response (No Results - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "No results created yet"
}
```

---

## 2.9 Get Public Results (Published Only)

**Endpoint:** `GET /api/v1/results/:eventId/round/:roundId`

**Accessibility:** 
- ✅ Public (No authentication required)
- ✅ Any authenticated user

**Purpose:** Get published results visible to public

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "res_123",
    "event": {
      "_id": "evt_123",
      "name": "Hackathon 2026",
      "date": "2026-01-23",
      "category": "Technical"
    },
    "roundId": "rnd_002",
    "roundName": "Semi-Final",
    "published": true,
    "results": [
      {
        "rank": 1,
        "registration": {
          "_id": "reg_001",
          "teamName": "Team Alpha",
          "registeredBy": {
            "name": "John Doe",
            "college": "ABC College"
          },
          "teamMembers": [
            {
              "user": {
                "name": "Jane Smith"
              }
            }
          ]
        },
        "score": "95/100",
        "won": false
      }
    ]
  },
  "message": "Results fetched successfully"
}
```

**Response (Not Published - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Results not yet announced"
}
```

---

## 2.10 Get Qualified Teams for Next Round

**Endpoint:** `GET /api/v1/results/:eventId/round/:roundId/qualified`

**Accessibility:** 
- ✅ Public (No authentication required)
- ✅ Any authenticated user

**Purpose:** Get list of teams qualified for the next round

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "reg_001",
      "teamName": "Team Alpha",
      "registeredBy": "user_1"
    },
    {
      "_id": "reg_002",
      "teamName": "Team Beta",
      "registeredBy": "user_2"
    }
  ],
  "message": "Qualified teams fetched"
}
```

---

## 2.11 Delete Round

**Endpoint:** `DELETE /api/v1/results/:eventId/rounds/:roundId`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Delete a round (only if results are not published)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID to delete |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Round deleted successfully"
}
```

**Error Responses:**

1. **Results already published (400)**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot delete a round with published results"
}
```

---

## 2.12 Delete Results

**Endpoint:** `DELETE /api/v1/results/:eventId/round/:roundId`

**Accessibility:** 
- ✅ Admin
- ✅ Category Lead
- ✅ Event Coordinator
- ✅ Faculty
- ❌ Volunteer
- ❌ Student
- **Requires:** Authentication Token + Event Authority

**Purpose:** Delete results for a round

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |
| roundId | string | Yes | Round ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Results deleted"
}
```

---

# 3. CERTIFICATE MANAGEMENT ENDPOINTS

## 3.1 Get Certificate by Certificate ID

**Endpoint:** `GET /api/v1/certificates/certificate/:certificateId`

**Accessibility:** 
- ✅ Public (No authentication required)

**Purpose:** Retrieve a specific certificate by its unique ID

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| certificateId | string | Yes | Certificate ID (e.g., "JGN26-CERT-ABC123") |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "cert_123",
    "user": {
      "_id": "user_1",
      "name": "John Doe",
      "email": "john@example.com",
      "jnanagniId": "JGN2025001"
    },
    "type": "excellence",
    "event": {
      "_id": "evt_123",
      "name": "Hackathon 2026",
      "date": "2026-01-23"
    },
    "registration": {
      "_id": "reg_123",
      "teamName": "Team Alpha"
    },
    "rank": 1,
    "roundReached": "Final",
    "isWinner": true,
    "winnerRank": 1,
    "certificateId": "JGN26-CERT-ABC123",
    "isGenerated": true,
    "issuedAt": "2026-01-23T11:00:00Z"
  },
  "message": "Certificate fetched"
}
```

**Error Responses:**

1. **Certificate not found (404)**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Certificate not found"
}
```

---

## 3.2 Get All Certificates for an Event

**Endpoint:** `GET /api/v1/certificates/event/:eventId/all`

**Accessibility:** 
- ✅ Public (No authentication required)

**Purpose:** Get all certificates (participation, completion, winner) for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "cert_001",
      "user": {
        "_id": "user_1",
        "name": "John Doe",
        "email": "john@example.com",
        "jnanagniId": "JGN2025001"
      },
      "type": "excellence",
      "isWinner": true,
      "winnerRank": 1,
      "roundReached": "Final",
      "certificateId": "JGN26-CERT-001",
      "registration": {
        "_id": "reg_001",
        "teamName": "Team Alpha"
      }
    },
    {
      "_id": "cert_002",
      "user": {...},
      "type": "participation",
      "isWinner": false,
      "roundReached": "Semi-Final",
      "certificateId": "JGN26-CERT-002",
      "registration": {...}
    }
  ],
  "message": "Certificates fetched"
}
```

---

## 3.3 Get Winner Certificates for an Event

**Endpoint:** `GET /api/v1/certificates/event/:eventId/winners-certificates`

**Accessibility:** 
- ✅ Public (No authentication required)

**Purpose:** Get only winner certificates (top 3) for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "cert_001",
      "user": {
        "_id": "user_1",
        "name": "John Doe",
        "email": "john@example.com",
        "jnanagniId": "JGN2025001"
      },
      "type": "excellence",
      "isWinner": true,
      "winnerRank": 1,
      "roundReached": "Final",
      "registration": {
        "_id": "reg_001",
        "teamName": "Team Alpha"
      }
    },
    {
      "_id": "cert_002",
      "user": {...},
      "type": "completion",
      "isWinner": true,
      "winnerRank": 2,
      "registration": {...}
    },
    {
      "_id": "cert_003",
      "user": {...},
      "type": "completion",
      "isWinner": true,
      "winnerRank": 3,
      "registration": {...}
    }
  ],
  "message": "Winner certificates fetched"
}
```

---

## 3.4 Get Final Winners for an Event

**Endpoint:** `GET /api/v1/certificates/event/:eventId/winners`

**Accessibility:** 
- ✅ Public (No authentication required)

**Purpose:** Get final winners (alternative endpoint, same as winners-certificates)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "cert_001",
      "user": {...},
      "type": "excellence",
      "isWinner": true,
      "winnerRank": 1,
      "registration": {
        "_id": "reg_001",
        "teamName": "Team Alpha",
        "registeredBy": "user_1"
      }
    }
  ],
  "message": "Winners fetched"
}
```

---

## 3.5 Get Participation Certificates for an Event

**Endpoint:** `GET /api/v1/certificates/event/:eventId/participation`

**Accessibility:** 
- ✅ Public (No authentication required)

**Purpose:** Get participation certificates for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "cert_004",
      "user": {
        "_id": "user_4",
        "name": "Alice Brown",
        "email": "alice@example.com",
        "jnanagniId": "JGN2025004"
      },
      "type": "participation",
      "isWinner": false,
      "roundReached": "Preliminary",
      "registration": {
        "_id": "reg_004",
        "teamName": "Team Delta"
      }
    }
  ],
  "message": "Participation certificates fetched"
}
```

---

## 3.6 Get Completion Certificates for an Event

**Endpoint:** `GET /api/v1/certificates/event/:eventId/completion`

**Accessibility:** 
- ✅ Public (No authentication required)

**Purpose:** Get completion certificates for an event

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | string | Yes | Event ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "cert_002",
      "user": {
        "_id": "user_2",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "jnanagniId": "JGN2025002"
      },
      "type": "completion",
      "isWinner": true,
      "winnerRank": 2,
      "roundReached": "Final",
      "registration": {
        "_id": "reg_002",
        "teamName": "Team Beta"
      }
    }
  ],
  "message": "Completion certificates fetched"
}
```

---

## 3.7 Get All Certificates for a User

**Endpoint:** `GET /api/v1/certificates/user/:userId`

**Accessibility:** 
- ✅ Authenticated users only
- **Requires:** Authentication Token

**Purpose:** Get all certificates earned by a specific user

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID |

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "cert_001",
      "type": "excellence",
      "isWinner": true,
      "winnerRank": 1,
      "roundReached": "Final",
      "event": {
        "_id": "evt_123",
        "name": "Hackathon 2026",
        "date": "2026-01-23"
      },
      "registration": {
        "_id": "reg_001",
        "teamName": "Team Alpha"
      }
    },
    {
      "_id": "cert_004",
      "type": "participation",
      "isWinner": false,
      "roundReached": "Semi-Final",
      "event": {
        "_id": "evt_124",
        "name": "Coding Challenge 2026",
        "date": "2026-01-25"
      },
      "registration": {...}
    }
  ],
  "message": "Certificates fetched"
}
```

---

# 4. AUTHENTICATION & AUTHORIZATION

## 4.1 Authentication Header

All protected endpoints require an Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 4.2 User Roles & Permissions

| Role | Attendance | Results | Certificates | Admin |
|------|-----------|---------|--------------|-------|
| Admin | ✅ All | ✅ All | ✅ All | ✅ |
| Faculty | Mark only | ✅ Create, Publish | ✅ View | ❌ |
| Event Coordinator | ✅ All | ✅ All | ✅ View | ❌ |
| Category Lead | Mark, Stats | ✅ All | ✅ View | ❌ |
| Volunteer | Mark only | ❌ | ❌ | ❌ |
| Student | ❌ | ❌ | ✅ Own | ❌ |

---

# 5. ERROR HANDLING

## Standard Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "data": null
}
```

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 403 | Forbidden - User not authorized |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource conflict (e.g., duplicate) |
| 500 | Internal Server Error |

---

# 6. RATE LIMITING & PAGINATION

Currently no rate limiting is enforced. Future implementations may include:
- Request throttling per IP
- Pagination for large result sets
- Cache headers for GET requests

---

# 7. WEBHOOK/REAL-TIME UPDATES

Currently, all updates are synchronous. Certificate generation and status updates happen immediately upon:
- Attendance marking
- Results publishing
- Results unpublishing

---

# 8. DATA VALIDATION RULES

### Event Round Names
- Must be non-empty string
- Final round must be named "Final" for winner certificate generation
- Examples: "Preliminary", "Semi-Final", "Final"

### Registration IDs
- Must be valid MongoDB ObjectId
- Must belong to the specified event
- Must have status="active"

### Team Size (Group Events)
- Minimum team size validation enforced
- Can be overridden with `force=true` flag in attendance marking

### Ranks
- Can be auto-assigned if not provided
- Must be unique within a round
- Duplicate ranks will use the last provided rank

---

# 9. EXAMPLES

### Example 1: Complete Event Flow

**Step 1: Create Event with Rounds**
```
Already created via Event API
Event: Hackathon 2026
Rounds: Preliminary, Semi-Final, Final
```

**Step 2: Activate Round 1**
```
PUT /api/v1/results/evt_123/rounds/rnd_001/activate
```

**Step 3: Mark Attendance**
```
POST /api/v1/attendance/mark
{
  "jnanagniId": "JGN2025001",
  "eventId": "evt_123",
  "roundId": "rnd_001"
}
→ Participation certificate created: roundReached="Preliminary"
```

**Step 4: Create Results**
```
POST /api/v1/results/evt_123/round/rnd_001
{
  "results": [...],
  "qualifiedRegistrations": [...]
}
→ Draft results created
```

**Step 5: Publish Results**
```
PUT /api/v1/results/evt_123/round/rnd_001/publish
→ Certificates updated with roundReached="Preliminary"
→ qualifiedForNextRound officially set
```

**Step 6: Activate Round 2**
```
PUT /api/v1/results/evt_123/rounds/rnd_002/activate
```

**Step 7: Mark Attendance (Qualified User)**
```
POST /api/v1/attendance/mark
{
  "jnanagniId": "JGN2025001",
  "eventId": "evt_123",
  "roundId": "rnd_002"
}
→ Only qualified users allowed
→ Certificate updated: roundReached="Semi-Final"
```

**... (Repeat for Round 2)**

**Step N: Publish Final Results**
```
PUT /api/v1/results/evt_123/round/rnd_003/publish
→ Top 3 certificates auto-generated:
  - Winner 1: type="excellence"
  - Winner 2 & 3: type="completion"
```

**Step N+1: View Results**
```
GET /api/v1/certificates/event/evt_123/winners
→ Returns top 3 winners with their certificates
```

---

# 10. VERSIONING

Current API Version: **v1**

All endpoints are prefixed with `/api/v1/`

Future versions (v2, v3) may introduce breaking changes.

---

**Last Updated:** January 23, 2026
**API Status:** Production Ready
