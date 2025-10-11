# ✅ RESPUESTA: Sistema de Fotos de Perfil para Equipos

**Para:** Frontend Team  
**De:** Backend Team  
**Fecha:** 11 de Octubre, 2025  
**Estado:** ✅ EN IMPLEMENTACIÓN  
**Prioridad:** 🟡 MEDIA

---

## 🎯 RESUMEN EJECUTIVO

Hemos recibido la especificación completa para implementar el sistema de fotos de perfil de equipos. La implementación está **lista para comenzar** siguiendo las especificaciones proporcionadas.

### Estado Actual:
- ❌ Modelo `Team` NO tiene campos de imagen
- ❌ Endpoints de perfil de equipo NO implementados
- ❌ Sistema de upload de imágenes NO configurado
- ✅ Infraestructura base (Prisma, Express) lista

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (2-3 horas) - **PRIORIDAD ALTA**

#### 1.1 Actualizar Schema de Prisma

```prisma
model Team {
  id                  String            @id @default(cuid())
  name                String
  description         String?
  city                String?
  area                String?
  
  // 🆕 CAMPOS DE IMAGEN DE PERFIL
  profileImage        String?           // URL de imagen principal
  profileImageSmall   String?           // Thumbnail 100x100
  profileImageMedium  String?           // Thumbnail 300x300
  profileImageLarge   String?           // Thumbnail 600x600
  
  // Metadata de imagen (opcional)
  avatarProvider      String?           // 'imagekit', 's3', 'cloudinary'
  avatarKey           String?           // Key en el storage
  avatarType          String?           // 'image/jpeg', 'image/png'
  avatarSize          Int?              // Tamaño en bytes
  avatarWidth         Int?              // Ancho original
  avatarHeight        Int?              // Alto original
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  members             TeamMember[]
  skills              TeamSkill[]
  assignments         TeamAssignment[]
  applications        TeamApplication[]
  invites             TeamInvite[]
  connections         TeamConnection[]

  @@index([city, area])
}
```

#### 1.2 Crear Migración

```bash
npx prisma migrate dev --name add_team_profile_images
```

**Archivo de migración generado:**
```sql
-- AlterTable
ALTER TABLE "Team" 
ADD COLUMN "profileImage" TEXT,
ADD COLUMN "profileImageSmall" TEXT,
ADD COLUMN "profileImageMedium" TEXT,
ADD COLUMN "profileImageLarge" TEXT,
ADD COLUMN "avatarProvider" TEXT,
ADD COLUMN "avatarKey" TEXT,
ADD COLUMN "avatarType" TEXT,
ADD COLUMN "avatarSize" INTEGER,
ADD COLUMN "avatarWidth" INTEGER,
ADD COLUMN "avatarHeight" INTEGER;
```

---

### Fase 2: Configuración de Storage (2-3 horas)

#### Opción Recomendada: ImageKit (Ya está configurado)

Veo que ya usan ImageKit para usuarios (`src/lib/imagekit.js`), podemos reutilizar:

```javascript
// src/lib/imagekit.js (EXISTENTE)
import ImageKit from 'imagekit';

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// 🆕 AGREGAR: Función para teams
export async function uploadTeamProfileImage(file, teamId) {
  const result = await imagekit.upload({
    file: file.buffer,
    fileName: `team_${teamId}_${Date.now()}.jpg`,
    folder: '/teams',
    transformation: {
      pre: 'l-image,i-logo.png,w-100,b-10_CDDC39,l-end', // Opcional: watermark
      post: [
        {
          type: 'transformation',
          value: 'w-600,h-600,c-at_max'
        }
      ]
    },
    tags: [`team`, `team_${teamId}`]
  });

  return {
    url: result.url,
    thumbnailUrl: result.thumbnailUrl,
    fileId: result.fileId,
    name: result.name,
    size: result.size,
    width: result.width,
    height: result.height
  };
}

// 🆕 AGREGAR: Generar thumbnails
export function getTeamImageThumbnails(url) {
  const baseUrl = url.split('?')[0];
  
  return {
    small: `${baseUrl}?tr=w-100,h-100,c-at_max`,
    medium: `${baseUrl}?tr=w-300,h-300,c-at_max`,
    large: `${baseUrl}?tr=w-600,h-600,c-at_max`
  };
}

// 🆕 AGREGAR: Eliminar imagen de equipo
export async function deleteTeamProfileImage(fileId) {
  await imagekit.deleteFile(fileId);
}
```

**Variables de entorno necesarias (ya existentes):**
```env
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

### Fase 3: Endpoints (4-5 horas)

#### 3.1 GET /teams/:teamId

```javascript
// src/routes/teams.route.js (NUEVO ARCHIVO)
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../utils/http-errors.js';

