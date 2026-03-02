# API Documentation

Complete API reference for School Picks backend.

**Base URL (Development):** `http://localhost:5000/api`  
**Base URL (Production):** `https://your-domain.com/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Games](#games)
- [Teams](#teams)
- [Bets](#bets)
- [Prop Bets](#prop-bets)
- [Transactions](#transactions)
- [Notifications](#notifications)
- [Error Responses](#error-responses)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "balance": 1000,
    "is_admin": false,
    "created_at": "2026-01-14T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid email, etc.)
- `409` - User already exists

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "balance": 1000,
    "is_admin": false,
    "created_at": "2026-01-14T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

## Users

### Get Current User Profile

Get authenticated user's profile information.

**Endpoint:** `GET /users/profile`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "balance": 1000,
  "is_admin": false,
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T10:30:00Z"
}
```

---

### Get User by ID

Get specific user's public profile.

**Endpoint:** `GET /users/:id`  
**Auth Required:** No

**Success Response (200):**
```json
{
  "id": 1,
  "username": "johndoe",
  "balance": 1500,
  "created_at": "2026-01-14T10:30:00Z"
}
```

---

### Get All Users

Get list of all users (admin only).

**Endpoint:** `GET /users`  
**Auth Required:** Yes (Admin)

**Success Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "balance": 1000,
      "is_admin": false,
      "created_at": "2026-01-14T10:30:00Z"
    }
  ]
}
```

---

### Update User Balance

Manually adjust user balance (admin only).

**Endpoint:** `PUT /users/:id/balance`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "balance": 2000,
  "reason": "Bonus reward for tournament win"
}
```

**Success Response (200):**
```json
{
  "message": "Balance updated successfully",
  "user": {
    "id": 1,
    "balance": 2000
  }
}
```

---

## Games

### Get All Games

Get list of visible games (or all games for admin).

**Endpoint:** `GET /games`  
**Auth Required:** No (but returns more data if authenticated)

**Query Parameters:**
- `status` (optional): Filter by status (`upcoming`, `active`, `completed`)
- `type` (optional): Filter by sport type

**Success Response (200):**
```json
{
  "games": [
    {
      "id": 1,
      "home_team": "Home Team",
      "away_team": "Away Team",
      "game_date": "2026-01-20",
      "game_time": "19:00:00",
      "location": "Home Gym",
      "status": "upcoming",
      "type": "basketball",
      "winning_odds": 1.5,
      "losing_odds": 2.0,
      "is_visible": true,
      "created_at": "2026-01-14T10:30:00Z"
    }
  ]
}
```

---

### Create Game

Create a new game (admin only).

**Endpoint:** `POST /games`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "team_id": 1,
  "team_type": "varsity",
  "home_team": "Home Team",
  "away_team": "Away Team",
  "game_date": "2026-01-20",
  "game_time": "19:00:00",
  "location": "Home Gym",
  "type": "basketball",
  "winning_odds": 1.5,
  "losing_odds": 2.0,
  "spread": 5.5,
  "spread_odds": 1.8,
  "over_under": 150.5,
  "over_odds": 1.9,
  "under_odds": 1.9,
  "notes": "Season opener",
  "is_visible": true
}
```

**Success Response (201):**
```json
{
  "message": "Game created successfully",
  "game": {
    "id": 1,
    "home_team": "Home Team",
    "away_team": "Away Team",
    "game_date": "2026-01-20",
    "status": "upcoming"
  }
}
```

---

### Update Game

Update existing game (admin only).

**Endpoint:** `PUT /games/:id`  
**Auth Required:** Yes (Admin)

**Request Body:** (same as create, all fields optional)

**Success Response (200):**
```json
{
  "message": "Game updated successfully",
  "game": { /* updated game object */ }
}
```

---

### Toggle Game Visibility

Show or hide game from users (admin only).

**Endpoint:** `PUT /games/:id/visibility`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "is_visible": false
}
```

**Success Response (200):**
```json
{
  "message": "Game visibility updated",
  "game": {
    "id": 1,
    "is_visible": false
  }
}
```

---

### Set Game Outcome

Mark game as completed and auto-resolve all bets (admin only).

