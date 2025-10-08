// Seed completo: Skills + Sectores
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 280+ Skills profesionales organizadas por categorías
const SKILLS = [
  // Frontend Frameworks & Libraries
  'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Remix', 'Astro',
  'Qwik', 'SolidJS', 'Preact', 'Alpine.js', 'HTMX', 'Lit',
  
  // Frontend Languages & Core
  'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'SASS', 'SCSS', 'Less',
  
  // CSS Frameworks & UI
  'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Ant Design', 'Chakra UI',
  'Semantic UI', 'Bulma', 'Foundation', 'Mantine', 'DaisyUI', 'shadcn/ui',
  
  // State Management
  'Redux', 'Zustand', 'MobX', 'Recoil', 'Jotai', 'XState', 'Pinia',
  
  // Data Fetching
  'React Query', 'SWR', 'Apollo Client', 'Relay', 'RTK Query', 'tRPC',
  
  // Build Tools
  'Webpack', 'Vite', 'Rollup', 'Parcel', 'esbuild', 'Turbopack', 'SWC',
  
  // Backend - Node.js
  'Node.js', 'Express.js', 'NestJS', 'Fastify', 'Koa', 'Hapi', 'AdonisJS',
  'Loopback', 'Sails.js', 'Meteor',
  
  // Backend - Python
  'Python', 'Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Bottle',
  'CherryPy', 'web2py',
  
  // Backend - Java
  'Java', 'Spring Boot', 'Spring Cloud', 'Spring Security', 'Hibernate',
  'Quarkus', 'Micronaut', 'Vert.x', 'Play Framework',
  
  // Backend - .NET
  'C#', '.NET Core', 'ASP.NET', 'ASP.NET Core', 'Entity Framework',
  'Blazor', 'SignalR',
  
  // Backend - PHP
  'PHP', 'Laravel', 'Symfony', 'CodeIgniter', 'Yii', 'CakePHP',
  'Slim', 'Phalcon', 'Zend',
  
  // Backend - Ruby
  'Ruby', 'Ruby on Rails', 'Sinatra', 'Hanami', 'Grape',
  
  // Backend - Go
  'Go', 'Gin', 'Echo', 'Fiber', 'Beego', 'Revel', 'Buffalo',
  
  // Backend - Rust
  'Rust', 'Actix', 'Rocket', 'Warp', 'Axum',
  
  // Backend - Others
  'Elixir', 'Phoenix', 'Scala', 'Play', 'Kotlin', 'Ktor',
  
  // Databases - SQL
  'PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'Microsoft SQL Server',
  'Oracle Database', 'CockroachDB', 'TimescaleDB',
  
  // Databases - NoSQL
  'MongoDB', 'Redis', 'Cassandra', 'Couchbase', 'Neo4j',
  'ArangoDB', 'RavenDB', 'InfluxDB', 'ScyllaDB',
  
  // Cloud Databases
  'Amazon DynamoDB', 'Amazon RDS', 'Azure Cosmos DB', 'Google Cloud SQL',
  'Firebase Realtime Database', 'Firestore', 'Supabase', 'PlanetScale',
  'Neon', 'Railway',
  
  // Search & Analytics
  'Elasticsearch', 'Solr', 'Algolia', 'Meilisearch', 'Typesense',
  
  // ORMs & Query Builders
  'Prisma', 'TypeORM', 'Sequelize', 'Mongoose', 'Drizzle ORM',
  'Knex.js', 'Bookshelf.js', 'Objection.js', 'Waterline',
  
  // GraphQL
  'GraphQL', 'Apollo Server', 'GraphQL Yoga', 'Hasura', 'Postgraphile',
  'Relay', 'urql', 'Strawberry',
  
  // API & Protocols
  'REST API', 'gRPC', 'WebSocket', 'Socket.io', 'MQTT', 'AMQP',
  'Server-Sent Events', 'WebRTC',
  
  // API Documentation
  'OpenAPI', 'Swagger', 'Postman', 'Insomnia', 'Stoplight', 'Redoc',
  
  // Message Brokers
  'RabbitMQ', 'Apache Kafka', 'Redis Pub/Sub', 'Amazon SQS', 'NATS',
  'Apache Pulsar', 'ZeroMQ',
  
  // DevOps - Containerization
  'Docker', 'Docker Compose', 'Podman', 'containerd',
  
  // DevOps - Orchestration
  'Kubernetes', 'Docker Swarm', 'Nomad', 'Apache Mesos',
  'Helm', 'Kustomize', 'ArgoCD', 'Flux',
  
  // Cloud Providers
  'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud Platform', 'GCP',
  'DigitalOcean', 'Linode', 'Vultr', 'Hetzner', 'OVHcloud',
  'Alibaba Cloud', 'IBM Cloud', 'Oracle Cloud',
  
  // AWS Services
  'Amazon EC2', 'Amazon S3', 'AWS Lambda', 'Amazon ECS', 'Amazon EKS',
  'Amazon RDS', 'Amazon CloudFront', 'Amazon API Gateway', 'AWS Amplify',
  
  // Azure Services
  'Azure Functions', 'Azure App Service', 'Azure DevOps', 'Azure AKS',
  
  // GCP Services
  'Google App Engine', 'Google Cloud Functions', 'Google Cloud Run',
  'Google Kubernetes Engine',
  
  // Infrastructure as Code
  'Terraform', 'Pulumi', 'CloudFormation', 'ARM Templates', 'CDK',
  'Ansible', 'Chef', 'Puppet', 'SaltStack',
  
  // CI/CD
  'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
  'Azure DevOps', 'Bamboo', 'TeamCity', 'Drone', 'Buildkite',
  'Bitbucket Pipelines', 'Spinnaker', 'Argo Workflows',
  
  // Monitoring & Observability
  'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Dynatrace',
  'AppDynamics', 'Splunk', 'ELK Stack', 'Elasticsearch', 'Logstash', 'Kibana',
  'Jaeger', 'Zipkin', 'OpenTelemetry', 'Sentry', 'Rollbar',
  
  // Web Servers & Reverse Proxy
  'Nginx', 'Apache HTTP Server', 'Caddy', 'HAProxy', 'Traefik', 'Envoy',
  
  // Operating Systems
  'Linux', 'Ubuntu', 'Debian', 'CentOS', 'Red Hat Enterprise Linux',
  'Fedora', 'Alpine Linux', 'Arch Linux', 'FreeBSD', 'Windows Server',
  
  // Mobile - Cross-Platform
  'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Cordova', 'Capacitor',
  'NativeScript', 'Expo',
  
  // Mobile - Native
  'Swift', 'SwiftUI', 'Objective-C', 'Kotlin', 'Java (Android)',
  'iOS Development', 'Android Development', 'Jetpack Compose',
  
  // Desktop
  'Electron', 'Tauri', 'Qt', 'GTK', 'WPF', 'WinForms', 'JavaFX',
  
  // Data Science & Machine Learning
  'Machine Learning', 'Deep Learning', 'Neural Networks', 'Computer Vision',
  'Natural Language Processing', 'NLP', 'Reinforcement Learning',
  
  // ML Frameworks
  'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'XGBoost', 'LightGBM',
  'Fastai', 'Hugging Face', 'Transformers', 'JAX', 'MXNet',
  
  // Data Analysis
  'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly',
  'Jupyter', 'JupyterLab', 'Google Colab',
  
  // Big Data
  'Apache Spark', 'Apache Hadoop', 'Apache Flink', 'Apache Storm',
  'Apache Hive', 'Apache Pig', 'Databricks', 'Snowflake',
  
  // Data Visualization
  'Power BI', 'Tableau', 'Looker', 'Metabase', 'Superset', 'Redash',
  'D3.js', 'Chart.js', 'Recharts', 'Victory', 'Nivo', 'Apache ECharts',
  
  // Testing - JavaScript/TypeScript
  'Jest', 'Vitest', 'Mocha', 'Chai', 'Jasmine', 'Karma', 'Ava',
  'Testing Library', 'Enzyme',
  
  // Testing - E2E
  'Cypress', 'Playwright', 'Selenium', 'WebdriverIO', 'Puppeteer',
  'TestCafe', 'Nightwatch.js',
  
  // Testing - API
  'Postman', 'Insomnia', 'REST Client', 'k6', 'Locust', 'JMeter',
  'Gatling', 'Artillery',
  
  // Testing - Unit (Other Languages)
  'JUnit', 'TestNG', 'Mockito', 'PyTest', 'unittest', 'RSpec', 'PHPUnit',
  'NUnit', 'xUnit', 'MSTest',
  
  // Design & UX
  'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin', 'Marvel',
  'Framer', 'Principle', 'ProtoPie',
  
  // Design Skills
  'UI/UX Design', 'User Research', 'Prototyping', 'Wireframing',
  'Design Systems', 'Interaction Design', 'Visual Design',
  'Information Architecture', 'Usability Testing',
  
  // Adobe Suite
  'Adobe Photoshop', 'Adobe Illustrator', 'Adobe After Effects',
  'Adobe Premiere Pro', 'Adobe InDesign', 'Adobe XD',
  
  // 3D & Animation
  'Blender', '3ds Max', 'Maya', 'Cinema 4D', 'Houdini',
  'ZBrush', 'Substance Painter', 'Three.js', 'Babylon.js',
  
  // Project Management
  'Agile', 'Scrum', 'Kanban', 'Lean', 'SAFe', 'Waterfall',
  'Jira', 'Trello', 'Asana', 'Monday.com', 'Linear', 'ClickUp',
  'Confluence', 'Notion', 'Basecamp', 'Wrike',
  
  // Version Control
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Azure Repos',
  'Subversion (SVN)', 'Mercurial', 'Perforce',
  
  // Security
  'OAuth 2.0', 'JWT', 'SAML', 'OpenID Connect', 'SSL/TLS',
  'Web Application Security', 'Penetration Testing', 'Vulnerability Assessment',
  'OWASP', 'Security Auditing', 'Ethical Hacking',
  'Burp Suite', 'Metasploit', 'Nmap', 'Wireshark', 'Nessus',
  
  // Blockchain & Web3
  'Blockchain', 'Ethereum', 'Solidity', 'Smart Contracts',
  'Web3.js', 'Ethers.js', 'Hardhat', 'Truffle', 'Ganache',
  'Bitcoin', 'Hyperledger', 'Solana', 'Polygon', 'IPFS',
  
  // CMS
  'WordPress', 'Drupal', 'Joomla', 'Ghost', 'Contentful',
  'Strapi', 'Sanity', 'Prismic', 'Directus', 'Payload CMS',
  
  // E-commerce
  'Shopify', 'WooCommerce', 'Magento', 'PrestaShop', 'BigCommerce',
  'Medusa', 'Saleor', 'Sylius',
  
  // Game Development
  'Unity', 'Unreal Engine', 'Godot', 'GameMaker', 'Construct',
  'C++', 'C', 'C++ Unreal', 'Game Design', 'Level Design',
  
  // SEO & Marketing
  'SEO', 'Search Engine Optimization', 'SEM', 'Google Analytics',
  'Google Tag Manager', 'Google Ads', 'Facebook Ads', 'Meta Ads',
  'Content Marketing', 'Email Marketing', 'Growth Hacking',
  'A/B Testing', 'Conversion Rate Optimization',
  
  // CRM & Sales
  'Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive', 'Dynamics 365',
  
  // Soft Skills
  'Leadership', 'Communication', 'Teamwork', 'Team Collaboration',
  'Problem Solving', 'Critical Thinking', 'Analytical Thinking',
  'Time Management', 'Project Management', 'Stakeholder Management',
  'Adaptability', 'Flexibility', 'Creativity', 'Innovation',
  'Emotional Intelligence', 'Conflict Resolution', 'Negotiation',
  'Presentation Skills', 'Public Speaking', 'Mentoring', 'Coaching',
  
  // Languages
  'English', 'Spanish', 'Portuguese', 'French', 'German', 'Italian',
  'Mandarin Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian',
  'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Danish',
  
  // Validation & Forms
  'Zod', 'Yup', 'Joi', 'Ajv', 'Formik', 'React Hook Form',
  'Final Form', 'Vest',
  
  // Animation
  'Framer Motion', 'React Spring', 'GSAP', 'Anime.js', 'Lottie',
  
  // Accessibility
  'Web Accessibility', 'WCAG', 'ARIA', 'Screen Readers',
  
  // Performance
  'Web Performance', 'Lighthouse', 'PageSpeed Insights',
  'Core Web Vitals', 'Performance Optimization',
  
  // Architecture & Patterns
  'Microservices', 'Monolithic Architecture', 'Serverless Architecture',
  'Event-Driven Architecture', 'CQRS', 'Event Sourcing',
  'Domain-Driven Design', 'DDD', 'Clean Architecture',
  'Hexagonal Architecture', 'MVC', 'MVVM', 'Design Patterns',
  
  // Methodologies
  'Test-Driven Development', 'TDD', 'Behavior-Driven Development', 'BDD',
  'Domain-Driven Development', 'Extreme Programming', 'XP',
  
  // Emerging Technologies
  'IoT', 'Internet of Things', 'Edge Computing', 'Augmented Reality', 'AR',
  'Virtual Reality', 'VR', 'Mixed Reality', 'MR', 'Metaverse',
  'Quantum Computing', '5G', 'Serverless Computing',
  'Progressive Web Apps', 'PWA', 'WebAssembly', 'WASM',
];