export const router = Router();

const ParamsSchema = z.object({
  teamId: z.string().min(1)
});

// GET /teams/:teamId
router.get(
  '/:teamId',
  validate(ParamsSchema, 'params'),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true
                }
              }
            }
          },
          skills: {
            include: {
              skill: true
            }
          }
        }
      });

      if (!team) {
        throw new HttpError(404, 'Equipo no encontrado');
      }

      // Buscar el líder
      const leader = team.members.find(m => m.role === 'LIDER');

      res.json({
        id: team.id,
        name: team.name,
        description: team.description,
        profileImage: team.profileImage,
        profileImageSmall: team.profileImageSmall,
        profileImageMedium: team.profileImageMedium,
        profileImageLarge: team.profileImageLarge,
        city: team.city,
        area: team.area,
        leaderId: leader?.userId,
        membersCount: team.members.length,
        skills: team.skills.map(ts => ts.skill.name),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      });

    } catch (err) {
      next(err);
    }
  }
);
```

#### 3.2 PUT /teams/:teamId

```javascript
const UpdateTeamSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  city: z.string().min(2).optional(),
  area: z.string().optional()
});

// PUT /teams/:teamId
router.put(
  '/:teamId',
  validate(ParamsSchema, 'params'),
  validate(UpdateTeamSchema, 'body'),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const userId = req.session?.user?.id; // Asumiendo middleware de sesión

      if (!userId) {
        throw new HttpError(401, 'No autenticado');
      }

      // Verificar que el usuario es líder del equipo
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId
          }
        }
      });

      if (!membership || membership.role !== 'LIDER') {
        throw new HttpError(403, 'Solo el líder puede actualizar el equipo');
      }

      const team = await prisma.team.update({
        where: { id: teamId },
        data: {
          ...req.body,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Equipo actualizado correctamente',
        team
      });

    } catch (err) {
      next(err);
    }
  }
);
```

#### 3.3 POST /teams/:teamId/profile-image ⭐ NUEVO

```javascript
import multer from 'multer';
import { imagekit, uploadTeamProfileImage, getTeamImageThumbnails } from '../lib/imagekit.js';

// Configurar multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new HttpError(400, 'Solo se permiten imágenes JPG, PNG o WebP'));
    }
    
    cb(null, true);
  }
});

// POST /teams/:teamId/profile-image
router.post(
  '/:teamId/profile-image',
  upload.single('image'),
  validate(ParamsSchema, 'params'),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const userId = req.session?.user?.id;
      const file = req.file;

      if (!userId) {
        throw new HttpError(401, 'No autenticado');
      }

      if (!file) {
        throw new HttpError(400, 'No se recibió ninguna imagen');
      }

      // Verificar que el usuario es líder del equipo
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId
          }
        }
      });

      if (!membership || membership.role !== 'LIDER') {
        throw new HttpError(403, 'Solo el líder puede actualizar la imagen del equipo');
      }

      // Obtener equipo para eliminar imagen anterior si existe
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        throw new HttpError(404, 'Equipo no encontrado');
      }

      // Eliminar imagen anterior si existe
      if (team.avatarKey) {
        try {
          await imagekit.deleteFile(team.avatarKey);
        } catch (error) {
          console.error('Error deleting old team image:', error);
        }
      }

      // Subir nueva imagen
      const uploadResult = await uploadTeamProfileImage(file, teamId);
      const thumbnails = getTeamImageThumbnails(uploadResult.url);

      // Actualizar BD
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          profileImage: uploadResult.url,
          profileImageSmall: thumbnails.small,
          profileImageMedium: thumbnails.medium,
          profileImageLarge: thumbnails.large,
          avatarProvider: 'imagekit',
          avatarKey: uploadResult.fileId,
          avatarType: file.mimetype,
          avatarSize: uploadResult.size,
          avatarWidth: uploadResult.width,
          avatarHeight: uploadResult.height,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Imagen de perfil actualizada correctamente',
        profileImage: updatedTeam.profileImage,
        thumbnails: {
          small: updatedTeam.profileImageSmall,
          medium: updatedTeam.profileImageMedium,
          large: updatedTeam.profileImageLarge
        }
      });

    } catch (err) {
      next(err);
    }
  }
);
```

#### 3.4 DELETE /teams/:teamId/profile-image

```javascript
// DELETE /teams/:teamId/profile-image
router.delete(
  '/:teamId/profile-image',
  validate(ParamsSchema, 'params'),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const userId = req.session?.user?.id;

      if (!userId) {
        throw new HttpError(401, 'No autenticado');
      }

      // Verificar que el usuario es líder del equipo
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId
          }
        }
      });

      if (!membership || membership.role !== 'LIDER') {
        throw new HttpError(403, 'Solo el líder puede eliminar la imagen del equipo');
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        throw new HttpError(404, 'Equipo no encontrado');
      }

      if (!team.profileImage) {
        throw new HttpError(404, 'El equipo no tiene imagen de perfil');
      }

      // Eliminar de ImageKit
      if (team.avatarKey) {
        try {
          await imagekit.deleteFile(team.avatarKey);
        } catch (error) {
          console.error('Error deleting team image from ImageKit:', error);
        }
      }

      // Actualizar BD
      await prisma.team.update({
        where: { id: teamId },
        data: {
          profileImage: null,
          profileImageSmall: null,
          profileImageMedium: null,
          profileImageLarge: null,
          avatarProvider: null,
          avatarKey: null,
          avatarType: null,
          avatarSize: null,
          avatarWidth: null,
          avatarHeight: null,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Imagen de perfil eliminada correctamente'
      });

    } catch (err) {
      next(err);
    }
  }
);

