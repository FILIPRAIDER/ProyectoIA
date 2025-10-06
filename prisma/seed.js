import 'dotenv/config';
import {
  PrismaClient,
  Role,
  TeamRole,
  ApplicationStatus,
  InviteStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const SEED_TAG = '[SEED]';

const cities = ['Montería', 'Medellín', 'Bogotá', 'Cali', 'Barranquilla'];
const areas = ['IA aplicada', 'FinTech', 'AgroTech', 'EduTech', 'Salud'];

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// util pequeño para dividir en lotes
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function cryptoRandomHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes; i++)
    s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return s;
}

async function main() {
  console.log('>> Seed iniciado (bajo-concurrencia)');

  // ---------------------------------------------------------------------------
  // 1) SKILLS (createMany + skipDuplicates, luego leemos)
  // ---------------------------------------------------------------------------
  const skillNames = [
    'JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'Next.js',
    'PostgreSQL', 'Prisma', 'Python', 'Django', 'FastAPI', 'Machine Learning',
    'Deep Learning', 'NLP', 'Computer Vision', 'Data Engineering',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'Figma', 'UI/UX', 'Tailwind', 'Zod', 'Redis', 'RabbitMQ',
  ];

  await prisma.skill.createMany({
    data: skillNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
  console.log(`✓ Skills: ${skills.length}`);

  // ---------------------------------------------------------------------------
  // 2) USERS (secuencial)
  // ---------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin.seed@example.com' },
    update: { name: `${SEED_TAG} Admin`, role: Role.ADMIN },
    create: { name: `${SEED_TAG} Admin`, email: 'admin.seed@example.com', role: Role.ADMIN },
  });

  const empresariosEmails = ['empresario1.seed@example.com', 'empresario2.seed@example.com', 'empresario3.seed@example.com'];
  const empresarios = [];
  for (let i = 0; i < empresariosEmails.length; i++) {
    const email = empresariosEmails[i];
    const u = await prisma.user.upsert({
      where: { email },
      update: { name: `${SEED_TAG} Empresario ${i + 1}`, role: Role.EMPRESARIO },
      create: { name: `${SEED_TAG} Empresario ${i + 1}`, email, role: Role.EMPRESARIO },
    });
    empresarios.push(u);
  }

  const estudiantes = [];
  for (let i = 1; i <= 12; i++) {
    const email = `estudiante${i}.seed@example.com`;
    const u = await prisma.user.upsert({
      where: { email },
      update: { name: `${SEED_TAG} Estudiante ${i}`, role: Role.ESTUDIANTE },
      create: { name: `${SEED_TAG} Estudiante ${i}`, email, role: Role.ESTUDIANTE },
    });
    estudiantes.push(u);
  }
  console.log(`✓ Users: admin=1, empresarios=${empresarios.length}, estudiantes=${estudiantes.length}`);

  // ---------------------------------------------------------------------------
  // 3) PROFILES (secuencial)
  // ---------------------------------------------------------------------------
  for (const u of estudiantes) {
    await prisma.memberProfile.upsert({
      where: { userId: u.id },
      update: {
        headline: 'Desarrollador Fullstack | JS/TS',
        bio: 'Entusiasta del desarrollo web y la IA.',
        seniority: pick(['Junior', 'Semi Senior']),
        location: pick(cities),
        availability: rnd(10, 30),
        stack: 'React, Node, PostgreSQL',
        sector: pick(areas),
      },
      create: {
        userId: u.id,
        headline: 'Desarrollador Fullstack | JS/TS',
        bio: 'Entusiasta del desarrollo web y la IA.',
        seniority: pick(['Junior', 'Semi Senior']),
        location: pick(cities),
        availability: rnd(10, 30),
        stack: 'React, Node, PostgreSQL',
        sector: pick(areas),
      },
    });
  }
  console.log(`✓ Profiles: ${estudiantes.length}`);

  // ---------------------------------------------------------------------------
  // 4) USER SKILLS (mini-lotes de 1 usuario a la vez, secuencial)
  // ---------------------------------------------------------------------------
  for (const u of estudiantes) {
    // elige 4–7 skills
    const subs = shuffle(skills).slice(0, rnd(4, 7));
    for (const s of subs) {
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId: u.id, skillId: s.id } },
        update: { level: rnd(2, 5) },
        create: { userId: u.id, skillId: s.id, level: rnd(2, 5) },
      });
    }
  }
  console.log('✓ UserSkills asignadas');

  // ---------------------------------------------------------------------------
  // 5) TEAMS (creación secuencial)
  // ---------------------------------------------------------------------------
  const teams = [];
  for (let i = 1; i <= 5; i++) {
    const name = `${SEED_TAG} Team ${i}`;
    let team = await prisma.team.findFirst({ where: { name } });
    if (!team) {
      team = await prisma.team.create({
        data: { name, city: pick(cities), area: pick(areas) },
      });
    }
    teams.push(team);
  }
  console.log(`✓ Teams: ${teams.length}`);

  // Miembros (3 por equipo: 1 líder + 2 miembros)
  const pool = shuffle(estudiantes);
  let idx = 0;
  for (const t of teams) {
    const miembros = [pool[idx % pool.length], pool[(idx + 1) % pool.length], pool[(idx + 2) % pool.length]];
    idx += 3;

    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: t.id, userId: miembros[0].id } },
      update: { role: TeamRole.LIDER },
      create: { teamId: t.id, userId: miembros[0].id, role: TeamRole.LIDER },
    });

    for (const m of miembros.slice(1)) {
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: t.id, userId: m.id } },
        update: { role: TeamRole.MIEMBRO },
        create: { teamId: t.id, userId: m.id, role: TeamRole.MIEMBRO },
      });
    }

    // TeamSkills (3–5) derivadas de skills de sus miembros
    const memberSkills = await prisma.userSkill.findMany({
      where: { userId: { in: miembros.map((m) => m.id) } },
      include: { skill: true },
    });
    const uniqSkillIds = Array.from(new Set(memberSkills.map((ms) => ms.skillId)));
    const chosen = shuffle(uniqSkillIds).slice(0, Math.min(5, Math.max(3, uniqSkillIds.length)));
    for (const skillId of chosen) {
      try {
        await prisma.teamSkill.create({ data: { teamId: t.id, skillId } });
      } catch (_) {
        // P2002 si ya existe; ignoramos
      }
    }
  }
  console.log('✓ TeamMembers + TeamSkills');

  // ---------------------------------------------------------------------------
  // 6) COMPANIES (createMany + skipDuplicates, luego leemos)
  // ---------------------------------------------------------------------------
  const companiesData = [
    { name: `${SEED_TAG} AgroNova`,  sector: 'Agro',    website: 'https://agronova.example.com',  city: pick(cities), about: 'Soluciones para el agro.' },
    { name: `${SEED_TAG} EduPlus`,   sector: 'EduTech', website: 'https://eduplus.example.com',   city: pick(cities), about: 'Plataformas educativas.' },
    { name: `${SEED_TAG} FinX`,      sector: 'FinTech', website: 'https://finx.example.com',      city: pick(cities), about: 'Pagos y créditos.' },
    { name: `${SEED_TAG} SaludIA`,   sector: 'Salud',   website: 'https://saludia.example.com',   city: pick(cities), about: 'IA para salud.' },
  ];
  await prisma.company.createMany({ data: companiesData, skipDuplicates: true });
  const companies = await prisma.company.findMany({ where: { name: { startsWith: SEED_TAG } } });
  console.log(`✓ Companies: ${companies.length}`);

  // ---------------------------------------------------------------------------
  // 7) PROJECTS (+ ProjectSkills) – todo secuencial
  // ---------------------------------------------------------------------------
  function makeProject(company, title, areaHint) {
    return {
      companyId: company.id,
      title: `${SEED_TAG} ${title} (${company.name.split(' ')[1]})`,
      description: `Proyecto ${title} para ${company.name}.`,
      city: pick(cities),
      area: areaHint ?? pick(areas),
      status: pick(['OPEN', 'OPEN', 'OPEN', 'IN_PROGRESS', 'DONE']),
      budget: rnd(1000, 15000),
      startDate: new Date(Date.now() - rnd(10, 90) * 86400000),
      endDate: null,
    };
  }

  const projectPayloads = [
    makeProject(companies[0], 'Monitoreo de cultivos con visión', 'AgroTech'),
    makeProject(companies[1], 'Tutor inteligente para cursos', 'EduTech'),
    makeProject(companies[2], 'Analítica de fraude en pagos', 'FinTech'),
    makeProject(companies[3], 'Clasificación de imágenes médicas', 'Salud'),
    makeProject(companies[1], 'Marketplace de microcursos', 'EduTech'),
    makeProject(companies[2], 'Score de riesgo crediticio', 'FinTech'),
  ];

  const projects = [];
  for (const p of projectPayloads) {
    let prj = await prisma.project.findFirst({
      where: { companyId: p.companyId, title: p.title },
    });
    if (!prj) prj = await prisma.project.create({ data: p });
    projects.push(prj);

    const reqSkills = shuffle(skills).slice(0, rnd(3, 5));
    for (const s of reqSkills) {
      await prisma.projectSkill.upsert({
        where: { projectId_skillId: { projectId: prj.id, skillId: s.id } },
        update: { levelRequired: rnd(2, 4) },
        create: { projectId: prj.id, skillId: s.id, levelRequired: rnd(2, 4) },
      });
    }
  }
  console.log(`✓ Projects: ${projects.length} + ProjectSkills`);

  // ---------------------------------------------------------------------------
  // 8) Team Applications – secuencial
  // ---------------------------------------------------------------------------
  for (const prj of projects) {
    const teamsSubset = shuffle(teams).slice(0, rnd(2, 3));
    for (const t of teamsSubset) {
      const id = `${prj.id}_${t.id}`; // id estable
      const status = pick([ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]);
      await prisma.teamApplication.upsert({
        where: { id },
        update: {
          status,
          message: `Aplicación de ${t.name} a ${prj.title}`,
          decidedAt: status === ApplicationStatus.PENDING ? null : new Date(),
          decidedBy: status === ApplicationStatus.PENDING ? null : admin.id,
        },
        create: {
          id,
          projectId: prj.id,
          teamId: t.id,
          status,
          message: `Aplicación de ${t.name} a ${prj.title}`,
          decidedAt: status === ApplicationStatus.PENDING ? null : new Date(),
          decidedBy: status === ApplicationStatus.PENDING ? null : admin.id,
        },
      });
    }
  }
  console.log('✓ TeamApplications');

  // ---------------------------------------------------------------------------
  // 9) Team Assignments – secuencial (si hay ACCEPTED)
  // ---------------------------------------------------------------------------
  for (const prj of projects.slice(0, 2)) {
    const acc = await prisma.teamApplication.findFirst({
      where: { projectId: prj.id, status: ApplicationStatus.ACCEPTED },
    });
    if (acc) {
      await prisma.teamAssignment.upsert({
        where: { projectId_teamId: { projectId: prj.id, teamId: acc.teamId } },
        update: {},
        create: { projectId: prj.id, teamId: acc.teamId },
      });
    }
  }
  console.log('✓ TeamAssignments');

  // ---------------------------------------------------------------------------
  // 10) Team Invites – secuencial
  // ---------------------------------------------------------------------------
  const anyTeam = teams[0];
  const leader = await prisma.teamMember.findFirst({
    where: { teamId: anyTeam.id, role: TeamRole.LIDER },
  });
  if (leader) {
    for (const email of ['invite1.seed@example.com', 'invite2.seed@example.com']) {
      const existing = await prisma.teamInvite.findFirst({
        where: { teamId: anyTeam.id, email, status: InviteStatus.PENDING },
      });
      if (!existing) {
        await prisma.teamInvite.create({
          data: {
            teamId: anyTeam.id,
            email,
            role: TeamRole.MIEMBRO,
            token: cryptoRandomHex(32),
            status: InviteStatus.PENDING,
            invitedBy: leader.userId,
            message: '¡Únete a nuestro equipo para un nuevo proyecto!',
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        });
      }
    }
  }
  console.log('✓ TeamInvites (PENDING)');

  // ---------------------------------------------------------------------------
  // Resumen
  // ---------------------------------------------------------------------------
// ... justo antes del resumen, añade una pequeña pausa
await new Promise((r) => setTimeout(r, 200));

// --- Resumen SECUENCIAL (sin Promise.all) ---
const users        = await prisma.user.count();
const teamCount    = await prisma.team.count();
const companyCount = await prisma.company.count();
const projectCount = await prisma.project.count();
const appCount     = await prisma.teamApplication.count();
const assignCount  = await prisma.teamAssignment.count();
const inviteCount  = await prisma.teamInvite.count();

console.log('>> Resumen:', {
  users,
  teams: teamCount,
  companies: companyCount,
  projects: projectCount,
  applications: appCount,
  assignments: assignCount,
  invites: inviteCount,
});


  console.log('>> Seed finalizado');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
