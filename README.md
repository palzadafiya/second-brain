# Second Brain

AI-powered personal link manager – save any URL, get an instant GPT-4 summary & tags, and chat with your own knowledge base.



## Demo
- https://drive.google.com/file/d/1nXVq1QEo_BoPxoDM-S7EI6ulpJdx_s4x/view?usp=sharing

---

## ✨ Features

| Front-End (React) | Back-End (Node) |
|-------------------|-----------------|
| Vite + TypeScript + Tailwind | Express + TypeScript + Prisma |
| Auth flow (register / login / logout) | Supabase Postgres + pgvector |
| Dashboard of saved links | GPT-4 summary / tag generation |
| "Fetch & Preview" before saving | Embeddings (text-embedding-ada-002) |
| Chat UI that cites related links | Vector similarity search |


---

## ⚙️  Prerequisites
* Node.js ≥ 18
* Supabase project (or self-hosted Postgres ≥ 14 with `pgvector`)
* OpenAI API key

---

## 🚀 Quick-start (local)
```bash
# 1. Clone
$ git clone https://github.com/palzadafiya/second-brain.git
$ cd second-brain

# 2. Install deps
$ cd backend  && npm i && cd ..
$ cd frontend && npm i && cd ..

# 3. Environment variables
$ cp backend/.env.example   backend/.env   # fill SUPABASE_*, OPENAI_API_KEY
$ cp frontend/.env.example  frontend/.env  # VITE_API_URL=http://localhost:5000/api

# 4. Database (inside backend)
$ cd backend
$ npx prisma migrate dev                                # Prisma schema
$ Run prisma/supabase-setup.sql in supabase sql editor  # pgvector index + RPC

# 5. Start dev servers (two terminals)
$ cd backend  && npm run dev   # http://localhost:5000
$ cd frontend && npm run dev   # http://localhost:5173
```
Open http://localhost:5173 – register, add a link, ask the chat ✨

---

## 🔑  Environment variables
### backend/.env
| Key | Purpose |
|-----|---------|
| SUPABASE_URL | your-project.supabase.co |
| SUPABASE_SERVICE_KEY | service-role key (bypasses RLS) |
| OPENAI_API_KEY | GPT-4 + embeddings |
| PORT | API port (default 5000) |

### Guide: 
- DATABASE_URL & DIRECT_URL: Connect > ORMs
- SUPABASE_URL & SUPABASE_KEY: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- SUPABASE_SERVICE_KEY: Settings > API Keys

### frontend/.env
| Key | Purpose |
|-----|---------|
| VITE_API_URL | URL of backend API |

---

## 📜 API reference
Base URL `/api`

### Auth
| Method | Endpoint | Body |
|--------|----------|------|
| POST | /auth/register | `{email,password,name?}` |
| POST | /auth/login | `{email,password}` |

### Links
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | /links | list links |
| POST | /links | body `{url}` – save link |
| GET | /links/preview?url= | fetch metadata, summary, tags only |
| GET | /links/:id | single link |
| PUT | /links/:id | update title / tags |
| DELETE | /links/:id | remove link |

### Chat
`POST /chat` – body `{query}` → returns `{response, similarLinks}`

All routes except register/login require `Authorization: Bearer <JWT>`.

---

## 🧑‍💻  User guide
1. **Register / Login**.
2. **Add Link** – use *Fetch & Preview* to inspect before saving.
3. **Chat** – ask questions; AI cites the most relevant saved links.
4. **View Details** – click a card for full summary & metadata.
5. **Delete** – remove when no longer needed.
6. **Logout** – top-right button.

---

## 🛠️  Dev scripts
| Command | Location | Description |
|---------|----------|-------------|
| npm run dev | backend | Nodemon + ts-node |
| npm run dev | frontend | Vite dev server |
| npm run build | frontend | Production build |
| npx prisma studio | backend | DB viewer |

---

## 📄 License
MIT © 2024 Palzadafiya





