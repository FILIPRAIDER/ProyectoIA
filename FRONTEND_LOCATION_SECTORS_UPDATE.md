# 🚀 BACKEND: Nueva Implementación de Ubicación y Sectores

**Fecha:** 7 de octubre, 2025  
**Versión Backend:** 2.0  
**Breaking Changes:** ⚠️ SÍ (campo `sector` migrado a relación)

---

## 📋 Resumen Ejecutivo

Se ha realizado una **reestructuración completa** del sistema de ubicación y sectores para mejorar la experiencia de usuario y la consistencia de datos:

### ✅ Cambios Principales:

1. **Sectores normalizados** → Tabla `Sector` con 30 sectores predefinidos
2. **Ubicación mejorada** → Campos separados: `country`, `city`, `address`
3. **Nuevos endpoints** → `/meta/sectors`, `/meta/cities/:countryCode`
4. **610 skills** → Base de datos completa con skills profesionales

---

## 🗄️ Cambios en el Modelo de Datos

### MemberProfile (Antes)
```typescript
interface MemberProfile {
  // ... otros campos
  location?: string;  // ❌ Texto libre
  sector?: string;    // ❌ Texto libre
}
```

### MemberProfile (Ahora)
```typescript
interface MemberProfile {
  // ... otros campos
  
  // UBICACIÓN MEJORADA
  country?: string;   // ✅ Código ISO: "CO", "US", "MX", etc.
  city?: string;      // ✅ Ciudad desde lista predefinida
  address?: string;   // ✅ Dirección completa (opcional)
  location?: string;  // ⚠️  DEPRECATED (mantener temporalmente)
  
  // SECTOR NORMALIZADO
  sectorId?: string;  // ✅ FK a tabla Sector
  sector?: Sector;    // ✅ Relación con datos completos
}

interface Sector {
  id: string;
  name: string;         // slug: "technology", "finance", etc.
  nameEs: string;       // "Tecnología", "Finanzas", etc.
  nameEn: string;       // "Technology", "Finance", etc.
  description?: string;
  icon?: string;        // emoji: "💻", "💰", etc.
  order: number;
  active: boolean;
}
```

---

## 🔌 Nuevos Endpoints

### 1. GET /meta/sectors

**Descripción:** Lista de sectores profesionales desde base de datos

**Respuesta:**
```json
{
  "ok": true,
  "sectors": [
    {
      "id": "cm2abc123...",
      "name": "technology",
      "nameEs": "Tecnología",
      "nameEn": "Technology",
      "description": "Desarrollo de software, hardware, servicios tecnológicos e innovación digital",
      "icon": "💻"
    },
    {
      "id": "cm2abc456...",
      "name": "finance",
      "nameEs": "Finanzas",
      "nameEn": "Finance",
      "description": "Banca, seguros, inversiones, fintech y servicios financieros",
      "icon": "💰"
    }
    // ... 28 sectores más
  ],
  "total": 30
}
```

**Uso en React:**
```typescript
const { data } = useQuery({
  queryKey: ['sectors'],
  queryFn: async () => {
    const res = await fetch('https://proyectoia-backend.onrender.com/meta/sectors');
    return res.json();
  },
});

// En el select
<Select>
  {data?.sectors.map(sector => (
    <option key={sector.id} value={sector.id}>
      {sector.icon} {sector.nameEs}
    </option>
  ))}
</Select>
```

---

### 2. GET /meta/countries

**Descripción:** Lista completa de países (desde RestCountries API)

**Respuesta:**
```json
[
  {
    "code": "CO",
    "name": "Colombia",
    "dialCode": "+57",
    "flag": "🇨🇴"
  },
  {
    "code": "US",
    "name": "United States",
    "dialCode": "+1",
    "flag": "🇺🇸"
  }
  // ... ~200+ países
]
```

**Uso en React:**
```typescript
const { data: countries } = useQuery({
  queryKey: ['countries'],
  queryFn: async () => {
    const res = await fetch('https://proyectoia-backend.onrender.com/meta/countries');
    return res.json();
  },
});

// En el select
<Select name="country" onChange={(e) => setCitiesFor(e.target.value)}>
  {countries?.map(country => (
    <option key={country.code} value={country.code}>
      {country.flag} {country.name}
    </option>
  ))}
</Select>
```

