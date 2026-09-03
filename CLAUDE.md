# CLAUDE.md — Contexto maestro de Seller Consulting

> Este archivo es el contexto base para todas las sesiones de Claude Code en los
> proyectos de Seller Consulting. Léelo antes de trabajar. Manténlo actualizado
> cuando cambien decisiones de arquitectura, stack o convenciones.

## 1. La empresa

- **Nombre legal:** Seller Group E.A.S. — marca comercial **Seller Consulting**.
- **Actividad:** consultoría comercial / de ventas. Los consultores trabajan con
  clientes en ciclos de sesiones estructuradas por fases (diagnóstico → plan →
  implementación → seguimiento).
- **Dominio:** `seller.consulting`. Correo del owner: `ml@seller.consulting`.
- **Propiedad intelectual:** el código y los datos de las herramientas internas
  son de Seller Group E.A.S.

### Idioma

- **Todo el producto está en español** (UI, textos, comentarios, mensajes de
  commit, nombres de columnas de base de datos en `snake_case` español:
  `proyectos`, `sesiones`, `fecha`, `titulo`, `contenido`).
- Escribe comentarios de código y de commits en español salvo que el archivo
  circundante ya esté en inglés.

## 2. Proyecto en este repo: `seller-bitacora`

**Bitácora** es la herramienta interna para documentar el trabajo con cada
cliente: proyectos, sesiones, resúmenes ejecutivos y un portal de solo lectura
para compartir el avance con el cliente.

- Repo: `github.com/ml-hue/seller-bitacora`
- Producción: **Vercel** → `https://bitacora.seller.consulting`
- Rama principal: `main` (deploy automático en cada push a `main`).

### Stack real (verificar antes de asumir versiones)

| Capa        | Tecnología |
|-------------|------------|
| Frontend    | React 18, Vite 5 |
| Routing     | `react-router-dom` 6 (`BrowserRouter`) |
| Estilos     | Tailwind CSS 3 + PostCSS; estilos inline para valores dinámicos |
| Backend     | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Auth        | Supabase Auth con **Google OAuth** (`signInWithOAuth`) |
| Iconos      | `lucide-react` |
| IA          | Claude API vía proxy Express local (`server.cjs`) |
| Deploy      | Vercel (SPA rewrites en `vercel.json`) |
| Node        | v24 en local |

> Nota: `.github/copilot-instructions.md` está parcialmente desactualizado (habla
> de React 19 / Vite 7 y de un `App.jsx` monolítico). La arquitectura vigente es
> la v2 descrita aquí. Si hay conflicto, gana este archivo.

### Comandos

```bash
npm run dev        # Vite dev server (HMR)
npm run proxy      # Proxy Express para Claude API (puerto 3001)
npm run dev:all    # dev + proxy juntos (concurrently)
npm run build      # build de producción -> dist/
npm run lint       # ESLint (--max-warnings 0)
npm run preview    # previsualizar build
```

### Variables de entorno (`.env.local`, NO se commitea)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_CLIENT_ID=...           # GoogleOAuthProvider en main.jsx
VITE_PROXY_URL=http://localhost:3001 # opcional, default para claudeService
VITE_ANTHROPIC_API_KEY=...          # SOLO lo usa server.cjs (proxy), nunca el bundle
```

`.env` está en `.gitignore`. La API key de Anthropic **nunca** debe llegar al
frontend: vive solo en el proxy (`server.cjs`).

## 3. Arquitectura

### Rutas (`src/App.jsx`)

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/login` | `components/Login.jsx` | público |
| `/shared/:token` | `components/v2/ClientPortal.jsx` | **público** (sin auth) |
| `/dashboard` | `components/v2/Dashboard.jsx` | requiere sesión |
| `/project/:projectId` | `components/v2/ProjectView.jsx` | requiere sesión |
| `/` y `*` | redirect según sesión | — |

- La sesión de Supabase se resuelve en `App.jsx` con `getSession()` +
  `onAuthStateChange`. Mientras `loading`, se muestra spinner.
- El **portal del cliente** usa `share_token` + `share_enabled` en `proyectos`
  para dar acceso de solo lectura sin autenticación.

### Código vigente vs. legacy

- **Vigente:** `src/components/v2/**`, `src/hooks/**`, `src/App.jsx`,
  `src/components/Login.jsx`, `src/services/claudeService.js`.
- **Legacy / no montado (no tocar sin pedir contexto):**
  `src/App.jsx.OLD`, `src/NotesImporter.jsx`, `src/components/SessionCard.jsx`
  (la versión activa es `src/components/v2/SessionCard.jsx`),
  `src/components/BitacoraFinanzas.jsx` + `src/hooks/useFinanzas.js` (módulo de
  finanzas en desarrollo, todavía sin ruta en `App.jsx`).
- Hay varios archivos de config duplicados dentro de `src/` (`src/vite.config.js`,
  `src/postcss.config.js`, `src/server.cjs`, etc.). Los que mandan son los de la
  **raíz**.

### Modelo de datos (Supabase, esquema `public`)

