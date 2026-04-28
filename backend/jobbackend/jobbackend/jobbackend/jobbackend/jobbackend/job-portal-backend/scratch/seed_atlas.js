/**
 * Seed script — run this ONCE to populate your Atlas (production) database with jobs.
 *
 * Usage:
 *   node scratch/seed_atlas.js "mongodb+srv://user:pass@cluster.mongodb.net/jobportal"
 *
 * Or set ATLAS_URI in .env and run:
 *   ATLAS_URI="mongodb+srv://..." node scratch/seed_atlas.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Pass the Atlas URI as a command-line argument OR set ATLAS_URI in .env
const ATLAS_URI = process.argv[2] || process.env.ATLAS_URI;

if (!ATLAS_URI) {
  console.error('❌  Please provide your Atlas MONGO_URI as an argument:');
  console.error('   node scratch/seed_atlas.js "mongodb+srv://user:pass@cluster.mongodb.net/jobportal"');
  process.exit(1);
}

// ── Job Model ────────────────────────────────────────────────────────────────
const jobSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true },
    company:       { type: String, required: true },
    location:      { type: String, required: true },
    salary:        { type: Number },
    description:   { type: String, trim: true },
    status:        {
      type: String,
      enum: ['Open', 'Applied', 'Interview Scheduled', 'Offer', 'Rejected', 'Closed'],
      default: 'Open',
    },
    interviewDate: { type: Date },
    notes:         { type: String, trim: true },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);

// ── Seed Data ─────────────────────────────────────────────────────────────────
const JOBS = [
  {
    title: 'Frontend Developer',
    company: 'TCS',
    location: 'Bangalore',
    salary: 500000,
    description: 'Build modern React applications for enterprise clients.',
    status: 'Open',
    notes: 'Good growth opportunity',
  },
  {
    title: 'Backend Developer',
    company: 'Infosys',
    location: 'Pune',
    salary: 700000,
    description: 'Node.js and Express backend development for scalable APIs.',
    status: 'Open',
    notes: 'Node.js + MongoDB stack',
  },
  {
    title: 'Full Stack Developer',
    company: 'Wipro',
    location: 'Hyderabad',
    salary: 900000,
    description: 'End-to-end MERN stack development for SaaS products.',
    status: 'Open',
    notes: 'Remote-friendly team',
  },
  {
    title: 'React Developer',
    company: 'Accenture',
    location: 'Chennai',
    salary: 800000,
    description: 'Design and implement responsive React UIs with TypeScript.',
    status: 'Open',
    notes: 'Strong frontend culture',
  },
  {
    title: 'Software Engineer',
    company: 'Cognizant',
    location: 'Mumbai',
    salary: 650000,
    description: 'General software engineering — Java + Spring Boot services.',
    status: 'Open',
    notes: 'Large team, good benefits',
  },
  {
    title: 'DevOps Engineer',
    company: 'HCL Technologies',
    location: 'Noida',
    salary: 1000000,
    description: 'CI/CD pipeline management, Docker, Kubernetes on AWS.',
    status: 'Open',
    notes: 'AWS certifications a plus',
  },
  {
    title: 'Data Analyst',
    company: 'Tech Mahindra',
    location: 'Remote',
    salary: 550000,
    description: 'Analyse large datasets and produce actionable insights.',
    status: 'Open',
    notes: 'Python + SQL required',
  },
  {
    title: 'UI/UX Designer',
    company: 'Zoho',
    location: 'Chennai',
    salary: 600000,
    description: 'Create intuitive user experiences using Figma and user research.',
    status: 'Open',
    notes: 'Portfolio required',
  },
  {
    title: 'Cloud Architect',
    company: 'IBM India',
    location: 'Bangalore',
    salary: 1800000,
    description: 'Design cloud-native architectures on Azure and AWS.',
    status: 'Open',
    notes: 'Senior role — 7+ years exp.',
  },
  {
    title: 'Mobile Developer',
    company: 'Flipkart',
    location: 'Bangalore',
    salary: 1200000,
    description: 'Build and maintain Android and iOS apps using React Native.',
    status: 'Open',
    notes: 'Fast-paced startup culture',
  },
  {
    title: 'Product Manager',
    company: 'Swiggy',
    location: 'Bangalore',
    salary: 1500000,
    description: 'Drive product roadmap for the core ordering experience.',
    status: 'Open',
    notes: 'MBA preferred',
  },
  {
    title: 'QA Engineer',
    company: 'Mphasis',
    location: 'Pune',
    salary: 480000,
    description: 'Manual and automated testing using Selenium and Jest.',
    status: 'Open',
    notes: 'Automation skills required',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🔗  Connecting to Atlas...');
  await mongoose.connect(ATLAS_URI);
  console.log('✅  Connected!\n');

  const existing = await Job.countDocuments();
  console.log(`📦  Existing jobs in Atlas: ${existing}`);

  if (existing > 0) {
    console.log('\n⚠️   Jobs already exist. Do you want to re-seed? (Ctrl+C to cancel)');
    console.log('     Waiting 5 seconds before proceeding...\n');
    await new Promise((r) => setTimeout(r, 5000));
  }

  const inserted = await Job.insertMany(JOBS);
  console.log(`✅  Seeded ${inserted.length} jobs into Atlas!\n`);

  const total = await Job.countDocuments();
  console.log(`📦  Total jobs in Atlas now: ${total}`);

  await mongoose.disconnect();
  console.log('\n🎉  Done! Your deployed app should now show jobs.\n');
}

seed().catch((err) => {
  console.error('❌  Seeding failed:', err.message);
  process.exit(1);
});
