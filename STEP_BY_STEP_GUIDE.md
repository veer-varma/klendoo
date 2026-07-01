// Copyright (c) 2026 Veer Varma. All rights reserved.

# Complete Step-by-Step Build Guide - Local to VPS

**Total Time:** ~4 hours  
**Difficulty:** Easy (copy-paste focused)  
**Outcome:** Full working Klendoo deployment on VPS

---

## PHASE 1: PREPARE YOUR WORKSPACE

### Step 1: Open Your Project in VS Code

1. Open VS Code
2. File → Open Folder
3. Select: `C:\Users\nikhi\Downloads\klendoo\klendoo`
4. Click "Open"

**You should see the project structure in the left sidebar**

### Step 2: Open BUILD_GUIDE.md

1. In VS Code left sidebar, find and click `BUILD_GUIDE.md`
2. Read the file (it contains all code you need to copy)
3. Keep this file open as reference

### Step 3: Open QUICK_BUILD_CHECKLIST.md

1. In VS Code, open `QUICK_BUILD_CHECKLIST.md`
2. This is your progress tracker
3. Keep this in a second tab

---

## PHASE 2: CREATE SPRINT 4 FILES (3 files - 30 mins)

### FILE 1: Update Root package.json

**Path:** `package.json` (in root directory)

**Steps:**
1. In VS Code, open `package.json` from root
2. Look for the `"scripts"` section
3. Find this line:
   ```
   "build": "echo 'Building Klendoo...'",
   ```
4. Replace it with:
   ```
   "build": "npm run build --workspaces --if-present",
   ```
5. Save file (Ctrl+S)
6. ✅ Check off File 1 in QUICK_BUILD_CHECKLIST.md

---

### FILE 2: Update Host Dashboard (Add Chat Tab)

**Path:** `apps/web/src/pages/host/dashboard.tsx`

**Steps:**
1. In VS Code, open this file
2. Go to line 1 (beginning of file)
3. Find this line (around line 5-10):
   ```typescript
   import { useRouter } from 'next/router';
   ```
4. Add this new import right after it:
   ```typescript
   import ChatWindow from '@/components/ChatWindow';
   ```
5. Find the tabs array (around line 15-30, looks like):
   ```typescript
   {[
     { id: 'overview', label: '📊 Overview' },
     { id: 'meetings', label: '🔗 Meetings' },
   ```
6. Add this new tab after 'overview':
   ```typescript
   { id: 'chat', label: '💬 Chat' },
   ```
7. Find section `{activeTab === 'overview' && (` (around line 40+)
8. Right after that closing `)}`, add this new section:
   ```typescript
   {/* Chat Tab */}
   {activeTab === 'chat' && (
     <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
       <h3 className="text-2xl font-black text-white mb-8">Schedule Meetings with AI</h3>
       <p className="text-purple-300/70 mb-6">
         Use natural language to schedule meetings. Just type what you need!
       </p>
       <ChatWindow hostName={hostName} mode="host" />
     </div>
   )}
   ```
9. Save file (Ctrl+S)
10. ✅ Check off File 2 in checklist

---

### FILE 3: Create useCalendar Hook

**Path:** `apps/web/src/hooks/useCalendar.ts`

