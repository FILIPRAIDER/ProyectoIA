# 🚀 Backend API - Documentación Técnica para Frontend

## 📌 Información General

**Base URL**: `http://localhost:4001` (desarrollo) → Producción: TBD
**Tecnología**: Node.js 22 + Express + Prisma + PostgreSQL
**Autenticación**: Pendiente implementar (actualmente sin auth)
**Content-Type**: `application/json`

---

## 🏗️ Arquitectura del Backend

### Stack Tecnológico
- **Runtime**: Node.js 22 con Bun
- **Framework**: Express.js (ESM modules)
- **ORM**: Prisma Client
- **Base de Datos**: PostgreSQL (actualmente Clever Cloud, migrar a Neon)
- **Validación**: Zod schemas
- **Email**: Resend API
- **File Storage**: ImageKit (para avatares y certificaciones)

### Estructura de Respuestas

#### ✅ Respuesta Exitosa
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### ❌ Respuesta de Error
```json
{
  "error": {
    "message": "Mensaje descriptivo del error",
    "details": { ... }
  }
}
```

#### 🔍 Códigos HTTP Utilizados
- `200` - OK
- `201` - Created
- `204` - No Content (delete exitoso)
- `400` - Bad Request (validación fallida)
- `401` - Unauthorized (credenciales inválidas)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `409` - Conflict (duplicados, estado inválido)
- `410` - Gone (invitación expirada)
- `422` - Unprocessable Entity (operación inválida)
- `500` - Internal Server Error

---

## 🔐 Modelos de Datos Principales

### User
```typescript
{
  id: string,              // cuid
  name: string,
  email: string,           // unique
  role: "EMPRESARIO" | "ESTUDIANTE" | "LIDER" | "ADMIN",
  avatarUrl?: string,
  onboardingStep: "ACCOUNT" | "PROFILE" | "OPTIONAL" | "DONE",
  createdAt: Date,
  updatedAt: Date
}
```

### MemberProfile (1:1 con User)
```typescript
{
  id: string,
  userId: string,          // unique
  headline?: string,
  bio?: string,
  seniority?: string,
  location?: string,
  availability?: number,   // horas/semana
  stack?: string,
  sector?: string,
  identityType?: "CC" | "TI" | "CE" | "PEP" | "PASAPORTE" | "NIT",
  documentNumber?: string, // unique
  phone?: string,
  phoneE164?: string,      // +573001234567
  phoneCountry?: string,   // ISO-3166 (ej: "CO")
  birthdate?: Date,
  // Avatar metadata
  avatarUrl?: string,
  avatarProvider?: string,
  avatarKey?: string,
  avatarType?: string,
  avatarSize?: number,
  avatarWidth?: number,
  avatarHeight?: number
}
```

### Team
```typescript
{
  id: string,
  name: string,
  city?: string,
  area?: string,           // categoría del equipo
  createdAt: Date,
  updatedAt: Date
}
```

### TeamMember
```typescript
{
  id: string,
  teamId: string,
  userId: string,
  role: "LIDER" | "MIEMBRO"
}
```

