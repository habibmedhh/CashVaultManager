# Design Guidelines: Professional Cash Register Management Application (MAD)

## Design Approach

**Selected Approach:** Design System - Financial Data Productivity
Inspired by modern fintech applications (Stripe Dashboard, Revolut Business) and premium spreadsheet tools (Airtable, Notion databases), prioritizing precision, trust, and operational efficiency. Every design decision reinforces financial credibility and data clarity.

**Core Principle:** Professional financial tool with refined aesthetics - where sophisticated visual design enhances, never distracts from, critical cash management operations.

## Color System

**Primary Palette:**
- Deep Navy: #1e293b (primary backgrounds, headers)
- Slate Blue: #334155 (secondary surfaces, table headers)
- Crisp White: #ffffff (input backgrounds, cards)
- Soft Gray: #f8fafc (alternate row backgrounds)

**Accent Colors:**
- Emerald: #059669 (positive values, deposits, success states)
- Amber: #d97706 (warnings, pending calculations)
- Ruby: #dc2626 (negative values, withdrawals, errors)
- Sapphire: #2563eb (primary actions, interactive elements)

**Gradients (Subtle Application):**
- Header gradient: linear from #1e293b to #334155 (top to bottom, 5% opacity variation)
- Card elevation: subtle radial gradient for depth on calculation cards
- Button hover states: 10% lighter gradient overlay

**Surface Hierarchy:**
- Level 0 (Background): #f1f5f9
- Level 1 (Cards/Tables): #ffffff with 1px border #e2e8f0
- Level 2 (Headers): #334155 with white text
- Level 3 (Active cells): #eff6ff with sapphire border

## Typography

**Font Stack:**
- Primary: 'Inter' (400, 500, 600, 700) - all interface text
- Numeric: 'JetBrains Mono' (500, 600) - currency values, calculations
- Arabic Support: 'IBM Plex Sans Arabic' for dirham symbol and mixed content

**Hierarchy:**
- App Title: text-2xl font-semibold tracking-tight (Deep Navy)
- Section Headers: text-base font-semibold uppercase tracking-wider letter-spacing-0.05em (Slate Blue)
- Table Headers: text-sm font-semibold uppercase (White on Slate Blue background)
- Labels: text-sm font-medium (Deep Navy)
- Numeric Values: text-base font-mono tabular-nums font-medium (Deep Navy)
- Totals: text-lg font-mono font-semibold (Deep Navy)
- Currency Symbol: "DH" or "د.م." positioned consistently after amounts

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 3, 4, 6
- Cell padding: px-3 py-2 (compact yet readable)
- Inter-section spacing: mb-6
- Container padding: px-4 md:px-6
- Table row height: h-11 (optimized for data density)

**Page Structure:**
- Maximum width container: max-w-7xl mx-auto
- Fixed header bar: h-14 with gradient background, sticky top-0 z-20
- Content area: pt-4 pb-6 with subtle background pattern
- Action bar integrated into header: right-aligned button group
- Date selector: left side of header with calendar icon
- Three-section layout: Billets/Pièces (grid-cols-2 gap-4) → Opérations (full-width) → Soldes (grid-cols-3 gap-4)

## Component Library

### Table Components

**Primary Table Structure:**
- Container: rounded-lg border border-slate-200 overflow-hidden
- Header row: slate-blue background, white text, h-10, border-b-2
- Data rows: alternating backgrounds (white/soft-gray), h-11, border-b
- Hover state: subtle sapphire tint (bg-blue-50 bg-opacity-30)
- Total rows: border-t-2 border-slate-300, font-bold, pt-3 mt-1

**Billets & Pièces Tables:**
- Side-by-side cards with elevation (shadow-sm)
- Headers: "BILLETS" and "PIÈCES" in tracking-wider uppercase
- Three columns: Dénomination (40%) | Quantité (30%) | Montant (30%)
- Pre-filled denominations (500, 200, 100... for bills; 10, 5, 2... for coins)
- Automatic calculation: Quantité × Dénomination = Montant
- Subtotals row with emerald accent for positive sums

**Opérations Table:**
- Full-width card with shadow-md
- Four columns: # (5%) | Libellé (45%) | Montant (30%) | Type (20%)
- Minimum 12 visible rows with add-row button
- Type column: dropdown with emerald (Entrée) or ruby (Sortie) badge
- Running total calculation displayed in footer

**Soldes Panel:**
- Three-column grid with distinct cards
- Left: Versements (deposits) with emerald accent border
- Center: Retraits (withdrawals) with ruby accent border  
- Right: Récapitulatif (summary) with sapphire accent border, larger text
- Écart caisse: prominent display with border-2, conditional color (green if 0, amber if small variance, red if significant)

### Input Fields

**Editable Cells:**
- Seamless table integration: border-none when inactive
- Focus state: ring-2 ring-sapphire ring-offset-1, bg-blue-50
- Number inputs: text-right, font-mono, tabular-nums
- Text inputs: text-left, font-sans
- Validation: invalid inputs show subtle ruby border shake animation

**Calculated Cells:**
- Read-only: bg-slate-50 with lock icon (size-3) positioned absolute top-1 right-1
- Formula tooltip on hover: rounded-md bg-slate-800 text-white px-2 py-1 text-xs
- Update animation: brief emerald glow (duration-300) when recalculated

### Buttons & Actions

**Action Bar Buttons:**
- Primary (Enregistrer): sapphire background, white text, px-5 py-2, rounded-md, font-medium, shadow-sm
- Secondary (Télécharger Excel/PDF): white background, slate-700 text, border, px-4 py-2, rounded-md
- Icon-only (Imprimer): square button (h-9 w-9) with icon, tooltip on hover
- Group spacing: gap-2 with separator lines (border-r) between groups

**Date Picker:**
- Integrated button: slate background, white text, rounded-md, flex items-center gap-2
- Calendar icon: size-4
- Selected date: font-medium with subtle gradient background

### Visual Enhancements

**Card Elevation:**
- Primary cards (tables): shadow-sm border border-slate-200
- Summary cards: shadow-md with hover lift (translate-y--1 transition-transform)
- Modals: shadow-2xl with backdrop blur

**Subtle Details:**
- Divider lines: 1px solid #e2e8f0 with 2px spacing
- Corner radius: rounded-lg for containers, rounded-md for inputs
- Micro-interactions: 150ms transitions for hover states
- Loading states: skeleton screens with gradient shimmer animation

## Responsive Behavior

**Desktop (lg+):** Full layout with side-by-side tables, all columns visible, action bar expanded

**Tablet (md):** Stack Billets/Pièces vertically, maintain table structure, compact action bar

**Mobile (base):** Single column, horizontal scroll for tables with sticky first column, icon-only action buttons with labels below

## Accessibility

- Keyboard navigation: tab order follows visual flow, arrow keys for cell navigation
- Focus indicators: minimum 2px ring with high contrast
- ARIA labels: all inputs, calculated fields, and actions properly labeled
- Screen reader announcements: calculation updates, save confirmations, errors
- Touch targets: minimum 44×44px on mobile
- Color independence: icons + text for all status indicators

## Print Optimization

- A4 format, 1.5cm margins
- Grayscale conversion: maintain readability
- Remove interactive elements, show all calculated values
- Header: date and "PV d'arrêté de caisse" on every page
- Footer: page numbers, timestamp
- Table borders: 0.5pt solid for clarity
- Page breaks: respect section boundaries