**Steps:**
1. Right-click on `apps/web/src/hooks` folder in sidebar
2. New File
3. Type: `useCalendar.ts`
4. Open BUILD_GUIDE.md
5. Find section "File 3: Create useCalendar Hook"
6. Copy ALL the code (everything between the ``` marks)
7. Paste into the new useCalendar.ts file
8. Save (Ctrl+S)
9. ✅ Check off File 3 in checklist

---

## PHASE 3: CREATE SPRINT 5 FILES (6 files - 60 mins)

**NOTE:** These must be created in this exact order!

### FILE 4: calendar-core/src/index.ts

**Steps:**
1. Right-click on `packages/calendar-core/src` folder
2. New File
3. Type: `index.ts`
4. Open BUILD_GUIDE.md
5. Find "File 4: Create calendar-core/src/index.ts"
6. Copy the code
7. Paste into index.ts
8. Save (Ctrl+S)
9. ✅ Check off File 4

### FILE 5: calendar-core/src/types.ts

**Steps:**
1. Right-click on `packages/calendar-core/src` folder
2. New File
3. Type: `types.ts`
4. Open BUILD_GUIDE.md
5. Find "File 5: Create calendar-core/src/types.ts"
6. Copy the code
7. Paste into types.ts
8. Save (Ctrl+S)
9. ✅ Check off File 5

### FILE 6: calendar-core/src/google-calendar.ts

**Steps:**
1. Right-click on `packages/calendar-core/src` folder
2. New File
3. Type: `google-calendar.ts`
4. Open BUILD_GUIDE.md
5. Find "File 6: Create calendar-core/src/google-calendar.ts"
6. Copy the code
7. Paste into google-calendar.ts
8. Save (Ctrl+S)
9. ✅ Check off File 6

### FILE 7: calendar-core/src/availability-engine.ts

**Steps:**
1. Right-click on `packages/calendar-core/src` folder
2. New File
3. Type: `availability-engine.ts`
4. Open BUILD_GUIDE.md
5. Find "File 7: Create calendar-core/src/availability-engine.ts"
6. Copy the code
7. Paste into availability-engine.ts
8. Save (Ctrl+S)
9. ✅ Check off File 7

### FILE 8: calendar-core/src/multi-participant.ts

**Steps:**
1. Right-click on `packages/calendar-core/src` folder
2. New File
3. Type: `multi-participant.ts`
4. Open BUILD_GUIDE.md
5. Find "File 8: Create calendar-core/src/multi-participant.ts"
6. Copy the code
7. Paste into multi-participant.ts
8. Save (Ctrl+S)
9. ✅ Check off File 8

### FILE 9: calendar-core/tsconfig.json

**Steps:**
1. Right-click on `packages/calendar-core` folder
2. New File
3. Type: `tsconfig.json`
4. Open BUILD_GUIDE.md
5. Find "File 9: Create calendar-core/tsconfig.json"
6. Copy the code
7. Paste into tsconfig.json
8. Save (Ctrl+S)
9. ✅ Check off File 9

---

## PHASE 4: CREATE SPRINT 6 FILES (5 files - 60 mins)

### FILE 10: BookingModeSelector Component

**Path:** `apps/web/src/components/BookingModeSelector.tsx`

**Steps:**
1. Right-click on `apps/web/src/components` folder
2. New File
3. Type: `BookingModeSelector.tsx`
4. Open BUILD_GUIDE.md
5. Find "File 10: Create BookingModeSelector Component"
6. Copy the code
7. Paste into BookingModeSelector.tsx
8. Save (Ctrl+S)
9. ✅ Check off File 10

### FILE 11: SlotsBooking Component

**Path:** `apps/web/src/components/SlotsBooking.tsx`

**Steps:**
1. Right-click on `apps/web/src/components` folder
2. New File
3. Type: `SlotsBooking.tsx`
4. Open BUILD_GUIDE.md
5. Find "File 11: Create SlotsBooking Component"
6. Copy the code
7. Paste into SlotsBooking.tsx
8. Save (Ctrl+S)
9. ✅ Check off File 11

### FILE 12: ChatBooking Component

**Path:** `apps/web/src/components/ChatBooking.tsx`

**Steps:**
1. Right-click on `apps/web/src/components` folder
2. New File
3. Type: `ChatBooking.tsx`
4. Open BUILD_GUIDE.md
5. Find "File 12: Create ChatBooking Component"
6. Copy the code
7. Paste into ChatBooking.tsx
8. Save (Ctrl+S)
9. ✅ Check off File 12

### FILE 13: DirectBooking Component

**Path:** `apps/web/src/components/DirectBooking.tsx`

**Steps:**
1. Right-click on `apps/web/src/components` folder
2. New File
3. Type: `DirectBooking.tsx`
4. Open BUILD_GUIDE.md
5. Find "File 13: Create DirectBooking Component"
6. Copy the code
7. Paste into DirectBooking.tsx
8. Save (Ctrl+S)
9. ✅ Check off File 13

### FILE 14: Visitor Booking Page

**Path:** `apps/web/src/pages/book/[id].tsx`

**Steps:**
1. Right-click on `apps/web/src/pages/book` folder (create if doesn't exist)
   - If folder doesn't exist:
     - Right-click on `apps/web/src/pages`
     - New Folder
     - Type: `book`
2. Right-click on `apps/web/src/pages/book` folder
3. New File
4. Type: `[id].tsx`
5. Open BUILD_GUIDE.md
6. Find "File 14: Create Visitor Booking Page"
7. Copy the code
8. Paste into [id].tsx
9. Save (Ctrl+S)
10. ✅ Check off File 14

---

## PHASE 5: CREATE API ROUTES (2 files - 30 mins)

### FILE 15: Calendar Sync API

**Path:** `apps/web/src/pages/api/calendar/sync.ts`

**Steps:**
1. Right-click on `apps/web/src/pages/api` folder (create if doesn't exist)
   - If `api` folder doesn't exist:
     - Right-click on `apps/web/src/pages`
     - New Folder
     - Type: `api`
2. Right-click on `api` folder
3. New Folder
4. Type: `calendar`
5. Right-click on new `calendar` folder
6. New File
7. Type: `sync.ts`
8. Open BUILD_GUIDE.md
9. Find "File 15: Calendar Sync API"
10. Copy the code
11. Paste into sync.ts
12. Save (Ctrl+S)
13. ✅ Check off File 15

### FILE 16: Booking Create API

**Path:** `apps/web/src/pages/api/booking/create.ts`

**Steps:**
1. Right-click on `apps/web/src/pages/api` folder
2. New Folder
3. Type: `booking`
4. Right-click on new `booking` folder
5. New File
6. Type: `create.ts`
7. Open BUILD_GUIDE.md
8. Find "File 16: Booking Create API"
9. Copy the code
10. Paste into create.ts
11. Save (Ctrl+S)
12. ✅ Check off File 16

---

## PHASE 6: COMMIT TO GITHUB

### Step 1: Open Terminal in VS Code

1. In VS Code, press `Ctrl + ` (backtick)
2. Terminal should open at bottom

### Step 2: Verify All Files Created

```bash
git status
```

**You should see many "new file:" entries**

### Step 3: Stage All Changes

```bash
git add -A
```

### Step 4: Commit

```bash
git commit -m "Complete Sprints 4, 5, 6: Chat interface, calendar integration, flexible booking modes - all files created locally"
```

### Step 5: Push to GitHub

```bash
git push origin main
```

**Wait for it to complete. You should see:**
```
To https://github.com/veer-varma/klendoo.git
   [commit-hash] main -> main
```

### Step 6: Verify on GitHub

1. Open browser
2. Go to: https://github.com/veer-varma/klendoo
3. Check that latest commit says your commit message
4. ✅ All files should be visible on GitHub

---

## PHASE 7: DEPLOY TO VPS

### Step 1: SSH to VPS

In terminal:
```bash
ssh root@187.124.153.221
```

**Password:** (use your VPS password)

### Step 2: Navigate to Project

```bash
cd /home/klendoo-deploy/klendoo
```

### Step 3: Pull Latest Code

```bash
git pull origin main
```

**Wait for it to download all files**

### Step 4: Update .env File

```bash
nano .env
```

**Add/Update these lines:**
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret_here
```

**To save and exit:**
- Press `Ctrl + X`
- Type `Y`
- Press `Enter`

### Step 5: Build Docker Image

```bash
docker compose build --no-cache
```

**Wait for it to complete. You'll see:**
```
[+] Building X.XXs (X/X) FINISHED
```

### Step 6: Start Services

```bash
docker compose up -d
```

**You should see:**
```
[+] Running X/X
```

### Step 7: Verify Deployment

```bash
docker compose ps
```

**You should see containers running (STATUS = "Up")**

### Step 8: Test It Works

```bash
curl http://localhost:5000/host/login
```

**You should see HTML response (a long block of code)**

---

## PHASE 8: VERIFY ON BROWSER

### Step 1: Open Browser

1. Go to: `http://187.124.153.221:5000/host/login`

### Step 2: Test Host Login

1. Email: `host@example.com`
2. Password: `any password`
3. Click "Log In"

### Step 3: Verify Chat Tab

1. You should see host dashboard
2. Look for "💬 Chat" tab at top
3. Click it
4. ChatWindow component should appear
5. Try typing: "Schedule meeting with Amanda next week"
6. Agent should respond

### Step 4: Test Booking Page

1. Go to: `http://187.124.153.221:5000/book/test123`
2. Should see "Schedule a Meeting" page
3. Should see 3 booking mode buttons
4. Click different modes to test

---

## ✅ COMPLETION CHECKLIST

- [ ] Phase 1: Workspace prepared
- [ ] Phase 2: 3 Sprint 4 files created
- [ ] Phase 3: 6 Sprint 5 files created
- [ ] Phase 4: 5 Sprint 6 files created
- [ ] Phase 5: 2 API routes created
- [ ] Phase 6: Committed and pushed to GitHub
- [ ] Phase 7: Deployed to VPS
- [ ] Phase 8: Verified working in browser

---

## 🎉 DONE!

Your complete Klendoo MVP is now:
- ✅ Built locally
- ✅ Committed to GitHub
- ✅ Deployed to VPS
- ✅ Running and tested

**Total time:** ~4 hours

---

**Copyright (c) 2026 Veer Varma. All rights reserved.**
