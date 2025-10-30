# Overview

This professional cash register management application (MAD - "PV d'Arrêté de Caisse") tracks daily cash operations, including deposits, withdrawals, and bank reconciliation with automatic calculations. It offers a financial data management interface inspired by fintech applications like Stripe Dashboard, focusing on precision, trust, and operational efficiency. The system manages cash denominations across two locations (cash register and safe), handles various transaction operations (e.g., Western Union, MoneyGram), and automatically calculates balances and discrepancies. Key capabilities include multi-user and multi-agency support with consolidated views, daily PV management, historical PV tracking, and detailed operations logging.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React 18+ and TypeScript, using Vite. It leverages Shadcn/ui (built on Radix UI and Tailwind CSS) for UI components, following a "new-york" style with a fintech aesthetic. State management uses React hooks for local state and TanStack Query for server state. Wouter provides client-side routing. A `UserContext` simulates authentication for multi-user/multi-agency selection. The design system uses a custom color palette (navy/slate blue, emerald, ruby, sapphire) and Inter/JetBrains Mono fonts. Key design decisions include editable cells with formula support, compact layouts for financial data, real-time calculations, and detailed operation breakdowns via modals.

## Backend Architecture

The backend uses Node.js with Express.js and TypeScript. It provides a REST API for cash register, agency, and user operations. Storage is designed with an `IStorage` interface, currently using in-memory storage, but designed to support PostgreSQL via Drizzle ORM for production. Complex nested objects are stored as JSON text fields within the database. Session management will use `connect-pg-simple` with PostgreSQL.

## Data Storage Solutions

Drizzle ORM provides type-safe database operations. The schema includes `agencies`, `users`, and `cash_registers` tables with relational structures. `cash_registers` links to `users` and `agencies` and stores complex data as JSON. Indices are used for efficient querying. The system supports multiple PVs per day, with the latest identifiable by `createdAt` timestamp, enabling historical tracking and an audit trail. Cash discrepancy (Écart Caisse) is calculated and color-coded. Operations with multiple details are flattened for granular visibility. Database connectivity uses Neon serverless PostgreSQL with `DATABASE_URL` environment variable. Zod schemas ensure data validation.

# External Dependencies

*   **UI Frameworks**: Radix UI, Tailwind CSS, Shadcn/ui
*   **Data Fetching**: TanStack Query, native Fetch API
*   **Date Handling**: date-fns
*   **Export & Reporting**: jsPDF, jsPDF-AutoTable (PDF generation), ExcelJS (Excel with full styling)
*   **Database**: Neon (PostgreSQL), Drizzle ORM, Drizzle Kit
*   **Development Tools**: Vite, tsx, esbuild
*   **Replit Integration**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`
*   **Form Handling**: React Hook Form, Zod

# Recent Changes

**October 30, 2025 (Latest)**: Added Admin section for multi-agency oversight
- **Admin Dashboard**: Three-level drill-down navigation for comprehensive agency monitoring with consistent French terminology
  - **Level 1**: Agency overview showing all agencies with key metrics (Agents, PVs enregistrés, Jours avec PV)
  - **Level 2**: Date-based view displaying daily financial aggregates for selected agency (Solde départ, Transactions, Change, Recharge, PayExpress, SpeedBox, CTM, Connexions, Alimentation, Versements, Solde final)
  - **Level 3**: Agent detail view showing individual PVs for each agent on selected date with complete breakdown (Solde de départ, Total opérations, Versements, Retraits, Solde final théorique, Caisse, Coffre, Total cash réel, Écart Caisse)
  - Clean card-based interface with hover effects and intuitive back navigation
  - Full dark mode support with proper color contrast for all financial metrics
  - Accessible via sidebar menu with Shield icon
  - All labels use consistent French terminology throughout all three levels

**October 30, 2025 (Earlier)**: Added professional print view for direct PV printing
- **Print View**: New dedicated print page optimized for A4 format (1-1.5 pages)
  - Clean, compact layout with two-column grid to maximize space utilization
  - All PV details included: Billets, Détail Caisse/Coffre, Opérations, Soldes, Transactions, Signatures
  - Professional styling with @media print CSS for optimal print output
  - Auto-triggered print dialog on page load
  - Accessible via "Imprimer" button on main cash register page
  - Opens in new window to avoid disrupting current work
  - Data passed via localStorage for seamless transition
  - Calculation logic mirrors main page exactly (verified parity for totals, solde final, écart)

**October 30, 2025 (Earlier)**: Enhanced PDF/Excel exports with professional visual design
- **Export System**: Complete redesign of PDF and Excel exports with professional styling
  - **PDF Export** (jsPDF + autoTable): Professional color scheme (slate-800 headers, blue-900 sections), alternating rows (slate-50/white), highlighted totals, emphasized important lines, clean borders
  - **Excel Export** (ExcelJS): Migrated from `xlsx` to `exceljs` for full styling support. Features: merged title cells, colored section headers, alternating row fills, bold totals, number formatting (#,##0.00), professional borders, signature section
  - Both formats follow identical structure: Title → Billets → Operations → Soldes/Transactions → Signatures → Détail caisse/coffre
  - Consistent color palette (slate/blue tones) ensures cohesive brand experience

**October 30, 2025 (Earlier)**: Fixed consolidated totals calculation - écart caisse now includes transactions (versements/retraits) matching PV Agence formula