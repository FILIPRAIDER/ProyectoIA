# 📸 BACKEND: Sistema de Fotos de Perfil para Equipos

**Para:** Backend Team  
**De:** Frontend Team  
**Fecha:** 11 de Octubre, 2025  
**Prioridad:** 🟡 MEDIA  
**Estado:** 📋 ESPECIFICACIÓN

---

## 🎯 OBJETIVO

Implementar la funcionalidad de fotos de perfil para equipos, similar al sistema actual de avatares de usuarios individuales.

### ¿Por qué es importante?

Las fotos de perfil de equipos:
- ✅ Mejoran la confianza y profesionalismo
- ✅ Facilitan el reconocimiento visual en matching
- ✅ Aumentan la tasa de conexión entre empresas y equipos
- ✅ Dan identidad visual a cada equipo

---

## 📊 CASOS DE USO

### Caso 1: Líder sube foto del equipo
```
Usuario: Líder de equipo
Acción: Va a /dashboard/lider/equipo/configuracion
        Click en ícono de cámara
        Selecciona imagen (JPG, PNG, WebP)
        Sistema valida y sube la imagen
Resultado: Foto se muestra en su perfil y en matching
```

### Caso 2: Empresario ve equipos con fotos
```
Usuario: Empresario
Acción: Solicita "busca equipos" en el chat
        Ve tarjetas de equipos resultantes
Resultado: Equipos con foto se ven más profesionales
          Empresario puede identificar visualmente cada equipo
```

### Caso 3: Equipo actualiza su foto
```
Usuario: Líder de equipo
Acción: Cambia la foto actual por una nueva
Resultado: Nueva foto se refleja en todas las vistas
```

---

## 🔧 ENDPOINTS REQUERIDOS

### 1. GET /teams/:teamId

**Descripción:** Obtener información completa del equipo

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "id": "team_abc123",
  "name": "DevTeam Pro",
  "description": "Equipo especializado en desarrollo web fullstack",
  "profileImage": "https://storage.bridge.com/teams/team_abc123/profile.jpg",
  "city": "Bogotá",
  "country": "Colombia",
  "website": "https://devteam.com",
  "email": "contacto@devteam.com",
  "phone": "+57 300 123 4567",
  "verified": true,
  "leaderId": "user_xyz789",
  "createdAt": "2025-10-01T10:30:00Z",
  "updatedAt": "2025-10-11T15:45:00Z"
}
```

**Errores:**
- `404`: Equipo no encontrado
- `401`: No autorizado
- `403`: No tienes permiso para ver este equipo

---

### 2. PUT /teams/:teamId

**Descripción:** Actualizar información del equipo (sin imagen)

**Headers:**
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "DevTeam Pro",
  "description": "Equipo especializado en desarrollo web fullstack",
  "city": "Bogotá",
  "country": "Colombia",
  "website": "https://devteam.com",
  "email": "contacto@devteam.com",
  "phone": "+57 300 123 4567"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Equipo actualizado correctamente",
  "team": {
    "id": "team_abc123",
    "name": "DevTeam Pro",
    // ... resto de campos actualizados
  }
}
```

**Validaciones:**
- `name`: Requerido, mín 3 caracteres, máx 100
- `description`: Opcional, máx 500 caracteres
- `city`: Requerido, mín 2 caracteres
- `country`: Requerido, mín 2 caracteres
- `website`: Opcional, debe ser URL válida
- `email`: Opcional, debe ser email válido
- `phone`: Opcional

**Errores:**
- `400`: Datos inválidos
- `401`: No autorizado
- `403`: No eres el líder de este equipo
- `404`: Equipo no encontrado

---

### 3. POST /teams/:teamId/profile-image ⭐ **NUEVO**

**Descripción:** Subir o actualizar la foto de perfil del equipo

**Headers:**
```http
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
image: File (JPG, PNG, WebP)
```

**Response 200:**
```json
{
  "success": true,
  "message": "Imagen de perfil actualizada correctamente",
  "profileImage": "https://storage.bridge.com/teams/team_abc123/profile.jpg",
  "thumbnails": {
    "small": "https://storage.bridge.com/teams/team_abc123/profile_small.jpg",
    "medium": "https://storage.bridge.com/teams/team_abc123/profile_medium.jpg",
    "large": "https://storage.bridge.com/teams/team_abc123/profile_large.jpg"
  }
}
```

**Validaciones:**
- ✅ Solo el líder del equipo puede subir imágenes
- ✅ Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- ✅ Tamaño máximo: 5MB
- ✅ Dimensiones mínimas: 200x200px
- ✅ Dimensiones máximas: 4096x4096px

