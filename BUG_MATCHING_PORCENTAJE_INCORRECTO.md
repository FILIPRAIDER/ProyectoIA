# 🐛 BUG CRÍTICO: Algoritmo de Matching Calcula Porcentajes Incorrectos

## 📊 EVIDENCIA DEL BUG

### Proyecto de Prueba
- **ID**: `cmglvowz40001n5jgan5tle1q`
- **Nombre**: "Tienda Online de Bufandas"
- **Total Skills**: 9
  1. React (L4)
  2. Node.js (L4)
  3. PostgreSQL (L4)
  4. Express.js (L3)
  5. Stripe (L3)
  6. Tailwind CSS (L3)
  7. PayPal (L3)
  8. Shopify API (L3)
  9. WooCommerce (L3)

---

## ❌ PROBLEMA DETECTADO

### Resultado del Matching con minCoverage 5%:

```json
{
  "teams": [
    {
      "name": "DevTeam FullStack",
      "skills": ["React", "Node.js", "PostgreSQL", "Express.js", "..."],
      "matchScore": 31.1  // ❌ INCORRECTO
    },
    {
      "name": "DevTeam Backend", 
      "skills": ["Node.js", "Express.js", "PostgreSQL", "..."],
      "matchScore": 23.3  // ❌ INCORRECTO
    },
    {
      "name": "DevTeam Frontend",
      "skills": ["React", "Tailwind CSS", "..."],
      "matchScore": 15.6  // ❌ INCORRECTO
    }
  ]
}
```

---

## 🔍 CÁLCULO MANUAL (CORRECTO)

### DevTeam FullStack
**Skills del proyecto que el equipo tiene:**
- ✅ React
- ✅ Node.js  
- ✅ PostgreSQL
- ✅ Express.js
- ❌ Stripe
- ❌ Tailwind CSS (aunque el equipo NO la tiene listada)
- ❌ PayPal
- ❌ Shopify API
- ❌ WooCommerce

**Cálculo correcto**: 4 skills / 9 total = **44.44%**
**Cálculo del backend**: **31.1%** ❌

**Diferencia**: -13.34 puntos porcentuales

---

### DevTeam Backend
**Skills del proyecto que el equipo tiene:**
- ❌ React
- ✅ Node.js
- ✅ PostgreSQL
- ✅ Express.js
- ❌ Stripe
- ❌ Tailwind CSS
- ❌ PayPal
- ❌ Shopify API
- ❌ WooCommerce

**Cálculo correcto**: 3 skills / 9 total = **33.33%**
**Cálculo del backend**: **23.3%** ❌

**Diferencia**: -10.03 puntos porcentuales

---

### DevTeam Frontend
**Skills del proyecto que el equipo tiene:**
- ✅ React
- ❌ Node.js
- ❌ PostgreSQL
- ❌ Express.js
- ❌ Stripe
- ✅ Tailwind CSS
- ❌ PayPal
- ❌ Shopify API
- ❌ WooCommerce

**Cálculo correcto**: 2 skills / 9 total = **22.22%**
**Cálculo del backend**: **15.6%** ❌

**Diferencia**: -6.62 puntos porcentuales

---

## 🔥 IMPACTO DEL BUG

### Comportamiento Actual:
1. **Con minCoverage 40%**: Devuelve 0 equipos
   - Debería devolver: DevTeam FullStack (44.44%)

2. **Con minCoverage 15%**: Devuelve 0 equipos  
   - Debería devolver: DevTeam FullStack (44.44%), DevTeam Backend (33.33%), DevTeam Frontend (22.22%)

3. **Con minCoverage 5%**: Devuelve 4 equipos
   - ✅ Correcto (pero con porcentajes calculados incorrectamente)

---

## 💡 HIPÓTESIS DEL PROBLEMA

El algoritmo podría estar:

### Opción A: Ponderando por Niveles (Incorrecto)
```typescript
// ❌ MAL: Considerar los niveles para el porcentaje de matching
const matchScore = (sumOfMatchingLevels / sumOfRequiredLevels) * 100
```

