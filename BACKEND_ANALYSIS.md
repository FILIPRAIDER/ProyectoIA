# 📊 Análisis de Endpoints Backend para Frontend

## ✅ Endpoints que YA EXISTEN

### 1. GET /api/users/:id
**Estado:** ✅ **IMPLEMENTADO** (línea 26 en users.route.js)
- Incluye: skills, teamMemberships, profile
- ❌ **FALTA:** No incluye `experiences` y `certifications`
- ❌ **FALTA:** No incluye `avatarUrl` en teamMemberships.user

### 2. PATCH /api/teams/:id  
**Estado:** ✅ **IMPLEMENTADO** (línea 40 en teams.route.js)
- Permite actualizar: name, city, area
- ❌ **FALTA:** No valida que el usuario sea LIDER del equipo
- ❌ **FALTA:** No incluye campo `description` en el modelo Team

### 3. GET /api/teams/:teamId/members
**Estado:** ✅ **IMPLEMENTADO** (línea 130 en teams.route.js)
- Incluye información del usuario
- ❌ **FALTA:** No incluye `avatarUrl` explícitamente en el select
- ❌ **FALTA:** No valida que el usuario sea miembro del equipo

## ❌ Problemas Encontrados

### Problema 1: GET /api/users/:id - Falta información
**Archivo:** `src/routes/users.route.js` línea 26

**Actual:**
```javascript
include: {
  skills: { include: { skill: true } },
  teamMemberships: { include: { team: true } },
  profile: true,
}
```

**Debería incluir:**
- ✅ experiences (ordenadas por startDate desc)
- ✅ certifications (ordenadas por issueDate desc)
- ❌ No incluye passwordHash en la respuesta

### Problema 2: GET /api/teams/:teamId/members - Falta avatarUrl
**Archivo:** `src/routes/teams.route.js` línea 147

**Actual:**
```javascript
{ select: { id: true, name: true, email: true, role: true } }
```

**Falta:**
```javascript
avatarUrl: true // ← AGREGAR
```

### Problema 3: PATCH /api/teams/:id - Sin validación de permisos
**Archivo:** `src/routes/teams.route.js` línea 40

**Falta:**
- Verificar que el usuario es LIDER del equipo
- Agregar middleware de autenticación
- Validar que req.user.id existe

### Problema 4: Modelo Team - Falta campo description
**Archivo:** `prisma/schema.prisma`

**El modelo Team no tiene campo `description`**

## 🛠️ Modificaciones Necesarias

### 1. Agregar campo `description` al modelo Team

```prisma
model Team {
  id           String            @id @default(cuid())
  name         String
  description  String?           // ← AGREGAR ESTE CAMPO
  city         String?
  area         String?
  // ... resto de campos
}
```

**Requiere migración:**
```bash
npx prisma migrate dev --name add_team_description
```

### 2. Actualizar GET /api/users/:id

**Modificar en:** `src/routes/users.route.js` línea 26

```javascript
const user = await prisma.user.findUnique({
  where: { id: req.params.id },
  include: {
    profile: true,
    experiences: {
      orderBy: { startDate: 'desc' }
    },
    certifications: {
      orderBy: { issueDate: 'desc' }
    },
    skills: { 
      include: { skill: true },
      orderBy: { level: 'desc' }
    },
    teamMemberships: { 
      include: { team: true } 
    },
  },
});
if (!user) throw new HttpError(404, "Usuario no encontrado");

// Remover passwordHash antes de enviar
const { passwordHash, ...userWithoutPassword } = user;
res.json(userWithoutPassword);
```

### 3. Actualizar GET /api/teams/:teamId/members

**Modificar en:** `src/routes/teams.route.js` línea 147

```javascript
const includeUser = req.query.withSkills
  ? {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true, // ← AGREGAR
        skills: {
          include: { skill: true },
          orderBy: { skill: { name: "asc" } },
        },
      },
    }
  : { 
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        avatarUrl: true // ← AGREGAR
      } 
    };
```

**Y agregar validación de permisos al inicio:**