**Endpoint:** `PUT /games/:id/outcome`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "result": "home_win",
  "home_score": 75,
  "away_score": 68
}
```

**Success Response (200):**
```json
{
  "message": "Game outcome set and bets resolved",
  "game": {
    "id": 1,
    "status": "completed",
    "result": "home_win",
    "home_score": 75,
    "away_score": 68
  },
  "bets_resolved": 15,
  "total_payout": 5420
}
```

---

### Delete Game

Delete a game (admin only).

**Endpoint:** `DELETE /games/:id`  
**Auth Required:** Yes (Admin)

**Success Response (200):**
```json
{
  "message": "Game deleted successfully"
}
```

---

## Teams

### Get All Teams

Get list of all teams.

**Endpoint:** `GET /teams`  
**Auth Required:** No

**Success Response (200):**
```json
{
  "teams": [
    {
      "id": 1,
      "name": "Varsity Basketball",
      "type": "varsity",
      "record_wins": 12,
      "record_losses": 3,
      "league_record": "8-2",
      "ranking": 3,
      "coach_name": "Coach Smith",
      "created_at": "2026-01-14T10:30:00Z"
    }
  ]
}
```

---

### Get Team by ID

Get specific team with full details including schedule and roster.

**Endpoint:** `GET /teams/:id`  
**Auth Required:** No

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Varsity Basketball",
  "type": "varsity",
  "description": "Our elite varsity basketball team",
  "record_wins": 12,
  "record_losses": 3,
  "league_record": "8-2",
  "ranking": 3,
  "coach_name": "Coach Smith",
  "coach_email": "coach@yourschool.edu",
  "coach_bio": "20 years coaching experience",
  "schedule": [
    {
      "date": "2026-01-20",
      "opponent": "Rival High",
      "location": "Home",
      "result": "TBD"
    }
  ],
  "players": [
    {
      "id": 1,
      "name": "John Doe",
      "number": 23,
      "position": "Guard",
      "grade": 12,
      "stats": {
        "ppg": 18.5,
        "rpg": 5.2,
        "apg": 4.1
      }
    }
  ],
  "created_at": "2026-01-14T10:30:00Z"
}
```

---

### Create Team

Create a new team (admin only).

**Endpoint:** `POST /teams`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "name": "JV Basketball",
  "type": "jv",
  "description": "Junior varsity basketball team",
  "record_wins": 0,
  "record_losses": 0,
  "coach_name": "Coach Johnson",
  "coach_email": "coachjv@yourschool.edu",
  "schedule": [],
  "players": []
}
```

**Success Response (201):**
```json
{
  "message": "Team created successfully",
  "team": { /* team object */ }
}
```

---

### Update Team

Update team information (admin only).

**Endpoint:** `PUT /teams/:id`  
**Auth Required:** Yes (Admin)

**Request Body:** (same as create, all fields optional)

**Success Response (200):**
```json
{
  "message": "Team updated successfully",
  "team": { /* updated team object */ }
}
```

---

## Bets

### Get User's Bets

Get authenticated user's betting history.

**Endpoint:** `GET /bets`  
**Auth Required:** Yes

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `resolved`)
- `outcome` (optional): Filter by outcome (`won`, `lost`)
- `limit` (optional): Number of results (default: 50)

**Success Response (200):**
```json
{
  "bets": [
    {
      "id": 1,
      "game_id": 1,
      "bet_type": "winner",
      "selected_team": "home",
      "amount": 100,
      "odds": 1.5,
      "potential_win": 150,
      "status": "pending",
      "outcome": null,
      "created_at": "2026-01-15T14:30:00Z",
      "game": {
        "home_team": "Home Team",
        "away_team": "Away Team",
        "game_date": "2026-01-20"
      }
    }
  ]
}
```

---

### Place Bet

Place a new bet on a game.

**Endpoint:** `POST /bets`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "game_id": 1,
  "bet_type": "winner",
  "selected_team": "home",
  "amount": 100,
  "odds": 1.5
}
```

**Bet Types:**
- `winner` - Bet on winning team
- `spread` - Bet on point spread
- `over_under` - Bet on total points

**Success Response (201):**
```json
{
  "message": "Bet placed successfully",
  "bet": {
    "id": 1,
    "amount": 100,
    "odds": 1.5,
    "potential_win": 150,
    "status": "pending"
  },
  "new_balance": 900
}
```

**Error Responses:**
- `400` - Invalid bet data, insufficient balance, game locked
- `404` - Game not found

---

### Get All Bets

Get all bets from all users (admin only).

**Endpoint:** `GET /bets/all`  
**Auth Required:** Yes (Admin)

