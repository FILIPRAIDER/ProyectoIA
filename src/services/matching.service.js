/**
 * Matching básico (equipos ↔ proyecto) ajustado a tu schema:
 * - Project.skills (ProjectSkill[]) con skill + levelRequired?
 * - Team.skills (TeamSkill[]) SIN level
 * - Nivel de equipo por skill = máx(UserSkill.level) entre sus miembros
 *
 * Pesos:
 *  - Skills: 0.70
 *  - Área:   0.15
 *  - Ciudad: 0.10
 *  - Dispon.:0.05
 */
export const WEIGHTS = {
  skills: 0.70,
  area: 0.15,
  city: 0.10,
  availability: 0.05,
};

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * @param {object} deps
 * @param {import('@prisma/client').PrismaClient} deps.prisma
 * @param {object} deps.project  // trae skills + skill
 * @param {number} deps.top
 * @param {boolean} [deps.explain=false]
 * @param {number} [deps.minCoverage=0]  // 0..1
 * @param {boolean} [deps.requireArea=false]
 * @param {boolean} [deps.requireCity=false]
 * @returns {{ candidates: any[], filtersApplied: string[] }}
 */
export async function computeCandidates({
  prisma,
  project,
  top,
  explain = false,
  minCoverage = 0,
  requireArea = false,
  requireCity = false,
}) {
  const filtersApplied = ["membersCount>0"];
  if (minCoverage > 0) filtersApplied.push(`minCoverage>=${minCoverage}`);
  if (requireArea) filtersApplied.push("requireArea");
  if (requireCity) filtersApplied.push("requireCity");

  // 1) Cargar equipos con miembros y skills (relación binaria)
  const teams = await prisma.team.findMany({
    include: {
      skills: { include: { skill: true } }, // TeamSkill[] + Skill
      members: { include: { user: true } }, // para availability y userSkills
    },
  });

  // 2) Requisitos del proyecto
  const reqSkills = (project.skills ?? []).map((ps) => ({
    id: ps.skillId,
    name: ps.skill?.name ?? "",
    required: ps.levelRequired ?? 1,
  }));
  const hasReqSkills = reqSkills.length > 0;
  if (hasReqSkills) filtersApplied.push("skillCoverage>0");

  // 3) Preload availability (MemberProfile) y userSkills (solo de skills requeridas)
  const allUserIds = Array.from(new Set(teams.flatMap((t) => t.members.map((m) => m.userId))));
  const reqSkillIds = reqSkills.map((s) => s.id);

  const [profiles, userSkills] = await Promise.all([
    prisma.memberProfile.findMany({
      where: { userId: { in: allUserIds } },
      select: { userId: true, availability: true },
    }),
    hasReqSkills
      ? prisma.userSkill.findMany({
          where: { userId: { in: allUserIds }, skillId: { in: reqSkillIds } },
          select: { userId: true, skillId: true, level: true },
        })
      : Promise.resolve([]),
  ]);

  const availabilityByUser = new Map(profiles.map((p) => [p.userId, p.availability ?? 0]));

  // Indexar userSkills por userId
  const userSkillsByUser = new Map();
  for (const us of userSkills) {
    const arr = userSkillsByUser.get(us.userId) ?? [];
    arr.push(us);
    userSkillsByUser.set(us.userId, arr);
  }

  // 4) Scoring por equipo
  const scored = teams.map((team) => {
    const members = team.members ?? [];

    // Disponibilidad promedio
    const memberAvail = members.map((m) => availabilityByUser.get(m.userId) ?? 0);
    const avgAvailability = memberAvail.length
      ? memberAvail.reduce((a, b) => a + b, 0) / memberAvail.length
      : 0;
    const availabilityNorm = Math.min(avgAvailability / 40, 1);

    // Nivel del equipo por skill requerida = máximo nivel entre sus miembros
    const teamMaxLevelBySkill = new Map();
    if (hasReqSkills && members.length > 0) {
      for (const m of members) {
        const skillsOfUser = userSkillsByUser.get(m.userId) ?? [];
        for (const us of skillsOfUser) {
          const prev = teamMaxLevelBySkill.get(us.skillId) ?? 0;
          if (us.level > prev) teamMaxLevelBySkill.set(us.skillId, us.level);
        }
      }
    }

    // Detalle de skills y cobertura
    const skillsDetail = reqSkills.map((req) => {
      const teamLevel = teamMaxLevelBySkill.get(req.id) ?? 0;
      let unit = 0;
      if (teamLevel >= req.required) unit = 1;
      else if (teamLevel === req.required - 1) unit = 0.5;
      return {
        skillId: req.id,
        skillName: req.name,
        required: req.required,
        teamLevel,
        unitScore: unit, // 0 | 0.5 | 1
      };
    });

    const coverage01 = hasReqSkills
      ? skillsDetail.reduce((a, s) => a + s.unitScore, 0) / reqSkills.length
      : 0;

    // Afinidad por área y ciudad (binario)
    const areaMatch = team.area && project.area && team.area === project.area ? 1 : 0;
    const cityMatch = team.city && project.city && team.city === project.city ? 1 : 0;

    // Score
    const score01 =
      WEIGHTS.skills * coverage01 +
      WEIGHTS.area * areaMatch +
      WEIGHTS.city * cityMatch +
      WEIGHTS.availability * availabilityNorm;

    const score = round1(score01 * 100); // 0–100, 1 decimal

    const teamSkillNames = (team.skills ?? []).map((ts) => ts.skill?.name).filter(Boolean);

    const missingSkills = reqSkills
      .filter((req) => (teamMaxLevelBySkill.get(req.id) ?? 0) === 0)
      .map((s) => s.name);

    const baseCandidate = {
      teamId: team.id,
      teamName: team.name,
      city: team.city,
      area: team.area,
      membersCount: members.length,
      avgAvailability: round1(avgAvailability),
      breakdown: {
        skillCoverage: round1(coverage01 * 100), // %
        areaMatch: areaMatch === 1,
        cityMatch: cityMatch === 1,
        availabilityNorm: round1(availabilityNorm * 100), // %
      },
      teamSkillNames,
      missingSkills,
      score,
      _coverage01: coverage01,  // interno para filtros
      _areaMatch: areaMatch === 1,
      _cityMatch: cityMatch === 1,
    };

    if (!explain) return baseCandidate;

    const contribution = {
      skills: round1(WEIGHTS.skills * coverage01 * 100),
      area: round1(WEIGHTS.area * areaMatch * 100),
      city: round1(WEIGHTS.city * cityMatch * 100),
      availability: round1(WEIGHTS.availability * availabilityNorm * 100),
    };

    return {
      ...baseCandidate,
      explain: {
        weights: WEIGHTS,
        contribution,
        skillsDetail,
        raw: { avgAvailability, normBase: 40 },
      },
    };
  });

  // 5) Filtros mínimos y avanzados
  let filtered = scored.filter((t) => t.membersCount > 0);

  if (hasReqSkills) {
    filtered = filtered.filter((t) => t.breakdown.skillCoverage > 0);
  }
  if (minCoverage > 0) {
    filtered = filtered.filter((t) => t._coverage01 >= minCoverage);
  }
  if (requireArea) {
    filtered = filtered.filter((t) => t._areaMatch);
  }
  if (requireCity) {
    filtered = filtered.filter((t) => t._cityMatch);
  }

  // 6) Orden y recorte
  filtered.sort((a, b) => b.score - a.score);

  // 7) Limpieza de campos internos
  filtered = filtered.map(({ _coverage01, _areaMatch, _cityMatch, ...rest }) => rest);

  return { candidates: filtered.slice(0, top), filtersApplied };
}
