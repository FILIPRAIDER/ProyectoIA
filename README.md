# core-api (ProyectoIA) — Backend Express + Prisma

Backend de gestión para el marketplace de equipos y proyectos.  
**Stack:** Node 22 + Bun, Express (ESM), Prisma ORM, PostgreSQL (Clever Cloud), Zod, ImageKit (firma de subida), Resend (emails).

---

## 🌳 Estructura del repo

proyectoia/
├─ prisma/
│ ├─ schema.prisma
│ └─ migrations/
├─ src/
│ ├─ lib/
│ │ ├─ prisma.js # PrismaClient singleton (cierre en signals)
│ │ ├─ imagekit.js # firma de subida (token/expire/signature)
│ │ └─ mailer.js # envío de emails (Resend / SMTP / Mailtrap)
│ ├─ middleware/
│ │ └─ validate.js # wrapper Zod (params|query|body)
│ ├─ routes/
│ │ ├─ health.routes.js
│ │ ├─ users.routes.js
│ │ ├─ skills.routes.js
│ │ ├─ teams.routes.js # equipos + members + skills + invites (email)
│ │ ├─ userProfile.routes.js# perfil, certificaciones, experiencias
│ │ ├─ uploads.routes.js # credenciales firmadas para ImageKit
│ │ ├─ companies.routes.js
│ │ ├─ projects.routes.js # projects, project-skills, assignments
│ │ └─ matching.routes.js # candidatos por proyecto (matching básico)
│ ├─ utils/
│ │ └─ http-errors.js # HttpError + middlewares (404/500)
│ ├─ env.js # lectura de .env (+ sslmode=require)
│ └─ server.js # Express app
├─ .env
├─ package.json
├─ bun.lock
└─ README.md


---

## ⚙️ Requisitos

- Node.js **v22**
- **Bun** (gestor de paquetes/runner)
- PostgreSQL (Clever Cloud)
- Resend (o SMTP/Mailtrap) para emails
- Cuenta en ImageKit para subir certificados desde el frontend (solo guardamos metadatos en DB)

---

## 🔐 Variables de entorno (.env)

> Nota: `env.js` fuerza `sslmode=require` en `DATABASE_URL` si no está presente.

```env
# Servidor
PORT=4001

# DB (Clever Cloud)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?pgbouncer=true&pool_timeout=10

# ImageKit (firma de subida)
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
IMAGEKIT_UPLOAD_FOLDER=/certifications

# Email provider selector: "resend" | "smtp" | "mailtrap"
MAIL_PROVIDER=resend

## Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
# Debe usar un dominio verificado en Resend
RESEND_FROM=Marca <onboarding@tu-dominio-verificado.com>
# (Dev) fuerza destinatario para evitar restricciones de sandbox
# RESEND_DEV_FORCE_TO=mi-correo-dev@dominio.com

## SMTP (si MAIL_PROVIDER="smtp")
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
# MAIL_FROM=Nombre <no-reply@tu-dominio.com>

## Mailtrap Sending API (si MAIL_PROVIDER="mailtrap")
# MAILTRAP_TOKEN=xxxxxxxxxxxx
# MAILTRAP_SENDER=Nombre <no-reply@tu-dominio-verificado.mailtrap.io>

# URLs para armar enlaces de invitación
API_BASE_URL=http://localhost:4001
APP_BASE_URL=http://localhost:3000

# Instalar dependencias
bun install

# Generar Prisma Client
bunx prisma generate

# Aplicar migraciones en la base actual
bunx prisma migrate deploy

# Iniciar el servidor
bun run dev
# o
bun run start

🧪 Probar con Postman (principales flujos)
Salud

GET /health → { ok:true, service:"core-api", db:"up" }

Users

POST /users { name, email, role? }

GET /users/:id

GET /users/:userId/skills

POST /users/:userId/skills { skillId, level(1..5) }

PATCH /users/:userId/skills/:skillId { level }

DELETE /users/:userId/skills/:skillId

Perfil / Certificaciones / Experiencia

GET /users/:userId/profile

POST /users/:userId/profile (upsert)

PATCH /users/:userId/profile

GET /users/:userId/certifications

POST /users/:userId/certifications

PATCH /users/:userId/certifications/:certId

DELETE /users/:userId/certifications/:certId

POST /uploads/certifications/:certId/url

GET /users/:userId/experiences

POST /users/:userId/experiences

PATCH /users/:userId/experiences/:expId

DELETE /users/:userId/experiences/:expId

Skills

POST /skills { name }

GET /skills

Teams

POST /teams { name, city?, area? }

PATCH /teams/:id

GET /teams/:id (incluye members, skills)

GET /teams?city=...&area=...&skill=...

Miembros:

GET /teams/:teamId/members

POST /teams/:teamId/members { userId, role? }

DELETE /teams/:teamId/members/:userId

Team Skills:

GET /teams/:teamId/skills

POST /teams/:teamId/skills { skillId }

DELETE /teams/:teamId/skills/:skillId

Crear & enviar:
POST /teams/:teamId/invites
Body:

{
  "email": "dest@correo.com",
  "role": "MIEMBRO",
  "byUserId": "<id-lider-o-admin>",
  "message": "¡Únete al squad!",
  "expiresInDays": 7,
  "target": "frontend"
}


Respuesta incluye token (dev) y acceptUrlExample.

Listar:
GET /teams/:teamId/invites?status=PENDING|ACCEPTED|CANCELED|EXPIRED

Cancelar:
POST /teams/:teamId/invites/:inviteId/cancel { "byUserId": "<id>" }

Reenviar:
POST /teams/:teamId/invites/:inviteId/resend
Body: { "byUserId":"<id>", "target":"frontend" }

Expirar (manual):
POST /teams/:teamId/invites/:inviteId/expire { "byUserId":"<id>" }

Aceptar (frontend):
POST /teams/invites/:token/accept { "name": "Opcional" }
(Dev) GET /teams/invites/:token/accept

Companies

POST /companies { name, sector?, website?, city?, about? }

GET /companies/:id

Projects

POST /projects { companyId, title, ... }
(case-insensitive unique por companyId + title)

GET /projects/:id

GET /projects?status=...&city=...&area=...&skill=...

Project Skills:

GET /projects/:projectId/skills

POST /projects/:projectId/skills { skillId, levelRequired? }

DELETE /projects/:projectId/skills/:skillId

Assignments (match efectivo)

POST /projects/:projectId/assignments { teamId }

GET /projects/:projectId/assignments

GET /projects/by-team/:teamId/assignments

Matching básico

POST /matching/projects/:projectId/candidates?top=5&explain=true&minCoverage=0.0&requireArea=false&requireCity=false
Calcula score por skills/area/ciudad/availability.