### TeamInvite
```typescript
{
  id: string,
  teamId: string,
  email: string,
  role: "LIDER" | "MIEMBRO",
  token: string,           // unique, para aceptar
  status: "PENDING" | "ACCEPTED" | "CANCELED" | "EXPIRED",
  invitedBy: string,       // userId
  message?: string,
  expiresAt?: Date,
  decidedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```typescript
{
  id: string,
  companyId: string,
  title: string,
  description?: string,
  city?: string,
  area?: string,
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELED",
  budget?: Decimal,
  startDate?: Date,
  endDate?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### TeamApplication (Empresa invita a Equipo)
```typescript
{
  id: string,
  projectId: string,
  teamId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN",
  message?: string,
  createdAt: Date,
  decidedAt?: Date,
  decidedBy?: string       // userId
}
```

### Skill
```typescript
{
  id: string,
  name: string             // unique
}
```

### UserSkill
```typescript
{
  id: string,
  userId: string,
  skillId: string,
  level: number            // 1-5
}
```

---

## 🛣️ API ENDPOINTS

### 1️⃣ HEALTH CHECK

#### `GET /health`
Verifica estado del servidor y conexión a BD.

**Response:**
```json
{
  "ok": true,
  "service": "core-api",
  "db": "up",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

---

### 2️⃣ AUTENTICACIÓN

#### `POST /auth/login`
Login con email/password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "id": "clxxx",
  "name": "Juan Pérez",
  "email": "user@example.com",
  "role": "ESTUDIANTE"
}
```

**Errores:**
- `401` - Credenciales inválidas
- `400` - Validación fallida

---

### 3️⃣ USUARIOS

#### `POST /users`
Crea nuevo usuario.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123!",
  "role": "ESTUDIANTE"  // opcional, default: ESTUDIANTE
}
```

**Validación de Password:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 número
- Al menos 1 carácter especial

**Response 201:**
```json
{
  "id": "clxxx",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "ESTUDIANTE",
  "onboardingStep": "ACCOUNT",
  "createdAt": "2025-10-07T12:00:00.000Z"
}
```

**Errores:**
- `409` - Email ya registrado

---

#### `GET /users/:id`
Obtiene usuario por ID con relaciones.

**Response 200:**
```json
{
  "id": "clxxx",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "ESTUDIANTE",
  "skills": [
    {
      "id": "clyyy",
      "skillId": "clzzz",
      "level": 4,
      "skill": { "id": "clzzz", "name": "React" }
    }
  ],
  "teamMemberships": [...],
  "profile": { ... }
}
```

---

#### `PATCH /users/:id/onboarding`
Avanza el paso de onboarding.

**Body:**
```json
{
  "step": "PROFILE"  // ACCOUNT → PROFILE → OPTIONAL → DONE
}
```

**Validación**: No permite retroceder pasos.

---

### 4️⃣ SKILLS DEL USUARIO

#### `GET /users/:userId/skills`
Lista skills del usuario.

#### `POST /users/:userId/skills`
Agrega skill al usuario.

**Body:**
```json
{
  "skillId": "clxxx",
  "level": 4          // 1-5
}
```

**Errores:**
- `404` - Usuario o skill no encontrado
- `409` - Usuario ya tiene esa skill

#### `PATCH /users/:userId/skills/:skillId`
Actualiza nivel de skill.

**Body:**
```json
{
  "level": 5
}
```

#### `DELETE /users/:userId/skills/:skillId`
Elimina skill del usuario.

---

### 5️⃣ PERFIL DE USUARIO

#### `GET /users/:userId/profile`
Obtiene perfil del usuario.

#### `POST /users/:userId/profile`
Crea o actualiza perfil (upsert).

**Body:**
```json
{
  "headline": "Full Stack Developer",
  "bio": "Apasionado por...",
  "seniority": "Senior",
  "location": "Bogotá, Colombia",
  "availability": 30,
  "stack": "React, Node.js, PostgreSQL",
  "sector": "FinTech",
  "identityType": "CC",
  "documentNumber": "1234567890",
  "phone": "300 123 4567",
  "phoneE164": "+573001234567",
  "phoneCountry": "CO",
  "birthdate": "1995-05-15T00:00:00.000Z"
}
```

**Validaciones Especiales:**
- `EMPRESARIO` → solo puede usar `identityType: "NIT"`
- `ESTUDIANTE/LIDER` → no puede usar NIT
- `documentNumber` único en sistema

#### `PATCH /users/:userId/profile`
Actualiza parcialmente el perfil.

#### `GET /users/:userId/profile/full`
Obtiene perfil + skills en una sola llamada.

#### `PATCH /users/:userId/profile/avatar`
Guarda metadatos del avatar subido a ImageKit.

**Body:**
```json
{
  "avatarUrl": "https://ik.imagekit.io/...",
  "avatarProvider": "imagekit",
  "avatarKey": "avatar_xxx",
  "avatarType": "image/jpeg",
  "avatarSize": 150000,
  "avatarWidth": 800,
  "avatarHeight": 800
}
```

---

### 6️⃣ CERTIFICACIONES

#### `GET /users/:userId/certifications`
Lista certificaciones del usuario.

#### `POST /users/:userId/certifications`
Crea certificación.

**Body:**
```json
{
  "name": "AWS Solutions Architect",
  "issuer": "Amazon Web Services",
  "issueDate": "2025-01-15T00:00:00.000Z",
  "url": "https://...",
  "fileUrl": "https://ik.imagekit.io/...",
  "fileProvider": "imagekit",
  "fileKey": "cert_xxx",
  "fileType": "application/pdf",
  "fileSize": 500000
}
```

#### `PATCH /users/:userId/certifications/:certId`
Actualiza certificación.

#### `DELETE /users/:userId/certifications/:certId`
Elimina certificación.

---

### 7️⃣ EXPERIENCIAS

#### `GET /users/:userId/experiences`
Lista experiencias del usuario.

#### `POST /users/:userId/experiences`
Crea experiencia.

**Body:**
```json
{
  "role": "Senior Developer",
  "company": "Tech Corp",
  "startDate": "2020-01-01T00:00:00.000Z",
  "endDate": "2023-12-31T00:00:00.000Z",
  "description": "Desarrollo de aplicaciones..."
}
```

#### `PATCH /users/:userId/experiences/:expId`
Actualiza experiencia.

#### `DELETE /users/:userId/experiences/:expId`
Elimina experiencia.

---

### 8️⃣ SKILLS (Catálogo Global)

#### `GET /skills`
Lista todas las skills disponibles.

**Response:**
```json
[
  { "id": "clxxx", "name": "React", "createdAt": "..." },
  { "id": "clyyy", "name": "Node.js", "createdAt": "..." }
]
```

#### `POST /skills`
Crea nueva skill (admin).

**Body:**
```json
{
  "name": "TypeScript"
}
```

**Errores:**
- `409` - Skill ya existe

---

### 9️⃣ EQUIPOS

#### `POST /teams`
Crea nuevo equipo.

**Body:**
```json
{
  "name": "Los Innovadores",
  "city": "Medellín",
  "area": "FinTech"
}
```

#### `GET /teams/:id`
Obtiene equipo con miembros y skills.

**Response:**
```json
{
  "id": "clxxx",
  "name": "Los Innovadores",
  "city": "Medellín",
  "area": "FinTech",
  "members": [
    {
      "id": "clyyy",
      "role": "LIDER",
      "user": { "id": "clzzz", "name": "Juan", "email": "..." }
    }
  ],
  "skills": [...]
}
```

#### `PATCH /teams/:id`
Actualiza equipo.

**Body:**
```json
{
  "name": "Nuevo Nombre",
  "city": "Bogotá",
  "area": "EdTech"
}
```

#### `GET /teams?city=&area=&skill=`
Lista equipos con filtros opcionales.

**Query Params:**
- `city` - filtro por ciudad (insensitive)
- `area` - filtro por área (contains, insensitive)
- `skill` - filtro por skill de algún miembro

---

### 🔟 MIEMBROS DEL EQUIPO

#### `GET /teams/:teamId/members?withSkills=false`
Lista miembros del equipo.

**Query Params:**
- `withSkills` - incluye skills de cada miembro (default: false)

#### `POST /teams/:teamId/members`
Agrega miembro al equipo.

**Body:**
```json
{
  "userId": "clxxx",
  "role": "MIEMBRO"  // "LIDER" | "MIEMBRO"
}
```

**Errores:**
- `404` - Equipo o usuario no encontrado
- `409` - Usuario ya es miembro

#### `DELETE /teams/:teamId/members/:userId`
Elimina miembro del equipo.

---

### 1️⃣1️⃣ SKILLS DEL EQUIPO

#### `GET /teams/:teamId/skills?aggregate=false`
Obtiene skills del equipo.

**Query Params:**
- `aggregate=false` - skills asignadas manualmente al equipo
- `aggregate=true` - skills agregadas desde miembros (con estadísticas)

**Response (aggregate=true):**
```json
{
  "source": "membersAggregate",
  "data": [
    {
      "skill": { "id": "clxxx", "name": "React" },
      "membersCount": 3,
      "avgLevel": 4.33
    }
  ]
}
```

#### `POST /teams/:teamId/skills`
Agrega skill al equipo.

**Body:**
```json
{
  "skillId": "clxxx"
}
```

#### `DELETE /teams/:teamId/skills/:skillId`
Elimina skill del equipo.

---

### 1️⃣2️⃣ INVITACIONES DE EQUIPO

#### `POST /teams/:teamId/invites`
Crea y envía invitación por email.

**Body:**
```json
{
  "email": "nuevo@example.com",
  "role": "MIEMBRO",
  "byUserId": "clxxx",     // quien invita (debe ser LIDER o ADMIN)
  "message": "¡Únete a nuestro equipo!",
  "expiresInDays": 7,
  "target": "frontend"      // "frontend" | "backend"
}
```

**Response 201:**
```json
{
  "id": "clxxx",
  "teamId": "clyyy",
  "email": "nuevo@example.com",
  "status": "PENDING",
  "token": "abc123...",
  "emailSent": true,
  "acceptUrlExample": "http://localhost:3000/join?token=abc123..."
}
```

**Validación:**
- Solo LIDER del equipo o ADMIN pueden invitar
- No se puede invitar a miembros existentes

---

#### `GET /teams/:teamId/invites?status=&email=&search=&from=&to=&page=1&limit=10&sortBy=createdAt&sortDir=desc`
Lista invitaciones con filtros y paginación.

**Query Params:**
- `status` - PENDING | ACCEPTED | CANCELED | EXPIRED
- `email` - filtro exacto por email
- `search` - búsqueda parcial en email
- `from` - fecha inicio (ISO 8601)
- `to` - fecha fin (ISO 8601)
- `page` - número de página (default: 1)
- `limit` - items por página (default: 10, max: 100)
- `sortBy` - createdAt | decidedAt | expiresAt
- `sortDir` - asc | desc

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasPrev": false,
    "hasNext": true,
    "sortBy": "createdAt",
    "sortDir": "desc"
  }
}
```