```javascript
router.get(
  "/:teamId/members",
  validate(TeamIdOnlyParams, "params"),
  validate(ListTeamMembersQuery, "query"),
  async (req, res, next) => {
    try {
      const userId = req.user?.id; // Desde middleware de auth
      
      // Verificar que el usuario es miembro del equipo
      if (userId) {
        const userMembership = await prisma.teamMember.findFirst({
          where: {
            teamId: req.params.teamId,
            userId: userId
          }
        });
        
        if (!userMembership) {
          throw new HttpError(403, 'No tienes acceso a este equipo');
        }
      }
      
      // ... resto del código
    }
  }
);
```

### 4. Actualizar PATCH /api/teams/:id

**Modificar en:** `src/routes/teams.route.js` línea 40

```javascript
const UpdateTeamBody = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().max(500).optional().nullable(), // ← AGREGAR
  city: z.string().trim().min(2).optional().nullable(),
  area: z.string().trim().min(2).max(50).optional().nullable(),
});

router.patch(
  "/:id",
  validate(TeamIdParams, "params"),
  validate(UpdateTeamBody),
  async (req, res, next) => {
    try {
      const userId = req.user?.id; // Desde middleware de auth
      
      if (!userId) {
        throw new HttpError(401, "Autenticación requerida");
      }
      
      // Verificar que el usuario es líder del equipo
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: req.params.id,
          userId: userId,
          role: 'LIDER'
        }
      });
      
      if (!membership) {
        throw new HttpError(403, 'Solo los líderes pueden editar el equipo');
      }
      
      // Validar nombre no vacío
      if ('name' in req.body && !req.body.name?.trim()) {
        throw new HttpError(400, 'El nombre no puede estar vacío');
      }
      
      const updated = await prisma.team.update({
        where: { id: req.params.id },
        data: {
          ...("name" in req.body ? { name: req.body.name } : {}),
          ...("description" in req.body ? { description: req.body.description ?? null } : {}), // ← AGREGAR
          ...("city" in req.body ? { city: req.body.city ?? null } : {}),
          ...("area" in req.body ? { area: req.body.area ?? null } : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Equipo no encontrado"));
      next(e);
    }
  }
);
```

## 📋 Checklist de Implementación

### Paso 1: Modificar Schema de Prisma
- [ ] Agregar campo `description` al modelo Team
- [ ] Crear y ejecutar migración

### Paso 2: Actualizar GET /api/users/:id
- [ ] Agregar `experiences` al include
- [ ] Agregar `certifications` al include
- [ ] Ordenar experiences por startDate desc
- [ ] Ordenar certifications por issueDate desc
- [ ] Ordenar skills por level desc
- [ ] Remover `passwordHash` de la respuesta

### Paso 3: Actualizar GET /api/teams/:teamId/members
- [ ] Agregar `avatarUrl` al select de user
- [ ] Agregar validación de permisos (opcional pero recomendado)

### Paso 4: Actualizar PATCH /api/teams/:id
- [ ] Agregar validación de autenticación
- [ ] Verificar que el usuario es LIDER del equipo
- [ ] Agregar campo `description` al schema de validación
- [ ] Agregar campo `description` al update
- [ ] Validar que el nombre no esté vacío

### Paso 5: Middleware de Autenticación
- [ ] Verificar que existe middleware de autenticación
- [ ] Aplicarlo a los endpoints que lo requieren

## 🎯 Prioridad de Implementación

### 🔥 Alta Prioridad (Bloqueante para el frontend)
1. ✅ GET /api/users/:id - Agregar experiences y certifications
2. ✅ GET /api/teams/:teamId/members - Agregar avatarUrl

### 🟡 Media Prioridad (Importante pero no bloqueante)
3. ⚠️ Agregar campo description al modelo Team (requiere migración)
4. ⚠️ PATCH /api/teams/:id - Validación de permisos

### 🟢 Baja Prioridad (Nice to have)
5. GET /api/teams/:teamId/members - Validación de acceso

## 🚀 Pasos de Ejecución

```bash
# 1. Modificar schema.prisma (agregar description)
# 2. Crear migración
npx prisma migrate dev --name add_team_description

# 3. Regenerar cliente
npx prisma generate

# 4. Modificar archivos de rutas
# 5. Probar endpoints
# 6. Commit y deploy
```

## 📝 Notas Adicionales

- El middleware de autenticación debe extraer `req.user` del JWT
- Considerar agregar rate limiting a los endpoints públicos
- El campo `description` del team puede ser null o string vacío
- Los errores 403 vs 401: usar 401 si no hay token, 403 si no tiene permisos
