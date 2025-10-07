import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed de Skills organizadas por categorías
 * Total: 150+ skills reales y actuales
 */

const skillsData = {
  // ==========================================
  // LENGUAJES DE PROGRAMACIÓN (30)
  // ==========================================
  'Lenguajes de Programación': [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C#',
    'C++',
    'Go',
    'Rust',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin',
    'Dart',
    'R',
    'Scala',
    'Elixir',
    'Clojure',
    'Haskell',
    'Lua',
    'Perl',
    'Shell/Bash',
    'PowerShell',
    'SQL',
    'HTML',
    'CSS',
    'SASS/SCSS',
    'Less',
    'Objective-C',
    'Assembly',
    'COBOL'
  ],

  // ==========================================
  // FRAMEWORKS FRONTEND (25)
  // ==========================================
  'Frontend Frameworks': [
    'React',
    'Vue.js',
    'Angular',
    'Svelte',
    'Next.js',
    'Nuxt.js',
    'Gatsby',
    'Remix',
    'Astro',
    'Solid.js',
    'Preact',
    'Alpine.js',
    'Ember.js',
    'Backbone.js',
    'jQuery',
    'Bootstrap',
    'Tailwind CSS',
    'Material-UI',
    'Ant Design',
    'Chakra UI',
    'Styled Components',
    'Emotion',
    'Bulma',
    'Foundation',
    'Semantic UI'
  ],

  // ==========================================
  // FRAMEWORKS BACKEND (20)
  // ==========================================
  'Backend Frameworks': [
    'Node.js',
    'Express.js',
    'NestJS',
    'Fastify',
    'Koa',
    'Django',
    'Flask',
    'FastAPI',
    'Spring Boot',
    'Laravel',
    'Ruby on Rails',
    'ASP.NET Core',
    'Phoenix',
    'Gin',
    'Echo',
    'Fiber',
    'Actix',
    'Rocket',
    'Symfony',
    'CodeIgniter'
  ],

  // ==========================================
  // BASES DE DATOS (25)
  // ==========================================
  'Bases de Datos': [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'SQLite',
    'Microsoft SQL Server',
    'Oracle Database',
    'MariaDB',
    'Cassandra',
    'DynamoDB',
    'Firebase Realtime Database',
    'Firestore',
    'Supabase',
    'PlanetScale',
    'CockroachDB',
    'Neo4j',
    'Elasticsearch',
    'InfluxDB',
    'TimescaleDB',
    'Couchbase',
    'RavenDB',
    'ArangoDB',
    'FaunaDB',
    'Prisma',
    'TypeORM'
  ],

  // ==========================================
  // MOBILE DEVELOPMENT (15)
  // ==========================================
  'Desarrollo Mobile': [
    'React Native',
    'Flutter',
    'Ionic',
    'Xamarin',
    'SwiftUI',
    'UIKit',
    'Jetpack Compose',
    'Android SDK',
    'Kotlin Multiplatform',
    'Cordova',
    'Capacitor',
    'NativeScript',
    'Expo',
    'React Navigation',
    'Firebase SDK'
  ],

  // ==========================================
  // DEVOPS & CLOUD (30)
  // ==========================================
  'DevOps & Cloud': [
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'Google Cloud Platform',
    'Terraform',
    'Ansible',
    'Jenkins',
    'GitLab CI/CD',
    'GitHub Actions',
    'CircleCI',
    'Travis CI',
    'ArgoCD',
    'Helm',
    'Prometheus',
    'Grafana',
    'ELK Stack',
    'Datadog',
    'New Relic',
    'Nginx',
    'Apache',
    'Linux Administration',
    'Bash Scripting',
    'CloudFormation',
    'Pulumi',
    'Vagrant',
    'Chef',
    'Puppet',
    'Consul',
    'Vault'
  ],

  // ==========================================
  // TESTING & QA (15)
  // ==========================================
  'Testing & QA': [
    'Jest',
    'Mocha',
    'Chai',
    'Cypress',
    'Selenium',
    'Playwright',
    'Puppeteer',
    'Testing Library',
    'JUnit',
    'PyTest',
    'Postman',
    'Insomnia',
    'k6',
    'JMeter',
    'Vitest'
  ],

  // ==========================================
  // DISEÑO & UI/UX (20)
  // ==========================================
  'Diseño & UI/UX': [
    'Figma',
    'Adobe XD',
    'Sketch',
    'InVision',
    'Photoshop',
    'Illustrator',
    'After Effects',
    'Premiere Pro',
    'Framer',
    'Principle',
    'Zeplin',
    'Marvel',
    'Balsamiq',
    'Axure',
    'Webflow',
    'Canva',
    'Design Systems',
    'Atomic Design',
    'User Research',
    'Wireframing'
  ],

  // ==========================================
  // DATA SCIENCE & AI (20)
  // ==========================================
  'Data Science & AI': [
    'Machine Learning',
    'Deep Learning',
    'TensorFlow',
    'PyTorch',
    'Scikit-learn',
    'Pandas',
    'NumPy',
    'Matplotlib',
    'Seaborn',
    'Jupyter',
    'Natural Language Processing',
    'Computer Vision',
    'OpenCV',
    'Keras',
    'XGBoost',
    'LightGBM',
    'Hugging Face',
    'LangChain',
    'OpenAI API',
    'Data Analysis'
  ],

  // ==========================================
  // HERRAMIENTAS DE DESARROLLO (20)
  // ==========================================
  'Herramientas de Desarrollo': [
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'VS Code',
    'IntelliJ IDEA',
    'WebStorm',
    'PyCharm',
    'Vim',
    'Emacs',
    'Sublime Text',
    'Atom',
    'Postman',
    'Insomnia',
    'Docker Desktop',
    'Figma',
    'Notion',
    'Jira',
    'Confluence',
    'Slack'
  ],

  // ==========================================
  // METODOLOGÍAS & SOFT SKILLS (15)
  // ==========================================
  'Metodologías & Soft Skills': [
    'Agile',
    'Scrum',
    'Kanban',
    'Lean',
    'Design Thinking',
    'TDD (Test-Driven Development)',
    'BDD (Behavior-Driven Development)',
    'CI/CD',
    'Pair Programming',
    'Code Review',
    'Liderazgo',
    'Comunicación',
    'Trabajo en Equipo',
    'Resolución de Problemas',
    'Pensamiento Crítico'
  ],

  // ==========================================
  // SEGURIDAD (15)
  // ==========================================
  'Seguridad': [
    'OWASP',
    'Penetration Testing',
    'Security Auditing',
    'OAuth 2.0',
    'JWT',
    'SSL/TLS',
    'Encryption',
    'Firewall Configuration',
    'Network Security',
    'Web Application Security',
    'API Security',
    'GDPR Compliance',
    'SOC 2',
    'Identity Management',
    'Zero Trust Architecture'
  ],

  // ==========================================
  // BLOCKCHAIN & WEB3 (10)
  // ==========================================
  'Blockchain & Web3': [
    'Solidity',
    'Ethereum',
    'Smart Contracts',
    'Web3.js',
    'Ethers.js',
    'Truffle',
    'Hardhat',
    'IPFS',
    'DeFi',
    'NFTs'
  ],

  // ==========================================
  // CMS & E-COMMERCE (10)
  // ==========================================
  'CMS & E-commerce': [
    'WordPress',
    'Shopify',
    'WooCommerce',
    'Magento',
    'Drupal',
    'Strapi',
    'Contentful',
    'Sanity',
    'Ghost',
    'PrestaShop'
  ],

  // ==========================================
  // OTROS (15)
  // ==========================================
  'Otros': [
    'GraphQL',
    'REST API',
    'WebSockets',
    'gRPC',
    'Microservices',
    'Serverless',
    'Event-Driven Architecture',
    'Message Queues',
    'RabbitMQ',
    'Apache Kafka',
    'Redis Queue',
    'WebRTC',
    'PWA',
    'SEO',
    'Analytics'
  ]
};