// 30 Sectores profesionales con información completa
const SECTORES = [
  {
    name: 'technology',
    nameEs: 'Tecnología',
    nameEn: 'Technology',
    icon: '💻',
    order: 1,
    description: 'Desarrollo de software, hardware, servicios tecnológicos e innovación digital',
  },
  {
    name: 'finance',
    nameEs: 'Finanzas',
    nameEn: 'Finance',
    icon: '💰',
    order: 2,
    description: 'Banca, seguros, inversiones, fintech y servicios financieros',
  },
  {
    name: 'healthcare',
    nameEs: 'Salud',
    nameEn: 'Healthcare',
    icon: '🏥',
    order: 3,
    description: 'Hospitales, clínicas, farmacéuticas, telemedicina y servicios médicos',
  },
  {
    name: 'education',
    nameEs: 'Educación',
    nameEn: 'Education',
    icon: '📚',
    order: 4,
    description: 'Instituciones educativas, e-learning, edtech y capacitación profesional',
  },
  {
    name: 'ecommerce',
    nameEs: 'E-commerce',
    nameEn: 'E-commerce',
    icon: '🛒',
    order: 5,
    description: 'Comercio electrónico, marketplaces y retail digital',
  },
  {
    name: 'retail',
    nameEs: 'Retail',
    nameEn: 'Retail',
    icon: '🏪',
    order: 6,
    description: 'Comercio minorista, tiendas físicas y experiencia del cliente',
  },
  {
    name: 'manufacturing',
    nameEs: 'Manufactura',
    nameEn: 'Manufacturing',
    icon: '🏭',
    order: 7,
    description: 'Producción industrial, fabricación y cadena de suministro',
  },
  {
    name: 'construction',
    nameEs: 'Construcción',
    nameEn: 'Construction',
    icon: '🏗️',
    order: 8,
    description: 'Infraestructura, edificación, arquitectura y obras civiles',
  },
  {
    name: 'realestate',
    nameEs: 'Bienes Raíces',
    nameEn: 'Real Estate',
    icon: '🏠',
    order: 9,
    description: 'Inmobiliarias, proptech y gestión de propiedades',
  },
  {
    name: 'transportation',
    nameEs: 'Transporte y Logística',
    nameEn: 'Transportation & Logistics',
    icon: '🚚',
    order: 10,
    description: 'Logística, transporte, movilidad y cadena de suministro',
  },
  {
    name: 'energy',
    nameEs: 'Energía',
    nameEn: 'Energy',
    icon: '⚡',
    order: 11,
    description: 'Generación eléctrica, distribución, energías renovables y sostenibilidad',
  },
  {
    name: 'agriculture',
    nameEs: 'Agricultura',
    nameEn: 'Agriculture',
    icon: '🌾',
    order: 12,
    description: 'Agroindustria, agtech, producción agrícola y ganadería',
  },
  {
    name: 'food',
    nameEs: 'Alimentos y Bebidas',
    nameEn: 'Food & Beverage',
    icon: '🍔',
    order: 13,
    description: 'Restaurantes, procesamiento de alimentos, bebidas y gastronomía',
  },
  {
    name: 'hospitality',
    nameEs: 'Hotelería y Turismo',
    nameEn: 'Hospitality & Tourism',
    icon: '🏨',
    order: 14,
    description: 'Hoteles, turismo, viajes y servicios de hospedaje',
  },
  {
    name: 'entertainment',
    nameEs: 'Entretenimiento',
    nameEn: 'Entertainment',
    icon: '🎬',
    order: 15,
    description: 'Cine, música, eventos, medios de comunicación y producción audiovisual',
  },
  {
    name: 'gaming',
    nameEs: 'Gaming y eSports',
    nameEn: 'Gaming & eSports',
    icon: '🎮',
    order: 16,
    description: 'Videojuegos, desarrollo de juegos, eSports y entretenimiento digital',
  },
  {
    name: 'telecommunications',
    nameEs: 'Telecomunicaciones',
    nameEn: 'Telecommunications',
    icon: '📡',
    order: 17,
    description: 'Servicios de telefonía, internet, 5G y comunicaciones',
  },
  {
    name: 'marketing',
    nameEs: 'Marketing y Publicidad',
    nameEn: 'Marketing & Advertising',
    icon: '📢',
    order: 18,
    description: 'Publicidad, branding, marketing digital y comunicación estratégica',
  },
  {
    name: 'consulting',
    nameEs: 'Consultoría',
    nameEn: 'Consulting',
    icon: '💼',
    order: 19,
    description: 'Asesoría empresarial, consultoría estratégica y servicios profesionales',
  },
  {
    name: 'legal',
    nameEs: 'Legal',
    nameEn: 'Legal',
    icon: '⚖️',
    order: 20,
    description: 'Servicios jurídicos, legaltech y asesoría legal',
  },
  {
    name: 'nonprofit',
    nameEs: 'ONGs',
    nameEn: 'Non-Profit Organizations',
    icon: '🤝',
    order: 21,
    description: 'Organizaciones sin fines de lucro, fundaciones e impacto social',
  },
  {
    name: 'government',
    nameEs: 'Gobierno y Sector Público',
    nameEn: 'Government & Public Sector',
    icon: '🏛️',
    order: 22,
    description: 'Instituciones gubernamentales, administración pública y servicios civiles',
  },
  {
    name: 'sports',
    nameEs: 'Deportes y Fitness',
    nameEn: 'Sports & Fitness',
    icon: '⚽',
    order: 23,
    description: 'Clubs deportivos, gimnasios, fitness y bienestar físico',
  },
  {
    name: 'fashion',
    nameEs: 'Moda y Textil',
    nameEn: 'Fashion & Textile',
    icon: '👗',
    order: 24,
    description: 'Diseño de moda, textil, confección y accesorios',
  },
  {
    name: 'automotive',
    nameEs: 'Automotriz',
    nameEn: 'Automotive',
    icon: '🚗',
    order: 25,
    description: 'Fabricación de vehículos, autopartes y movilidad sostenible',
  },
  {
    name: 'aerospace',
    nameEs: 'Aeroespacial',
    nameEn: 'Aerospace',
    icon: '✈️',
    order: 26,
    description: 'Aviación, tecnología espacial y defensa aeroespacial',
  },
  {
    name: 'biotechnology',
    nameEs: 'Biotecnología',
    nameEn: 'Biotechnology',
    icon: '🧬',
    order: 27,
    description: 'Investigación biotecnológica, genómica y bioingeniería',
  },
  {
    name: 'insurance',
    nameEs: 'Seguros',
    nameEn: 'Insurance',
    icon: '🛡️',
    order: 28,
    description: 'Compañías de seguros, insurtech y gestión de riesgos',
  },
  {
    name: 'cybersecurity',
    nameEs: 'Ciberseguridad',
    nameEn: 'Cybersecurity',
    icon: '🔒',
    order: 29,
    description: 'Seguridad informática, protección de datos y ethical hacking',
  },
  {
    name: 'other',
    nameEs: 'Otro',
    nameEn: 'Other',
    icon: '📦',
    order: 99,
    description: 'Otros sectores no clasificados',
  },
];

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.userSkill.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.memberProfile.updateMany({ data: { sectorId: null } });
    await prisma.sector.deleteMany();
    console.log('✅ Datos limpiados\n');

    // 2. Crear Skills
    console.log('📊 Creando skills...');
    let skillsCreated = 0;
    
    for (const skillName of SKILLS) {
      await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });
      skillsCreated++;
      
      // Mostrar progreso cada 50 skills
      if (skillsCreated % 50 === 0) {
        console.log(`   ⏳ ${skillsCreated} skills creadas...`);
      }
    }
    
    const totalSkills = await prisma.skill.count();
    console.log(`✅ ${totalSkills} skills creadas exitosamente\n`);

    // 3. Crear Sectores
    console.log('🏢 Creando sectores...');
    
    for (const sector of SECTORES) {
      await prisma.sector.upsert({
        where: { name: sector.name },
        update: sector,
        create: sector,
      });
    }
    
    const totalSectores = await prisma.sector.count();
    console.log(`✅ ${totalSectores} sectores creados exitosamente\n`);

    // 4. Mostrar algunos ejemplos
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📈 Resumen final:\n');
    console.log(`   • Total Skills: ${totalSkills}`);
    console.log(`   • Total Sectores: ${totalSectores}\n`);

    console.log('📋 Primeras 10 skills:');
    const firstSkills = await prisma.skill.findMany({ take: 10, orderBy: { name: 'asc' } });
    firstSkills.forEach((s, i) => console.log(`   ${i + 1}. ${s.name}`));

    console.log('\n🏢 Primeros 10 sectores:');
    const firstSectors = await prisma.sector.findMany({ take: 10, orderBy: { order: 'asc' } });
    firstSectors.forEach((s) => console.log(`   ${s.icon} ${s.nameEs} (${s.nameEn})`));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 Seed completado exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