---

#### `POST /teams/:teamId/invites/:inviteId/cancel`
Cancela invitación (solo PENDING).

**Body:**
```json
{
  "byUserId": "clxxx"
}
```

**Errores:**
- `403` - No tiene permisos
- `422` - Invitación no está PENDING

---

#### `POST /teams/:teamId/invites/:inviteId/resend`
Reenvía email de invitación.

**Body:**
```json
{
  "byUserId": "clxxx",
  "target": "frontend"
}
```

**Errores:**
- `410` - Invitación expirada
- `422` - Invitación no está PENDING

---

#### `POST /teams/:teamId/invites/:inviteId/expire`
Marca invitación como expirada manualmente.

**Body:**
```json
{
  "byUserId": "clxxx"
}
```

---

#### `POST /teams/invites/:token/accept`
Acepta invitación (endpoint público).

**Body:**
```json
{
  "name": "Juan Pérez"  // opcional, si el usuario no existe
}
```

**Response 200:**
```json
{
  "invite": { ... },
  "user": { ... },
  "membership": { ... }
}
```

**Errores:**
- `404` - Token inválido
- `410` - Invitación expirada
- `422` - Invitación no está PENDING

---

#### `GET /teams/:teamId/invites/export.csv`
Exporta invitaciones a CSV.

