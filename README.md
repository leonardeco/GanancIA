# GanancIA — Inteligencia Financiera para Restaurantes

<div align="center">

**La inteligencia artificial que convierte datos en ganancia real.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-green?logo=fastify)](https://fastify.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.43-brightgreen)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TimescaleDB-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ¿Qué es GanancIA?

**GanancIA** es un **Micro-SaaS de inteligencia financiera gastronómica** diseñado para dueños de restaurantes en Latinoamérica. Automatiza el análisis de rentabilidad eliminando la necesidad de un analista de datos, entregando métricas accionables en tiempo real a través de:

- 📊 Un **dashboard web** con KPIs financieros clave
- 🍽️ Una **Matriz BCG** de ingeniería de menú (platos Estrella, Puzzle, Caballo de batalla y Perro)
- ⚠️ Un módulo de **Detección de Fugas** para detectar anomalías en costo, cancelaciones y mermas
- 🤖 **Gana**, un chatbot de IA disponible 24/7 que responde en lenguaje natural sobre las métricas del restaurante

> **Slogan:** *"Tu restaurante. Tu GanancIA."*

---

## 📸 Capturas de Pantalla

| Dashboard | Ingeniería de Menú | Chatbot Gana |
|---|---|---|
| KPIs financieros en tiempo real | Clasificación BCG automática | Análisis conversacional IA |

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend** | Next.js 15 + TypeScript | Dashboard SSR + SPA |
| **Estilos** | Tailwind CSS | UI utility-first |
| **Gráficas** | Recharts | RevPASH, ventas, márgenes |
| **Backend** | Node.js + Fastify | API REST multi-tenancy |
| **ORM** | Drizzle ORM | Type-safe SQL queries |
| **Base de datos** | PostgreSQL + TimescaleDB | Series de tiempo para RevPASH |
| **Caché/Colas** | Redis + BullMQ | Jobs automáticos nocturnos |
| **IA** | Claude API (Anthropic) | Chatbot Gana + resúmenes |
| **Infra** | Vercel + Railway | Deploy automático |
| **Monorepo** | Turborepo + pnpm | Gestión de paquetes |

---

## 🗂️ Estructura del Proyecto

```
ganancia/
├── apps/
│   ├── web/                    # Frontend Next.js 15
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (app)/
│   │   │   │   │   ├── dashboard/   # KPIs y gráficas
│   │   │   │   │   ├── menu/        # Matriz BCG
│   │   │   │   │   ├── ventas/      # Registro e importación de ventas
│   │   │   │   │   ├── fugas/       # Alertas de anomalías
│   │   │   │   │   └── chat/        # Chatbot Gana IA
│   │   │   │   └── (auth)/
│   │   │   │       ├── login/
│   │   │   │       └── register/
│   │   │   ├── components/
│   │   │   │   ├── chat/           # ChatWindow, MessageBubble
│   │   │   │   └── sidebar.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api.ts          # Cliente HTTP
│   │   │   │   └── mock-data.ts    # Datos demo
│   │   │   └── store/              # Zustand (auth, restaurant)
│   │
│   └── api/                    # Backend Fastify + TypeScript
│       └── src/
│           ├── db/
│           │   ├── schema.ts       # 9 tablas Drizzle ORM
│           │   └── seed.ts         # Datos de desarrollo
│           ├── routes/
│           │   ├── auth.ts
│           │   ├── analytics.ts    # KPIs, revenue chart, top items
│           │   ├── menu.ts         # CRUD platos
│           │   ├── alerts.ts       # Fugas y alertas
│           │   ├── chat.ts         # Proxy a Claude API
│           │   ├── sales.ts
│           │   └── restaurants.ts
│           ├── services/
│           │   └── gana.ts         # System prompt + Claude API
│           └── plugins/
│               ├── auth.ts         # JWT middleware
│               └── db.ts           # Drizzle connection
│
└── packages/
    └── shared/                 # Tipos TypeScript compartidos
        └── src/types/
            ├── user.ts
            ├── restaurant.ts
            ├── menu.ts
            ├── analytics.ts
            └── alerts.ts
```

---

## 🗄️ Esquema de Base de Datos

```
users              → id · email · name · plan · stripe_customer_id
restaurants        → id · owner_id · name · currency · pos_type · alert_threshold
branches           → id · restaurant_id · name · address
menu_items         → id · restaurant_id · name · category · cost_price · sale_price · active
menu_classifications → week_start · item_id · classification · popularity · margin
sales              → time · branch_id · ticket_id · amount · waiter_id · discount · items_json
inventory_costs    → date · restaurant_id · ingredient · theoretical_cost · real_cost
alerts             → id · restaurant_id · type · severity · message · resolved
pos_sync_log       → id · restaurant_id · synced_at · records · status
weekly_reports     → id · restaurant_id · week_start · metrics_json · sent_at
```

> La tabla `sales` es candidata a **hypertable de TimescaleDB** — particionada por tiempo para queries de RevPASH hasta 100x más rápido.

---

## ⚙️ Funcionalidades del MVP

### 📊 Dashboard — Métricas KPI
- **RevPASH** — Ingresos por hora de asiento disponible
- **Ticket promedio** — Gasto por cliente y por mesero
- **Margen real vs. teórico** — Detecta desperdicio o porcionamiento incorrecto
- **Gráfica de ingresos** — Serie de tiempo diaria con Recharts

### 🍽️ Ingeniería de Menú (Matriz BCG)
| Categoría | Rentabilidad | Popularidad | Acción |
|---|---|---|---|
| ⭐ Estrella | Alta | Alta | Mantener y promocionar |
| 🔵 Puzzle | Alta | Baja | Mejorar presentación/marketing |
| 🟡 Caballo de batalla | Baja | Alta | Optimizar costos de receta |
| 🔴 Perro | Baja | Baja | Eliminar del menú |

### ⚠️ Detección de Fugas
- Diferencias entre costo real vs. teórico por encima del umbral configurado
- Patrones inusuales de cancelaciones de tickets por cajero
- Alertas de inventario bajo por umbral personalizable
- Sistema de severidades: **Crítica** 🔴, **Advertencia** 🟡, **Informativa** 🔵

### 🤖 Chatbot Gana — Asistente IA
- Motor: **Claude 3.5 Sonnet** (Anthropic API)
- Datos en tiempo real inyectados dinámicamente en el System Prompt
- Responde sobre ventas, costos, fugas, ranking de meseros y predicciones
- Historial de conversación multi-turno
- Fallback inteligente con respuestas mock si no hay API key configurada

---

## 🔌 Instalación y Desarrollo Local

### Prerrequisitos
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (o cuenta en [Supabase](https://supabase.com))

### 1. Clonar el repositorio
```bash
git clone https://github.com/leonardeco/GanancIA.git
cd GanancIA
pnpm install
```

### 2. Configurar variables de entorno
```bash
cp apps/api/.env.example apps/api/.env
```

Edita `apps/api/.env` con tus credenciales:
```env
DATABASE_URL=postgresql://user:password@host:5432/ganancia_db
JWT_SECRET=tu_secreto_jwt_largo_y_aleatorio
ANTHROPIC_API_KEY=sk-ant-...        # Opcional para modo demo
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 3. Aplicar el schema a la base de datos
```bash
pnpm --filter @ganancia/api db:push
```

### 4. Cargar datos de prueba (opcional)
```bash
pnpm --filter @ganancia/api db:seed
# Crea: demo@ganancia.app / demo1234
```

### 5. Iniciar el servidor de desarrollo
```bash
pnpm dev
```

| Servicio | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (Fastify) | http://localhost:4000 |
| Drizzle Studio (DB GUI) | `pnpm --filter @ganancia/api db:studio` |

---

## 🔑 Variables de Entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | URL de conexión a PostgreSQL |
| `JWT_SECRET` | ✅ | Secreto para firmar tokens JWT |
| `ANTHROPIC_API_KEY` | ⚠️ Opcional | Clave de Claude API. Sin ella, Gana usa respuestas demo |
| `STRIPE_SECRET_KEY` | ⚠️ Opcional | Para planes de pago (aún no implementado) |
| `WHATSAPP_ACCESS_TOKEN` | ⚠️ Opcional | Para resúmenes ejecutivos semanales |
| `REDIS_URL` | ⚠️ Opcional | Para jobs automáticos con BullMQ |
| `SQUARE_APP_SECRET` | ⚠️ Opcional | Para sincronización de POS Square |

> Ver el archivo completo en [`apps/api/.env.example`](apps/api/.env.example)

---

## 📋 Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia frontend + backend en paralelo |
| `pnpm build` | Build de producción |
| `pnpm --filter @ganancia/api db:push` | Aplica el schema a la DB |
| `pnpm --filter @ganancia/api db:generate` | Genera archivos de migración SQL |
| `pnpm --filter @ganancia/api db:seed` | Carga datos de prueba |
| `pnpm --filter @ganancia/api db:studio` | Abre Drizzle Studio (GUI de la DB) |

---

## 🗺️ Roadmap

- [x] Dashboard con KPIs financieros (RevPASH, ticket promedio, margen)
- [x] Ingeniería de menú con Matriz BCG automática
- [x] Detección de fugas y sistema de alertas
- [x] Chatbot Gana con Claude API
- [x] Schema completo de base de datos (9 tablas)
- [x] Seed de datos para desarrollo
- [ ] Stripe Billing (planes Starter $49 / Pro $99 / Cadena $249)
- [ ] Landing Page pública ganancia.app
- [ ] Jobs automáticos BullMQ (reporte semanal, detector de fugas, sync POS)
- [ ] Integración WhatsApp Business API
- [ ] Microservicio Python (FastAPI + Prophet para predicción de demanda)
- [ ] Integración POS: Square / Toast / Clover (OAuth 2.0)
- [ ] Modo PWA (instalable en celular)

---

## 💰 Modelo de Negocio

| Plan | Precio/mes | Sucursales | Características |
|---|---|---|---|
| **Starter** | $49 | 1 | Dashboard · Chatbot Gana · Reporte email · Matriz BCG |
| **Pro** ⭐ | $99 | Hasta 3 | Todo Starter + Predicción IA · WhatsApp · Detección fugas · Integración POS |
| **Cadena** | $249 | Ilimitadas | Todo Pro + API completa · Onboarding dedicado · SLA 99.9% · Marca blanca |

**Break-even:** 2 clientes Pro → ~$86 USD/mes de infraestructura cubierta.

---

## 🎨 Identidad de Marca

- **Nombre:** GanancIA (el juego tipográfico en "**IA**" en verde revela la tecnología integrada)
- **Colores:** Bosque `#0F6E56` · Teal `#1D9E75` · Menta `#E1F5EE` · Carbón `#111111`
- **Tipografía:** Playfair Display (display/logo) · DM Sans (UI/datos)
- **Chatbot:** Gana — analista financiero amigable disponible 24/7

---

## 📄 Licencia

MIT © 2026 [Leonardo Guzmán](https://github.com/leonardeco)

---

<div align="center">
<strong>GanancIA</strong> · ganancia.app · Abril 2026
<br/>
<em>"Tu restaurante. Tu GanancIA."</em>
</div>