export default router;
```

---

### Fase 4: Integración con Matching (1 hora)

#### Actualizar `matching.route.js`:

```javascript
// Ya existe en src/routes/matching.route.js
// Solo agregar profileImage al response

const teams = candidates.map(team => ({
  teamId: team.teamId,
  name: team.teamName,
  avatarUrl: team.avatarUrl || team.profileImage || `https://cdn.bridge.com/avatars/${team.teamId}.png`, // 🆕
  profileImage: team.profileImage, // 🆕 Agregar explícitamente
  skills: team.teamSkillNames || [],
  members: team.membersCount,
  rating: team.rating || null,
  location: team.city || "",
  availability: team.avgAvailability !== undefined ? 
    (team.avgAvailability === 0 ? "No disponible" : "Inmediata") : "",
  matchScore: team.score || 0,
  skillCoverage: team.breakdown?.skillCoverage || 0
}));
```

#### Actualizar `matching.service.js`:

```javascript
// En la función computeCandidates, agregar profileImage al resultado

const baseCandidate = {
  teamId: team.id,
  teamName: team.name,
  profileImage: team.profileImage, // 🆕 AGREGAR
  avatarUrl: team.profileImage,     // 🆕 Alias para compatibilidad
  city: team.city,
  area: team.area,
  membersCount: members.length,
  // ... resto de campos
};
```

---

## 📦 REGISTRO DE RUTAS EN SERVER

```javascript
// src/server.js
import teamsRouter from './routes/teams.route.js'; // 🆕

// ... otras importaciones

// Registrar rutas
app.use('/teams', teamsRouter); // 🆕 AGREGAR
app.use('/matching', matchingRouter);
// ... otras rutas
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos:
- [ ] Actualizar `prisma/schema.prisma` con campos de imagen
- [ ] Crear migración `add_team_profile_images`
- [ ] Ejecutar migración en local
- [ ] Verificar columnas creadas
- [ ] Ejecutar migración en staging/producción

### ImageKit:
- [ ] Verificar configuración existente
- [ ] Agregar función `uploadTeamProfileImage`
- [ ] Agregar función `getTeamImageThumbnails`
- [ ] Agregar función `deleteTeamProfileImage`
- [ ] Probar upload de imagen de prueba

### Endpoints:
- [ ] Crear `src/routes/teams.route.js`
- [ ] Implementar `GET /teams/:teamId`
- [ ] Implementar `PUT /teams/:teamId`
- [ ] Implementar `POST /teams/:teamId/profile-image`
- [ ] Implementar `DELETE /teams/:teamId/profile-image`
- [ ] Registrar router en `src/server.js`

### Integración:
- [ ] Actualizar `matching.route.js` para incluir `profileImage`
- [ ] Actualizar `matching.service.js` para incluir `profileImage`
- [ ] Verificar que thumbnails se generan correctamente

### Testing:
- [ ] Probar GET /teams/:teamId (equipo existente)
- [ ] Probar GET /teams/:teamId (equipo inexistente → 404)
- [ ] Probar PUT /teams/:teamId como líder
- [ ] Probar PUT /teams/:teamId como miembro (debe fallar → 403)
- [ ] Probar POST /profile-image con JPG válido
- [ ] Probar POST /profile-image con PNG válido
- [ ] Probar POST /profile-image con WebP válido
- [ ] Probar POST /profile-image con PDF (debe fallar → 400)
- [ ] Probar POST /profile-image con archivo > 5MB (debe fallar → 413)
- [ ] Probar POST /profile-image sin autenticación (debe fallar → 401)
- [ ] Probar POST /profile-image como miembro no líder (debe fallar → 403)
- [ ] Probar DELETE /profile-image
- [ ] Verificar que imagen anterior se elimina al subir nueva
- [ ] Verificar URLs de thumbnails accesibles

