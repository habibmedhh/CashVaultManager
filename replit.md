# Overview

This is a professional cash register management application (MAD - "PV d'Arrêté de Caisse") designed for daily cash operations tracking, including deposits, withdrawals, and bank reconciliation with automatic calculations. The application provides a sophisticated financial data management interface inspired by modern fintech applications like Stripe Dashboard and Revolut Business, emphasizing precision, trust, and operational efficiency.

The system tracks cash denominations (bills and coins) across two locations (cash register and safe), manages various transaction operations (Western Union, MoneyGram, RIA, etc.), handles bank deposits and withdrawals, and automatically calculates balances and discrepancies.

## Key Features

1. **Multi-User & Multi-Agency Support**: 
   - Each agent (chargé de clientèle) manages their own isolated PV
   - Agents are assigned to agencies
   - When multiple agents share an agency, automatic "PV Agence" consolidation view
   - User selector in header for simulated authentication (production would use proper auth)
   
2. **Daily PV Management**: 
   - Create and save multiple PVs per day, with automatic timestamp tracking
   - Each PV is linked to a specific user and agency
   - User can only view and edit their own PVs
   
3. **PV Agence (Consolidated View)**: 
   - Automatically combines data from all agents in the same agency
   - Aggregates cash registers, safes, operations, and transactions
   - Shows combined totals and discrepancies by date
   - Only visible when multiple agents share an agency
   
4. **PV History**: 
   - View all historical PVs with date range filtering and detailed summaries
   - Toggle to show only the latest PV per day or all PVs (default: latest only)
   - Cash discrepancy column (Écart Caisse) showing the difference between actual cash and expected balance
   
5. **Operations Detail**: 
   - Comprehensive view of all operations and transactions with advanced filtering (by date, type, amount, search)
   - Each operation detail displayed as a separate row for granular visibility
   - New Description column showing individual operation details
   
6. **Multi-page Navigation**: Sidebar navigation for easy access to different features

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

**October 30, 2025 (Latest)**: Fixed consolidated totals calculation to match PV Agence
- **Backend**: Added missing `/api/users/all` endpoint to retrieve all users
- **PV History Page**: Corrected écart caisse calculation to include transactions
  - Updated `calculateConsolidatedTotals` to parse and sum versements (deposits) and retraits (withdrawals)
  - Now uses same formula as PV Agence: `soldeFinal = soldeDepart + totalOperations + totalVersements - totalRetraits`
  - Écart caisse calculated as: `ecartCaisse = totalCash - soldeFinal`
  - Consolidated totals now match PV Agence page exactly (verified: -2000 MAD vs previous incorrect -1000 MAD)
- **PV History Page**: When "Tous les agents" is selected, displays consolidated PV totals by agency
  - Groups PVs by agency and takes the latest PV for each agent
  - Shows a single "PV Agence" card per agency/date with accurate consolidated metrics
  - Links to PV Agence page for detailed view
- **Operations Detail Page**: Fixed to display operations from all agents
  - Changed grouping logic from (date) to (date, userId)
  - Now shows the latest PV for each agent per date
  - Ensures all agents' operations are visible

**October 30, 2025 (Earlier)**: Enhanced multi-user/multi-agency filtering and display
- Added agency and agent filters to PV History page with agent/agency columns
- Added agency and agent filters to Operations Detail page with agent attribution column
- Added detailed "Versements et Retraits" section to PV Agence page
- Fixed transaction aggregation to display each transaction line individually (not aggregated)
- All filtering pages now support comprehensive multi-agency and multi-user views

**October 30, 2025 (Earlier)**: Implemented multi-user and multi-agency support
- Extended database schema with agencies table and user roles
- Added foreign key relationships linking users and cash registers to agencies
- Created UserContext and UserSelector for simulated authentication
- Built PV Agence page for consolidated multi-agent view
- Updated cash register page to filter by selected user
- Fixed TanStack Query bug where agency IDs weren't properly interpolated into API URLs
- All PVs now require userId and agencyId (nullable for backward compatibility)

# System Architecture

## Frontend Architecture

**Framework**: React 18+ with TypeScript, utilizing Vite as the build tool and development server.

**UI Component System**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. The design follows a "new-york" style variant with custom color variables and a sophisticated fintech-inspired aesthetic.

**State Management**: React's built-in useState and useEffect hooks for local component state. TanStack Query (React Query) handles server state management, caching, and data synchronization with the backend.

**Routing**: Wouter provides lightweight client-side routing with multiple pages:
- `/` - Main cash register PV interface (user-specific)
- `/pv-agence` - Consolidated PV view for multi-agent agencies
- `/historique` - PV history with date filtering and toggle for showing all/latest PVs
- `/operations` - Detailed operations view with flattened operation details

**Navigation**: Shadcn sidebar component provides persistent navigation across all pages.

**User Context**: UserContext provides simulated authentication and user selection:
- Tracks currently selected user (agent) via localStorage
- Provides user details (name, role, agency)
- UserSelector component in header allows switching between agents
- Production would replace this with proper authentication (Replit Auth, OAuth, etc.)

**Design System**: Custom color palette with deep navy/slate blue backgrounds, emerald for positive values, ruby for negative values, and sapphire for primary actions. Typography uses Inter for interface text and JetBrains Mono for numeric values to ensure tabular alignment and readability of financial data.

**Key Design Decisions**:
- Editable cells support both direct number input and formula calculations (Excel-like `=` prefix)
- Compact, information-dense layouts optimized for financial data entry
- Real-time calculation of totals and discrepancies
- Support for detailed operation breakdowns via modal dialogs

