# Feature: Unified calendar with employee selection modal

## Summary

- **One calendar** for all employees: a single list of time slots (union of all employees’ availability).
- **Per slot**: Employee photos above-left of the time label (max 3 photos, then "+N").
- **On slot click** (when multiple employees): open a **centered modal** listing all employees; those available at that slot are clickable (cards with photo + name); those not available show "Sin turno disponible". Order: employees who have the slot first (in creation order), then the rest.
- **On employee card click**: set slot + employee, close modal, go to confirmation step.
- **Single or no employees**: keep current behaviour (no photos, no modal; slot click goes straight to confirmation).

Conventions: code/comments/commits in **English**; user-facing strings in **Spanish** (per `/docs/CODING_RULES.md` and `AI_RULES_FOR_CURSOR.md`).

---

## Step 1 – Compute unified slots and employees-per-slot (data only)

**Goal:** Add derived data used by the new UI without changing the current UI.

**Where:** `frontend/app/(public)/[business-slug]/page.tsx` (or a small helper used by it).

**What:**

- From `slotsByEmployee` and `employees` (in creation order), compute:
  - **Unified slots:** sorted list of unique time strings that appear in any employee’s slots (for the selected date). Filter past times for today using existing `currentTimeStr` logic.
  - **Employees per slot:** for each slot time, list of employee ids that have that slot (same order as `employees`).
- Pass these into `DateStep` as new props, e.g. `unifiedSlots: string[]` and `employeesBySlot: Record<string, string[]>` (slot time → employee ids).
- Keep passing `slots`, `slotsByEmployee`, `employees` as today; `DateStep` still uses the current UI.

**Acceptance:** No visual change. Data is available for the next step.

---

## Step 2 – Branch in DateStep: multi-employee vs current UI

**Goal:** When there are 2+ employees, render the new unified calendar block; otherwise keep the current behaviour.

**Where:** `frontend/app/(public)/[business-slug]/components/DateStep.tsx`.

**What:**

- If `employees.length <= 1`: keep current layout (current list of employees with their slots, or single “Horarios disponibles” grid). No modal, no photos in cells.
- If `employees.length > 1`: render the new “unified” block that will show one row/cell per `unifiedSlots` entry (Step 3 will fill this block). For now you can show a simple placeholder (e.g. list of slot times) so the branch is testable.

**Acceptance:** With 2+ employees we see the new (placeholder) block; with 0 or 1 employee we see the current UI unchanged.

---

## Step 3 – Unified slot cells: time + photos above-left (max 3, then “+N”)

**Goal:** Each slot is one cell: photos above-left, time (e.g. "09:00") as in the wireframe.

**Where:** `DateStep.tsx` (inside the multi-employee block).

**What:**

- For each slot in `unifiedSlots`, render one cell containing:
  - **Above-left:** area with employee avatars (from `employeesBySlot[slot]`). Use first 3 employees; if more, show “+N” (e.g. “+2”). Use existing `Employee` (photoUrl, name) and Next.js `Image` for photos; fallback to initial letter as in `ServiceStep`/`DateStep`.
  - **Horario:** the time string (same format as today, e.g. "09:00").
- Cells are buttons (or clickable divs) that will open the modal in Step 5. For Step 3, clicking can be a no-op or just set selected slot in state.
- Reuse existing theme (dark/light) and slot/card styles from `DateStep` (e.g. `slotBtnClass`, `noSlotsCardClass`) for consistency.

**Acceptance:** With 2+ employees we see one row per slot with photos above-left and the time; max 3 photos then “+N”.

---

## Step 4 – Employee selection modal component

**Goal:** Reusable modal: centered, overlay; lists all employees; available at slot = clickable card (photo + name); not available = “Sin turno disponible”; order = available first (creation order), then unavailable.

**Where:** New component under `frontend/app/(public)/[business-slug]/components/`, e.g. `EmployeeSelectModal.tsx`. Colocate with booking feature.

**What:**

- **Props:** e.g. `slotTime: string`, `employees: Employee[]`, `availableEmployeeIds: string[]`, `onSelect: (employeeId: string) => void`, `onClose: () => void`, `isOpen: boolean`, theme (e.g. `isDarkTheme`), `primaryColor`.
- **Layout:** Centered modal (fixed overlay, z-index above content). Inside: title/context (e.g. “Horario 09:00” or “Elegí empleado”), then list of employee cards. Each card: photo + name. If employee id is in `availableEmployeeIds`, card is clickable and `onSelect(employeeId)` on click. If not, show “Sin turno disponible” and do not call `onSelect`.
- **Order:** Sort list so that employees in `availableEmployeeIds` appear first (preserve `employees` order for both groups), then the rest.
- **Accessibility:** Focus trap, aria labels, close on Escape; optional backdrop click to close (or only explicit close button, per product preference).
- **Copy:** All user-facing text in Spanish (e.g. “Sin turno disponible”, “Elegí empleado”).

**Acceptance:** Modal opens/closes; shows all employees; available ones clickable and trigger `onSelect`; unavailable show “Sin turno disponible”; theme and primary color applied.

---

## Step 5 – Wire modal to DateStep and flow

**Goal:** Clicking a unified slot opens the modal; selecting an employee sets slot + employee and navigates to confirmation.

**Where:** `DateStep.tsx` and parent `page.tsx` if needed.

**What:**

- In `DateStep`, when `employees.length > 1` and user clicks a slot: open the modal (e.g. set `modalSlot: string | null`). Pass `slotTime`, `employees`, `availableEmployeeIds = employeesBySlot[slot]`, and `onSelect(employeeId)` that:
  - calls `onSelectedSlot(slot, employeeId)` and `onContinue()`,
  - closes the modal (set `modalSlot` to null).
- Ensure the parent already supports `onSelectedSlot(slot, employeeId)` and `onContinue()` (it does today). No change to form step or API; confirmation step already uses `selectedSlot` and `selectedEmployeeId`.

**Acceptance:** With 2+ employees, click slot → modal opens → click available employee → modal closes and user is on confirmation step with correct slot and employee.

---

## Step 6 – Polish and docs

**Goal:** Accessibility, theme consistency, and any final copy.

**What:**

- Modal: focus trap, aria-modal, aria-labelledby; close button with aria-label (e.g. “Cerrar”).
- Ensure dark/light theme is consistent in modal and slot cells (reuse existing `DateStep` theme classes).
- Spanish copy: confirm “Sin turno disponible”, “Elegí empleado” (or chosen titles) everywhere.
- Optional: add a one-line note in `docs/` (e.g. in `FLOWS.md` or `UI_Design_Specification.md`) that the public booking date step uses a unified calendar with employee selection modal when the business has multiple employees.

**Acceptance:** No regressions; modal and slots look correct in both themes; a11y and copy checked.

---

## Order of implementation

| Step | Description |
|------|-------------|
| 1 | Compute unified slots + employeesBySlot in page, pass to DateStep |
| 2 | Branch in DateStep: multi-employee vs current UI |
| 3 | Unified slot cells: photos above-left + time, max 3 then “+N” |
| 4 | EmployeeSelectModal component |
| 5 | Wire modal open/close and onSelect to flow |
| 6 | Polish (a11y, theme, copy, docs) |

We implement one step at a time and confirm before moving to the next.