**Errores:**
- `400`: Archivo no válido (tipo, tamaño o dimensiones)
- `401`: No autorizado
- `403`: No eres el líder de este equipo
- `404`: Equipo no encontrado
- `413`: Archivo demasiado grande
- `500`: Error al procesar/guardar la imagen

**Ejemplos de Errores:**
```json
// Error 400 - Tipo inválido
{
  "success": false,
  "error": "INVALID_FILE_TYPE",
  "message": "Solo se permiten imágenes JPG, PNG o WebP",
  "allowedTypes": ["image/jpeg", "image/png", "image/webp"]
}

// Error 400 - Tamaño excedido
{
  "success": false,
  "error": "FILE_TOO_LARGE",
  "message": "La imagen no debe superar los 5MB",
  "maxSize": 5242880,
  "receivedSize": 7340032
}

// Error 400 - Dimensiones inválidas
{
  "success": false,
  "error": "INVALID_DIMENSIONS",
  "message": "La imagen debe tener al menos 200x200 píxeles",
  "minWidth": 200,
  "minHeight": 200,
  "receivedWidth": 150,
  "receivedHeight": 150
}
```

---

### 4. DELETE /teams/:teamId/profile-image ⭐ **NUEVO** (Opcional)

**Descripción:** Eliminar la foto de perfil del equipo

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Imagen de perfil eliminada correctamente"
}
```

**Errores:**
- `401`: No autorizado
- `403`: No eres el líder de este equipo
- `404`: Equipo no encontrado o no tiene imagen

---

## 💾 BASE DE DATOS

### Tabla: `teams`

**Columnas a agregar/verificar:**

```sql
ALTER TABLE teams ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS profile_image_small VARCHAR(500);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS profile_image_medium VARCHAR(500);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS profile_image_large VARCHAR(500);
```

**Estructura recomendada:**

```typescript
interface Team {
  id: string;
  name: string;
  description: string;
  profile_image: string | null;        // URL completa
  profile_image_small: string | null;  // Thumbnail 100x100
  profile_image_medium: string | null; // Thumbnail 300x300
  profile_image_large: string | null;  // Thumbnail 600x600
  city: string;
  country: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  verified: boolean;
  leader_id: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## 📦 ALMACENAMIENTO DE IMÁGENES

### Recomendaciones de Implementación

#### Opción 1: AWS S3 (Recomendada)
```typescript
// Estructura de carpetas en S3:
teams/
  └── {teamId}/
      ├── profile.jpg           // Original
      ├── profile_small.jpg     // 100x100
      ├── profile_medium.jpg    // 300x300
      └── profile_large.jpg     // 600x600

// URL pública:
https://storage.bridge.com/teams/{teamId}/profile.jpg
```

**Ventajas:**
- ✅ Escalable
- ✅ CDN integrado (CloudFront)
- ✅ Backups automáticos
- ✅ Costos bajos

#### Opción 2: Servidor Local + CDN
```typescript
// Estructura local:
/uploads/teams/{teamId}/profile.jpg

// Servir con CDN:
https://cdn.bridge.com/teams/{teamId}/profile.jpg
```

#### Opción 3: Cloudinary (Fácil)
```typescript
// Upload con transformaciones automáticas
cloudinary.uploader.upload(file, {
  folder: `teams/${teamId}`,
  transformation: [
    { width: 600, height: 600, crop: 'fill' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
});
```

**Ventajas:**
- ✅ Transformaciones automáticas
- ✅ Optimización de imágenes
- ✅ CDN incluido
- ✅ Fácil implementación

---

## 🔄 PROCESAMIENTO DE IMÁGENES

### Flujo Recomendado:

```
1. Recibir imagen → 2. Validar → 3. Generar thumbnails → 4. Subir a storage → 5. Guardar URLs en DB
```

### Generación de Thumbnails:

**Usando Sharp (Node.js):**
```typescript
import sharp from 'sharp';

async function generateThumbnails(originalPath: string, teamId: string) {
  const sizes = {
    small: 100,
    medium: 300,
    large: 600
  };

  const thumbnails: Record<string, string> = {};

  for (const [key, size] of Object.entries(sizes)) {
    const outputPath = `teams/${teamId}/profile_${key}.jpg`;
    
    await sharp(originalPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    thumbnails[key] = await uploadToS3(outputPath);
  }

  return thumbnails;
}
```

### Optimización:

```typescript
// Comprimir y optimizar
await sharp(inputPath)
  .resize(600, 600)
  .jpeg({
    quality: 85,
    progressive: true,
    mozjpeg: true
  })
  .toFile(outputPath);
```

---

## 🔒 SEGURIDAD

### Validaciones Obligatorias:

1. **Autenticación:**
   ```typescript
   if (!session || !session.user) {
     return res.status(401).json({ error: 'No autenticado' });
   }
   ```

2. **Autorización:**
   ```typescript
   const team = await db.team.findUnique({ where: { id: teamId } });
   
   if (team.leaderId !== session.user.id) {
     return res.status(403).json({ error: 'No eres el líder de este equipo' });
   }
   ```

3. **Tipo de archivo:**
   ```typescript
   const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
   
   if (!allowedTypes.includes(file.mimetype)) {
     return res.status(400).json({ error: 'Tipo de archivo no permitido' });
   }
   ```

4. **Tamaño:**
   ```typescript
   const maxSize = 5 * 1024 * 1024; // 5MB
   
   if (file.size > maxSize) {
     return res.status(413).json({ error: 'Archivo demasiado grande' });
   }
   ```

5. **Sanitización del nombre:**
   ```typescript
   const sanitizedFilename = `${teamId}_${Date.now()}.jpg`;
   ```

6. **Validar dimensiones:**
   ```typescript
   const metadata = await sharp(file.path).metadata();
   
   if (metadata.width < 200 || metadata.height < 200) {
     return res.status(400).json({ 
       error: 'Dimensiones demasiado pequeñas' 
     });
   }
   ```

---

## 📝 EJEMPLO DE IMPLEMENTACIÓN (Express)

```typescript
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const upload = multer({ 
  dest: 'temp/',
  limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /teams/:teamId/profile-image
router.post(
  '/teams/:teamId/profile-image',
  authenticate,
  authorize('TEAM_LEADER'),
  upload.single('image'),
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ 
          success: false,
          error: 'No se recibió ninguna imagen' 
        });
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FILE_TYPE',
          message: 'Solo se permiten imágenes JPG, PNG o WebP'
        });
      }

      // Validar que el usuario es el líder del equipo
      const team = await db.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Equipo no encontrado'
        });
      }

      if (team.leaderId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'No eres el líder de este equipo'
        });
      }

      // Procesar imagen
      const processedBuffer = await sharp(file.path)
        .resize(600, 600, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Subir a S3
      const s3Key = `teams/${teamId}/profile.jpg`;
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      }));

      const profileImageUrl = `https://${process.env.CDN_URL}/${s3Key}`;

