# PocketBase Setup

## 1. Download PocketBase

Download the latest PocketBase binary for your OS from:
https://pocketbase.io/docs/

Place the binary in this `pocketbase/` directory.

## 2. Start PocketBase

```bash
cd pocketbase
./pocketbase serve
```

PocketBase will start at http://127.0.0.1:8090

## 3. Create Admin Account

Visit http://127.0.0.1:8090/_/ and create your admin account.

## 4. Create Collections

Go to the Collections tab and create the following:

---

### Collection: `users` (Auth collection — already exists by default)

Add these extra fields:
- `name` — Text, required
- `avatar` — File (optional)

---

### Collection: `habits`

Type: Base

Fields:
| Name | Type | Required | Options |
|------|------|----------|---------|
| user_id | Relation (users) | ✅ | |
| name | Text | ✅ | |
| type | Select | ✅ | Values: good, bad |
| category | Text | ✅ | |
| icon | Text | ✅ | |
| color | Text | ✅ | |
| frequency | Select | ✅ | Values: daily, weekly |
| target_per_day | Number | ✅ | Min: 1 |
| is_active | Bool | ✅ | Default: true |

API Rules:
- List/Search: `user_id = @request.auth.id`
- View: `user_id = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `user_id = @request.auth.id`
- Delete: `user_id = @request.auth.id`

---

### Collection: `habit_logs`

Type: Base

Fields:
| Name | Type | Required | Options |
|------|------|----------|---------|
| habit_id | Relation (habits) | ✅ | |
| date | Text | ✅ | (YYYY-MM-DD format) |
| status | Select | ✅ | Values: done, missed |

API Rules:
- List/Search: `habit_id.user_id = @request.auth.id`
- View: `habit_id.user_id = @request.auth.id`
- Create: `@request.auth.id != "" && habit_id.user_id = @request.auth.id`
- Update: `habit_id.user_id = @request.auth.id`
- Delete: `habit_id.user_id = @request.auth.id`

---

### Collection: `journal_entries`

Type: Base

Fields:
| Name | Type | Required | Options |
|------|------|----------|---------|
| user_id | Relation (users) | ✅ | |
| date | Text | ✅ | (YYYY-MM-DD format) |
| good_text | Text | | Long text |
| bad_text | Text | | Long text |
| journal_text | Text | | Long text |

API Rules:
- List/Search: `user_id = @request.auth.id`
- View: `user_id = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `user_id = @request.auth.id`
- Delete: `user_id = @request.auth.id`

---

## 5. Enable Email Auth

In Settings > Auth, make sure Email/Password auth is enabled for the `users` collection.

## 6. CORS Settings

In Settings > Application, add your frontend URL to the allowed origins:
- `http://localhost:3000` (development)
- Your production URL

---

That's it! Your PocketBase backend is ready.
