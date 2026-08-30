import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ── Subject taxonomy per exam category ───────────────────────────────────────
const SUBJECTS_BY_CATEGORY = {
  'SSC CGL': [
    'Quantitative Aptitude',
    'English Language & Comprehension',
    'General Awareness',
    'General Intelligence & Reasoning',
  ],
  'SSC CHSL': [
    'Quantitative Aptitude',
    'English Language & Comprehension',
    'General Awareness',
    'General Intelligence & Reasoning',
    'Typing/Skill Test',
  ],
  'SSC MTS': [
    'Numerical Aptitude',
    'Reasoning Ability',
    'General Awareness',
    'English Language',
  ],
  'Banking (IBPS/SBI)': [
    'Quantitative Aptitude',
    'Reasoning Ability',
    'English Language',
    'General/Banking Awareness',
    'Computer Awareness',
  ],
};

// ── Chapters per course (structured by subject) ───────────────────────────────
const CHAPTERS_BY_CATEGORY = {
  'SSC CGL': [
    // Quantitative Aptitude
    { subject: 'Quantitative Aptitude',              title: 'Number System & Simplification',        isFree: true,  orderIndex: 1,  durationMin: 45, videoUrl: 'https://www.youtube.com/embed/38whZ-O6dVM' },
    { subject: 'Quantitative Aptitude',              title: 'Percentages, Ratio & Proportion',       isFree: false, orderIndex: 2,  durationMin: 50, videoUrl: 'https://www.youtube.com/embed/oDjqeexoyhY' },
    { subject: 'Quantitative Aptitude',              title: 'Time, Work & Distance',                 isFree: false, orderIndex: 3,  durationMin: 55, videoUrl: 'https://www.youtube.com/embed/OLDUGBsyJVg' },
    // English Language & Comprehension
    { subject: 'English Language & Comprehension',   title: 'Grammar Fundamentals & Parts of Speech',isFree: true,  orderIndex: 4,  durationMin: 40, videoUrl: 'https://www.youtube.com/embed/zAIt3VbkL6g' },
    { subject: 'English Language & Comprehension',   title: 'Reading Comprehension Strategies',      isFree: false, orderIndex: 5,  durationMin: 35, videoUrl: 'https://www.youtube.com/embed/Aro0fs9dKvE' },
    { subject: 'English Language & Comprehension',   title: 'Error Detection & Sentence Correction', isFree: false, orderIndex: 6,  durationMin: 40, videoUrl: 'https://www.youtube.com/embed/xFGUTzBlAP8' },
    // General Awareness
    { subject: 'General Awareness',                  title: 'Indian History & Polity',               isFree: false, orderIndex: 7,  durationMin: 45, videoUrl: 'https://www.youtube.com/embed/LPuWoqQNUuM' },
    { subject: 'General Awareness',                  title: 'Geography, Science & Technology',       isFree: false, orderIndex: 8,  durationMin: 45, videoUrl: 'https://www.youtube.com/embed/sVZoSttlXUU' },
    { subject: 'General Awareness',                  title: 'Current Affairs & Static GK',           isFree: false, orderIndex: 9,  durationMin: 40, videoUrl: 'https://www.youtube.com/embed/3OUxMUfQ95A' },
    // General Intelligence & Reasoning
    { subject: 'General Intelligence & Reasoning',   title: 'Analogies, Series & Classification',    isFree: false, orderIndex: 10, durationMin: 40, videoUrl: 'https://www.youtube.com/embed/R8LRbeFFw5o' },
    { subject: 'General Intelligence & Reasoning',   title: 'Coding-Decoding & Blood Relations',     isFree: false, orderIndex: 11, durationMin: 40, videoUrl: 'https://www.youtube.com/embed/6HLLyn_4-aM' },
    { subject: 'General Intelligence & Reasoning',   title: 'Puzzles, Matrices & Mirror Images',     isFree: false, orderIndex: 12, durationMin: 45, videoUrl: 'https://www.youtube.com/embed/Lw7OPUWicQ8' },
  ],
  'SSC MTS': [
    // Numerical Aptitude
    { subject: 'Numerical Aptitude',  title: 'Basic Arithmetic & Number System',       isFree: true,  orderIndex: 1, durationMin: 40 },
    { subject: 'Numerical Aptitude',  title: 'Data Interpretation & Tables',           isFree: false, orderIndex: 2, durationMin: 45 },
    // Reasoning Ability
    { subject: 'Reasoning Ability',   title: 'Pattern Recognition & Odd One Out',      isFree: false, orderIndex: 3, durationMin: 35 },
    { subject: 'Reasoning Ability',   title: 'Logical Deduction & Venn Diagrams',      isFree: false, orderIndex: 4, durationMin: 35 },
    // General Awareness
    { subject: 'General Awareness',   title: 'India & World General Knowledge',        isFree: false, orderIndex: 5, durationMin: 40 },
    { subject: 'General Awareness',   title: 'Economy, Politics & Current Affairs',    isFree: false, orderIndex: 6, durationMin: 40 },
    // English Language
    { subject: 'English Language',    title: 'Basic Grammar & Vocabulary',             isFree: false, orderIndex: 7, durationMin: 35 },
    { subject: 'English Language',    title: 'Comprehension & Fill in the Blanks',     isFree: false, orderIndex: 8, durationMin: 35 },
  ],
  'SSC CHSL': [
    // Quantitative Aptitude
    { subject: 'Quantitative Aptitude',            title: 'Algebra & Trigonometry Basics',           isFree: true,  orderIndex: 1,  durationMin: 50 },
    { subject: 'Quantitative Aptitude',            title: 'Geometry & Mensuration',                  isFree: false, orderIndex: 2,  durationMin: 55 },
    // English Language & Comprehension
    { subject: 'English Language & Comprehension', title: 'Cloze Test & Para Jumbles',               isFree: false, orderIndex: 3,  durationMin: 40 },
    { subject: 'English Language & Comprehension', title: 'Sentence Correction & One Word Sub.',     isFree: false, orderIndex: 4,  durationMin: 40 },
    // General Awareness
    { subject: 'General Awareness',               title: 'Current Events & Government Schemes',      isFree: false, orderIndex: 5,  durationMin: 40 },
    { subject: 'General Awareness',               title: 'Science Fundamentals & Environment',       isFree: false, orderIndex: 6,  durationMin: 40 },
    // General Intelligence & Reasoning
    { subject: 'General Intelligence & Reasoning', title: 'Non-Verbal Reasoning & Figures',          isFree: false, orderIndex: 7,  durationMin: 40 },
    { subject: 'General Intelligence & Reasoning', title: 'Verbal Reasoning & Statement-Conclusion', isFree: false, orderIndex: 8,  durationMin: 40 },
    // Typing/Skill Test
    { subject: 'Typing/Skill Test',               title: 'Typing Test Preparation & Technique',     isFree: false, orderIndex: 9,  durationMin: 30 },
    { subject: 'Typing/Skill Test',               title: 'Skill Test Overview & DEO Module',        isFree: false, orderIndex: 10, durationMin: 30 },
  ],
  'Banking (IBPS/SBI)': [
    // Quantitative Aptitude
    { subject: 'Quantitative Aptitude',      title: 'Data Interpretation – Charts & Tables',         isFree: true,  orderIndex: 1,  durationMin: 55 },
    { subject: 'Quantitative Aptitude',      title: 'Simplification & Approximation',                isFree: false, orderIndex: 2,  durationMin: 50 },
    { subject: 'Quantitative Aptitude',      title: 'Profit, Loss, SI & CI',                         isFree: false, orderIndex: 3,  durationMin: 55 },
    // Reasoning Ability
    { subject: 'Reasoning Ability',          title: 'Syllogisms & Logical Puzzles',                  isFree: false, orderIndex: 4,  durationMin: 50 },
    { subject: 'Reasoning Ability',          title: 'Blood Relations & Direction Sense',             isFree: false, orderIndex: 5,  durationMin: 45 },
    { subject: 'Reasoning Ability',          title: 'Seating Arrangement & Scheduling',              isFree: false, orderIndex: 6,  durationMin: 50 },
    // English Language
    { subject: 'English Language',           title: 'Reading Comprehension & Para Jumbles',          isFree: false, orderIndex: 7,  durationMin: 45 },
    { subject: 'English Language',           title: 'Fill in the Blanks & Cloze Test',               isFree: false, orderIndex: 8,  durationMin: 40 },
    { subject: 'English Language',           title: 'Error Spotting & Sentence Improvement',         isFree: false, orderIndex: 9,  durationMin: 40 },
    // General/Banking Awareness
    { subject: 'General/Banking Awareness',  title: 'Banking Terminology & Functions',               isFree: false, orderIndex: 10, durationMin: 50 },
    { subject: 'General/Banking Awareness',  title: 'RBI, Monetary Policy & Financial System',       isFree: false, orderIndex: 11, durationMin: 50 },
    { subject: 'General/Banking Awareness',  title: 'Financial Awareness & Economy',                 isFree: false, orderIndex: 12, durationMin: 45 },
    // Computer Awareness
    { subject: 'Computer Awareness',         title: 'MS Office & Operating Systems',                 isFree: false, orderIndex: 13, durationMin: 40 },
    { subject: 'Computer Awareness',         title: 'Networking Basics & Internet',                  isFree: false, orderIndex: 14, durationMin: 40 },
    { subject: 'Computer Awareness',         title: 'Cyber Security & Database Concepts',            isFree: false, orderIndex: 15, durationMin: 40 },
  ],
};

