# CommuniSync AI: The Smart Neighborhood Operating System

CommuniSync AI is a modern, enterprise-ready smart community management SaaS application designed to digitize residential complexes, apartments, and gated societies. It integrates role-based dashboards, secure visitor transits, conflict-free calendars, and Retrieval-Augmented Generation (RAG) virtual assistant bots.

---

## 🛠️ Tech Stack & Integrations

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, TanStack Query, React Hook Form, Zod.
- **Backend:** Firebase Auth, Firestore, Firebase Storage.
- **AI Stack:** Gemini Pro API (`gemini-2.5-flash`), Gemini Embeddings (`text-embedding-004`), local cosine similarity vector-search mapping.
- **Utilities:** PDF compilation (`pdf-lib`), QR Code generation (`qrcode`), Chart elements (`recharts`), canvas-confetti.
- **DevOps:** multi-stage Docker builds, docker-compose.

---

## 🗝️ Developer Quick-Access Presets

For testing, a complete local localStorage mock sandbox is pre-configured. If you launch the app without Firebase configuration keys, it will initialize in mock mode automatically with the following logins (use any password, e.g., `password`):

| Role | Email | Preset Name | Gate / Specialty |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@communisync.com` | Aravind Swamy | Board Executive |
| **🏠 Resident** | `resident@communisync.com` | Vikram Seth | Tower A - 501 |
| **🔧 Technician** | `plumber@communisync.com` | Ramesh Kumar | Plumbing specialty |
| **👮 Guard** | `guard@communisync.com` | Bahadur Singh | Gate 1, day shift |

---

## 🚀 Getting Started

### 1. Prerequisite Installations
Verify that Node.js v20+ and npm are installed on your workstation.

### 2. Standard Development Launch
Clone the workspace repository, navigate to the folder, and run:
```bash
# Install packages
npm install

# Launch next dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Standalone Run
To test production compilation:
```bash
# Build
npm run build

# Start production server
npm run start
```

### 4. Running with Docker Compose
Or orchestrate the container locally:
```bash
docker-compose up --build
```
This maps port 3000 to the container and launches the Next.js production build standalone.

---

## 📂 Project Architecture

```
Smart-ai/
├── app/                        # Next.js 15 Router Pages & API routes
│   ├── (auth)/                 # SignIn / SignUp views
│   ├── (dashboard)/            # RBAC Protected dashboards (Resident, Tech, Guard, Admin)
│   └── api/                    # Server endpoints (AI stream, Report PDFs, classify)
├── components/                 # Shared UI cards, overlays, sidebars, buttons, selectors
├── features/                   # Core Feature modules (Complaints, Bookings, Visitors, Notices)
├── hooks/                      # State handlers (useAuth, useToast, context listeners)
├── services/                   # External adapters (database CRUD, Gemini AI, pdf-lib)
├── firebase/                   # Firebase Client & Admin SDK Initializers
├── lib/                        # Mathematics helpers (cosineSimilarity vector searches)
└── docker/                     # Standalone deploy Dockerfile
```