---

### 3. GET /meta/cities/:countryCode

**Descripción:** Lista de ciudades principales por país

**Parámetros:**
- `countryCode` (path): Código ISO del país (ej: "CO", "US", "MX")

**Ejemplo:**
```bash
GET /meta/cities/CO
```

**Respuesta:**
```json
{
  "ok": true,
  "countryCode": "CO",
  "cities": [
    "Bogotá",
    "Medellín",
    "Cali",
    "Barranquilla",
    "Cartagena"
    // ... 15 ciudades más
  ],
  "total": 20
}
```

**Uso en React:**
```typescript
const [selectedCountry, setSelectedCountry] = useState<string>('');

const { data: cities } = useQuery({
  queryKey: ['cities', selectedCountry],
  queryFn: async () => {
    const res = await fetch(`https://proyectoia-backend.onrender.com/meta/cities/${selectedCountry}`);
    return res.json();
  },
  enabled: !!selectedCountry, // Solo consultar si hay país seleccionado
});

// En el select de ciudades
<Select name="city" disabled={!selectedCountry}>
  {cities?.cities.map(city => (
    <option key={city} value={city}>
      {city}
    </option>
  ))}
</Select>
```

---

### 4. GET /meta/stacks (Sin cambios)

**Descripción:** Lista de stacks tecnológicos comunes

**Respuesta:**
```json
{
  "ok": true,
  "stacks": [
    "MERN (MongoDB, Express, React, Node.js)",
    "MEAN (MongoDB, Express, Angular, Node.js)",
    "LAMP (Linux, Apache, MySQL, PHP)"
    // ... 12 más
  ],
  "total": 15
}
```

---

## 🔄 Migración del Frontend

### Paso 1: Actualizar Interfaces TypeScript

```typescript
// src/types/profile.ts

export interface Sector {
  id: string;
  name: string;       // slug
  nameEs: string;
  nameEn: string;
  description?: string;
  icon?: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  seniority?: string;
  
  // UBICACIÓN (NUEVO)
  country?: string;   // Código ISO
  city?: string;      // Nombre de ciudad
  address?: string;   // Dirección completa
  
  availability?: number;
  stack?: string;
  
  // SECTOR (ACTUALIZADO)
  sectorId?: string;  // FK
  sector?: Sector;    // Relación poblada
  
  // ... resto de campos
}

export interface Country {
  code: string;       // ISO alpha-2
  name: string;
  dialCode: string;
  flag: string;       // emoji
}

export interface CitiesResponse {
  ok: boolean;
  countryCode: string;
  cities: string[];
  total: number;
}
```

---

### Paso 2: Eliminar Constantes Locales de Sectores

**ANTES** (eliminar):
```typescript
// ❌ src/constants/sectors.ts - ELIMINAR ESTE ARCHIVO
export const SECTORS = [
  "Tecnología",
  "Finanzas",
  // ...
];
```

**AHORA** (usar desde API):
```typescript
// ✅ src/hooks/useSectors.ts
import { useQuery } from '@tanstack/react-query';

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/meta/sectors`);
      if (!res.ok) throw new Error('Failed to fetch sectors');
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hora (los sectores no cambian frecuentemente)
  });
}
```

---

### Paso 3: Crear Hooks para Ubicación

```typescript
// src/hooks/useCountries.ts
import { useQuery } from '@tanstack/react-query';

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/meta/countries`);
      if (!res.ok) throw new Error('Failed to fetch countries');
      return res.json();
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

// src/hooks/useCities.ts
import { useQuery } from '@tanstack/react-query';