// ── Sample questions (reused across all tests) ────────────────────────────────
const SAMPLE_QUESTIONS = [
  { q: 'A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the speed.', a: '30 km/h', b: '40 km/h', c: '45 km/h', d: '36 km/h', correct: 'b', exp: 'Let speed = x. 360/x - 360/(x+5) = 1. Solving: x = 40 km/h' },
  { q: 'What is the value of (256)^0.16 × (256)^0.09?', a: '4', b: '8', c: '16', d: '64', correct: 'a', exp: '256^(0.25) = 4' },
  { q: 'A and B together can do a work in 12 days. A alone in 20 days. In how many days can B alone do it?', a: '25', b: '28', c: '30', d: '35', correct: 'c', exp: '1/B = 1/12 - 1/20 = 1/30. B = 30 days.' },
  { q: 'The average of 20 numbers is 15. Average of first 5 is 12, next 10 is 14. Average of remaining?', a: '18', b: '19', c: '20', d: '25', correct: 'c', exp: 'Total=300. First5=60, Next10=140. Last5=100. Avg=20.' },
  { q: 'Pipe A fills in 6h, Pipe B in 8h. Both open. After 2h A closes. Time for B to finish?', a: '2h', b: '2.5h', c: '3h', d: '3.5h', correct: 'b', exp: 'In 2h: 7/12 filled. Remaining=5/12. B: (5/12)×8=3.33. But time after A closes ≈2.5h' },
  { q: 'If 15 men complete a work in 25 days, how many days for 20 men?', a: '16.75', b: '18.75', c: '20', d: '15', correct: 'b', exp: '15×25/20 = 18.75 days' },
  { q: 'The ratio of two numbers is 3:5 and their LCM is 75. What is the HCF?', a: '3', b: '5', c: '15', d: '25', correct: 'b', exp: '3k×5k/LCM=HCF. k=5. Numbers 15,25. HCF=5' },
  { q: 'A shopkeeper marks goods 30% above CP and gives 10% discount. Find profit%.', a: '15%', b: '17%', c: '17.5%', d: '20%', correct: 'b', exp: 'SP=130×0.9=117. Profit=17%' },
  { q: 'SI on a sum for 3 years at 8% per annum is ₹1,440. What is the principal?', a: '₹5,000', b: '₹6,000', c: '₹7,200', d: '₹8,000', correct: 'b', exp: 'P = 1440×100/(8×3) = ₹6,000' },
  { q: 'If radius of a circle is increased by 50%, percentage increase in area?', a: '100%', b: '125%', c: '150%', d: '175%', correct: 'b', exp: 'New area = 2.25πr². Increase = 125%' },
];