## Backend Architecture

**Runtime**: Node.js with Express.js framework providing a REST API.

**Language**: TypeScript with ES modules for type safety and modern JavaScript features.

**API Design**: RESTful endpoints for cash register and agency operations:

*Cash Register Endpoints*:
- `POST /api/cash-register` - Save cash register data (creates new PV with userId and agencyId)
- `GET /api/cash-register/:date/user/:userId` - Retrieve latest PV for specific date and user
- `GET /api/cash-registers` - Retrieve all PVs sorted by date
- `GET /api/cash-registers/range/:startDate/:endDate` - Retrieve PVs in date range
- `GET /api/cash-registers/agency/:agencyId` - Retrieve all PVs for a specific agency

*Agency Endpoints*:
- `GET /api/agencies` - Retrieve all agencies
- `GET /api/agencies/:id` - Retrieve a specific agency
- `POST /api/agencies` - Create a new agency
- `PATCH /api/agencies/:id` - Update an agency

*User Endpoints*:
- `GET /api/users/all` - Retrieve all users
- `GET /api/users/:id` - Retrieve a specific user
- `GET /api/users/agency/:agencyId` - Retrieve all users for a specific agency
- `PATCH /api/users/:id` - Update a user (role, agency assignment)

**Storage Strategy**: Dual-layer storage implementation via `IStorage` interface:
- In-memory storage (`MemStorage`) for development/testing
- Designed to support PostgreSQL via Drizzle ORM for production

**Data Serialization**: Complex nested objects (bills data, coins data, operations, transactions) are stored as JSON text fields in the database, allowing flexible schema evolution while maintaining relational structure for core entities.

**Session Management**: Uses connect-pg-simple for PostgreSQL-backed session storage (when database is provisioned).

## Data Storage Solutions

**ORM**: Drizzle ORM provides type-safe database operations with schema-first design.

**Database Schema**:

- `agencies` table: Organizational units for grouping agents
  - `id`: Unique identifier (varchar/UUID)
  - `name`: Agency name
  - `createdAt`: Timestamp

- `users` table: Agents and administrators
  - `id`: Unique identifier (serial)
  - `username`: Login username
  - `password`: Hashed password
  - `name`: Display name
  - `role`: User role ('admin' or 'agent')
  - `agencyId`: Foreign key to agencies (nullable for admins)
  - `createdAt`: Timestamp

- `cash_registers` table: Daily PV records
  - `id`: Unique identifier (serial)
  - `userId`: Foreign key to users (nullable for backward compatibility)
  - `agencyId`: Foreign key to agencies (nullable for backward compatibility)
  - `date`: Natural date key (YYYY-MM-DD format)
  - `createdAt`: Timestamp for tracking when PV was created (allows multiple PVs per day)
  - Indexes on `date`, `createdAt`, `userId`, and `agencyId` for efficient querying
  - Serialized JSON for complex data structures (bills, coins, operations, transactions)
  - `solde_depart` (opening balance)

**Relational Structure**:
- Each cash register belongs to one user (agent) and one agency
- Each user belongs to zero or one agency (admins have no agency)
- Each agency can have multiple users (agents)
- PV Agence consolidation queries join cash_registers by agencyId and date

**Schema Evolution Strategy**: JSON fields allow flexibility for adding new transaction types or cash denominations without schema migrations. Core financial data (totals, dates, user references) remain in structured columns.

**PV Versioning Strategy**: The system now supports multiple PVs per day by creating a new record each time the user saves. The latest PV for any given date is retrieved using the `createdAt` timestamp. This allows:
- Historical tracking of all changes throughout the day
- Ability to review previous states of the PV
- Audit trail for financial operations
- Toggle in PV History page to show only latest PV per day (default) or all historical versions

**Cash Discrepancy Tracking**: The application calculates cash discrepancy (Écart Caisse) for each PV using the formula:
- Écart Caisse = Total Caisse - (Solde Départ + Total Opérations)
- Color-coded display: Green for positive discrepancy, red for negative, normal for zero

**Operation Detail Flattening**: Operations with multiple details (e.g., Western Union with 4 transactions) are displayed as separate rows in the Operations Detail page, providing granular visibility into each individual transaction rather than aggregated summaries.

**Database Connectivity**: Configured for PostgreSQL via Neon serverless driver (`@neondatabase/serverless`), with connection string from `DATABASE_URL` environment variable.

**Data Validation**: Zod schemas generated from Drizzle schema definitions ensure type safety from database to API to frontend.

## External Dependencies

**UI Framework**:
- Radix UI components for accessible, unstyled primitives
- Tailwind CSS for utility-first styling
- Shadcn/ui for pre-built component patterns

**Data Fetching**:
- TanStack Query for server state management
- Native fetch API for HTTP requests

**Date Handling**:
- date-fns for date formatting and manipulation with French locale support

**Database**:
- Neon serverless PostgreSQL for production database
- Drizzle ORM for type-safe queries
- Drizzle Kit for migrations

**Development Tools**:
- Vite for fast development server and optimized builds
- tsx for TypeScript execution in development
- esbuild for production server bundling

**Replit Integration**:
- `@replit/vite-plugin-runtime-error-modal` for error overlay
- `@replit/vite-plugin-cartographer` for enhanced debugging
- `@replit/vite-plugin-dev-banner` for development environment indication

**Form Handling**:
- React Hook Form with Zod resolvers for type-safe form validation

**Design Tokens**: Custom CSS variables for theme consistency, supporting both light and dark modes with separate color definitions for backgrounds, borders, and interactive states.