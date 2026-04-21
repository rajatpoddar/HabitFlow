# Design System Specification: The Digital Conservatory

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Conservatory"**
This design system is not merely a utility; it is a premium sanctuary for personal growth. We are moving away from the "app-like" feel of standard trackers and toward a high-end editorial experience. Think of this as a digital greenhouse where habits are nurtured.

To break the "template" look, we leverage **Organic Brutalism**: the structure is rigid (Bento-style grids), but the execution is soft, using hyper-rounded corners (`md: 1.5rem`), breathing room, and intentional asymmetry. We prioritize "white space" as a functional element, allowing the deep emeralds and mints to feel like lush foliage against a warm, sun-bleached gallery wall.

---

## 2. Color Philosophy
The palette is rooted in a "Forest Floor to Canopy" hierarchy. We use `primary` (#005237) for grounding and `secondary_container` (#6cf8ba) for moments of vibrant growth.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to define sections or cards. 
Boundaries must be defined through **Background Tonal Shifts**. For example, a `surface_container_low` card should sit on a `surface` background. If you need more definition, use a shift to `surface_container_high`. Lines are a sign of structural weakness; color transitions are a sign of intentional craft.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of organic material.
*   **Base:** `surface` (#f7faf5) is your canvas.
*   **The Nesting Principle:** Use `surface_container` tiers to create depth. A Dashboard (Surface) might contain an Analytics Bento Box (`surface_container_low`), which contains individual stat chips (`surface_container_highest`). This creates a "soft-stack" effect.

### The "Glass & Gradient" Rule
To add a signature "soul" to the UI, floating elements (modals, navigation bars) must utilize **Glassmorphism**.
*   **Token:** `surface_variant` at 60% opacity with a `24px` backdrop-blur.
*   **Gradients:** Use a subtle linear gradient from `primary` (#005237) to `primary_container` (#006d4a) for primary CTAs. This mimics the depth of a leaf's surface.

---

## 3. Typography
We employ a high-contrast typographic scale to create an editorial feel.

*   **Display & Headlines (Manrope):** This is our "organic" voice. Use `display-lg` for daily streaks or high-level milestones. The geometric yet warm nature of Manrope should feel authoritative but welcoming.
*   **Body & Labels (Inter):** This is our "functional" voice. Inter provides the technical precision required for habit logs and data.
*   **Editorial Contrast:** Always pair a large `headline-lg` with a significantly smaller `label-md` in `on_surface_variant`. The gap in scale creates a premium, curated aesthetic.

---

## 4. Elevation & Depth
Traditional drop shadows are too "digital." We use **Tonal Layering** and **Ambient Light**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface_container_lowest` card on a `surface_container_low` background creates a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** If a floating action button (FAB) or modal requires a shadow, it must be:
    *   **Blur:** 40px - 60px.
    *   **Opacity:** 4% - 6%.
    *   **Color:** Use `primary` (tinted dark green) instead of grey to simulate natural forest light.
*   **The Ghost Border Fallback:** If accessibility requires a border, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Bento Logic

### Bento-Style Grid
Our analytics are housed in a Bento grid. Every "cell" in the grid must use the `md` (1.5rem) or `lg` (2rem) border radius. Use **Asymmetric Spanning**: a "Water Intake" card might take 2 columns, while a "Sunlight Exposure" card takes a 1x1 square. This prevents the layout from looking like a repetitive table.

### Buttons (The "Pebble" State)
*   **Primary:** Background `primary`, text `on_primary`. Shape: `full` (pill) or `md` (1.5rem).
*   **Secondary:** Glassmorphic. `surface_variant` at 40% opacity with a 10% `outline_variant` "Ghost Border."
*   **Interactions:** On hover, a button should not just change color—it should slightly scale (1.02x) and shift from `primary` to `secondary_container`.

### Inputs & Habit Logs
*   **The "No-Box" Input:** Instead of a boxed field, use a `surface_container_highest` background with a bottom-only soft indicator.
*   **Nature-Themed Icons:** Use custom Material Symbols (`leaf`, `water_drop`, `light_mode`). Icons should always be dual-tone: the "fill" using a soft `primary_fixed_dim` and the "stroke" using `primary`.

### Cards & Lists
*   **Rule:** Zero dividers. 
*   **Separation:** Use `8px`, `16px`, or `24px` of vertical white space. If lists are dense, alternate background colors between `surface` and `surface_container_low`.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use "Breathing Room." If you think there is enough margin, add 8px more.
*   **DO** overlap elements. Let a "Growth Tree" illustration slightly break the boundary of its Bento box to create 3D depth.
*   **DO** use `tertiary` (#79302d) sparingly for "Warning" or "Missed Habit" states—it represents autumn/decay, providing a natural counterpoint to the greens.

### Don’t
*   **DON'T** use pure black (#000000) or pure grey. Use `on_surface` (#181c1a) for all text.
*   **DON'T** use sharp corners. Everything in nature is rounded; everything in this system must be `1.5rem` or higher.
*   **DON'T** use 100% opaque borders. They trap the eye and ruin the "organic" flow of the conservatory.