**Query Params:** (mismos filtros que GET /invites)
- `delimiter` - "," | ";" (default: ",")
- `dateFmt` - "iso" | "local"
- `limit` - máximo registros (default: 20000)
- `filename` - nombre del archivo (sin extensión)

**Response:** Archivo CSV descargable

---

### 1️⃣3️⃣ EMPRESAS

#### `POST /companies`
Crea empresa.

**Body:**
```json
{
  "name": "Tech Innovations S.A.",
  "sector": "Software",
  "city": "Bogotá",
  "website": "https://techinno.com",
  "about": "Somos una empresa..."
}
```

#### `GET /companies/:id`
Obtiene empresa por ID.

#### `GET /companies?search=&page=1&limit=10&sortBy=name&sortDir=asc`
Lista empresas con filtros.

---

### 1️⃣4️⃣ PROYECTOS

#### `POST /projects`
Crea proyecto.

**Body:**
```json
{
  "companyId": "clxxx",
  "title": "App Mobile Bancaria",
  "description": "Desarrollo de...",
  "city": "Medellín",
  "area": "FinTech",
  "status": "OPEN",
  "budget": 50000000,
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2026-02-28T00:00:00.000Z"
}
```

**Validación:**
- Título único por empresa (case-insensitive)

**Errores:**
- `409` - Ya existe proyecto con ese título para la empresa

---

#### `GET /projects/:id`
Obtiene proyecto con relaciones.

**Response:**
```json
{
  "id": "clxxx",
  "title": "App Mobile Bancaria",
  "company": { "id": "clyyy", "name": "..." },
  "skills": [
    {
      "skillId": "clzzz",
      "skill": { "name": "React Native" },
      "levelRequired": 4
    }
  ],
  "_count": { "assignments": 2 }
}
```

---

