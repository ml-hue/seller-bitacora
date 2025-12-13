# Copilot Instructions for seller-bitacora

## Project Overview
**seller-bitacora** is a React + Vite application for managing client sessions and project roadmaps. It uses Supabase as the backend and Tailwind CSS for styling. The app features a dual-mode interface (client portal vs. internal tool) and handles complex data relationships around projects, sessions, and phases.

## Tech Stack
- **Frontend**: React 19, Vite 7
- **Styling**: Tailwind CSS 4, PostCSS
- **Backend**: Supabase (PostgreSQL)
- **Build**: Vite with React plugin
- **Code Quality**: ESLint with React hooks rules

## Architecture Patterns

### Supabase Integration
All database operations follow a consistent pattern:
```jsx
const { data, error } = await supabase
  .from("table_name")
  .select("columns")
  .eq("filter_col", value);

if (error) throw error;
```
- Error handling is always wrapped in try-catch blocks
- Environmental variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required
- Client is singleton exported from `src/supabaseClient.js`

### Component Structure (Single Large Components)
- Both `App.jsx` (961 lines) and `NotesImporter.jsx` (522 lines) are monolithic components
- Use comments with visual separators (===) to organize major functional sections
- Sections pattern: Data loading functions → event handlers → helper functions → JSX render
- Inline styles are preferred over CSS modules in existing code

### State Management
- Uses React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`
- No Redux/Context; state remains local to components
- Loading and error states are explicitly managed per data fetch operation
- Example: `[sessionsLoading, setSessionsLoading]` paired with `[sessionsError, setSessionsError]`

### Data Fetch Pattern
- Wrap async operations in `useCallback` to prevent infinite loops
- Always set loading state before fetch, error state to null, cleanup in finally
- Use `maybeSingle()` for optional single-row queries (e.g., project_phase lookup)
- Handle edge case where record doesn't exist by creating it on first access

### Dual-Mode Portal Logic
- Check URL host or query param: `window.location.host.includes("bitacora-client")` or `?mode=client`
- Client mode hides internal controls, shows limited data
- Reference: `App.jsx` lines 24-26

## Development Workflows

### Local Development
```bash
npm run dev      # Start Vite dev server (HMR enabled)
npm run build    # Production build to dist/
npm run lint     # Run ESLint checks
npm run preview  # Preview production build locally
```

### Environment Setup
Create `.env.local` with:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## Code Conventions

### Naming
- React components: PascalCase (`NotesImporter`, `App`)
- Variables/functions: camelCase
- Database columns: snake_case (matches Supabase schema)
- Constants: UPPER_SNAKE_CASE (e.g., `PHASES`, `PHASE_MARKERS`)

### Comments
- Use `/* ===== SECTION_NAME ===== */` for visual section breaks
- Inline comments for non-obvious logic
- Spanish is acceptable in comments and UI text (project context)

### Styling
- Tailwind utilities preferred for new components
- Inline `style` objects used for dynamic values or one-off components
- Avoid creating new CSS files unless reusable across components

### Error Handling
- Log errors to console: `console.error("Context message:", error)`
- Show user-friendly messages in UI state (never expose raw error to users)
- Validation before async operations (e.g., check data exists before import)

## Common Tasks

### Adding a New Feature
1. Create data fetch function using `useCallback`
2. Add related `useState` hooks for loading/error/data
3. Wire in `useEffect` to trigger on dependency change
4. Build UI with inline styles, using emoji for visual indicators
5. Test in both portal modes

### Modifying Database Queries
- All queries in `src/App.jsx` and `src/NotesImporter.jsx`
- Follow destructuring pattern: `const { data, error } = await supabase...`
- Add `.order()` clauses for consistent sorting
- Use `.eq()` for filters, `.select()` for column picking

### Notes Import Workflow (NotesImporter.jsx)
- Parse text with regex patterns for Title, Date, Tag, Status fields
- Default values: today's date, "Sesión" tag, "postergado" status
- Support Spanish field names (Título, Fecha, Etiqueta, Estado)
- Three-step UX: Parse → Preview → Import to maintain data integrity

## Key Files Reference
- `src/App.jsx` - Main application, project/session management, roadmap visualization
- `src/NotesImporter.jsx` - macOS Notes migration tool
- `src/supabaseClient.js` - Singleton Supabase client setup
- `src/index.css` - Global Tailwind directives
- `package.json` - Dependencies and build scripts
- `vite.config.js` - Vite configuration with React plugin

## Testing & Debugging
- Use browser DevTools to inspect Supabase requests (Network tab)
- Check React DevTools for hook state
- ESLint rules enforce no unused variables (except uppercase constants)
- Test portal mode by adding `?mode=client` to localhost URL