      // Generar thumbnails
      const thumbnails = await generateThumbnails(file.path, teamId);

      // Actualizar BD
      await db.team.update({
        where: { id: teamId },
        data: {
          profileImage: profileImageUrl,
          profileImageSmall: thumbnails.small,
          profileImageMedium: thumbnails.medium,
          profileImageLarge: thumbnails.large,
          updatedAt: new Date()
        }
      });

      // Limpiar archivo temporal
      await fs.unlink(file.path);

      res.status(200).json({
        success: true,
        message: 'Imagen de perfil actualizada correctamente',
        profileImage: profileImageUrl,
        thumbnails
      });

    } catch (error) {
      console.error('Error uploading team profile image:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar la imagen'
      });
    }
  }
);

export default router;
```

---

## 🧪 TESTING

### Casos de Prueba:

1. **Upload exitoso:**
   ```bash
   curl -X POST \
     http://localhost:4001/teams/team_123/profile-image \
     -H "Authorization: Bearer {token}" \
     -F "image=@team_photo.jpg"
   ```

2. **Tipo inválido:**
   ```bash
   curl -X POST \
     http://localhost:4001/teams/team_123/profile-image \
     -H "Authorization: Bearer {token}" \
     -F "image=@document.pdf"
   # Debe retornar 400
   ```

3. **Archivo muy grande:**
   ```bash
   # Imagen de 10MB
   curl -X POST \
     http://localhost:4001/teams/team_123/profile-image \
     -H "Authorization: Bearer {token}" \
     -F "image=@large_image.jpg"
   # Debe retornar 413
   ```

4. **Sin autorización:**
   ```bash
   curl -X POST \
     http://localhost:4001/teams/team_123/profile-image \
     -F "image=@team_photo.jpg"
   # Debe retornar 401
   ```

5. **Usuario no es líder:**
   ```bash
   # Token de un miembro (no líder)
   curl -X POST \
     http://localhost:4001/teams/team_123/profile-image \
     -H "Authorization: Bearer {member_token}" \
     -F "image=@team_photo.jpg"
   # Debe retornar 403
   ```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos:
- [ ] Agregar columna `profile_image` a tabla `teams`
- [ ] Agregar columnas de thumbnails (opcional)
- [ ] Crear migración
- [ ] Ejecutar migración en dev/staging

### Backend:
- [ ] Implementar `GET /teams/:teamId`
- [ ] Implementar `PUT /teams/:teamId`
- [ ] Implementar `POST /teams/:teamId/profile-image`
- [ ] Configurar multer para uploads
- [ ] Configurar sharp para procesamiento
- [ ] Configurar S3/Cloudinary para storage
- [ ] Agregar validaciones de seguridad
- [ ] Agregar logs de eventos

### Testing:
- [ ] Probar upload exitoso
- [ ] Probar validaciones de tipo
- [ ] Probar validaciones de tamaño
- [ ] Probar autorización
- [ ] Probar generación de thumbnails
- [ ] Probar con diferentes formatos (JPG, PNG, WebP)

### Integración:
- [ ] Actualizar endpoint de matching para incluir `profileImage`
- [ ] Actualizar endpoint de perfil de equipo
- [ ] Verificar que las URLs son accesibles públicamente
- [ ] Configurar CORS si es necesario
- [ ] Configurar CDN para optimizar entrega

---

## 🔗 INTEGRACIÓN CON MATCHING

### Actualizar Endpoint de Matching:

`POST /projects/:projectId/recommend-teams`

**Response debe incluir profileImage:**
```json
{
  "candidates": [
    {
      "team": {
        "id": "team_001",
        "name": "DevTeam Pro",
        "profileImage": "https://storage.bridge.com/teams/team_001/profile.jpg", // ⭐
        "city": "Bogotá",
        "rating": 4.8,
        "totalProjects": 24,
        "verified": true,
        "availability": "AVAILABLE"
      },
      "matchPercentage": 85,
      // ...
    }
  ]
}
```

---

## 📊 MÉTRICAS A TRACKEAR

Después de implementar, monitorear:

1. **Tasa de adopción:**
   - % de equipos con foto vs sin foto
   - Tiempo promedio hasta subir primera foto

2. **Impacto en matching:**
   - Tasa de clicks en equipos con foto vs sin foto
   - Tasa de conexiones de equipos con foto vs sin foto

3. **Performance:**
   - Tiempo promedio de upload
   - Tamaño promedio de imágenes
   - Uso de storage

4. **Errores:**
   - % de uploads fallidos
   - Tipos de errores más comunes

---

## ⏰ ESTIMACIÓN DE TIEMPO

| Tarea | Tiempo Estimado |
|-------|----------------|
| Setup de storage (S3/Cloudinary) | 2-3 horas |
| Implementar POST /profile-image | 3-4 horas |
| Implementar GET/PUT /teams/:id | 2 horas |
| Procesamiento y thumbnails | 2-3 horas |
| Validaciones y seguridad | 2 horas |
| Testing | 2-3 horas |
| Integración con matching | 1 hora |
| **TOTAL** | **14-18 horas** (~2-3 días) |

---

## 🚀 PRÓXIMOS PASOS

### Fase 1: Implementación Básica (Esta semana)
1. Setup de storage (S3/Cloudinary)
2. Endpoint POST /teams/:teamId/profile-image
3. Endpoint GET/PUT /teams/:teamId
4. Migraciones de BD

### Fase 2: Optimización (Próxima semana)
1. Generación de thumbnails
2. Integración con matching
3. Testing exhaustivo
4. Deploy a staging

### Fase 3: Testing & Deploy (Semana siguiente)
1. Testing end-to-end con frontend
2. Validar performance
3. Deploy a producción
4. Monitoreo de métricas

---

## 📞 COORDINACIÓN

**¿Dudas o necesitas clarificación?**

- Slack: #matching-feature
- Email: frontend@bridge.com
- Meetings: Disponibles Ma/Ju 3-5 PM

**Documentos Relacionados:**
- `FRONTEND_CONFIRMACION_MATCHING_INTEGRATION.md`
- `BACKEND_TEAM_MATCHING_ENDPOINTS.md`
- `AI_TEAM_MATCHING_INTEGRATION.md`

---

**Fecha de creación:** 11 de Octubre, 2025  
**Última actualización:** 11 de Octubre, 2025  
**Versión:** 1.0.0  
**Estado:** 📋 Especificación Lista para Implementación
