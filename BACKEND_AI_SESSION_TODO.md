# 🔴 PENDIENTE: Fix de Sesiones en Backend de IA

**Fecha:** 8 de Octubre 2025  
**Sistema:** Bridge-AI-API (Render)  
**Prioridad:** ALTA  
**Status:** ⏳ PENDIENTE (No es nuestro backend)

---

## 📋 Resumen del Problema

El **backend de IA** (Bridge-AI-API en Render) está **perdiendo las sesiones** del chat, causando que:
- ❌ El AI repite preguntas ya contestadas
- ❌ Los flags de proyecto se pierden
- ❌ Conversaciones no son coherentes

---

## ✅ Lo que YA está correcto

### Frontend (Nuestro) ✅
```typescript
// El frontend SÍ envía sessionId en cada request
const response = await sendChatMessage({
  message: content.trim(),
  sessionId: sessionId, // ← SE ENVÍA CORRECTAMENTE
  context: { userId, companyId, projectId }
});
```

**Verificado:** Frontend está implementado correctamente.

---

## ❌ Lo que falla

### Backend de IA (Bridge-AI-API) ❌

**Problema:** El backend está **ignorando o perdiendo** el `sessionId` recibido.

**Causas posibles:**
1. No lee el `sessionId` del `req.body`
2. Las sesiones se pierden en memoria (cold start de Render)
3. Las sesiones expiran muy rápido (<30 min)

---

## 🔧 Solución Propuesta (Para el Backend de IA)

### Solución Inmediata: Agregar Logs (15 min)

```javascript
// src/routes/chat.route.js
router.post('/chat', async (req, res) => {
  const { message, sessionId, context } = req.body;
  
  console.log('[Chat] Request:', { 
    hasSessionId: !!sessionId, 
    sessionId 
  });
  
  const session = sessionId 
    ? sessionManager.getSession(sessionId)  // Usar existente
    : sessionManager.createSession();       // Crear nueva
  
  console.log('[Chat] Using session:', {
    sessionId: session.id,
    isNew: sessionId !== session.id,
    messageCount: session.messages.length
  });
});
```

### Solución Permanente: Persistencia (4 horas)

**Opción 1:** PostgreSQL (ya tienen Neon)
**Opción 2:** Redis (Upstash - gratis)

Ambas sobreviven cold starts de Render.

---

## 📊 Impacto

### Antes (Ahora)
- ❌ Conversaciones incoherentes
- ❌ AI repite preguntas
- ❌ Flags de proyecto se pierden
- ❌ UX deficiente

### Después (Con el Fix)
- ✅ Conversaciones coherentes
- ✅ AI recuerda respuestas anteriores
- ✅ Flags persisten
- ✅ UX profesional

---

## 🎯 Acción Requerida

**Para el equipo de Bridge-AI-API:**

1. **Hoy:** Agregar logs para confirmar diagnóstico
2. **Esta semana:** Implementar persistencia (PostgreSQL o Redis)
3. **Testing:** Verificar que sesiones sobreviven cold starts

**Tiempo estimado:** 4-5 horas

---

## 📞 Coordinar con Bridge-AI

- Compartir documento: `BACKEND_SESSION_ISSUE_CONFIRMED.md`
- Solicitar logs del backend
- Testing coordinado frontend + backend
- Confirmar fix implementado

---

## ✅ Nuestro Trabajo (Core-API Backend)

**NO APLICA** - Este es un issue del backend de IA, no del nuestro.

Nuestro backend (Core-API) funciona correctamente:
- ✅ Endpoints de usuarios funcionan
- ✅ Sistema de skills sync implementado
- ✅ User-Company relation implementada
- ✅ Matching system operacional

---

**Documento creado:** 8 de Octubre 2025  
**Responsable:** Equipo Bridge-AI-API  
**Status:** Esperando implementación del fix