**El porcentaje de matching debe ser**: Skills coincidentes / Total skills del proyecto * 100

### Opción B: Contando Skills del Equipo (Incorrecto)
```typescript
// ❌ MAL: Dividir por total de skills del equipo
const matchScore = (matchingSkills / teamTotalSkills) * 100
```

**El porcentaje debe calcularse sobre el total del PROYECTO, no del equipo**

### Opción C: Bug en Query SQL/Prisma
Posiblemente el `COUNT()` o `JOIN` está mal construido y cuenta duplicados o no cuenta correctamente.

---

## ✅ SOLUCIÓN REQUERIDA

### Fórmula Correcta:
```typescript
const matchScore = (matchingSkills.length / projectSkills.length) * 100
```

### Pasos:
1. Para cada equipo, obtener `teamSkills[]`
2. Para el proyecto, obtener `projectSkills[]`
3. Encontrar intersección: `matchingSkills = teamSkills ∩ projectSkills`
4. Calcular: `matchScore = (matchingSkills.length / projectSkills.length) * 100`

**IMPORTANTE**: Los niveles (`levelRequired` vs `level`) se usan para FILTRAR equipos que no cumplen el nivel mínimo, pero NO para calcular el porcentaje de matching.

---

## 🧪 TESTING

### Caso de Prueba 1: DevTeam FullStack
```typescript
// Datos
const projectSkills = ["React", "Node.js", "PostgreSQL", "Express.js", "Stripe", "Tailwind CSS", "PayPal", "Shopify API", "WooCommerce"]
const teamSkills = ["React", "Node.js", "PostgreSQL", "Express.js", "TypeScript", "MongoDB", "Docker", ...]

// Matching
const matching = teamSkills.filter(s => projectSkills.includes(s))
// => ["React", "Node.js", "PostgreSQL", "Express.js"]

// Score
const matchScore = (matching.length / projectSkills.length) * 100
// => (4 / 9) * 100 = 44.44%

// Expected: 44.44%
// Actual: 31.1%
// ❌ FAIL
```

---

## 📍 UBICACIÓN DEL BUG

Archivo: `backend/src/services/matchingService.ts` (o equivalente)

Función: `calculateMatchScore()` o `getTeamCandidates()`

Query: Revisar el `SELECT` y `JOIN` que calcula el match percentage.

---

## ⏱️ PRIORIDAD: 🔴 CRÍTICA

Este bug bloquea completamente el flujo de matching. Los usuarios no pueden ver equipos recomendados porque los porcentajes están subestimados en ~10-13 puntos.

---

## 📝 PASOS PARA REPRODUCIR

1. Crear proyecto con 9 skills (React, Node.js, PostgreSQL, Express.js, Stripe, Tailwind CSS, PayPal, Shopify API, WooCommerce)
2. Verificar que existan equipos con al menos 4 de esas skills (DevTeam FullStack)
3. Llamar `POST /matching/projects/{id}/candidates` con `minCoverage: 0.4`
4. **Resultado actual**: 0 equipos
5. **Resultado esperado**: DevTeam FullStack (44.44%)

---

## ✅ CONFIRMACIÓN DE FIX

Una vez corregido:

```bash
# Test 1: minCoverage 40% debe devolver 1 equipo
POST /matching/projects/cmglvowz40001n5jgan5tle1q/candidates
{ "minCoverage": 0.4 }

# Expected:
{
  "teams": [
    {
      "name": "DevTeam FullStack",
      "matchScore": 44.44  // ✅ Corregido
    }
  ]
}

# Test 2: minCoverage 15% debe devolver 3 equipos
POST /matching/projects/cmglvowz40001n5jgan5tle1q/candidates
{ "minCoverage": 0.15 }

# Expected:
{
  "teams": [
    { "name": "DevTeam FullStack", "matchScore": 44.44 },
    { "name": "DevTeam Backend", "matchScore": 33.33 },
    { "name": "DevTeam Frontend", "matchScore": 22.22 }
  ]
}
```

---

**Fecha**: 2025-01-11
**Ambiente**: LOCAL (localhost:4001)
**Reportado por**: AI-API Team