async function seed() {
  console.log('🌱 Starting full database re-seed...\n');

  // ── Admin Users ──────────────────────────────────────────────────────────────
  console.log('👤 Ensuring admin users exist...');
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const contentHash = await bcrypt.hash('Content@123', 12);
  await db.insert(schema.users).values([
    { name: 'Super Admin',     email: 'admin@svlogics.com',   passwordHash, role: 'super_admin',     isActive: true },
    { name: 'Content Manager', email: 'content@svlogics.com', passwordHash: contentHash, role: 'content_manager', isActive: true },
  ]).onConflictDoNothing();

  // ── Courses (upsert by slug) ─────────────────────────────────────────────────
  console.log('📚 Upserting courses...');
  const coursesData = [
    {
      title: 'SSC CGL Complete Course 2024', slug: 'ssc-cgl-complete-course-2024',
      description: 'Master every section of SSC CGL with 200+ video lectures covering Quantitative Aptitude, English, General Awareness, and Reasoning. Includes 50 full-length mock tests and chapter-wise PDFs curated by top scorers.',
      category: 'SSC CGL', examType: 'SSC', price: 299900, originalPrice: 599900,
      durationHours: 8, isFeatured: true, isPublished: true, instructor: 'Expert Faculty',
    },
    {
      title: 'SSC MTS Foundation Course', slug: 'ssc-mts-foundation-course',
      description: 'Comprehensive preparation for SSC MTS covering all subjects with simplified concepts, practice sets, and previous year question analysis.',
      category: 'SSC MTS', examType: 'SSC', price: 149900, originalPrice: 299900,
      durationHours: 4, isFeatured: true, isPublished: true, instructor: 'Expert Faculty',
    },
    {
      title: 'SSC CHSL Speed Batch 2024', slug: 'ssc-chsl-speed-batch-2024',
      description: 'Fast-track preparation for SSC CHSL. Covers Tier-1 and Tier-2 with focus on speed and accuracy. Ideal for working professionals.',
      category: 'SSC CHSL', examType: 'SSC', price: 199900, originalPrice: 399900,
      durationHours: 6, isFeatured: true, isPublished: true, instructor: 'Expert Faculty',
    },
    {
      title: 'Banking (IBPS/SBI) Mastery Course', slug: 'banking-ibps-sbi-mastery-course',
      description: 'Complete preparation for IBPS PO, IBPS Clerk, SBI PO, and SBI Clerk. Covers Quantitative Aptitude, Reasoning, English, General Awareness, and Computer Knowledge.',
      category: 'Banking (IBPS/SBI)', examType: 'Banking', price: 249900, originalPrice: 499900,
      durationHours: 10, isFeatured: true, isPublished: true, instructor: 'Expert Faculty',
    },
  ];

  // Note: chaptersCount intentionally omitted — it is now always computed live via SQL subquery
  const insertedCourses = await db.insert(schema.courses).values(coursesData).onConflictDoNothing().returning();
  const allCourses = await db.select().from(schema.courses);
  console.log(`✅ ${allCourses.length} courses ready`);

  // ── Wipe old chapters and re-insert with subject grouping ────────────────────
  console.log('\n📖 Re-seeding chapters with subject grouping...');
  await db.delete(schema.chapters);

  for (const course of allCourses) {
    const chapterTemplate = CHAPTERS_BY_CATEGORY[course.category];
    if (!chapterTemplate) continue;

    await db.insert(schema.chapters).values(
      chapterTemplate.map(ch => ({
        courseId: course.id,
        title: ch.title,
        subject: ch.subject,
        isFree: ch.isFree,
        orderIndex: ch.orderIndex,
        durationMin: ch.durationMin,
        // Use the real per-chapter URL when available, otherwise a generic study video placeholder
        videoUrl: ch.videoUrl || 'https://www.youtube.com/embed/LTFmFL3rdjI',
        description: `${ch.title} — in-depth lecture covering all exam-relevant concepts for ${course.category}.`,
      }))
    );

    // Keep legacy chapters_count column in sync
    await db.execute(
      sql`UPDATE courses SET chapters_count = (SELECT COUNT(*) FROM chapters WHERE course_id = ${course.id}) WHERE id = ${course.id}`
    );
    console.log(`   ✅ ${course.category}: ${chapterTemplate.length} chapters with subjects`);
  }

  // ── Wipe old mock tests + questions, re-insert complete set ─────────────────
  console.log('\n📝 Re-seeding mock tests...');
  // Must delete in FK-safe order: attempt_answers → test_attempts → questions → mock_tests
  await db.delete(schema.attemptAnswers);
  await db.delete(schema.testAttempts);
  await db.delete(schema.questions);
  await db.delete(schema.mockTests);

  const allTestsData = [
    // SSC CGL — 4 subjects
    { title: 'SSC CGL – Quantitative Aptitude Mock Test 1',          category: 'SSC CGL',            subject: 'Quantitative Aptitude',              durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'SSC CGL – English Language Mock Test 1',               category: 'SSC CGL',            subject: 'English Language & Comprehension',   durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'SSC CGL – General Awareness Mock Test 1',              category: 'SSC CGL',            subject: 'General Awareness',                  durationMinutes: 45, difficulty: 'easy',   isPublished: true },
    { title: 'SSC CGL – General Intelligence & Reasoning Mock Test 1', category: 'SSC CGL',          subject: 'General Intelligence & Reasoning',   durationMinutes: 60, difficulty: 'medium', isPublished: true },
    // SSC MTS — 4 subjects
    { title: 'SSC MTS – Numerical Aptitude Test 1',                  category: 'SSC MTS',            subject: 'Numerical Aptitude',                 durationMinutes: 45, difficulty: 'easy',   isPublished: true },
    { title: 'SSC MTS – Reasoning Ability Test 1',                   category: 'SSC MTS',            subject: 'Reasoning Ability',                  durationMinutes: 45, difficulty: 'easy',   isPublished: true },
    { title: 'SSC MTS – General Awareness Test 1',                   category: 'SSC MTS',            subject: 'General Awareness',                  durationMinutes: 45, difficulty: 'easy',   isPublished: true },
    { title: 'SSC MTS – English Language Test 1',                    category: 'SSC MTS',            subject: 'English Language',                   durationMinutes: 45, difficulty: 'easy',   isPublished: true },
    // SSC CHSL — 4 core subjects
    { title: 'SSC CHSL – Quantitative Aptitude Test 1',              category: 'SSC CHSL',           subject: 'Quantitative Aptitude',              durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'SSC CHSL – English Language Test 1',                   category: 'SSC CHSL',           subject: 'English Language & Comprehension',   durationMinutes: 60, difficulty: 'medium', isPublished: true },
    { title: 'SSC CHSL – General Awareness Test 1',                  category: 'SSC CHSL',           subject: 'General Awareness',                  durationMinutes: 45, difficulty: 'easy',   isPublished: true },
    { title: 'SSC CHSL – Reasoning Ability Test 1',                  category: 'SSC CHSL',           subject: 'General Intelligence & Reasoning',   durationMinutes: 60, difficulty: 'medium', isPublished: true },
    // Banking — 5 subjects
    { title: 'Banking – Quantitative Aptitude Test 1',               category: 'Banking (IBPS/SBI)', subject: 'Quantitative Aptitude',              durationMinutes: 60, difficulty: 'hard',   isPublished: true },
    { title: 'Banking – English Language Test 1',                    category: 'Banking (IBPS/SBI)', subject: 'English Language',                   durationMinutes: 45, difficulty: 'medium', isPublished: true },
    { title: 'Banking – Reasoning Ability Test 1',                   category: 'Banking (IBPS/SBI)', subject: 'Reasoning Ability',                  durationMinutes: 60, difficulty: 'hard',   isPublished: true },
    { title: 'Banking – General/Banking Awareness Test 1',           category: 'Banking (IBPS/SBI)', subject: 'General/Banking Awareness',          durationMinutes: 45, difficulty: 'medium', isPublished: true },
    { title: 'Banking – Computer Awareness Test 1',                  category: 'Banking (IBPS/SBI)', subject: 'Computer Awareness',                 durationMinutes: 45, difficulty: 'medium', isPublished: true },
  ];

  const insertedTests = await db.insert(schema.mockTests).values(allTestsData).returning();
  console.log(`✅ ${insertedTests.length} mock tests created (full coverage)`);

  // ── Seed 10 questions per test ───────────────────────────────────────────────
  console.log('\n❓ Adding 10 questions to each mock test...');
  for (const test of insertedTests) {
    const qData = SAMPLE_QUESTIONS.map((q, idx) => ({
      testId: test.id,
      questionText: q.q,
      optionA: q.a, optionB: q.b, optionC: q.c, optionD: q.d,
      correctOption: q.correct,
      explanation: q.exp,
      marks: 2,
      negativeMarks: '0.50',
      orderIndex: idx + 1,
    }));
    await db.insert(schema.questions).values(qData);
    await db.execute(sql`UPDATE mock_tests SET total_questions = 10 WHERE id = ${test.id}`);
  }
  console.log(`✅ ${insertedTests.length * 10} questions created`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  const [{ courseCount }]  = await db.select({ courseCount:  sql`COUNT(*)::int` }).from(schema.courses);
  const [{ chapterCount }] = await db.select({ chapterCount: sql`COUNT(*)::int` }).from(schema.chapters);
  const [{ testCount }]    = await db.select({ testCount:    sql`COUNT(*)::int` }).from(schema.mockTests);
  const [{ questionCount }]= await db.select({ questionCount:sql`COUNT(*)::int` }).from(schema.questions);

  console.log('\n🎉 Seed complete! Summary:');
  console.log(`   Admin:           admin@svlogics.com / Admin@123`);
  console.log(`   Content Manager: content@svlogics.com / Content@123`);
  console.log(`   Courses:         ${courseCount}`);
  console.log(`   Chapters:        ${chapterCount} (grouped by subject)`);
  console.log(`   Mock Tests:      ${testCount} (full subject coverage)`);
  console.log(`   Questions:       ${questionCount}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
