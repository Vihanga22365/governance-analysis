# Governance API with Firebase Realtime Database

NestJS API for managing governance basic details with Firebase Realtime Database integration.

## Features

- ✅ POST API to insert governance details
- ✅ Firebase Realtime Database integration
- ✅ Input validation with class-validator
- ✅ Proper error handling
- ✅ TypeScript support
- ✅ Modular architecture

## Project Structure

```
src/
├── config/
│   ├── firebase.config.ts    # Firebase Admin SDK configuration
│   └── firebase.module.ts    # Firebase module
├── governance/
│   ├── dto/
│   │   └── create-governance.dto.ts  # Data Transfer Objects
│   ├── interfaces/
│   │   └── governance.interface.ts   # TypeScript interfaces
│   ├── governance.controller.ts      # API endpoints
│   ├── governance.service.ts         # Business logic
│   └── governance.module.ts          # Governance module
├── app.module.ts
└── main.ts
```

## Installation

1. Install dependencies:

```bash
npm install
npm install firebase-admin class-validator class-transformer @nestjs/config
```

2. Set up Firebase:
   - Go to Firebase Console (https://console.firebase.google.com)
   - Create a new project or select existing
   - Enable Realtime Database
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

3. Create `.env` file in the root directory:

```env
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Create Governance Details (POST)

**Endpoint:** `POST /governance`

**Request Body:**

```json
{
  "governance_id": "GOV-001",
  "user_name": "John Doe",
  "use_case": "Data Privacy Compliance",
  "relevant_documents": [
    {
      "documentName": "Privacy Policy",
      "documentUrl": "https://example.com/privacy-policy.pdf",
      "description": "Company privacy policy document"
    },
    {
      "documentName": "GDPR Compliance",
      "documentUrl": "https://example.com/gdpr.pdf",
      "description": "GDPR compliance guidelines"
    }
  ]
}
```

**Response (Success - 201):**

```json
{
  "message": "Governance details created successfully",
  "data": {
    "governance_id": "GOV-001",
    "user_name": "John Doe",
    "use_case": "Data Privacy Compliance",
    "relevant_documents": [...],
    "created_at": "2025-11-25T10:30:00.000Z",
    "updated_at": "2025-11-25T10:30:00.000Z"
  }
}
```

**Response (Error - 400):**

```json
{
  "statusCode": 400,
  "message": "Governance with ID GOV-001 already exists",
  "error": "Bad Request"
}
```

### Get All Governance Details (GET)

**Endpoint:** `GET /governance`

**Response:**

```json
{
  "message": "Governance details fetched successfully",
  "data": [
    {
      "id": "unique-firebase-key",
      "governance_id": "GOV-001",
      "user_name": "John Doe",
      "use_case": "Data Privacy Compliance",
      "relevant_documents": [...],
      "created_at": "2025-11-25T10:30:00.000Z",
      "updated_at": "2025-11-25T10:30:00.000Z"
    }
  ]
}
```

### Get Governance by ID (GET)

**Endpoint:** `GET /governance/:governanceId`

**Example:** `GET /governance/GOV-001`

**Response:**

```json
{
  "message": "Governance details fetched successfully",
  "data": {
    "id": "unique-firebase-key",
    "governance_id": "GOV-001",
    "user_name": "John Doe",
    "use_case": "Data Privacy Compliance",
    "relevant_documents": [...],
    "created_at": "2025-11-25T10:30:00.000Z",
    "updated_at": "2025-11-25T10:30:00.000Z"
  }
}
```

## Validation Rules

### Required Fields:

- `governance_id` - String, not empty
- `user_name` - String, not empty
- `use_case` - String, not empty

### Optional Fields:

- `relevant_documents` - Array of document objects (can be empty or omitted)

### Document Object Structure:

- `documentName` - String, required if document is provided
- `documentUrl` - String, required if document is provided
- `description` - String, optional

## Firebase Database Structure

Data is stored in Firebase Realtime Database under the path:

```
governance_basic_details/
  ├── {unique-key-1}/
  │   ├── governance_id: "GOV-001"
  │   ├── user_name: "John Doe"
  │   ├── use_case: "Data Privacy Compliance"
  │   ├── relevant_documents: [...]
  │   ├── created_at: "2025-11-25T10:30:00.000Z"
  │   └── updated_at: "2025-11-25T10:30:00.000Z"
  └── {unique-key-2}/
      └── ...
```

## Testing with Postman/cURL

```bash
# Create governance details
curl -X POST http://localhost:3000/governance \
  -H "Content-Type: application/json" \
  -d '{
    "governance_id": "GOV-001",
    "user_name": "John Doe",
    "use_case": "Data Privacy Compliance",
    "relevant_documents": [
      {
        "documentName": "Privacy Policy",
        "documentUrl": "https://example.com/privacy-policy.pdf",
        "description": "Company privacy policy document"
      }
    ]
  }'

# Get all governance details
curl http://localhost:3000/governance

# Get specific governance by ID
curl http://localhost:3000/governance/GOV-001
```

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid input or duplicate governance_id
- **500 Internal Server Error**: Database connection issues or unexpected errors

## Notes

- The `relevant_documents` field is optional and can accept 0 or more documents
- Duplicate `governance_id` values are prevented
- All dates are stored in ISO 8601 format
- CORS is enabled for cross-origin requests
- Global validation pipe ensures data integrity
