# Copilot Instructions — seller-bitacora

Herramienta interna de **Seller Consulting** (Seller Group E.A.S.) para documentar
el trabajo con clientes: proyectos, sesiones, resúmenes ejecutivos y un portal de
solo lectura para compartir el avance con el cliente.

> Para el contexto completo de empresa + producto lee **`CLAUDE.md`** en la raíz.
> Este archivo es el resumen operativo. Si hay conflicto, gana `CLAUDE.md`.

## Stack

- React 18 + Vite 5, `react-router-dom` 6 (`BrowserRouter`)
- Tailwind CSS 3 + PostCSS; estilos inline solo para valores dinámicos
- Supabase (PostgreSQL + Auth + Storage + Realtime); Auth con Google OAuth
- `lucide-react` para iconos
- Claude API vía proxy Express local (`server.cjs`), no vía el bundle
- Deploy en Vercel (`vercel.json` con SPA rewrites) → `bitacora.seller.consulting`

## Comandos

```bash
npm run dev        # Vite dev server (HMR)
npm run proxy      # Proxy Express para Claude API (puerto 3001)
npm run dev:all    # dev + proxy juntos
npm run build      # build de producción -> dist/
npm run lint       # ESLint (--max-warnings 0)
```

Variables en `.env.local` (no se commitea): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_PROXY_URL` (opcional).
`VITE_ANTHROPIC_API_KEY` la usa **solo** `server.cjs`, nunca el frontend.

## Arquitectura

Código vigente: `src/components/v2/**`, `src/hooks/**`, `src/App.jsx`,
`src/components/Login.jsx`, `src/services/claudeService.js`.

Rutas (`src/App.jsx`), sesión resuelta con `getSession()` + `onAuthStateChange`:

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/login` | `components/Login.jsx` | público |
| `/shared/:token` | `components/v2/ClientPortal.jsx` | **público, sin auth** (vía `share_token` + `share_enabled`) |
| `/dashboard` | `components/v2/Dashboard.jsx` | requiere sesión |
| `/project/:projectId` | `components/v2/ProjectView.jsx` | requiere sesión |

**Legacy / no montado** (no editar sin pedir contexto): `src/App.jsx.OLD`,
`src/NotesImporter.jsx`, `src/components/SessionCard.jsx` (la activa es la de
`v2/`), `src/components/BitacoraFinanzas.jsx` + `src/hooks/useFinanzas.js`
(módulo finanzas en desarrollo, sin ruta todavía). Los archivos de config
duplicados dentro de `src/` se ignoran; mandan los de la raíz.

### Modelo de datos (Supabase, esquema `public`)

- `proyectos` — `user_id`, `nombre`, `descripcion`, `logo_url`, `color_tema`
  (default `#3b82f6`), `estado` (`activo`/`pausado`), `share_token`,
  `share_enabled`, `updated_at`.
- `sesiones` — `proyecto_id`, `titulo`, `fecha`, `fase_id` (1–4),
  `responsable_cliente`, `estado_cliente`, `contenido` (texto libre),
  `etiqueta` (`Sesión`/`Agendada`), `resumen_ejecutivo` (JSON:
  `{texto, generado_con_ia, fecha_generacion}`).
- `proyectos_con_stats` — **vista** con agregados (`total_sesiones`,
  `ultima_sesion_fecha`, `sesiones_diagnostico/plan/implementacion/seguimiento`).
  Usar para listados; no recalcular en el cliente.
- `configuracion_finanzas`, `movimientos_financieros` — módulo finanzas.
- Storage bucket `public`, logos en `project-logos/`.

**Fases del proyecto** (constante repetida en varios componentes):
1 🔍 Diagnóstico · 2 📋 Plan Estratégico · 3 ⚙️ Implementación · 4 📊 Seguimiento & Control.

### Claude API

`services/claudeService.js` → `POST {VITE_PROXY_URL}/api/claude` con
`{ prompt, sessionData }`; `server.cjs` reenvía a la API de Anthropic y devuelve
`{ summary, rawResponse }`. Uso principal: generar el resumen ejecutivo de una
sesión (`AddSessionModal`). En producción el proxy Express **no corre**: para IA
desplegada habría que portarlo a una Serverless Function. Al fijar modelo, usar
un ID de Claude vigente (el de `server.cjs` es antiguo).

## Convenciones

- **Todo en español**: UI, textos, comentarios, mensajes de commit, columnas de
  BD en `snake_case` español.
- Componentes en PascalCase, uno por archivo, `export default`.
- Hooks de datos en `src/hooks/`: encapsulan fetch + CRUD + realtime y devuelven
  `{ data, loading, error, ...acciones }`. Sin Redux/Context global; `useState`/
  `useEffect` locales. Cada fetch maneja su `loading` y `error` explícitos.
- Patrón Supabase:
  ```js
  const { data, error } = await supabase.from('tabla').select('*').eq('col', v);
  if (error) throw error;
  ```
  Escrituras: `.insert([...]).select().single()`, `.update(...).eq('id', id)`,
  `.upsert(..., { onConflict: 'user_id' })`. Filtrar por `user_id`
  (`supabase.auth.getUser()`) en datos privados. `error.code === 'PGRST116'` = "no
  rows", es caso normal.
- Tailwind para todo lo estático; paleta de marca en `tailwind.config.js`
  (`seller-blue` `#2563eb`, `seller-blue-dark` `#1d4ed8`, `seller-blue-light`
  `#dbeafe`) — aunque el código todavía usa mucho el hex literal. `style={{...}}`
  solo para valores dinámicos (p. ej. `color_tema`).
- Separadores de sección: `// ==================== NOMBRE ====================`.
- `console.error('Contexto:', error)` para logs; nunca mostrar el error crudo al
  usuario (usar estado de error con mensaje amable).
- Commits en español, prefijo Conventional Commits (`feat:`, `fix:`, `chore:`,
  `refactor:`). No commitear `.env`.

## Antes de cerrar un cambio

1. `npm run lint` (`--max-warnings 0`).
2. `npm run build` si tocaste imports, rutas o assets (Vercel rompe el build; hay
   historial de "fix: logo roto", "fix JSX").
3. Assets: `import logo from '../assets/x.png'`, nunca rutas absolutas
   `/src/assets/...` (rompen en build).
4. Probar en ambos modos cuando aplique: consultor autenticado y `/shared/:token`.

## Trampas conocidas

- Encoding: problemas históricos con tildes / `divs` de cierre en JSX. Si un
  archivo se ve raro, revisar UTF-8.
- `ClientPortal` arma clases Tailwind dinámicas (`bg-${color}-100`): solo
  funcionan si existen en el build; no extender a colores nuevos sin safelist.
- `useProjects` expone nombres inconsistentes (`getProjects` vs `refetch`);
  revisar el hook antes de llamar métodos.
