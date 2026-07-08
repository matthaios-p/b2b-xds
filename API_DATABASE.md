# Database Integration & Order Management API

## Overview

The backend now includes persistent storage for quotes via PostgreSQL. Quotes can be saved as orders with full tracking and status management.

## Database Schema

### clients table
- `id` (SERIAL PRIMARY KEY) - Client identifier
- `name` (VARCHAR 255) - Client name
- `email` (VARCHAR 255 UNIQUE) - Client email
- `created_at` (TIMESTAMP) - Record creation time

### orders table
- `id` (SERIAL PRIMARY KEY) - Order identifier
- `client_id` (INTEGER FK) - Reference to clients table
- `raw_prompt` (TEXT) - Original customer description
- `parsed_dimensions_json` (JSONB) - Structured dimensions and specifications
- `estimated_volume` (DECIMAL) - Material volume in cm³
- `total_cost` (DECIMAL) - Final calculated cost in USD
- `status` (VARCHAR 50) - Order status (pending, confirmed, processing, completed, cancelled)
- `created_at` (TIMESTAMP) - Order creation time
- `updated_at` (TIMESTAMP) - Last update time

Indexes created on: client_id, status, created_at, email

## API Endpoints

### 1. Generate Quote (No Persistence)
```
POST /api/quote
```

**Purpose**: Get a quote without saving to database

**Request**:
```json
{
  "prompt": "I need 3D printed letters for 'CAFE', 50cm height, 5cm depth, hollowed"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "specifications": {
    "design_description": "Letters spelling CAFE",
    "width_cm": 50,
    "depth_cm": 5,
    "height_cm": 50,
    "material_type": "resin",
    "is_hollowed": true,
    "wall_thickness_cm": 0.3,
    "quantity": 1,
    "notes": ""
  },
  "pricing_per_unit": {
    "material_volume_cm3": 1242.75,
    "material_volume_with_waste_cm3": 1429.16,
    "material_cost_usd": 214.37,
    "labor_cost_usd": 325,
    "base_cost_usd": 50,
    "subtotal_usd": 589.37,
    "markup_percentage": 25,
    "total_usd": 736.71
  },
  "pricing_total": {
    "total_usd": 736.71,
    "quantity": 1
  }
}
```

---

### 2. Create Order (Generate Quote + Save to DB)
```
POST /api/orders
```

**Purpose**: Generate a quote and save it as a persistent order

**Request**:
```json
{
  "prompt": "I need 3D printed letters for 'CAFE', 50cm height, 5cm depth, hollowed",
  "clientId": 1
}
```

Note: `clientId` is optional. Defaults to 1 (test client). Must exist in clients table.

**Response** (201 Created):
```json
{
  "success": true,
  "order": {
    "id": 42,
    "client_id": 1,
    "total_cost": "736.71",
    "estimated_volume": "1242.75",
    "status": "pending",
    "created_at": "2026-07-08T16:15:00.000Z",
    "specifications": {
      "design_description": "Letters spelling CAFE",
      "width_cm": 50,
      "depth_cm": 5,
      "height_cm": 50,
      "material_type": "resin",
      "is_hollowed": true,
      "wall_thickness_cm": 0.3,
      "quantity": 1
    }
  }
}
```

---

### 3. Retrieve Client Orders
```
GET /api/orders/:clientId
```

**Purpose**: Get all orders for a specific client

**Example**:
```
GET /api/orders/1
```

**Response** (200 OK):
```json
{
  "success": true,
  "client_id": 1,
  "orders": [
    {
      "id": 42,
      "total_cost": "736.71",
      "estimated_volume": "1242.75",
      "status": "pending",
      "created_at": "2026-07-08T16:15:00.000Z",
      "specifications": { ... }
    },
    {
      "id": 41,
      "total_cost": "456.28",
      "estimated_volume": "850.00",
      "status": "completed",
      "created_at": "2026-07-08T15:45:00.000Z",
      "specifications": { ... }
    }
  ]
}
```

---

### 4. Update Order Status
```
PATCH /api/orders/:orderId/status
```

**Purpose**: Change order status through workflow

**Example**:
```
PATCH /api/orders/42/status
```

**Request**:
```json
{
  "status": "confirmed"
}
```

**Valid Statuses**:
- `pending` - New order, not yet reviewed
- `confirmed` - Client has confirmed the order
- `processing` - Production started
- `completed` - Order fulfilled
- `cancelled` - Order cancelled

**Response** (200 OK):
```json
{
  "success": true,
  "order": {
    "id": 42,
    "client_id": 1,
    "total_cost": "736.71",
    "estimated_volume": "1242.75",
    "status": "confirmed",
    "created_at": "2026-07-08T16:15:00.000Z",
    "updated_at": "2026-07-08T16:20:00.000Z"
  }
}
```

---

## Error Handling

All endpoints return structured error responses:

**Invalid Input** (400):
```json
{
  "success": false,
  "error": "Invalid client ID. Please provide a valid numeric ID."
}
```

**Resource Not Found** (500):
```json
{
  "success": false,
  "error": "Client with ID 999 not found"
}
```

**Server Error** (500):
```json
{
  "success": false,
  "error": "Failed to save order: connection refused"
}
```

---

## Database Connection

Connection details are configured via environment variables:

```env
DB_HOST=postgres          # PostgreSQL host
DB_PORT=5432              # PostgreSQL port
DB_USER=signage_user      # Database user
DB_PASSWORD=signage_password  # Database password
DB_NAME=signage_db        # Database name
```

The connection pool:
- Maintains up to 20 idle connections
- Uses parameterized queries to prevent SQL injection
- Logs query execution times
- Handles connection errors gracefully

---

## SQL Injection Prevention

All database operations use parameterized queries with numbered placeholders:

```javascript
// ✓ SAFE - Uses parameterized query
const result = await db.query(
  'SELECT * FROM orders WHERE id = $1 AND client_id = $2',
  [orderId, clientId]
);

// ✗ UNSAFE - String interpolation (DO NOT USE)
const result = await db.query(
  `SELECT * FROM orders WHERE id = ${orderId}`
);
```

---

## Testing with cURL

### Generate and save quote:
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I need 3D printed signage for HELLO, 40cm tall, 5cm thick, solid",
    "clientId": 1
  }'
```

### Retrieve client orders:
```bash
curl http://localhost:5000/api/orders/1
```

### Update order status:
```bash
curl -X PATCH http://localhost:5000/api/orders/42/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

---

## Future Enhancements

- Add client creation endpoint
- Add order search/filtering
- Add batch operations
- Add audit logging
- Add soft deletes
- Add revision history
