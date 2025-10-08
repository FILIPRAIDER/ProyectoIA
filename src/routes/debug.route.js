import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const router = Router();

/* ============================================================
   GET /debug/db-check
   Verificar estado de la conexión a base de datos
============================================================ */
router.get("/db-check", async (req, res) => {
  try {
    // 1. Test básico de conexión
    await prisma.$queryRaw`SELECT 1 as result`;

    // 2. Contar registros en tablas principales
    const [userCount, teamCount, inviteCount, notificationCount] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.teamInvite.count(),
      prisma.notification.count(),
    ]);

    // 3. Verificar que el usuario específico existe
    const testUser = await prisma.user.findUnique({
      where: { id: "cmghgdt9q0001gu6ze0fyd7hs" },
      select: { id: true, name: true, email: true, role: true }
    });

    // 4. Verificar que el equipo específico existe
    const testTeam = await prisma.team.findUnique({
      where: { id: "cmghgdtiv0002gu6zbruvqg4t" },
      select: { id: true, name: true }
    });

    return res.json({
      status: "ok",
      database: {
        connected: true,
        connectionString: process.env.DATABASE_URL ? "✅ Configurada" : "❌ No configurada",
        directUrl: process.env.DIRECT_DATABASE_URL ? "✅ Configurada" : "⚠️ No configurada (opcional)",
      },
      counts: {
        users: userCount,
        teams: teamCount,
        invites: inviteCount,
        notifications: notificationCount,
      },
      testData: {
        testUser: testUser ? {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role
        } : null,
        testTeam: testTeam ? {
          id: testTeam.id,
          name: testTeam.name
        } : null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL || "❌ No configurada",
        appBaseUrl: process.env.APP_BASE_URL || "⚠️ No configurada",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en db-check:", error);

    return res.status(503).json({
      status: "error",
      database: {
        connected: false,
        error: error.message,
        code: error.code,
        meta: error.meta,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
        hasFrontendUrl: !!process.env.FRONTEND_URL,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/* ============================================================
   GET /debug/test-invite
   Test completo del flujo de invitaciones
============================================================ */
router.get("/test-invite", async (req, res) => {
  try {
    const teamId = "cmghgdtiv0002gu6zbruvqg4t";
    const userId = "cmghgdt9q0001gu6ze0fyd7hs";

    // 1. Verificar equipo
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true }
    });

    if (!team) {
      return res.status(404).json({
        error: "Equipo no encontrado",
        teamId,
      });
    }

    // 2. Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
        userId,
      });
    }

    // 3. Verificar membresía
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        }
      },
      select: { role: true, joinedAt: true }
    });

    if (!membership) {
      return res.status(403).json({
        error: "Usuario no es miembro del equipo",
        userId,
        teamId,
      });
    }

    if (membership.role !== "LIDER") {
      return res.status(403).json({
        error: "Usuario no es LIDER",
        role: membership.role,
      });
    }

    // 4. Contar invitaciones
    const inviteCount = await prisma.teamInvite.count({
      where: { teamId }
    });

    return res.json({
      status: "ok",
      message: "Usuario puede enviar invitaciones",
      team: {
        id: team.id,
        name: team.name,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.role,
      },
      membership: {
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
      stats: {
        existingInvites: inviteCount,
      },
      correctPayload: {
        email: "nuevo@example.com",
        role: "MIEMBRO",
        byUserId: userId,
        message: "Te invito a unirte a nuestro equipo" // opcional
      }
    });
  } catch (error) {
    console.error("❌ Error en test-invite:", error);

    return res.status(500).json({
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
});

export default router;
