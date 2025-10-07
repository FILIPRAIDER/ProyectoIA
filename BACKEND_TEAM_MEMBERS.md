# Modificaciones Backend para Gestión de Equipo y Miembros

## Resumen
Se necesitan modificaciones en el backend para soportar las nuevas funcionalidades:
1. Vista completa de miembros con sus perfiles
2. Gestión de información del equipo (editar nombre y descripción)
3. Obtener perfiles completos de usuarios con experiencias, certificaciones y skills

## 1. Endpoint: GET /api/users/:id

### Propósito
Obtener información completa de un usuario incluyendo perfil, experiencias, certificaciones y skills.

### Modificación Requerida
El endpoint ya debería existir, pero asegúrate de que incluya las siguientes relaciones:

```typescript
// En el controlador de users
async getUserById(req, res) {
  const { id } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        experiences: {
          orderBy: { startDate: 'desc' }
        },
        certifications: {
          orderBy: { issueDate: 'desc' }
        },
        userSkills: {
          include: {
            skill: true
          },
          orderBy: { level: 'desc' }
        },
        teamMemberships: {
          include: {
            team: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Remover campos sensibles si es necesario
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
}
```

## 2. Endpoint: PATCH /api/teams/:id

### Propósito
Permitir a los líderes actualizar información del equipo (nombre y descripción).

### Implementación

```typescript
// En el controlador de teams
async updateTeam(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id; // Del middleware de autenticación
  
  try {
    // Verificar que el usuario es líder del equipo
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: userId,
        role: 'LIDER'
      }
    });
    
    if (!membership) {
      return res.status(403).json({ 
        message: 'Solo los líderes pueden editar el equipo' 
      });
    }
    
    // Preparar datos para actualizar
    const updateData = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ 
          message: 'El nombre no puede estar vacío' 
        });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim() || null;
    }
    
    // Actualizar equipo
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData
    });
    
    res.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Error al actualizar equipo' });
  }
}
```

### Ruta
```typescript
// En las rutas de teams (routes/teams.js o similar)
router.patch('/:id', authenticateToken, updateTeam);
```

## 3. Verificar Endpoint: GET /api/teams/:id/members

### Propósito
Obtener todos los miembros de un equipo con información básica de usuario.

### Verificación
Asegúrate de que este endpoint ya incluye la relación con `user`:

```typescript
async getTeamMembers(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Verificar que el usuario es miembro del equipo
    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: userId
      }
    });
    
    if (!userMembership) {
      return res.status(403).json({ 
        message: 'No tienes acceso a este equipo' 
      });
    }
    
    // Obtener todos los miembros
    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true, // IMPORTANTE: Incluir avatarUrl
            createdAt: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // LIDER primero
        { joinedAt: 'asc' }
      ]
    });
    
    res.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Error al obtener miembros' });
  }
}
```

## 4. Verificar Modelo User

### Asegúrate de que el modelo User incluya avatarUrl

```prisma
model User {
  id            String         @id @default(cuid())
  name          String
  email         String         @unique
  password      String
  role          Role           @default(ESTUDIANTE)
  avatarUrl     String?        // Campo para la URL del avatar
  profile       Profile?
  experiences   Experience[]
  certifications Certification[]
  userSkills    UserSkill[]
  teamMemberships TeamMember[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@map("users")
}
```

## 5. Middleware de Autenticación

Asegúrate de que todos estos endpoints estén protegidos con el middleware de autenticación:

```typescript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
```

## 6. Resumen de Rutas Necesarias

```
GET    /api/users/:id                    - Obtener usuario con perfil completo
PATCH  /api/teams/:id                    - Actualizar equipo (nombre, descripción)
GET    /api/teams/:id/members            - Obtener miembros del equipo
```

## 7. Permisos y Validaciones

### Actualizar Equipo (PATCH /api/teams/:id)
- Solo los LIDER del equipo pueden editar
- El nombre no puede estar vacío
- La descripción puede ser null/vacío

### Ver Miembros (GET /api/teams/:id/members)
- Cualquier miembro del equipo puede ver la lista
- Incluir avatarUrl en la respuesta

### Ver Perfil de Usuario (GET /api/users/:id)
- Debe estar autenticado
- Puede ver perfiles de miembros de su equipo
- No incluir contraseña en la respuesta

## Testing

Prueba los endpoints con estos casos:

```bash
# 1. Actualizar nombre del equipo
curl -X PATCH http://localhost:3000/api/teams/TEAM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuevo Nombre del Equipo"}'

# 2. Actualizar descripción del equipo
curl -X PATCH http://localhost:3000/api/teams/TEAM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Nueva descripción del equipo"}'

# 3. Obtener miembros del equipo
curl -X GET http://localhost:3000/api/teams/TEAM_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Obtener perfil completo de un usuario
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notas Adicionales

1. **Performance**: Considera agregar caché para los perfiles de usuarios si hay muchas consultas
2. **Paginación**: Si el equipo tiene muchos miembros, considera agregar paginación
3. **Validación**: Usa una librería como Joi o Zod para validar los datos de entrada
4. **Rate Limiting**: Considera agregar rate limiting para prevenir abuso de los endpoints

¡Listo! Con estas modificaciones, el backend estará preparado para soportar todas las nuevas funcionalidades del frontend.
