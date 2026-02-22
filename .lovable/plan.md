

# Full System Activation Plan -- TinSites OS

This is a large-scale overhaul covering database tables, new modules, and UI rewrites. Due to the scope, I recommend splitting this into **3 phases** implemented sequentially.

---

## Phase 1: Core Module Activation (Projects, Tasks, Invoices)

### 1A. Database Schema -- New Tables

Create the following tables with RLS policies:

**`projects` table:**
- id, name, client_id (FK to clients), description, status (enum: onboarding, in_progress, review, completed, archived), progress (integer 0-100), deadline, created_by, created_at, updated_at
- Team assignment via a `project_members` join table (project_id, user_id)

**`tasks` table:**
- id, title, description, project_id (FK to projects), assignee_id (FK to profiles.user_id), status (todo, in_progress, done), priority (low, medium, high), due_date, is_completed, created_by, created_at, updated_at

**`invoices` table:**
- id, invoice_number (auto-generated), client_id (FK to clients), project_id (optional FK), items (JSONB array of line items), subtotal, tax, total, status (draft, sent, paid, overdue), due_date, notes, created_by, created_at, updated_at
- public_token for shareable links

**`documents` table:**
- id, title, content (text/markdown), project_id (optional FK), category, created_by, created_at, updated_at

**`calendar_events` table:**
- id, title, description, start_date, end_date, event_type (appointment, goal, milestone), is_quarterly_goal, created_by, created_at, updated_at

**`prospects` table:**
- id, company_name, industry, contact_name, contact_email, outreach_method (email, whatsapp), date_contacted, response_received (boolean), follow_up_status (pending, followed_up, converted, lost), notes, created_by, created_at, updated_at

All tables will have RLS policies scoped to authenticated users viewing records created by their team. The `has_role` function will be used for any admin-level access.

### 1B. Remove All Mock/Demo Data

The following files contain hardcoded fake data that will be replaced with live database queries:

- **Dashboard.tsx** -- hardcoded stats, recentProjects, recentTasks arrays
- **Projects.tsx** -- hardcoded projects array
- **Tasks.tsx** -- hardcoded tasks array
- **Invoices.tsx** -- hardcoded invoices array and summary stats

Each page will be rewritten to:
1. Fetch real data from the database
2. Show empty states when no data exists
3. Have fully functional Create/Edit/Delete operations

### 1C. Projects Module

- "New Project" button opens a dialog with: name, client (dropdown from clients table), description, deadline, status, team members (multi-select from profiles)
- Three-dot menu with Edit, Archive, Delete options
- Project cards show real progress calculated from completed tasks
- Search bar filters projects

### 1D. Tasks Module

- "Add Task" button opens a form: title, description, project (dropdown), assignee (dropdown), priority, due date
- Filter bar: by status, priority, project
- Clicking the circle toggles task completion and updates project progress
- Tasks are fetched from the database with real-time updates

### 1E. Invoices Module

- "New Invoice" form with: client, project (optional), line items (description + amount), tax, notes
- Invoice number auto-generated as INV-001, INV-002, etc.
- Status management: Draft -> Sent -> Paid / Overdue
- Shareable public link via token (similar to onboarding forms)
- PDF download using browser print/PDF generation
- Summary cards computed from real invoice data

---

## Phase 2: New Modules (Documents, Calendar, Prospecting, Analytics)

### 2A. Documents/Notes Module

- Create notes with title, content (rich text area), category, optional project link
- List view with search and category filter
- Edit in place and auto-save
- After saving, show reminder banner: "Consider exporting this to a Word document and uploading to Google Drive."

### 2B. Calendar Module

- Full 12-month calendar view (January-December) using a custom grid
- Monthly view toggle
- Add events/appointments with date, title, description
- Quarterly goal setting -- special event type highlighted visually
- Events persist in `calendar_events` table
- Editable events via click

### 2C. Prospecting Tracker

- New page with CRUD for prospects
- Table view with: company, industry, outreach method, date contacted, response status, follow-up status
- Analytics cards: total outreach count, response rate, industry breakdown
- Filter and search

### 2D. Analytics Module (Real Data)

- Dashboard pulling aggregated data from: projects, tasks, invoices, prospects
- Charts using recharts (already installed): revenue trends, task completion rates, project status distribution
- CEO-focused KPIs: attention areas, performance weak spots, growth insights
- All data from real database queries -- no mock graphs

---

## Phase 3: Settings, Security, and Onboarding Fix

### 3A. Settings Module

- **Profile**: Edit name, avatar (upload to storage bucket)
- **Role display**: Show current role (read-only, managed by admin)
- **Theme**: Light/dark toggle (already have next-themes installed)
- **Notification preferences**: Toggle switches for different notification types (stored in profiles or a preferences table)

### 3B. Onboarding Form Fix

The `SubmitForm.tsx` currently queries `onboarding_forms` which requires authentication via RLS. The fix:
- The current RLS `SELECT` policy on `onboarding_forms` uses `USING (true)` which should work for anon access, but it's a restrictive policy (`PERMISSIVE: No`). Need to change it to a permissive policy or add an anon-accessible policy.
- Verify the `form_submissions` INSERT policy allows anonymous inserts.
- Test the public link end-to-end.

### 3C. Security Hardening

- Audit all RLS policies ensuring no cross-user data leaks
- Verify `user_roles` table can only be read by the user themselves (already done)
- Ensure messaging only shows messages between sender and recipient (already done)
- Verify no sensitive data exposed through public routes
- Add input validation (zod schemas) on all forms

### 3D. Dashboard Rewrite

- Replace all hardcoded stats with live aggregated queries
- Active clients count from `clients` table
- Project count and status from `projects` table
- Open tasks from `tasks` table
- Revenue from `invoices` table (paid invoices)
- Recent projects and tasks from real data

---

## Technical Details

### Files to Create (New)
- `src/pages/Projects.tsx` -- full rewrite with DB integration
- `src/pages/Tasks.tsx` -- full rewrite with DB integration
- `src/pages/Invoices.tsx` -- full rewrite with DB integration
- `src/pages/Documents.tsx` -- new module
- `src/pages/Calendar.tsx` -- new module
- `src/pages/Analytics.tsx` -- new module
- `src/pages/Prospecting.tsx` -- new module
- `src/pages/Settings.tsx` -- new module
- `src/pages/PublicInvoice.tsx` -- public invoice view

### Files to Modify
- `src/App.tsx` -- add new routes (prospecting, public invoice)
- `src/components/layout/AppSidebar.tsx` -- add Prospecting nav item
- `src/pages/Dashboard.tsx` -- replace mock data with DB queries
- `src/pages/PlaceholderPages.tsx` -- remove (no longer needed)
- `src/pages/SubmitForm.tsx` -- fix RLS for anonymous access

### Database Migrations
- Create 6 new tables: projects, project_members, tasks, invoices, documents, calendar_events, prospects
- Add RLS policies for all tables
- Fix onboarding_forms SELECT policy for anonymous access
- Create a storage bucket for avatars (Settings profile picture)

### Routing Updates
- `/prospecting` -- new protected route
- `/invoice/:token` -- new public route for shareable invoices

---

## Important Notes

- This is a substantial amount of work. I recommend implementing Phase 1 first, testing it, then proceeding to Phase 2 and Phase 3.
- All mock/hardcoded data will be completely removed.
- Every button, form, and action will be wired to the database.
- The system will show clean empty states when no data exists yet.