export function useCities(countryCode?: string) {
  return useQuery({
    queryKey: ['cities', countryCode],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/meta/cities/${countryCode}`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    enabled: !!countryCode,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}
```

---

### Paso 4: Actualizar Formularios

```typescript
// src/components/ProfileForm.tsx
import { useSectors } from '@/hooks/useSectors';
import { useCountries } from '@/hooks/useCountries';
import { useCities } from '@/hooks/useCities';

export function ProfileForm() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  const { data: sectorsData } = useSectors();
  const { data: countries } = useCountries();
  const { data: citiesData } = useCities(selectedCountry);

  return (
    <form>
      {/* Sector */}
      <div>
        <label>Sector</label>
        <select name="sectorId" required>
          <option value="">Selecciona un sector</option>
          {sectorsData?.sectors.map(sector => (
            <option key={sector.id} value={sector.id}>
              {sector.icon} {sector.nameEs}
            </option>
          ))}
        </select>
      </div>

      {/* País */}
      <div>
        <label>País</label>
        <select 
          name="country" 
          onChange={(e) => setSelectedCountry(e.target.value)}
          required
        >
          <option value="">Selecciona un país</option>
          {countries?.map(country => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ciudad */}
      <div>
        <label>Ciudad</label>
        <select 
          name="city" 
          disabled={!selectedCountry}
          required
        >
          <option value="">Selecciona una ciudad</option>
          {citiesData?.cities.map(city => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {!selectedCountry && (
          <p className="text-sm text-gray-500">
            Primero selecciona un país
          </p>
        )}
      </div>

      {/* Dirección (opcional) */}
      <div>
        <label>Dirección (opcional)</label>
        <input 
          type="text" 
          name="address" 
          placeholder="Ej: Calle 123 #45-67, Apartamento 102"
        />
      </div>
    </form>
  );
}
```

---

### Paso 5: Actualizar Llamadas a la API

**ANTES:**
```typescript
// ❌ Enviando sector como string
const profile = {
  ...otherFields,
  sector: "Tecnología", // texto libre
  location: "Bogotá, Colombia", // texto libre
};
```

**AHORA:**
```typescript
// ✅ Enviando sectorId y ubicación estructurada
const profile = {
  ...otherFields,
  sectorId: "cm2abc123...", // ID del sector
  country: "CO",            // Código ISO
  city: "Bogotá",           // Ciudad desde lista
  address: "Calle 123",     // Dirección opcional
};
```

---

## 📊 Endpoints Actualizados

### GET /users/:userId/profile

**Respuesta incluye sector poblado:**
```json
{
  "id": "cm2...",
  "userId": "user123",
  "headline": "Full Stack Developer",
  "seniority": "Senior",
  
  "country": "CO",
  "city": "Bogotá",
  "address": "Calle 123 #45-67",
  
  "sectorId": "cm2sector123",
  "sector": {
    "id": "cm2sector123",
    "name": "technology",
    "nameEs": "Tecnología",
    "nameEn": "Technology",
    "icon": "💻",
    "description": "Desarrollo de software..."
  },
  
  "stack": "MERN (MongoDB, Express, React, Node.js)",
  "availability": 40
}
```

---

## ⚠️ Breaking Changes y Retrocompatibilidad

### Campo `sector` (String → Relación)

**Migración automática:**
- El campo viejo `sector` (string) ya NO existe en el schema
- Ahora es `sectorId` (FK) → `sector` (relación)

**Acción requerida:**
1. ✅ Actualizar todos los formularios para usar `sectorId`
2. ✅ Actualizar interfaces TypeScript
3. ✅ Mostrar `profile.sector.nameEs` en lugar de `profile.sector`

### Campo `location` (Deprecated)

**Estado actual:**
- `location` sigue existiendo pero está deprecated
- Se recomienda usar `country`, `city`, `address`

**Acción requerida:**
1. ✅ Usar campos separados en nuevos formularios
2. ⏳ Mantener `location` solo para perfiles antiguos (display)
3. ⏳ Mostrar migración sugerida a usuarios: "Actualiza tu ubicación"

---

## 🧪 Testing de Endpoints

### Usando cURL:

```bash
# Sectores
curl https://proyectoia-backend.onrender.com/meta/sectors

# Países
curl https://proyectoia-backend.onrender.com/meta/countries

# Ciudades de Colombia
curl https://proyectoia-backend.onrender.com/meta/cities/CO

# Ciudades de México
curl https://proyectoia-backend.onrender.com/meta/cities/MX

# Stacks
curl https://proyectoia-backend.onrender.com/meta/stacks
```

### Usando fetch en consola del navegador:

```javascript
// Sectores
fetch('https://proyectoia-backend.onrender.com/meta/sectors')
  .then(r => r.json())
  .then(console.log);

// Ciudades de Colombia
fetch('https://proyectoia-backend.onrender.com/meta/cities/CO')
  .then(r => r.json())
  .then(console.log);
```

---

## 📦 Datos Completos

### Sectores (30 total):
💻 Tecnología, 💰 Finanzas, 🏥 Salud, 📚 Educación, 🛒 E-commerce, 🏪 Retail, 🏭 Manufactura, 🏗️ Construcción, 🏠 Bienes Raíces, 🚚 Transporte y Logística, ⚡ Energía, 🌾 Agricultura, 🍔 Alimentos y Bebidas, 🏨 Hotelería y Turismo, 🎬 Entretenimiento, 🎮 Gaming y eSports, 📡 Telecomunicaciones, 📢 Marketing y Publicidad, 💼 Consultoría, ⚖️ Legal, 🤝 ONGs, 🏛️ Gobierno y Sector Público, ⚽ Deportes y Fitness, 👗 Moda y Textil, 🚗 Automotriz, ✈️ Aeroespacial, 🧬 Biotecnología, 🛡️ Seguros, 🔒 Ciberseguridad, 📦 Otro

### Skills (610 total):
Incluye: React, Vue.js, Angular, Next.js, TypeScript, Python, Django, Node.js, Express.js, PostgreSQL, MongoDB, Docker, Kubernetes, AWS, Azure, Machine Learning, TensorFlow, y 593 más...

### Países con Ciudades:
- 🇨🇴 Colombia: 20 ciudades
- 🇺🇸 Estados Unidos: 20 ciudades
- 🇲🇽 México: 20 ciudades
- 🇦🇷 Argentina: 15 ciudades
- 🇧🇷 Brasil: 15 ciudades
- 🇨🇱 Chile: 15 ciudades
- 🇵🇪 Perú: 15 ciudades
- 🇪🇨 Ecuador: 15 ciudades
- 🇻🇪 Venezuela: 15 ciudades
- 🇪🇸 España: 20 ciudades
- Y más países...

---

## ✅ Checklist de Integración Frontend

### Configuración Inicial
- [ ] Actualizar interfaces TypeScript (`Sector`, `MemberProfile`, `Country`, `CitiesResponse`)
- [ ] Crear hooks (`useSectors`, `useCountries`, `useCities`)
- [ ] Eliminar constantes locales de sectores (`src/constants/sectors.ts`)

### Formularios
- [ ] Actualizar formulario de perfil con nuevos campos
- [ ] Implementar cascada País → Ciudades
- [ ] Cambiar `sector` (string) → `sectorId` (select)
- [ ] Agregar validación de campos requeridos

### Visualización
- [ ] Mostrar `sector.nameEs` con icono `sector.icon`
- [ ] Mostrar ubicación formateada: "🇨🇴 Bogotá, Colombia"
- [ ] Agregar tooltip con `sector.description`

### Migración de Datos
- [ ] Detectar perfiles con `location` antiguo
- [ ] Mostrar banner: "Actualiza tu ubicación para mejor visibilidad"
- [ ] Permitir edición fácil para migrar

### Testing
- [ ] Probar formulario de creación de perfil
- [ ] Probar edición de perfil existente
- [ ] Verificar cascada país → ciudades
- [ ] Verificar que sectores se cargan correctamente
- [ ] Testing con diferentes países

---

## 🆘 Soporte y Preguntas

Si tienes dudas o encuentras algún problema:

1. **Endpoints no funcionan:** Verifica que estés usando la URL correcta:
   ```
   https://proyectoia-backend.onrender.com/meta/...
   ```

2. **Sectores no aparecen:** Verifica que el backend esté desplegado y la BD tenga los 30 sectores.

3. **Ciudades no cargan:** Asegúrate de pasar el código ISO correcto (mayúsculas): `"CO"` no `"co"`

4. **Errores de tipo TypeScript:** Actualiza las interfaces según este documento.

---

**Contacto Backend:** Disponible para resolver dudas sobre implementación  
**Fecha de Deploy:** 7 de octubre, 2025  
**Próximo deploy a producción:** Pendiente de commit y push
