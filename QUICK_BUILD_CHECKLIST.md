// Copyright (c) 2026 Veer Varma. All rights reserved.

# Quick Build Checklist - Create All Remaining Files

**Goal:** Complete all files from BUILD_GUIDE.md locally  
**Time:** 2-3 hours  
**Method:** Copy-paste each file code into the specified path  
**Files to Create:** 14 remaining files

---

## ⚡ Step-by-Step Process

### Step 1: Open BUILD_GUIDE.md
Reference: `https://github.com/veer-varma/klendoo/blob/main/BUILD_GUIDE.md`

### Step 2: Create Files in This Order

**⚙️ SPRINT 4 - Chat Integration (3 files)**

- [ ] **File 1:** `package.json` (root)
  - Action: Update existing file
  - Section in guide: "File 1: Update Root package.json"
  
- [ ] **File 2:** `apps/web/src/pages/host/dashboard.tsx`
  - Action: Add chat tab to existing file
  - Section in guide: "File 2: Update Host Dashboard"
  - **IMPORTANT:** Import ChatWindow at top
  
- [ ] **File 3:** `apps/web/src/hooks/useCalendar.ts`
  - Action: CREATE new file
  - Section in guide: "File 3: Create useCalendar Hook"

**📅 SPRINT 5 - Calendar (6 files)**

- [ ] **File 4:** `packages/calendar-core/src/index.ts`
  - Action: CREATE new file
  - Section: "File 4: Create calendar-core/src/index.ts"

- [ ] **File 5:** `packages/calendar-core/src/types.ts`
  - Action: CREATE new file
  - Section: "File 5: Create calendar-core/src/types.ts"

- [ ] **File 6:** `packages/calendar-core/src/google-calendar.ts`
  - Action: CREATE new file
  - Section: "File 6: Create calendar-core/src/google-calendar.ts"

- [ ] **File 7:** `packages/calendar-core/src/availability-engine.ts`
  - Action: CREATE new file
  - Section: "File 7: Create calendar-core/src/availability-engine.ts"

- [ ] **File 8:** `packages/calendar-core/src/multi-participant.ts`
  - Action: CREATE new file
  - Section: "File 8: Create calendar-core/src/multi-participant.ts"

- [ ] **File 9:** `packages/calendar-core/tsconfig.json`
  - Action: CREATE new file
  - Section: "File 9: Create calendar-core/tsconfig.json"

**📚 SPRINT 6 - Booking Modes (5 files)**

- [ ] **File 10:** `apps/web/src/components/BookingModeSelector.tsx`
  - Action: CREATE new file
  - Section: "File 10: Create BookingModeSelector Component"

- [ ] **File 11:** `apps/web/src/components/SlotsBooking.tsx`
  - Action: CREATE new file
  - Section: "File 11: Create SlotsBooking Component"

- [ ] **File 12:** `apps/web/src/components/ChatBooking.tsx`
  - Action: CREATE new file
  - Section: "File 12: Create ChatBooking Component"

- [ ] **File 13:** `apps/web/src/components/DirectBooking.tsx`
  - Action: CREATE new file
  - Section: "File 13: Create DirectBooking Component"

- [ ] **File 14:** `apps/web/src/pages/book/[id].tsx`
  - Action: CREATE new file
  - Section: "File 14: Create Visitor Booking Page"

**🔌 API Routes (3 files)**

- [ ] **File 15:** `apps/web/src/pages/api/calendar/sync.ts`
  - Action: CREATE new file
  - Section: "File 15: Calendar Sync API"

- [ ] **File 16:** `apps/web/src/pages/api/booking/create.ts`
  - Action: CREATE new file
  - Section: "File 16: Booking Create API"

---

## 🎯 Creating Each File

### For NEW files:
1. Create directory if needed
2. Copy code from BUILD_GUIDE.md
3. Paste into new file using your editor
4. Save

### For UPDATES to existing files:
1. Open the file
2. Find the section mentioned in the guide
3. Add the code (don't replace entire file)
4. Save

---

## ⚠️ Important Notes

### File 2 (Dashboard Update)
- **MUST add this import at the top:**
  ```typescript
  import ChatWindow from '@/components/ChatWindow';
  ```
- Find the tabs array and add the chat tab entry
- Find `{activeTab === 'overview' && ...}` section
- Add new chat section right after it

### Calendar Core Package
All files in `packages/calendar-core/` must be created in this order:
1. types.ts (defines interfaces)
2. index.ts (exports)
3. google-calendar.ts (depends on types)
4. availability-engine.ts (depends on types)
5. multi-participant.ts (depends on types)
6. tsconfig.json (config)

### Booking Components
All files in `apps/web/src/components/` and `apps/web/src/pages/book/`:
- BookingModeSelector.tsx (no dependencies)
- SlotsBooking.tsx (uses axios)
- ChatBooking.tsx (imports ChatWindow)
- DirectBooking.tsx (no special dependencies)
- pages/book/[id].tsx (imports all 4 components above)

---

## 🚀 After Creating All Files

1. **Verify directory structure:**
   ```
   packages/calendar-core/src/
   ├── index.ts
   ├── types.ts
   ├── google-calendar.ts
   ├── availability-engine.ts
   ├── multi-participant.ts
   └── tsconfig.json
   
   apps/web/src/
   ├── components/
   │   ├── ChatWindow.tsx (already exists)
   │   ├── BookingModeSelector.tsx
   │   ├── SlotsBooking.tsx
   │   ├── ChatBooking.tsx
   │   └── DirectBooking.tsx
   ├── hooks/
   │   ├── useChat.ts (already exists)
   │   └── useCalendar.ts
   ├── pages/
   │   ├── api/
   │   │   ├── chat.ts (already exists)
   │   │   ├── calendar/
   │   │   │   └── sync.ts
   │   │   └── booking/
   │   │       └── create.ts
   │   ├── book/
   │   │   └── [id].tsx
   │   ├── host/
   │   │   └── dashboard.tsx (UPDATED)
   │   └── index.tsx (already exists)
   ```

2. **Commit to Git:**
   ```bash
   git add -A
   git commit -m "Sprint 4, 5, 6: Complete all booking, calendar, and flexible booking mode implementations"
   git push origin main
   ```

3. **Deploy to VPS:**
   ```bash
   ssh root@187.124.153.221
   cd /home/klendoo-deploy/klendoo
   git pull origin main
   # Add DEEPSEEK_API_KEY and GOOGLE_* keys to .env
   docker compose build --no-cache
   docker compose up -d
   ```

---

## 💡 Pro Tips

1. **Use VS Code or your editor** - Easier than terminal for creating files
2. **Copy entire code blocks** - Don't type manually, copy-paste from BUILD_GUIDE.md
3. **Check indentation** - Match the guide's indentation exactly
4. **Save frequently** - Don't lose work
5. **Create directories first** - Some tools auto-create, some don't

---

## ✅ Completion Checklist

- [ ] All 16 files created
- [ ] Directory structure matches above
- [ ] No import errors in files
- [ ] git add -A
- [ ] git commit done
- [ ] git push done
- [ ] Ready to pull on VPS

---

## 📞 If You Get Stuck

1. Check BUILD_GUIDE.md for the exact file code
2. Verify file paths are correct
3. Check imports in dependent files
4. Check indentation matches
5. Verify semicolons and brackets

---

**Ready?** Start with File 1 (package.json update) 🚀

**Copyright (c) 2026 Veer Varma. All rights reserved.**
