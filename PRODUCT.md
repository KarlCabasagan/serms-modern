# PRODUCT.md — SERMS Modern

## Product

**SERMS Modern** is a replacement interface for St. Peter's College's Student Enrolment and Records Management System. It is built for the people who run the Registrar, Cashier, Accounting, Faculty, and Administration desks every day.

## The job

The current SERMS is functionally rich but fragmented. Staff move between fixed-size forms, menus, and modal lookups to complete one student transaction. The student is the object everyone needs, but the student is not the organising idea of the interface.

SERMS Modern makes the student record the centre of the work:

1. Find the student.
2. See the whole record.
3. Take the next action.
4. Print or post the result.
5. Leave an audit trail.

## Users and contexts

- **Registrar / Clerk** — enrollment, COR, advising, records, class lists.
- **Cashier** — payments, ORs, collections, refunds.
- **Accounting** — assessment, collection reports, income distribution.
- **Faculty** — grade sheets, class lists, teaching load.
- **Administrator** — terms, fees, users, locks, configuration.

The primary device is a Windows office PC on the school network. The interface must remain usable on a tablet or phone for quick lookups, but it is designed for a desk with a keyboard.

## Product principles

- **One student, one workspace.** Related tasks stay together.
- **Show the next step.** Screens end with a clear action, not a maze of menus.
- **Respect the existing rules.** The PostgreSQL schema, triggers, and functions remain the source of truth.
- **No invented upload.** Grades, assessments, and payments write directly to the school server, as they do today.
- **Quiet confidence.** Academic identity, not generic SaaS decoration.
- **Print matters.** The office still runs on official documents; a screen is not done until its document is trustworthy.
- **No data risk in design work.** Prototype with synthetic records; validate live writes on a test copy.

## Visual direction

- Deep maroon and warm gold from the school seal.
- Warm paper background, white work surfaces, ink text.
- Newsreader for display; Inter for UI and tables.
- 240 px sidebar, 66 px top bar, generous page rhythm, dense but readable tables.
- Motion is restrained: page enter, modal enter, press feedback. No animation on high-frequency actions.

## Scope for this phase

Working UI prototype with synthetic data, desktop shell, responsive layouts, payment flow, grade sheet, command palette, and a real PostgreSQL connection test.

Not yet: full 146-form parity, live read/write queries for every module, exact legacy print layouts, migration tooling.