**Success Response (200):**
```json
{
  "bets": [
    {
      "id": 1,
      "user_id": 1,
      "username": "johndoe",
      "game_id": 1,
      "amount": 100,
      "status": "pending",
      "created_at": "2026-01-15T14:30:00Z"
    }
  ],
  "stats": {
    "total_bets": 150,
    "pending": 45,
    "resolved": 105,
    "total_wagered": 25000
  }
}
```

---

## Prop Bets

### Get All Prop Bets

Get list of active proposition bets.

**Endpoint:** `GET /prop-bets`  
**Auth Required:** No

**Success Response (200):**
```json
{
  "propBets": [
    {
      "id": 1,
      "title": "Will the home team win by 10+ points?",
      "description": "Bet YES if the home team wins by 10 or more points",
      "team_type": "varsity",
      "yes_odds": 1.8,
      "no_odds": 2.2,
      "expires_at": "2026-01-20T19:00:00Z",
      "status": "active",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### Create Prop Bet

Create a new proposition bet (admin only).

**Endpoint:** `POST /prop-bets`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "title": "Will the home team score 80+ points?",
  "description": "Bet YES if the home team scores 80 or more points",
  "team_type": "varsity",
  "yes_odds": 1.6,
  "no_odds": 2.4,
  "expires_at": "2026-01-20T19:00:00Z"
}
```

**Success Response (201):**
```json
{
  "message": "Prop bet created successfully",
  "propBet": { /* prop bet object */ }
}
```

---

### Place Prop Bet

Bet on a proposition.

**Endpoint:** `POST /prop-bets/:id/bet`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "choice": "yes",
  "amount": 50
}
```

**Success Response (201):**
```json
{
  "message": "Prop bet placed successfully",
  "bet": {
    "id": 1,
    "choice": "yes",
    "amount": 50,
    "odds": 1.8,
    "potential_win": 90
  },
  "new_balance": 950
}
```

---

### Resolve Prop Bet

Set outcome for proposition bet (admin only).

**Endpoint:** `PUT /prop-bets/:id`  
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "status": "resolved",
  "outcome": "yes"
}
```

**Success Response (200):**
```json
{
  "message": "Prop bet resolved",
  "propBet": { /* updated prop bet */ },
  "bets_resolved": 24,
  "total_payout": 1850
}
```

---

## Transactions

### Get User Transactions

Get authenticated user's transaction history.

**Endpoint:** `GET /transactions`  
**Auth Required:** Yes

**Query Parameters:**
- `type` (optional): Filter by type (`bet`, `win`, `adjustment`)
- `limit` (optional): Number of results (default: 50)

**Success Response (200):**
```json
{
  "transactions": [
    {
      "id": 1,
      "type": "bet",
      "amount": -100,
      "description": "Bet placed on Home Team vs Away Team",
      "status": "completed",
      "created_at": "2026-01-15T14:30:00Z"
    },
    {
      "id": 2,
      "type": "win",
      "amount": 150,
      "description": "Won bet on Home Team vs Opponent",
      "status": "completed",
      "created_at": "2026-01-14T20:00:00Z"
    }
  ]
}
```

---

## Notifications

### Get User Notifications

Get authenticated user's notifications.

**Endpoint:** `GET /notifications`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "bet_won",
      "title": "You won your bet!",
      "message": "Congratulations! Your bet on the home team won. +$150",
      "is_read": false,
      "created_at": "2026-01-14T20:00:00Z"
    }
  ]
}
```

---

### Mark Notification as Read

Mark notification as read.

**Endpoint:** `PUT /notifications/:id/read`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error, invalid data)
- `401` - Unauthorized (not logged in or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate resource)
- `500` - Internal server error

---

## Rate Limiting

**Development:** No rate limiting  
**Production:** Recommended to implement rate limiting

Suggested limits:
- Authentication endpoints: 5 requests/minute
- Bet placement: 10 requests/minute
- General API: 100 requests/minute

---

## Pagination

For endpoints returning lists, use query parameters:

```
GET /bets?page=1&limit=20
```

Response includes pagination metadata:
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Webhooks (Future Feature)

Planned webhook support for:
- Game outcomes
- Bet resolutions
- Balance changes

---

## API Versioning

Current version: **v1** (implicit, no version in URL)

Future versions will use URL versioning:
- `/api/v1/...`
- `/api/v2/...`

---

## Additional Resources

- [Authentication Guide](CONTRIBUTING.md#authentication)
- [Security Best Practices](SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)

---

**Questions?** Open an issue on [GitHub](https://github.com/yourusername/school-picks/issues)
