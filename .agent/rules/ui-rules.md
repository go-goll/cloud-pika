---
trigger: always_on
---

# Frontend Design System

This document outlines the current design standards for the CertGo frontend, established to ensure consistency across the application.

## 1. Color Palette

The application uses a semantic color system based on Tailwind CSS variables, backed by a custom primary color.

- **Primary Color**: `#434e78` (defined as `--primary` in `index.css`)
  - This is the core brand color.
  - **Usage**: Main action buttons, active states, key text emphasis.

### Common Theme Tokens

| Token Class           | Previous/Hardcoded Equivalent | Usage Scenario                                        |
| :-------------------- | :---------------------------- | :---------------------------------------------------- |
| `bg-primary`          | `bg-blue-600`                 | Primary buttons, active step indicators.              |
| `hover:bg-primary/90` | `hover:bg-blue-700`           | Hover state for primary actions.                      |
| `text-primary`        | `text-blue-600`               | Links, active text, icons in cards.                   |
| `bg-primary/5`        | `bg-blue-50`                  | Subtle backgrounds for badges, hover states in lists. |
| `border-primary/10`   | `border-blue-100`             | Borders for subtle background elements.               |

> **Rule**: Avoid hardcoded colors like `blue-600` or `purple-600` for main interface elements. Always prefer `primary` variants to maintain theming capability.

## 2. Shape & Geometry

The design direction has shifted towards a "softer" but structured look.

- **Border Radius**: `rounded-sm`
  - **Global Replacement**: We have systematically replaced `rounded-xl` and `rounded-lg` with `rounded-sm`.
  - **Scope**: Buttons, Inputs, Cards, Modals, Badges.
  - **Exception**: `rounded-full` is still used for circular elements (steps, icon backgrounds).

## 3. Layout Patterns

### Page Headers

- **Structure**: "Left-Right" alignment using `flex justify-between`.
  - **Left**: Page Title, Back Button, Status Indicators.
  - **Right**: Action Buttons (Save, Edit, Preview).
- **Sticky**: Headers inside scrollable areas (like Wizards) should be `sticky top-0 z-20` with a blurred background (`bg-white/80 backdrop-blur-md`).

### Modals

- **Overlay**: `bg-slate-900/40 backdrop-blur-sm`.
- **Container**: `bg-white rounded-sm shadow-2xl`.
- **Animation**: `animate-in fade-in zoom-in-95`.

## 4. Component Styles

> **Rule**: When building pages, prioritize importing components from `@/components/ui` (e.g., `Button`, `Input`, `Select`) instead of hardcoding styles or creating ad-hoc components. This ensures consistent theming and behavior.

### Buttons (`<Button />`)

- **Primary**: `bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-blue-500/20`.
- **Ghost/Secondary**: `text-slate-500 hover:text-slate-700 hover:bg-slate-100`.
- **Size**:
  - Standard: `h-9 px-4 text-sm`.
  - Large / Wizard Actions: `h-12 text-sm uppercase tracking-widest`.

### Inputs

- **Focus State**: Custom focus rings are handled via Tailwind. We explicitly disable the browser default outline using `focus:outline-none` on the input element itself.

## 5. Typography

- **Body Text**: Predominantly `text-sm` for density.
- **Labels**: Often `uppercase tracking-widest text-xs` for a technical/dashboard aesthetic.
- **Font Weight**: Reduced usage of `font-bold`. Headers and titles generally use `font-semibold` or normal weights for a cleaner look.
