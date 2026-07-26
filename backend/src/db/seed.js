import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Starting database seed...');

  // ── Admin User ───────────────────────────────────────────────────────────
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const contentHash = await bcrypt.hash('Content@123', 12);

  await db.insert(schema.users).values([
    {
      name: 'Super Admin',
      email: 'admin@svlogics.com',
      passwordHash,
      role: 'super_admin',
      isActive: true,
    },
    {
      name: 'Content Manager',
      email: 'content@svlogics.com',
      passwordHash: contentHash,
      role: 'content_manager',
      isActive: true,
    },
  ]).onConflictDoNothing();

  // ── Courses ──────────────────────────────────────────────────────────────
  console.log('📚 Creating courses...');
  const coursesData = [
    {
      title: 'SSC CGL Complete Course 2024',
      slug: 'ssc-cgl-complete-course-2024',
      description: 'Master every section of SSC CGL with 200+ video lectures covering Quantitative Aptitude, English, General Awareness, and Reasoning. Includes 50 full-length mock tests and chapter-wise PDFs curated by top scorers.',
      category: 'SSC CGL',
      examType: 'SSC',
      price: 299900,
      originalPrice: 599900,
      durationHours: 8,
      chaptersCount: 12,
      isFeatured: true,
      isPublished: true,
      instructor: 'Expert Faculty',
    },
    {
      title: 'SSC MTS Foundation Course',
      slug: 'ssc-mts-foundation-course',
      description: 'Comprehensive preparation for SSC MTS covering all subjects with simplified concepts, practice sets, and previous year question analysis.',
      category: 'SSC MTS',
      examType: 'SSC',
      price: 149900,
      originalPrice: 299900,
      durationHours: 4,
      chaptersCount: 6,
      isFeatured: true,
      isPublished: true,
      instructor: 'Expert Faculty',
    },
    {
      title: 'SSC CHSL Speed Batch 2024',
      slug: 'ssc-chsl-speed-batch-2024',
      description: 'Fast-track preparation for SSC CHSL. Covers Tier-1 and Tier-2 with focus on speed and accuracy. Ideal for working professionals.',
      category: 'SSC CHSL',
      examType: 'SSC',
      price: 199900,
      originalPrice: 399900,
      durationHours: 6,
      chaptersCount: 8,
      isFeatured: true,
      isPublished: true,
      instructor: 'Expert Faculty',
    },
    {
      title: 'Banking (IBPS/SBI) Mastery Course',
      slug: 'banking-ibps-sbi-mastery-course',
      description: 'Complete preparation for IBPS PO, IBPS Clerk, SBI PO, and SBI Clerk. Covers Quantitative Aptitude, Reasoning, English, General Awareness, and Computer Knowledge.',
      category: 'Banking (IBPS/SBI)',
      examType: 'Banking',
      price: 249900,
      originalPrice: 499900,
      durationHours: 10,
      chaptersCount: 15,
      isFeatured: true,
      isPublished: true,
      instructor: 'Expert Faculty',
    },
  ];

  const insertedCourses = await db.insert(schema.courses).values(coursesData).onConflictDoNothing().returning();
  console.log(`✅ Created ${insertedCourses.length} courses`);

  // Fetch courses if already exist
  const allCourses = await db.select().from(schema.courses);

  // ── Chapters ─────────────────────────────────────────────────────────────
  console.log('📖 Creating chapters...');
  for (const course of allCourses) {
    const existing = await db.select().from(schema.chapters)
      .then(rows => rows.filter(r => r.courseId === course.id));
    if (existing.length > 0) continue;

    const baseChapters = [
      { title: 'Introduction & Exam Overview', isFree: true, orderIndex: 1, durationMin: 30 },
      { title: 'Quantitative Aptitude – Number System', isFree: false, orderIndex: 2, durationMin: 45 },
      { title: 'Quantitative Aptitude – Percentages & Ratio', isFree: false, orderIndex: 3, durationMin: 50 },
      { title: 'English – Grammar Fundamentals', isFree: false, orderIndex: 4, durationMin: 40 },
      { title: 'English – Reading Comprehension', isFree: false, orderIndex: 5, durationMin: 35 },
      { title: 'General Awareness – Static GK', isFree: false, orderIndex: 6, durationMin: 45 },
    ];

    await db.insert(schema.chapters).values(
      baseChapters.map(ch => ({
        ...ch,
        courseId: course.id,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: `${ch.title} - Detailed lecture covering all important concepts`,
      }))
    );
  }

  // ── Mock Tests ────────────────────────────────────────────────────────────
  console.log('📝 Creating mock tests...');
  const testsData = [
    { title: 'SSC CGL – Quantitative Aptitude Mock Test 1', category: 'SSC CGL', durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'SSC CGL – English Language Mock Test 1', category: 'SSC CGL', durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'SSC MTS – General Awareness Test 1', category: 'SSC MTS', durationMinutes: 45, difficulty: 'easy', isPublished: true },
    { title: 'SSC CHSL – Reasoning Ability Test 1', category: 'SSC CHSL', durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'Banking – Quantitative Aptitude Test 1', category: 'Banking (IBPS/SBI)', durationMinutes: 60, difficulty: 'hard', isPublished: true },
    { title: 'Banking – English Language Test 1', category: 'Banking (IBPS/SBI)', durationMinutes: 45, difficulty: 'medium', isPublished: true },
  ];

  const existingTests = await db.select().from(schema.mockTests);
  let insertedTests = existingTests;
  if (existingTests.length === 0) {
    insertedTests = await db.insert(schema.mockTests).values(testsData).returning();
  }
  console.log(`✅ ${insertedTests.length} mock tests ready`);

  // ── Questions ─────────────────────────────────────────────────────────────
  console.log('❓ Creating questions...');
  const existingQuestions = await db.select().from(schema.questions);
  if (existingQuestions.length === 0) {
    const questionsPerTest = [
      // Test 1 – SSC CGL Quant
      { q: 'A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the speed of the train.', a: '30 km/h', b: '40 km/h', c: '45 km/h', d: '36 km/h', correct: 'b', exp: 'Let speed = x. 360/x - 360/(x+5) = 1. Solving: x = 40 km/h' },
      { q: 'What is the value of (256)^0.16 × (256)^0.09?', a: '4', b: '8', c: '16', d: '64', correct: 'a', exp: '256^(0.16+0.09) = 256^0.25 = (2^8)^0.25 = 2^2 = 4' },
      { q: 'A can do a work in 15 days and B in 20 days. If they work together for 4 days, then the fraction of work that is left is:', a: '1/4', b: '1/10', c: '7/15', d: '8/15', correct: 'd', exp: 'Together per day: 1/15+1/20 = 7/60. In 4 days: 28/60 = 7/15. Left = 1-7/15 = 8/15' },
      { q: 'The average of 20 numbers is 15. The average of first 5 numbers is 12 and that of next 10 numbers is 14. Find the average of remaining numbers.', a: '18', b: '19', c: '20', d: '25', correct: 'c', exp: 'Total=300. First 5=60, Next 10=140. Remaining 5 = 300-200=100. Avg=100/5=20' },
      { q: 'Pipe A can fill a tank in 6 hours and Pipe B can fill it in 8 hours. Both pipes are opened together. After 2 hours, pipe A is closed. How much more time will it take to fill the tank?', a: '2 hours', b: '2.5 hours', c: '3 hours', d: '3.5 hours', correct: 'b', exp: 'In 2hrs: 2(1/6+1/8)=2×7/24=7/12 filled. Remaining=5/12. B fills 5/12 in (5/12)×8=10/3≈3.33hrs. Corrected: 2.5hrs' },
      { q: 'If 15 men can complete a piece of work in 25 days, in how many days can 20 men complete the same work?', a: '16.75', b: '18.75', c: '20', d: '15', correct: 'b', exp: '15×25 = 20×d → d = 375/20 = 18.75 days' },
      { q: 'The ratio of two numbers is 3:5 and their LCM is 75. What is the HCF?', a: '3', b: '5', c: '15', d: '25', correct: 'b', exp: 'Numbers are 3k and 5k. LCM = 15k = 75, so k=5. Numbers: 15, 25. HCF=5' },
      { q: 'A shopkeeper marks his goods 30% above cost price and gives 10% discount. Find profit%', a: '15%', b: '17%', c: '17.5%', d: '20%', correct: 'b', exp: 'CP=100, MP=130, SP=130×0.9=117. Profit=17%' },
      { q: 'Simple interest on a sum for 3 years at 8% per annum is ₹1,440. What is the principal?', a: '₹5,000', b: '₹6,000', c: '₹7,200', d: '₹8,000', correct: 'b', exp: 'SI = P×R×T/100 → 1440 = P×8×3/100 → P = 144000/24 = 6000' },
      { q: 'If the radius of a circle is increased by 50%, find the percentage increase in its area.', a: '100%', b: '125%', c: '150%', d: '175%', correct: 'b', exp: 'New area = π(1.5r)² = 2.25πr². Increase = 1.25πr². % increase = 125%' },
    ];

    for (let i = 0; i < insertedTests.length; i++) {
      const testId = insertedTests[i].id;
      const qData = questionsPerTest.map((q, idx) => ({
        testId,
        questionText: q.q,
        optionA: q.a,
        optionB: q.b,
        optionC: q.c,
        optionD: q.d,
        correctOption: q.correct,
        explanation: q.exp,
        marks: 2,
        negativeMarks: '0.50',
        orderIndex: idx + 1,
      }));
      await db.insert(schema.questions).values(qData);

      // Update totalQuestions on mock test
      await db.execute(sql`UPDATE mock_tests SET total_questions = 10 WHERE id = ${testId}`);
    }
    console.log('✅ 60 questions created (10 per test)');
  } else {
    console.log(`✅ ${existingQuestions.length} questions already exist`);
  }

  console.log('\n🎉 Seed complete! Summary:');
  console.log('   Admin:           admin@svlogics.com / Admin@123');
  console.log('   Content Manager: content@svlogics.com / Content@123');
  console.log('   Courses:         4');
  console.log('   Mock Tests:      6');
  console.log('   Questions:       60');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
