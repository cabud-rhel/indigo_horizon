# Design System Document: The Editorial Executive

## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Curator"**

This design system rejects the "spreadsheet-dense" legacy of project management software. Instead, it adopts the logic of high-end editorial layouts: prioritized hierarchy, aggressive use of white space, and a rejection of structural "scaffolding" (borders and lines). We are building an environment that feels like a quiet, high-end office—airy, functional, and authoritative. 

The "Architectural Curator" breaks the traditional grid through **intentional asymmetry**. Data isn't just displayed; it is staged. By utilizing overlapping layers and tonal depth rather than hard strokes, we move the user's eye naturally toward the most critical "at-risk" metrics, creating a premium SaaS aesthetic that feels both bespoke and ruthlessly efficient.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, intellectual Indigo (`primary: #2f3b88`) contrasted against an ethereal, cool background (`background: #f8f9ff`). 

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Traditional borders create visual noise and "trap" the data. Boundaries must be defined exclusively through:
1.  **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2.  **Tonal Transitions:** Defining a header by sitting it on a `surface-container-highest` block against a `surface` canvas.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers. Use the `surface-container` tiers to create a "nested" depth.
*   **Main Canvas:** `surface` (#f8f9ff).
*   **Sub-Sections/Sidebars:** `surface-container-low` (#eff4ff).
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) to provide a "lifted" feel.
*   **Active/Selected States:** `surface-container-high` (#dde9ff).

### The "Glass & Gradient" Rule
For floating elements (modals, popovers, or navigation rails), employ **Glassmorphism**. Use `surface` colors at 80% opacity with a `backdrop-blur` of 12px-20px. 
*   **Signature Textures:** Main CTAs should not be flat. Apply a subtle linear gradient from `primary` (#2f3b88) to `primary_container` (#4854a2) at a 135-degree angle to give buttons a "gemstone" depth.

---

## 3. Typography
We utilize a dual-font strategy to balance character with utility.

*   **Display & Headlines (Manrope):** Chosen for its geometric, modern proportions. High-end and editorial.
    *   `display-lg` (3.5rem): Use sparingly for high-level dashboard summaries (e.g., total project value).
    *   `headline-sm` (1.5rem): The standard for card titles and section headers.
*   **Body & UI (Inter):** The workhorse for readability.
    *   `body-md` (0.875rem): Standard text for project descriptions and metadata.
    *   `label-md` (0.75rem): Used for uppercase status labels or micro-data.

**Identity Note:** High contrast between the `display` (Manrope) and `body` (Inter) scales conveys a brand that is both visionary (the headline) and precise (the data).

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than traditional structural shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a natural 3D effect without a single drop shadow.
*   **Ambient Shadows:** For "floating" elements (Active Modals), use a shadow with a blur of `32px` and an opacity of `6%`. The shadow color must be a tinted version of `on-surface` (#0d1c2f) to mimic natural, diffused ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., an input field), use `outline-variant` (#c5c5d4) at **20% opacity**. Never use 100% opaque borders.
*   **Backdrop Blur:** Any element with a "floating" Z-index should use a `surface` tint with a 16px blur to integrate with the content beneath it.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary-container`), `xl` (0.75rem) roundedness, white text.
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Tertiary:** Ghost style. `primary` text, no background until hover (use `surface-container-low` on hover).

### Cards & Lists
*   **The Divider Ban:** Never use horizontal rules (`<hr>`). Separate list items using `spacing.4` (1.4rem) of vertical white space or by alternating background colors using `surface-container-lowest` and `surface-container-low`.
*   **Interactive Cards:** Use `xl` (0.75rem) corner radius. On hover, shift the background from `lowest` to `low` rather than adding a shadow.

### Inputs & Fields
*   **Styling:** Large `3.5` (1.2rem) padding. Background should be `surface-container-low`. 
*   **Focus State:** A 2px "Ghost Border" using `primary` at 40% opacity.

### Status Chips
*   **On-Track:** `secondary_container` background with `on_secondary_container` text.
*   **At-Risk:** `tertiary_fixed` background with `on_tertiary_fixed_variant` text.
*   **Overdue:** `error_container` background with `on_error_container` text.

### Additional Dashboard Components
*   **Progress Rings:** Use `secondary` (#006c49) for completion. Use a stroke width of 4px for an elegant, thin-line aesthetic.
*   **The "Metric Overlap":** Allow large `display-sm` numbers to slightly overlap the edge of their container or a background texture to break the "boxed-in" feel.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `spacing.16` (5.5rem) or more for major section breathing room.
*   **Do** use `manrope` for any number larger than 24px to emphasize the "Editorial" feel.
*   **Do** use color-coded "Glows" (8% opacity `secondary` or `error` shadows) to indicate status without changing the card background.

### Don't
*   **Don't** use black (#000000). Use `on_surface` (#0d1c2f) for all "black" text to maintain the Indigo/Slate tonal integrity.
*   **Don't** use standard `DEFAULT` (0.25rem) roundedness for large cards. Stick to `xl` (0.75rem) to maintain the modern SaaS softness.
*   **Don't** cram data. If a table feels tight, move a column to a "Detail View" fly-out.