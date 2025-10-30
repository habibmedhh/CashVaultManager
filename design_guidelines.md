# Design Guidelines: Cash Register Management Application

## Design Approach

**Selected Approach:** Design System - Utility-Focused
This is a productivity tool for cash management requiring precision, clarity, and efficiency. The design prioritizes data entry accuracy and calculation visibility over visual aesthetics. Drawing inspiration from modern spreadsheet applications (Google Sheets, Airtable) and enterprise data tools (Notion tables, Linear data views) while maintaining Excel familiarity.

**Core Principle:** Faithful spreadsheet recreation with modern web polish - every pixel serves data clarity and operational efficiency.

## Layout System

**Spacing Primitives:** Use Tailwind units of 1, 2, 4, and 6 consistently
- Cell padding: p-2
- Section spacing: mb-4 and mb-6 between major sections
- Container margins: mx-4 on mobile, mx-6 on desktop
- Table borders: border and border-2 for emphasis

**Page Structure:**
- Full-width container (max-w-7xl mx-auto) for optimal table viewing
- Header bar with date selector and action buttons (h-16)
- Main content area with scrollable table sections
- Fixed action bar at top for Save/Download/Print functions
- Responsive breakpoint: single column on mobile (stacked tables), full table view on tablet+

## Typography

**Font Family:** 
- Primary: 'Inter' or 'Roboto' for clean data readability
- Monospace: 'Roboto Mono' for numeric values and calculations

**Hierarchy:**
- Page title (PV d'arrêté de caisse): text-2xl font-semibold
- Section headers: text-lg font-medium uppercase tracking-wide
- Table headers: text-sm font-semibold uppercase
- Cell labels: text-sm font-medium
- Numeric values: text-base font-mono tabular-nums (ensures number alignment)
- Formula display: text-xs font-mono italic
- Total rows: text-base font-bold

## Component Library

### Core Table Structure
**Three Main Tables:** Each with distinct visual separation (mb-6 between tables)

1. **Billets & Pièces Section (Top):**
   - Two side-by-side tables (grid-cols-2 gap-4 on desktop)
   - Column headers: Dénomination | Quantité | Montant
   - Row height: h-10 for comfortable data entry
   - Footer row for totals with emphasized styling

2. **Opérations Section (Middle):**
   - Full-width table
   - Columns: Libellé | Montant | Type (Entrée/Sortie)
   - Multiple input rows (minimum 10 visible rows)
   - Auto-calculating total row

3. **Versements/Retraits + Soldes Section (Bottom):**
   - Split layout: left side for transactions, right side for balance summary
   - Solde départ, Solde final, Écart caisse displayed prominently
   - Écart caisse gets special visual treatment (larger text, emphasized border)

### Cell Types

**Editable Cells:**
- Input fields styled as table cells: border, p-2, rounded-none
- Focus state: prominent outline (ring-2) and subtle background shift
- Placeholder text for guidance
- Text alignment: right-aligned for numbers, left for labels
- Validation indicators for invalid entries

**Calculated Cells:**
- Read-only appearance with subtle background differentiation
- Display formula on hover via tooltip
- Click outside triggers calculation and display update
- Formula preview in small text below value when focused

**Header Cells:**
- Bold text, subtle background differentiation
- Borders on all sides for grid clarity
- Sticky positioning for long tables (sticky top-0)

### Navigation & Actions

**Action Bar (Top):**
- Fixed or sticky positioning (sticky top-0 z-10)
- Button group with consistent spacing (gap-2)
- Primary action (Enregistrer): prominent button size (px-6 py-2)
- Secondary actions (Télécharger Excel, PDF, Imprimer): standard size (px-4 py-2)
- Date picker integrated into header: inline calendar icon

**Button Specifications:**
- All buttons: rounded corners (rounded-md), medium font weight
- Icon + text for clarity
- Grouped by function with dividers between groups

### Form Elements

**Input Fields within Tables:**
- Seamless integration: no visible borders when not focused
- Border appears on focus
- Number inputs with step controls hidden (appearance: textfield)
- Tab navigation follows logical top-to-bottom, left-to-right flow

**Dropdowns (for transaction types):**
- Minimal styling to blend with table aesthetic
- Clear selected value display
- Options list with adequate spacing (py-2)

### Data Display

**Numeric Formatting:**
- Thousand separators for readability
- Two decimal places for currency (XX.XX)
- Negative values with minus sign (not parentheses)
- Alignment: all numbers right-aligned within cells

**Totals & Calculations:**
- Distinct row styling (border-t-2, font-bold)
- Larger text size for critical totals (Solde final, Écart caisse)
- Visual separation from input rows (pt-2 spacing)

### Modals & Overlays

**Confirmation Dialogs:**
- Simple centered modal (max-w-md)
- Clear messaging with action buttons
- Used for: confirming save, overwrite warnings, print preview

**Print Preview:**
- Full-screen overlay showing print layout
- A4 paper format simulation
- Close button (top-right) and Print button (bottom-right)

## Responsive Behavior

**Desktop (lg and above):**
- Full table layout with all columns visible
- Side-by-side Billets/Pièces tables
- Action bar spans full width

**Tablet (md):**
- Stack Billets/Pièces tables vertically
- Maintain table structure with horizontal scroll if needed
- Action bar remains at top

**Mobile (base):**
- Single column layout
- Each section stacks vertically
- Simplified action bar (icon-only buttons with tooltips)
- Horizontal scroll for wide tables with fixed first column

## Accessibility

**Keyboard Navigation:**
- Tab through all editable cells in logical order
- Enter to edit cell, Escape to cancel
- Arrow keys for cell navigation within tables
- Keyboard shortcuts for actions (Ctrl+S for save, Ctrl+P for print)

**Screen Reader Support:**
- Descriptive labels for all input fields
- Table headers properly associated (scope attributes)
- Status announcements for calculations and saves
- Error messages linked to inputs (aria-describedby)

**Visual Clarity:**
- High contrast between text and backgrounds
- Clear focus indicators (minimum 2px outline)
- Sufficient touch targets (minimum 44x44px on mobile)
- No color-only indicators (use icons + color)

## Animations

**Minimal, purposeful only:**
- Fade-in for modals (duration-200)
- Subtle highlight flash on calculated cell update (duration-300)
- Loading spinner during save/download operations
- No decorative animations - focus remains on data

## Print Optimization

**Print Layout:**
- A4 format with appropriate margins (1.5cm all sides)
- Page breaks respect table boundaries
- Header with date on every page
- Footer with page numbers
- Remove action buttons and interactive elements
- Ensure all borders print clearly