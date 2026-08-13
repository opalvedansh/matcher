# Matcherc Backend API

REST API for the Matcherc brand ↔ influencer matching platform.

**Stack:** Node.js · Express · PostgreSQL · JWT

---

## Quick Start

```bash
cd backend
npm install

# 1. Copy env template and fill in values
cp .env.example .env

# 2. Create the database and run migration
createdb matcherc
psql matcherc -f migrations/001_init.sql

# 3. Start dev server (hot-reload)
npm run dev

# 4. Start production server
npm start
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/matcherc` |
| `JWT_SECRET` | Secret for signing JWTs (min 64 chars) | `a_very_long_random_string...` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `BCRYPT_ROUNDS` | bcrypt work factor | `10` |

---

## Authentication

All protected routes require a Bearer JWT in the Authorization header:

```
Authorization: Bearer <token>
```

---

## API Endpoints

### Auth  /api/auth

#### POST /api/auth/register
Register a new brand or influencer account.

**Body:** { "email": "...", "password": "...", "role": "brand" | "influencer" }
**Response 201:** { "token": "...", "user": { id, email, role, created_at } }

#### POST /api/auth/login
**Body:** { "email": "...", "password": "..." }
**Response 200:** { "token": "...", "user": { ... } }

#### GET /api/auth/me  [AUTH]
Returns the authenticated user's base record.

---

### Profiles  /api/profiles  [AUTH]

#### GET /api/profiles/me
Returns the full profile of the authenticated user.

#### PUT /api/profiles/me
Update own profile (supports partial updates).

Brand body fields: name, logo_url, cover_url, bio, categories[], location, budget_min, budget_max, campaign_types[], vibes[], website

Influencer body fields: name, avatar_url, cover_url, bio, categories[], location, age, gender, platforms[], followers, engagement_rate, avg_views, price_min, price_max

#### GET /api/profiles/:userId
Returns any user's public profile.

---

### Feed  /api/feed  [AUTH]

#### GET /api/feed?limit=10&offset=0
Returns paginated swipe candidates (opposite role, not yet swiped).

Response: { data: [...], limit, offset, count }

---

### Swipes  /api/swipes  [AUTH]

#### POST /api/swipes
Record a like or reject.

**Body:** { "swiped_id": "uuid", "direction": "like" | "reject" }

**Response 201 (no match):** { "swipe": {...}, "matched": false, "match": null }

**Response 201 (mutual match!):** { "swipe": {...}, "matched": true, "match": { id, matched_at } }

#### GET /api/swipes
Returns all swipes made by the current user.

---

### Matches  /api/matches  [AUTH]

#### GET /api/matches
Returns all active mutual matches with full profiles of both parties.

#### GET /api/matches/:matchId
Returns details of a specific match (only accessible to participants).

#### DELETE /api/matches/:matchId
Archives (soft-deletes) a match — the unmatch feature.

---

## Matching Algorithm

```
User A swipes "like" on User B
  -> INSERT into swipes (swiper=A, swiped=B, direction=like)
  -> Check: does a like already exist (swiper=B, swiped=A)?
      Yes -> INSERT into matches (brand_id, influencer_id) -> MATCH created
      No  -> no match yet
```

All within a single DB transaction. No race conditions. ON CONFLICT prevents duplicates.

---

## Error Format

{ "error": "message", "details": [ { "field": "email", "message": "..." } ] }

| Status | Meaning |
|---|---|
| 401 | Missing or invalid token |
| 403 | Wrong role |
| 404 | Not found |
| 409 | Duplicate (swipe, email) |
| 422 | Validation failed |
| 500 | Server error |

---

## Curl Examples

```bash
BASE=http://localhost:3000/api

# Register
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"brand@test.com","password":"pass1234","role":"brand"}'

# Login -> save token
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brand@test.com","password":"pass1234"}' | jq -r .token)

# Get swipe feed
curl $BASE/feed -H "Authorization: Bearer $TOKEN"

# Swipe like
curl -X POST $BASE/swipes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"swiped_id":"<influencer-uuid>","direction":"like"}'

# Get your matches
curl $BASE/matches -H "Authorization: Bearer $TOKEN"
```
