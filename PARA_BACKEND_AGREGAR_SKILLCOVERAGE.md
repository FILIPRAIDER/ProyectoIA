# 📋 REQUEST: Agregar Campo `skillCoverage` al Response de Matching

**Fecha:** 11 de Enero, 2025  
**De:** AI-API Team  
**Para:** Backend Team  
**Prioridad:** 🟡 ALTA

---

## 🎯 PROBLEMA ACTUAL

El endpoint de matching devuelve solo `matchScore` (score ponderado), pero **necesitamos también el porcentaje real de skills** para poder:

1. **Mostrar al usuario**: "Este equipo tiene el 44% de las skills que necesitas"
2. **Filtrar correctamente**: Aplicar `minCoverage` basado en skills, no en score ponderado
3. **Explicar el matching**: Diferenciar entre score total y cobertura de skills

---

## 📊 RESPONSE ACTUAL vs REQUERIDO

### ❌ Response Actual:

```json
{
  "teams": [
    {
      "teamId": "cmglrywwu0008jhzkmknq8i8g",
      "name": "DevTeam FullStack",
      "skills": ["React", "Node.js", "PostgreSQL", "Express.js", "..."],
      "matchScore": 31.1,  // ⚠️ Score ponderado (70% skills + 15% área + 10% ciudad + 5% disponibilidad)
      "members": 4,
      "rating": null,
      "location": "Bogotá",
      "availability": "No disponible"
    }
  ]
}
```

### ✅ Response Requerido:

```json
{
  "teams": [
    {
      "teamId": "cmglrywwu0008jhzkmknq8i8g",
      "name": "DevTeam FullStack",
      "skills": ["React", "Node.js", "PostgreSQL", "Express.js", "..."],
      "matchScore": 31.1,        // Score ponderado total
      "skillCoverage": 44.44,    // 🆕 Porcentaje REAL de skills (4/9 = 44.44%)
      "members": 4,
      "rating": null,
      "location": "Bogotá",
      "availability": "No disponible"
    }
  ]
}
```

---

## 🔍 CÁLCULO DE `skillCoverage`

### Fórmula:

```typescript
skillCoverage = (matchedSkills.length / projectSkills.length) * 100
```

### Ejemplo Real (DevTeam FullStack):

**Proyecto:** "Tienda Online de Bufandas"
- Total skills: 9
- Skills requeridas: React, Node.js, PostgreSQL, Express.js, Stripe, Tailwind CSS, PayPal, Shopify API, WooCommerce

**Equipo:** DevTeam FullStack
- Skills del equipo: React, Node.js, PostgreSQL, Express.js, TypeScript, MongoDB, Docker, Git, Next.js, NestJS, Prisma, GraphQL, Flutter, Vue.js, Firestore, Expo, React Native

**Matching:**
```typescript
// Skills que coinciden
const matchedSkills = ["React", "Node.js", "PostgreSQL", "Express.js"]  // 4 skills

// Cálculo
skillCoverage = (4 / 9) * 100 = 44.44%
```

**Resultado:**
```json
{
  "matchScore": 31.1,       // 44.44% × 0.70 (weight de skills) = 31.1
  "skillCoverage": 44.44    // 🆕 Porcentaje puro de skills
}
```

---

## 📐 DIFERENCIA ENTRE `matchScore` Y `skillCoverage`

### `matchScore` (Score Ponderado):
- **Qué es:** Score total considerando múltiples factores
- **Fórmula:** `(skills × 0.70) + (area × 0.15) + (city × 0.10) + (availability × 0.05) × 100`
- **Uso:** Ordenar equipos por relevancia total
- **Rango:** 0-100 puntos

### `skillCoverage` (Porcentaje Real de Skills):
- **Qué es:** Porcentaje puro de skills coincidentes
- **Fórmula:** `(matchedSkills / totalSkills) × 100`
- **Uso:** Filtrar equipos y mostrar al usuario
- **Rango:** 0-100%

---

## 💡 USO EN AI-API

### Filtrado:

```typescript
// Usuario dice: "Necesito un equipo que tenga al menos el 40% de las skills"
const minSkillCoverage = 0.40;

// Request al backend
POST /matching/projects/{id}/candidates
Body: { minCoverage: 0.40 }

// El backend filtra por skillCoverage >= 40%
// NO por matchScore >= 40 (porque matchScore es ponderado)
```

