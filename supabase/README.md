# Supabase Setup

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Espera a que el proyecto esté listo (~2 minutos)

## 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y llena las credenciales:

```bash
cp .env.local.example .env.local
```

Las credenciales las encuentras en:
- Supabase Dashboard > Settings > API
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (mantener secreto)

## 3. Ejecutar migraciones

### Opción A: Desde el SQL Editor de Supabase

1. Ve a SQL Editor en el dashboard de Supabase
2. Copia y ejecuta el contenido de `migrations/001_initial_schema.sql`
3. Luego ejecuta `migrations/002_seed_data.sql`

### Opción B: Usando Supabase CLI

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## 4. Verificar

Después de ejecutar las migraciones, verifica en el dashboard:
- Table Editor: Deberías ver las tablas `parties`, `districts`, `candidates`, `scores`, `flags`, etc.
- Los datos de seed deberían estar en las tablas

## Estructura de tablas

| Tabla | Descripción |
|-------|-------------|
| `parties` | Partidos políticos |
| `districts` | Distritos electorales (27) |
| `candidates` | Candidatos |
| `scores` | Puntajes calculados |
| `score_breakdowns` | Desglose detallado de puntajes |
| `flags` | Alertas y banderas (RED/AMBER/GRAY) |

## Views

| Vista | Descripción |
|-------|-------------|
| `candidates_full` | Candidatos con party, district y scores |
| `ranking_view` | Vista optimizada para ranking con conteo de flags |
