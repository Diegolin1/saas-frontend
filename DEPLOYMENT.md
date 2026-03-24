# Guía de Despliegue — SaaS B2B

## Arquitectura de Producción

```
Cloudflare Pages (CDN global)          Render.com (Node.js)           Supabase (PostgreSQL)
  ┌──────────────────────┐             ┌─────────────────────┐        ┌──────────────────┐
  │  React (Static SPA)  │  ──HTTPS──► │  Express + Prisma   │ ──────►│   PostgreSQL DB  │
  │  Vite Build / dist/  │             │  node dist/server   │        │   (pgbouncer)    │
  └──────────────────────┘             └─────────────────────┘        └──────────────────┘
```

---

## 1. Backend — Render.com

### Opción A: Deploy automático con `render.yaml` *(recomendado)*
1. Sube el código a GitHub.
2. En [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Selecciona tu repo. Render detectará el `render.yaml` automáticamente.
4. Configura las variables secretas (ver sección más abajo).

### Opción B: Servicio manual
- **Runtime:** Node
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `node dist/server.js`
- **Health Check:** `/health`

### Variables de entorno en Render Dashboard
Ve a tu servicio → **Environment** → añade estas:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL Supabase con pgbouncer (puerto 6543) |
| `DIRECT_URL` | URL Supabase directa (puerto 5432) |
| `JWT_SECRET` | Cadena aleatoria larga (mín. 32 chars) |
| `FACTURAPI_KEY` | Llave Live de Facturapi |
| `SMTP_HOST` | Host de correo (ej. smtp.gmail.com) |
| `SMTP_PORT` | Puerto (587 para TLS) |
| `SMTP_USER` | Cuenta de correo emisor |
| `SMTP_PASS` | Contraseña de aplicación |
| `STRIPE_SECRET_KEY` | `sk_live_...` de Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del Webhook registrado |

### Registrar Webhook de Stripe en producción
1. Ve a [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks).
2. Añade endpoint: `https://saas-backend-83xm.onrender.com/api/payments/webhook`
3. Evento a escuchar: `checkout.session.completed`
4. Copia el `Signing secret` y ponlo en `STRIPE_WEBHOOK_SECRET`.

### Migrar la base de datos
Para producción, se utiliza `npm run db:deploy` el cual ejecuta `prisma migrate deploy`.
Esto ya está configurado en el `render.yaml` dentro del campo `preDeployCommand`, por lo que las migraciones se aplicarán solas en cada despliegue exitoso antes de poner en línea el nuevo código.
Si llegaras a necesitar aplicarlas manualmente desde la Shell de Render:
```bash
npx prisma migrate deploy
```

---

## 2. Frontend — Cloudflare Pages

### Setup en Cloudflare Pages Dashboard
1. **New Project** → conecta tu repo GitHub.
2. **Framework preset:** Vite
3. **Build command:** `npm run build`
4. **Output directory:** `dist`

### Variables de entorno (Settings → Environment variables → Production)
| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://saas-backend-83xm.onrender.com/api` |
| `VITE_COMPANY_ID` | UUID de tu empresa (ver cómo obtenerlo abajo) |

### Cómo obtener el `VITE_COMPANY_ID`
1. Abre la app, inicia sesión como OWNER.
2. Abre DevTools (F12) → **Application** → **Local Storage**.
3. Busca la clave `token`, copia el valor.
4. Ve a [jwt.io](https://jwt.io), pega el token.
5. El campo `companyId` en el payload es tu ID.

### Deploy desde CLI (Wrangler)
```bash
npm install -g wrangler
wrangler login
npm run build
npx wrangler pages deploy dist --project-name saas-frontend
```

---

## 3. Checklist Pre-Deploy

- [ ] `.env` **no** está en el repositorio (está en `.gitignore`)
- [ ] Todas las variables de entorno están configuradas en Render
- [ ] `STRIPE_SECRET_KEY` es la llave **Live** (no test)
- [ ] `FACTURAPI_KEY` es la llave **Live** (no test)
- [ ] Webhook de Stripe apunta a la URL de producción
- [ ] Las migraciones se aplicarán automáticamente (o ejecuta `npx prisma migrate deploy` en la Shell de Render si no usaste `render.yaml`)
- [ ] Health check responde: `GET /health` → `{ "status": "ok" }`
- [ ] CORS: la URL de Cloudflare Pages está en el array `allowedOrigins` de `app.ts`

---

## 4. CORS: Agregar dominio de producción

Si usas un dominio personalizado en Cloudflare, agrégalo en `backend/src/app.ts`:

```ts
const allowedOrigins = [
    'https://saas-frontend-c9l.pages.dev',
    'https://tu-dominio.com',  // ← añadir aquí
    'http://localhost:5173',
];
```

---

## 5. Monitoreo post-deploy

| Qué verificar | Cómo |
|---|---|
| Backend vivo | `GET https://tu-backend.onrender.com/health` |
| DB conectada | Iniciar sesión con credenciales de admin |
| Emails | Cambiar estado de un pedido a SHIPPED |
| Stripe | Checkout con tarjeta de prueba `4242 4242 4242 4242` |
| Importador CSV | Subir un archivo de prueba desde Productos |