### Presentación al Usuario:

```typescript
const team = response.teams[0];

// ✅ Con skillCoverage
"Encontré DevTeam FullStack que tiene el 44% de las skills que necesitas (React, Node.js, PostgreSQL, Express.js)"

// ❌ Sin skillCoverage
"Encontré DevTeam FullStack con un match del 31%" // ← Confuso, ¿31% de qué?
```

---

## 🔧 IMPLEMENTACIÓN SUGERIDA

### En el Backend (matchingService.ts):

```typescript
// Función de cálculo de matching
function calculateTeamMatch(team: Team, project: Project) {
  const projectSkills = project.skills;
  const teamSkills = team.skills;
  
  // 1. Calcular skills coincidentes
  const matchedSkills = projectSkills.filter(ps => 
    teamSkills.some(ts => 
      ts.skill.name === ps.skill.name && 
      ts.level >= ps.levelRequired
    )
  );
  
  // 2. Calcular coverage puro
  const skillCoverage = (matchedSkills.length / projectSkills.length) * 100;
  
  // 3. Calcular otros factores
  const areaMatch = team.area === project.area ? 1 : 0;
  const cityMatch = team.city === project.city ? 1 : 0;
  const availabilityNorm = normalizeAvailability(team.availability);
  
  // 4. Calcular score ponderado
  const matchScore = (
    (skillCoverage / 100) * WEIGHTS.skills +    // 70%
    areaMatch * WEIGHTS.area +                   // 15%
    cityMatch * WEIGHTS.city +                   // 10%
    availabilityNorm * WEIGHTS.availability      // 5%
  ) * 100;
  
  return {
    teamId: team.id,
    name: team.name,
    skills: matchedSkills.map(s => s.skill.name),
    matchScore,           // Score ponderado (ej: 31.1)
    skillCoverage,        // 🆕 Porcentaje puro (ej: 44.44)
    members: team.members.length,
    rating: team.averageRating,
    location: team.city,
    availability: team.availability
  };
}
```

---

## ✅ TESTING

### Test Case 1: DevTeam FullStack

**Input:**
- Proyecto: 9 skills (React, Node.js, PostgreSQL, Express.js, Stripe, Tailwind CSS, PayPal, Shopify API, WooCommerce)
- Equipo: DevTeam FullStack tiene React, Node.js, PostgreSQL, Express.js (4/9)

**Expected Output:**
```json
{
  "name": "DevTeam FullStack",
  "matchScore": 31.1,        // ✅ Score ponderado
  "skillCoverage": 44.44     // ✅ Porcentaje puro (4/9 × 100)
}
```

### Test Case 2: DevTeam Backend

**Input:**
- Proyecto: 9 skills
- Equipo: DevTeam Backend tiene Node.js, PostgreSQL, Express.js (3/9)

**Expected Output:**
```json
{
  "name": "DevTeam Backend",
  "matchScore": 23.3,        // ✅ Score ponderado
  "skillCoverage": 33.33     // ✅ Porcentaje puro (3/9 × 100)
}
```

### Test Case 3: DevTeam Frontend

**Input:**
- Proyecto: 9 skills
- Equipo: DevTeam Frontend tiene React, Tailwind CSS (2/9)

**Expected Output:**
```json
{
  "name": "DevTeam Frontend",
  "matchScore": 15.6,        // ✅ Score ponderado
  "skillCoverage": 22.22     // ✅ Porcentaje puro (2/9 × 100)
}
```

---

## 🎯 FILTRADO CON `minCoverage`

Con el nuevo campo `skillCoverage`, el filtrado debe ser:

```typescript
// ANTES (incorrecto):
const candidates = teams.filter(t => t.matchScore >= minCoverage * 100);
// Problema: matchScore es ponderado, no es el % real de skills

// DESPUÉS (correcto):
const candidates = teams.filter(t => t.skillCoverage >= minCoverage * 100);
// ✅ Filtra por el % real de skills coincidentes
```

### Ejemplo:

