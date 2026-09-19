# Architecture Plan: Dynamic Discover Screen & Remote Content

## Overview
This plan outlines how to build a dynamic "Discover" screen backend using Supabase. 
**CRITICAL RULE:** Do NOT alter the visual design, layout, or components of `app/(tabs)/discover.tsx`. The user has already built the UI cards. Your job is strictly to fetch the dynamic data and wire it into the *existing* UI components.

---

## Phase 1: Supabase Database Schema
Create two new tables in Supabase.

**1. Table: `daily_verses`**
- `id` (uuid, primary key)
- `date` (date, unique) - e.g., '2026-09-19'
- `book` (integer)
- `chapter` (integer)
- `verse` (integer)

**2. Table: `discover_plans`**
- `id` (text, primary key)
- `title` (text)
- `description` (text)
- `verses_array` (jsonb) - e.g., `[{"b": 43, "c": 3, "v": 16}]`
- `is_active` (boolean)
- `created_at` (timestamptz)

---

## Phase 2: The Data Service (`src/services/discoverService.ts`)
Create a service to fetch this data from Supabase and **cache it locally**. 
1. **Fetch Verse of the Day:** Check local cache for today. If missing, ping Supabase for today + the next 7 days. Pass the `book, chapter, verse` to `VerseRepository` to get the text.
2. **Fetch Active Plans:** Query Supabase for active plans and cache the JSON.

---

## Phase 3: Data Binding & UI Wiring (PRESERVE DESIGN)
Do not create new UI components. Wire the data into what already exists.

**1. Verse of the Day:**
- Locate the existing Verse of the Day card/section on the screen.
- Replace the hardcoded text with the data returned from `discoverService.getVerseOfTheDay()`.
- Wire the existing "Add" button to call `QueueManager.addToQueue()`.

**2. Curated Plans:**
- Locate the existing plan/collection cards on the screen.
- Map the data from `discoverService.getPlans()` into these existing card components. 
- Ensure the title and description map correctly.
- Wire the card's button/action to add the plan's `verses_array` to the Queue using `QueueManager`.

---

## Phase 4: Linking to the SRS Engine
When a user taps the action to start a plan:
1. Loop through the `verses_array`.
2. For each item, call `QueueManager.addToQueue(userId, b, c, v)`.
3. Provide a standard toast/haptic feedback to confirm.