async function main() {
  console.log('🌱 Iniciando seed de Skills...\n');

  // Contador de skills creadas
  let totalCreated = 0;
  let totalSkipped = 0;

  // Iterar por cada categoría
  for (const [category, skills] of Object.entries(skillsData)) {
    console.log(`📁 Categoría: ${category}`);
    console.log(`   Skills a crear: ${skills.length}`);

    let categoryCreated = 0;
    let categorySkipped = 0;

    for (const skillName of skills) {
      try {
        // Intentar crear la skill
        await prisma.skill.create({
          data: {
            name: skillName
          }
        });
        categoryCreated++;
        totalCreated++;
      } catch (error) {
        // Si ya existe (unique constraint), skip
        if (error.code === 'P2002') {
          categorySkipped++;
          totalSkipped++;
        } else {
          console.error(`   ❌ Error creando "${skillName}":`, error.message);
        }
      }
    }

    console.log(`   ✅ Creadas: ${categoryCreated}`);
    console.log(`   ⏭️  Omitidas (ya existían): ${categorySkipped}\n`);
  }

  // Resumen final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completado!\n');
  console.log(`   ✅ Skills creadas: ${totalCreated}`);
  console.log(`   ⏭️  Skills omitidas: ${totalSkipped}`);
  console.log(`   📊 Total en base de datos: ${totalCreated + totalSkipped}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verificar total en DB
  const totalInDB = await prisma.skill.count();
  console.log(`✅ Verificación: ${totalInDB} skills en la base de datos\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('👋 Desconectado de la base de datos');
  })
  .catch(async (e) => {
    console.error('❌ Error en el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