```typescript
// Request: minCoverage = 0.4 (40%)

// ❌ Filtrado ANTES por matchScore:
DevTeam FullStack: matchScore 31.1 < 40 → NO pasa
DevTeam Backend: matchScore 23.3 < 40 → NO pasa
// Resultado: 0 equipos (¡INCORRECTO!)

// ✅ Filtrado DESPUÉS por skillCoverage:
DevTeam FullStack: skillCoverage 44.44 >= 40 → SÍ pasa
DevTeam Backend: skillCoverage 33.33 < 40 → NO pasa
// Resultado: 1 equipo (¡CORRECTO!)
```

---

## 📦 BENEFICIOS

### 1. **Claridad para el Usuario**
```
"DevTeam FullStack tiene el 44% de las skills que necesitas"
```
vs
```
"DevTeam FullStack tiene un match del 31%"  // ← ¿31% de qué?
```

### 2. **Filtrado Correcto**
El `minCoverage` ahora filtra por % real de skills, no por score ponderado.

### 3. **Mejor Experiencia en Chat IA**
La IA puede decir:
- "Encontré 3 equipos que tienen al menos el 40% de las skills"
- "Este equipo tiene el 70% de lo que necesitas"
- "Aunque solo tiene el 30% de las skills, es el mejor disponible"

### 4. **Compatibilidad con Sistema Ponderado**
No elimina el `matchScore`, solo lo complementa. Ambos conviven:
- `matchScore`: Para ordenar equipos por relevancia total
- `skillCoverage`: Para filtrar y comunicar al usuario

---

## ⏱️ ESTIMACIÓN DE ESFUERZO

- **Complejidad:** 🟢 BAJA (agregar un campo calculado)
- **Tiempo estimado:** 30 minutos
- **Archivos a modificar:** 
  - `src/services/matchingService.ts` (agregar cálculo)
  - `src/routes/matching.route.ts` (incluir en response)
- **Testing:** 15 minutos (verificar con proyectos existentes)

**Total:** ~45 minutos

---

## 🔄 BACKWARD COMPATIBILITY

✅ **100% compatible hacia atrás**

Solo se **agrega** un campo nuevo (`skillCoverage`), no se modifica ni elimina nada existente. Sistemas que ya consumen el endpoint seguirán funcionando igual.

```json
// Clientes antiguos ignoran el nuevo campo
{
  "matchScore": 31.1,      // ← Siguen usando este
  "skillCoverage": 44.44   // ← Simplemente lo ignoran
}

// AI-API nuevo usa ambos
{
  "matchScore": 31.1,      // ← Para ordenar
  "skillCoverage": 44.44   // ← Para filtrar y mostrar
}
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Agregar cálculo de `skillCoverage` en `calculateTeamMatch()`
- [ ] Incluir campo en el response de `/matching/projects/:id/candidates`
- [ ] Ajustar filtrado: usar `skillCoverage >= minCoverage * 100`
- [ ] Probar con proyecto de 9 skills (cmglvowz40001n5jgan5tle1q)
- [ ] Verificar que `skillCoverage` sea 44.44% para DevTeam FullStack
- [ ] Actualizar documentación de la API
- [ ] Deployar a producción

---

## 🎯 PREGUNTA PARA EL BACKEND

**¿El filtrado actual (`minCoverage`) se aplica sobre `matchScore` o ya se aplica sobre el % real de skills?**

Si ya se aplica sobre skills (como indica el documento RESPUESTA_BUG_MATCHING_NO_ES_BUG.md), entonces solo falta **exponer ese valor en el response** para que AI-API pueda mostrarlo al usuario.

---

## 📎 REFERENCIA

- **Proyecto de prueba:** cmglvowz40001n5jgan5tle1q (Tienda Online de Bufandas)
- **Ambiente:** LOCAL (localhost:4001)
- **Documento relacionado:** RESPUESTA_BUG_MATCHING_NO_ES_BUG.md

---

**¿Podemos implementar esto?** 🙏

Agregar `skillCoverage` al response nos permitirá:
1. Comunicar claramente al usuario el % de match
2. Mejorar la experiencia del chat IA
3. Mantener el sistema ponderado actual (`matchScore`) para ordenamiento

**Gracias!** 🚀

---

**Contacto:** AI-API Team  
**Fecha límite sugerida:** Esta semana (prioridad alta)
