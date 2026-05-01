## Express Auth + Notes CRUD API

This project includes a backend API with:
- Signup
- Email verification
- Login with JWT access + refresh tokens
- User-scoped Notes CRUD (each note belongs to an authenticated user)
- A simple Next.js frontend connected to the backend

### 1) Setup

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required:
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional for development:
- `ALLOW_IN_MEMORY_DB=true` (if local MongoDB is down, API will auto-start with in-memory Mongo)

Email:
- If SMTP variables are provided, real email sending is used.
- If SMTP variables are not provided, Ethereal test email is used and preview link is logged in the terminal.

### 2) Run API

```bash
npm run api
```

Server runs on `http://localhost:5000` by default.

### 3) Run Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

If needed, set this in frontend env:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 4) API Endpoints

#### Auth
- `POST /api/auth/signup`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

#### Notes (Protected)
Add header:
`Authorization: Bearer <accessToken>`

- `POST /api/notes`
- `GET /api/notes`
- `GET /api/notes/:id`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

### 5) Sample Request Bodies

Signup:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Login:
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Create note:
```json
{
  "title": "First Note",
  "content": "This note is linked to my user ID.",
  "completed": false
}
```
