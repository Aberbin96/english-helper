# English B1→B2 Tracker — Technical Spec

## Overview

A lightweight web app (PWA) to track daily study habits, stage progress, vocabulary, and diary entries based on the 6-month learning plan. Hosted on Railway. Push notifications via Web Push API (no native app required — works from the browser home screen on iOS/Android).

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14** (App Router) | API routes + frontend in one repo, deploys cleanly to Railway |
| Database | **PostgreSQL** (Railway plugin) | Relational, free tier on Railway, handles all data needs |
| ORM | **Prisma** | Simple schema, auto-migrations, type-safe queries |
| Auth | **NextAuth.js** (email magic link) | No passwords, just email — simple for a solo app |
| Push Notifications | **Web Push API** + `web-push` npm package | Native browser push, no Firebase needed |
| Styling | **Tailwind CSS** | Fast, no design system overhead |
| Deployment | **Railway** | Auto-deploy from GitHub, PostgreSQL plugin built-in |

---

## Core Features

### 1. Stage & Progress Tracker
- User selects current stage (1 / 2 / 3) on onboarding
- Dashboard shows current stage, days elapsed, days remaining
- Auto-advances stage at month 2 and month 4 marks (or user triggers manually)

### 2. Daily Activity Log
Each day the user can check off completed blocks:
- [ ] Commute/break listening (podcast/article)
- [ ] Evening grammar study (Tue/Thu only)
- [ ] Bedtime diary entry
- [ ] Weekend production session (Sat/Sun only)

Weekly completion % shown as a simple progress bar.

### 3. Checkpoint Checklist (from `retos.md`)
Per stage, the 3 mini-challenges shown as checklist. User marks done manually. Completion unlocks next stage prompt.

### 4. Vocabulary Log
- Add 2–3 new words/day: word + definition + example sentence
- View history by date
- Simple search

### 5. Diary Entries
- Short text input (4–5 lines, soft cap ~300 chars)
- Saved per day, browsable history
- Optional: word count nudge if under 30 words

### 6. Push Notifications
Three daily reminders (user configures time):

| Notification | Default Time | Message |
|---|---|---|
| Morning commute | 08:00 | "Podcast time. Open BBC 6 Minute English." |
| Evening study | 20:30 | "Grammar block. 45 min tonight." (Tue/Thu only) |
| Bedtime diary | 22:30 | "Write 4 lines in English before you sleep." |

Weekend notification:
| Notification | Default Time | Message |
|---|---|---|
| Production session | 10:00 | "Production session today. 1.5–2 hours." |

User can enable/disable each and change times from settings.

---

## Data Model (Prisma)

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  currentStage  Int            @default(1)
  startDate     DateTime       @default(now())
  pushSub       String?        // Web Push subscription JSON
  notifSettings Json?          // per-notification time overrides
  logs          DailyLog[]
  vocab         VocabEntry[]
  diary         DiaryEntry[]
  checkpoints   Checkpoint[]
}

model DailyLog {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime
  blocks    Json     // { commute: bool, grammar: bool, diary: bool, production: bool }
  user      User     @relation(fields: [userId], references: [id])
}

model VocabEntry {
  id         String   @id @default(cuid())
  userId     String
  word       String
  definition String
  example    String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}

model DiaryEntry {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime
  content   String
  user      User     @relation(fields: [userId], references: [id])
}

model Checkpoint {
  id        String   @id @default(cuid())
  userId    String
  stage     Int
  number    Int      // 1, 2, or 3
  done      Boolean  @default(false)
  doneAt    DateTime?
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## App Structure

```
/app
  /                    → Dashboard (today's blocks, streak, stage)
  /log                 → Daily activity checkboxes
  /vocab               → Vocabulary log + add entry
  /diary               → Today's entry + history
  /checkpoints         → Stage challenge checklist
  /settings            → Notification times, stage override
/app/api
  /auth/[...nextauth]  → Magic link auth
  /push/subscribe      → Save Web Push subscription
  /push/send           → Trigger push (called by cron)
  /log                 → CRUD daily logs
  /vocab               → CRUD vocab entries
  /diary               → CRUD diary entries
  /checkpoints         → CRUD checkpoints
```

---

## Notifications Architecture

1. On first visit after login → browser prompts for notification permission
2. Frontend calls `POST /api/push/subscribe` with `PushSubscription` object → stored in `User.pushSub`
3. Railway cron job (or Vercel cron alternative) calls `POST /api/push/send` at scheduled times
4. `web-push` package sends notification to stored subscription

> Railway doesn't have native cron — use a lightweight cron service (e.g. `node-cron` running inside the same Next.js process via a custom server, or a separate Railway service with a simple Node script).

---

## Railway Deployment

```
# Required env vars
DATABASE_URL=           # auto-set by Railway PostgreSQL plugin
NEXTAUTH_SECRET=        # random string
NEXTAUTH_URL=           # your Railway domain
EMAIL_SERVER=           # SMTP for magic links (e.g. Resend or Mailtrap)
EMAIL_FROM=             # sender address
VAPID_PUBLIC_KEY=       # generated with web-push
VAPID_PRIVATE_KEY=      # generated with web-push
```

Generate VAPID keys once:
```bash
npx web-push generate-vapid-keys
```

---

## MVP Scope (Ship First)

1. Auth (magic link)
2. Dashboard with today's block checklist
3. Stage tracker
4. Checkpoint checklist
5. Push notification subscribe + one daily reminder

**Post-MVP:** Vocab log, diary, streak counter, weekly stats chart.