### Documentación:
- [ ] Actualizar API docs con nuevos endpoints
- [ ] Agregar ejemplos de uso
- [ ] Documentar errores posibles

---

## 🚀 TIMELINE ESTIMADO

| Fase | Tareas | Tiempo | Responsable |
|------|--------|--------|-------------|
| **Fase 1** | Schema + Migración | 2-3h | Backend |
| **Fase 2** | Configurar ImageKit | 2-3h | Backend |
| **Fase 3** | Implementar Endpoints | 4-5h | Backend |
| **Fase 4** | Integrar con Matching | 1h | Backend |
| **Testing** | Pruebas E2E | 2-3h | Backend + QA |
| **Deploy** | Staging + Producción | 1h | DevOps |
| **TOTAL** | | **12-16h** | ~2-3 días |

---

## 📊 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana (11-15 Oct):
1. ✅ Actualizar schema de Prisma
2. ✅ Crear y ejecutar migración
3. ✅ Configurar funciones de ImageKit para teams
4. ✅ Implementar endpoints básicos (GET/PUT)

### Próxima Semana (18-22 Oct):
5. ✅ Implementar POST /profile-image
6. ✅ Implementar DELETE /profile-image
7. ✅ Integrar con matching
8. ✅ Testing exhaustivo

### Semana del 25 Oct:
9. ✅ Deploy a staging
10. ✅ Testing con frontend
11. ✅ Deploy a producción
12. ✅ Monitoreo

---

## 🎯 INFORMACIÓN ADICIONAL

### Formato de Response del Matching (Actualizado):

```json
{
  "type": "team_matches",
  "teams": [
    {
      "teamId": "cmglrywwu0008jhzkmknq8i8g",
      "name": "DevTeam FullStack",
      "profileImage": "https://ik.imagekit.io/bridge/teams/team_001/profile.jpg", // 🆕
      "avatarUrl": "https://ik.imagekit.io/bridge/teams/team_001/profile.jpg",
      "skills": ["React", "Node.js", "PostgreSQL"],
      "members": 4,
      "rating": null,
      "location": "Bogotá",
      "availability": "No disponible",
      "matchScore": 31.1,
      "skillCoverage": 44.4
    }
  ]
}
```

### Manejo de Imágenes sin ProfileImage:

```javascript
// Si el equipo no tiene profileImage, usar placeholder
const avatarUrl = team.profileImage || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&size=600&background=random`;
```

---

## 📞 COORDINACIÓN

### Dudas o Preguntas:
- **Slack:** #backend-team
- **Email:** backend@bridge.com
- **Daily Standups:** 9:00 AM COT

### Review de Código:
- PR en GitHub una vez completada cada fase
- Review requerido antes de merge a `main`

### Testing con Frontend:
- Disponible después de Fase 3 completa
- Endpoint staging: `https://staging-api.bridge.com`
- Endpoint local: `http://localhost:4001`

---

## 📝 NOTAS TÉCNICAS

### ImageKit vs S3:
**Decisión:** Usar ImageKit (ya configurado)

**Ventajas:**
- ✅ Ya está configurado en el proyecto
- ✅ Transformaciones de imagen automáticas
- ✅ CDN incluido
- ✅ Thumbnails on-the-fly con query params
- ✅ No requiere configuración adicional

### Autenticación:
Asumiendo que ya existe middleware de sesión (`req.session.user`). Si no existe, necesitaremos implementarlo.

### Validación de Dimensiones:
ImageKit hace validaciones automáticas. Si se necesita validación manual antes del upload, agregar:

```javascript
import sharp from 'sharp';

// Validar dimensiones
const metadata = await sharp(file.buffer).metadata();

if (metadata.width < 200 || metadata.height < 200) {
  throw new HttpError(400, 'La imagen debe tener al menos 200x200 píxeles');
}
```

---

## 🎉 CONCLUSIÓN

La especificación está **perfectamente clara** y lista para implementar. Comenzaremos con la Fase 1 (Base de Datos) inmediatamente.

**Estimación total:** 12-16 horas (~2-3 días de desarrollo)  
**Fecha estimada de completación:** 20 de Octubre, 2025  
**Bloqueadores:** Ninguno identificado

Estaremos actualizando el progreso diariamente en nuestro canal de Slack.

---

**Preparado por:** Backend Team  
**Fecha:** 11 de Octubre, 2025  
**Versión:** 1.0  
**Estado:** ✅ APROBADO PARA IMPLEMENTACIÓN
