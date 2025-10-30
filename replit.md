# Overview

This is a professional cash register management application (MAD - "PV d'Arrêté de Caisse") designed for daily cash operations tracking, including deposits, withdrawals, and bank reconciliation with automatic calculations. The application provides a sophisticated financial data management interface inspired by modern fintech applications like Stripe Dashboard and Revolut Business, emphasizing precision, trust, and operational efficiency.

The system tracks cash denominations (bills and coins) across two locations (cash register and safe), manages various transaction operations (Western Union, MoneyGram, RIA, etc.), handles bank deposits and withdrawals, and automatically calculates balances and discrepancies.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18+ with TypeScript, utilizing Vite as the build tool and development server.

**UI Component System**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. The design follows a "new-york" style variant with custom color variables and a sophisticated fintech-inspired aesthetic.

**State Management**: React's built-in useState and useEffect hooks for local component state. TanStack Query (React Query) handles server state management, caching, and data synchronization with the backend.

**Routing**: Wouter provides lightweight client-side routing. Currently implements a single-page application pattern with the main cash register interface at the root route.

**Design System**: Custom color palette with deep navy/slate blue backgrounds, emerald for positive values, ruby for negative values, and sapphire for primary actions. Typography uses Inter for interface text and JetBrains Mono for numeric values to ensure tabular alignment and readability of financial data.

**Key Design Decisions**:
- Editable cells support both direct number input and formula calculations (Excel-like `=` prefix)
- Compact, information-dense layouts optimized for financial data entry
- Real-time calculation of totals and discrepancies
- Support for detailed operation breakdowns via modal dialogs

## Backend Architecture

**Runtime**: Node.js with Express.js framework providing a REST API.

**Language**: TypeScript with ES modules for type safety and modern JavaScript features.

**API Design**: RESTful endpoints for cash register data operations:
- `POST /api/cash-register` - Save cash register data
- `GET /api/cash-register/:date` - Retrieve data by date

**Storage Strategy**: Dual-layer storage implementation via `IStorage` interface:
- In-memory storage (`MemStorage`) for development/testing
- Designed to support PostgreSQL via Drizzle ORM for production

**Data Serialization**: Complex nested objects (bills data, coins data, operations, transactions) are stored as JSON text fields in the database, allowing flexible schema evolution while maintaining relational structure for core entities.

**Session Management**: Uses connect-pg-simple for PostgreSQL-backed session storage (when database is provisioned).

## Data Storage Solutions

**ORM**: Drizzle ORM provides type-safe database operations with schema-first design.

**Database Schema**:
- `users` table: Authentication with username/password
- `cash_registers` table: Stores daily cash register records with date as natural key, serialized JSON for complex data structures (bills, coins, operations, transactions), and `solde_depart` (opening balance)

**Schema Evolution Strategy**: JSON fields allow flexibility for adding new transaction types or cash denominations without schema migrations. Core financial data (totals, dates, user references) remain in structured columns.

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