#### `GET /projects?status=&city=&area=&skill=&includeDescription=false&page=1&limit=10&sortBy=createdAt&sortDir=desc`
Lista proyectos con filtros.

**Query Params:**
- `status` - OPEN | IN_PROGRESS | DONE | CANCELED
- `city` - filtro por ciudad
- `area` - filtro por área
- `skill` - filtro por skill requerida
- `includeDescription` - incluye descripción completa (default: false)
- Paginación y ordenamiento

---

### 1️⃣5️⃣ APLICACIONES A PROYECTOS (Empresa → Equipo)

#### `POST /projects/:projectId/applications?maxPending=`
Empresa invita a equipo para proyecto.

**Body:**
```json
{
  "teamId": "clxxx",
  "message": "Estamos interesados en su equipo",
  "byUserId": "clyyy"
}
```

**Query Params:**
- `maxPending` - límite de invitaciones PENDING por proyecto

**Errores:**
- `409` - Ya existe invitación PENDING o asignación efectiva
- `422` - Se alcanzó el máximo de PENDING

---

#### `POST /projects/:projectId/applications/:appId/response`
Equipo responde a invitación.

**Body:**
```json
{
  "decision": "ACCEPT",  // "ACCEPT" | "REJECT" | "WITHDRAW"
  "byUserId": "clxxx"
}
```

**Response (ACCEPT):**
```json
{
  "application": { "status": "ACCEPTED", ... },
  "assignment": { "projectId": "...", "teamId": "..." }
}
```

**Validación:**
- Solo aplicaciones PENDING pueden responderse
- ACCEPT crea TeamAssignment automáticamente

---

#### `POST /projects/:projectId/applications/:appId/cancel`
Empresa cancela invitación (→ WITHDRAWN).

**Body:**
```json
{
  "byUserId": "clxxx"
}
```

---

#### `GET /projects/:projectId/applications?status=`
Lista aplicaciones de un proyecto.

**Response:**
```json
[
  {
    "id": "clxxx",
    "projectId": "clyyy",
    "teamId": "clzzz",
    "status": "PENDING",
    "message": "...",
    "team": { "id": "...", "name": "...", "city": "...", "area": "..." },
    "createdAt": "..."
  }
]
```

---

#### `GET /projects/by-team/:teamId/applications?status=`
Lista aplicaciones recibidas por un equipo.

---

### 1️⃣6️⃣ MATCHING (Algoritmo de Recomendación)

#### `POST /matching/projects/:projectId/candidates?top=5&explain=false&minCoverage=0&requireArea=false&requireCity=false`
Obtiene equipos candidatos para un proyecto.

**Query Params:**
- `top` - número de candidatos (1-50, default: 5)
- `explain` - incluye desglose detallado (default: false)
- `minCoverage` - cobertura mínima de skills (0-1, default: 0)
- `requireArea` - filtro duro por área (default: false)
- `requireCity` - filtro duro por ciudad (default: false)

**Response:**
```json
{
  "project": {
    "id": "clxxx",
    "title": "App Mobile",
    "city": "Medellín",
    "area": "FinTech",
    "requiredSkills": [
      { "skillId": "...", "skillName": "React", "levelRequired": 4 }
    ]
  },
  "top": 5,
  "candidates": [
    {
      "teamId": "clyyy",
      "teamName": "Los Innovadores",
      "city": "Medellín",
      "area": "FinTech",
      "membersCount": 5,
      "avgAvailability": 32.0,
      "breakdown": {
        "skillCoverage": 85.0,    // %
        "areaMatch": true,
        "cityMatch": true,
        "availabilityNorm": 80.0   // %
      },
      "teamSkillNames": ["React", "Node.js", "PostgreSQL"],
      "missingSkills": ["Docker"],
      "score": 87.5                // 0-100
    }
  ],
  "filtersApplied": ["membersCount>0", "skillCoverage>0"]
}
```

**Algoritmo de Scoring:**
- **Skills**: 70% (cobertura de skills requeridas)
- **Área**: 15% (match exacto)
- **Ciudad**: 10% (match exacto)
- **Disponibilidad**: 5% (promedio de miembros)

**Nivel de Equipo por Skill**: Máximo nivel entre todos los miembros

---

### 1️⃣7️⃣ UPLOADS (ImageKit)

#### `GET /uploads/auth/imagekit`
Obtiene credenciales firmadas para subir a ImageKit.