| Tabla / vista | Uso |
|---------------|-----|
| `proyectos` | proyecto por cliente. Campos: `user_id`, `nombre`, `descripcion`, `logo_url`, `color_tema` (default `#3b82f6`), `estado` (`activo`/`pausado`/…), `share_token`, `share_enabled`, `updated_at` |
| `sesiones` | sesión de un proyecto. Campos: `proyecto_id`, `titulo`, `fecha`, `fase_id` (1–4), `responsable_cliente`, `estado_cliente`, `contenido` (texto libre), `etiqueta` (`Sesión` / `Agendada` / …), `resumen_ejecutivo` (JSON: `{texto, generado_con_ia, fecha_generacion}`) |
| `proyectos_con_stats` | **vista** con agregados por proyecto (`total_sesiones`, `ultima_sesion_fecha`, `sesiones_diagnostico/plan/implementacion/seguimiento`, etc.). Usar para lectura en listados. |
| `configuracion_finanzas` | (módulo finanzas) `user_id`, `saldo_inicial`, `fecha_inicio`, `cuenta_bancaria` |
| `movimientos_financieros` | (módulo finanzas) ingresos/egresos, `agendado`, `estado`, `confirmado`, `conciliado`, `recordar`, `dias_antes` |
| Storage bucket `public` | logos de proyecto en `project-logos/` |

**Fases del proyecto** (constante repetida en varios componentes):

1. 🔍 Diagnóstico
2. 📋 Plan Estratégico
3. ⚙️ Implementación
4. 📊 Seguimiento & Control

### Integración con Claude API

- `src/services/claudeService.js` → `POST {VITE_PROXY_URL}/api/claude` con
  `{ prompt, sessionData }`.
- `server.cjs` reenvía a `https://api.anthropic.com/v1/messages` con la API key
  del entorno y devuelve `{ summary, rawResponse }`.
- Uso principal: generar **resumen ejecutivo** de una sesión desde su contenido
  (`AddSessionModal` → botón "Generar resumen con IA").
- En producción (Vercel) el proxy Express no corre: si se necesita IA en prod hay
  que portar el proxy a una Serverless Function. Tenerlo en cuenta antes de
  prometer que la función de IA funciona desplegada.
- Al fijar el modelo, usar un ID de Claude vigente (revisar `server.cjs`, que hoy
  apunta a un `claude-sonnet-4-*` antiguo).

## 4. Convenciones de código

### Componentes y estado

- Componentes en **PascalCase**, un componente por archivo, `export default`.
- Hooks de datos en `src/hooks/` (`useProjects`, `useFinanzas`): encapsulan
  fetch + CRUD + suscripción realtime y devuelven `{ data, loading, error, ...acciones }`.
- Sin Redux ni Context global. Estado local con `useState`/`useEffect`.
- Cada fetch maneja explícitamente sus estados de `loading` y `error`.

### Patrón Supabase

```js
const { data, error } = await supabase
  .from('tabla')
  .select('*')
  .eq('columna', valor)
  .order('fecha', { ascending: false });

if (error) throw error;               // o console.error + estado de error
```

- Escrituras: `.insert([...]).select().single()` / `.update(...).eq('id', id)` /
  `.upsert(..., { onConflict: 'user_id' })`.
- Filtrar siempre por `user_id` (de `supabase.auth.getUser()`) en datos privados.
- Lecturas de listados: usar la vista `proyectos_con_stats`, no recalcular en el cliente.
- `error.code === 'PGRST116'` = "no rows"; tratarlo como caso normal, no como fallo.

### Estilos

- Tailwind para todo lo estático. Paleta de marca en `tailwind.config.js`:
  `seller-blue` `#2563eb`, `seller-blue-dark` `#1d4ed8`, `seller-blue-light` `#dbeafe`.
  (En el código todavía se usan mucho los hex literales `#2563eb` / `#1d4ed8`.)
- `style={{...}}` inline solo para valores dinámicos (p. ej. `color_tema`).
- Evitar crear archivos CSS nuevos salvo que sea reutilizable.

### Comentarios

- Separadores de sección: `// ==================== NOMBRE ====================`.
- `console.error('Contexto:', error)` para logs; nunca mostrar el error crudo al
  usuario final (usar estado de error con mensaje amable).

### Git

- Mensajes en español con prefijo tipo Conventional Commits:
  `feat:`, `fix:`, `chore:`, `refactor:`.
- No commitear ni pushear sin que el usuario lo pida. Si estás en `main`, crear
  rama antes de trabajar cambios grandes.
- No commitear `.env` / `.env.local` ni secretos.

### Antes de dar por terminado un cambio

1. `npm run lint` (config con `--max-warnings 0`).
2. `npm run build` si tocaste imports, rutas o assets (Vercel falla el build si
   rompe — histórico de commits con "fix: logo roto", "fix JSX", etc.).
3. Assets: importar con `import logo from '../assets/x.png'`, **no** rutas
   absolutas tipo `/src/assets/...` (rompen en build).
4. Probar el flujo en ambos modos cuando aplique: consultor autenticado y
   `/shared/:token` (portal cliente).

## 5. Cosas a tener presente

- Encoding: hubo problemas históricos con caracteres en JSX (`divs` de cierre,
  tildes). Si un archivo se ve raro, revisar UTF-8.
- El portal cliente construye clases Tailwind dinámicas tipo
  `bg-${color}-100` — solo funcionan si esas clases existen en el build; no
  extender ese patrón a colores nuevos sin safelist.
- `ProjectView` y `useProjects` exponen nombres algo inconsistentes
  (`getProjects` vs `refetch`); revisar el hook antes de llamar métodos.