**Response:**
```json
{
  "token": "abc123...",
  "expire": 1696699200,
  "signature": "xyz789...",
  "publicKey": "public_xxx",
  "urlEndpoint": "https://ik.imagekit.io/xxx",
  "folder": "/certifications",
  "uploadApiEndpoint": "https://upload.imagekit.io/api/v1/files/upload"
}
```

**Uso desde Frontend:**
1. Llamar a este endpoint
2. Usar credenciales para subir directamente a ImageKit
3. Guardar metadatos (URL, key, etc.) en backend

---

### 1️⃣8️⃣ METADATA (Enumeraciones)

#### `GET /meta/roles`
```json
["EMPRESARIO", "ESTUDIANTE", "LIDER", "ADMIN"]
```

#### `GET /meta/identity-types`
```json
["CC", "TI", "CE", "PEP", "PASAPORTE", "NIT"]
```

#### `GET /meta/project-statuses`
```json
["OPEN", "IN_PROGRESS", "DONE", "CANCELED"]
```

#### `GET /meta/application-statuses`
```json
["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"]
```

#### `GET /meta/invite-statuses`
```json
["PENDING", "ACCEPTED", "CANCELED", "EXPIRED"]
```

---

## 🔒 Consideraciones de Seguridad

### Pendiente de Implementar
1. **JWT Authentication**: Actualmente sin auth
2. **Rate Limiting**: Sin protección contra abuso
3. **CORS**: Configurado como wildcard (desarrollo)
4. **Input Sanitization**: Solo validación de Zod
5. **SQL Injection**: Protegido por Prisma ORM
6. **Password Hashing**: Implementado con bcryptjs (10 rounds)

### Variables de Entorno Requeridas
```env
DATABASE_URL=postgresql://...
PORT=4001

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Resend
RESEND_API_KEY=
RESEND_FROM=

# URLs
API_BASE_URL=http://localhost:4001
APP_BASE_URL=http://localhost:3000
```

---

## 📊 Límites y Consideraciones

### Paginación
- **Default**: 10 items por página
- **Máximo**: 100 items por página
- **Exportación CSV**: Max 20,000 registros

### Validaciones de Archivo
- **Avatar**: Max 5MB
- **Certificación**: Max 10MB
- **Tipos permitidos**: image/jpeg, image/png, application/pdf

### Passwords
- Mínimo 8 caracteres
- Máximo 72 caracteres (bcrypt limit)
- Requiere mayúscula, número y carácter especial

### Texto
- **Names**: 2-120 caracteres
- **Email**: Validación RFC 5322
- **Bio**: Max 2000 caracteres
- **Description (proyectos)**: Max 3000 caracteres
- **Message (invites)**: Max 500 caracteres

---

## 🐛 Manejo de Errores Comunes

### Prisma Error Codes
- `P2002` - Unique constraint violation → 409 Conflict
- `P2025` - Record not found → 404 Not Found
- `P2003` - Foreign key constraint → 400 Bad Request

### Errores de Negocio
- **Email duplicado**: 409 Conflict
- **Usuario no encontrado**: 404 Not Found
- **Invitación expirada**: 410 Gone
- **Operación inválida**: 422 Unprocessable Entity
- **Sin permisos**: 403 Forbidden

---

## 🚀 Próximos Pasos para Migración

### Base de Datos → Neon
1. Crear proyecto en Neon (neon.tech)
2. Actualizar `DATABASE_URL` en .env
3. Ejecutar `bunx prisma migrate deploy`
4. Opcional: `bunx prisma db seed` para datos iniciales

### Deploy del Backend (Opciones)
1. **Vercel** (recomendado para simplicidad con Next.js)
2. **Railway** (mejor para Node.js + DB integrada)
3. **Render** (opción gratuita inicial)
4. **Fly.io** (mejor performance global)

### Variables de Entorno en Producción
- Configurar todas las variables en plataforma de deploy
- Usar dominios verificados en Resend
- Actualizar `CORS` origin al dominio de frontend
- Cambiar `API_BASE_URL` y `APP_BASE_URL`

---

## 📞 Contacto y Soporte

**Desarrollador**: FILIPRAIDER
**Repositorio**: ProyectoIA (main branch)
**Última actualización**: 2025-10-07

---

*Este documento es una guía técnica para el equipo frontend. Para preguntas específicas sobre endpoints, consultar el código fuente en `/src/routes/*.route.js`*
