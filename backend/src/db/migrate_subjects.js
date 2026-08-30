/**
 * migrate_subjects.js
 * One-shot script that backfills course_subjects from the existing chapters.subject
 * and mock_tests.subject string columns, then sets subject_id FKs on both tables.
 *
 * Run ONCE after applying the Drizzle migration:
 *   node src/db/migrate_subjects.js
 */
import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db   = drizzle(pool, { schema });

async function migrate() {
  console.log('🔄  Migrating subject strings → course_subjects table...\n');

  // ── Step 1: Collect distinct (course_id, subject) from chapters ─────────────
  const { rows: chapterSubjects } = await db.execute(sql.raw(`
    SELECT DISTINCT course_id, subject
    FROM   chapters
    WHERE  subject IS NOT NULL
      AND  subject <> ''
      AND  subject_id IS NULL
    ORDER  BY course_id, subject
  `));

  // ── Step 2: Collect distinct (course_id, subject) from mock_tests ───────────
  //   Only those not already found via chapters (same course + name)
  const { rows: testSubjects } = await db.execute(sql.raw(`
    SELECT DISTINCT mt.course_id, mt.subject
    FROM   mock_tests mt
    WHERE  mt.subject IS NOT NULL
      AND  mt.subject <> ''
      AND  mt.subject_id IS NULL
      AND  mt.course_id IS NOT NULL
  `));

  // Merge into a unified set: key = "courseId|subjectName"
  const seen = new Map();
  for (const r of chapterSubjects) {
    const key = `${r.course_id}|${r.subject}`;
    if (!seen.has(key)) seen.set(key, { courseId: r.course_id, name: r.subject });
  }
  for (const r of testSubjects) {
    const key = `${r.course_id}|${r.subject}`;
    if (!seen.has(key)) seen.set(key, { courseId: r.course_id, name: r.subject });
  }

  if (seen.size === 0) {
    console.log('✅  No subjects to migrate (already done or no data).');
    await pool.end();
    return;
  }

  console.log(`   Found ${seen.size} distinct subject(s) to insert into course_subjects`);

  // ── Step 3: Insert into course_subjects (ordered alphabetically per course) ──
  const grouped = {};
  for (const { courseId, name } of seen.values()) {
    if (!grouped[courseId]) grouped[courseId] = [];
    grouped[courseId].push(name);
  }

  const insertedMap = new Map(); // key "courseId|name" → course_subjects.id

  for (const [courseId, names] of Object.entries(grouped)) {
    names.sort();
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      // Insert — skip if already exists (idempotent)
      const { rows } = await db.execute(sql.raw(`
        INSERT INTO course_subjects (course_id, name, order_index)
        VALUES (${courseId}, '${name.replace(/'/g, "''")}', ${i + 1})
        ON CONFLICT DO NOTHING
        RETURNING id, course_id, name
      `));

      if (rows.length > 0) {
        insertedMap.set(`${courseId}|${name}`, rows[0].id);
        console.log(`   ✅  [course ${courseId}] "${name}" → id=${rows[0].id}`);
      } else {
        // Already existed — look it up
        const { rows: existing } = await db.execute(sql.raw(`
          SELECT id FROM course_subjects WHERE course_id = ${courseId} AND name = '${name.replace(/'/g, "''")}'
        `));
        if (existing.length > 0) {
          insertedMap.set(`${courseId}|${name}`, existing[0].id);
          console.log(`   ↩️  [course ${courseId}] "${name}" already exists → id=${existing[0].id}`);
        }
      }
    }
  }

  // ── Step 4: Update chapters.subject_id ────────────────────────────────────
  console.log('\n   Backfilling chapters.subject_id...');
  const { rowCount: chaptersUpdated } = await db.execute(sql.raw(`
    UPDATE chapters ch
    SET    subject_id = cs.id
    FROM   course_subjects cs
    WHERE  cs.course_id = ch.course_id
      AND  cs.name      = ch.subject
      AND  ch.subject_id IS NULL
  `));
  console.log(`   ✅  Updated ${chaptersUpdated ?? '?'} chapter rows`);

  // ── Step 5: Update mock_tests.subject_id ──────────────────────────────────
  console.log('\n   Backfilling mock_tests.subject_id...');
  const { rowCount: testsUpdated } = await db.execute(sql.raw(`
    UPDATE mock_tests mt
    SET    subject_id = cs.id
    FROM   course_subjects cs
    WHERE  cs.course_id = mt.course_id
      AND  cs.name      = mt.subject
      AND  mt.subject_id IS NULL
  `));
  console.log(`   ✅  Updated ${testsUpdated ?? '?'} mock_test rows`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  const { rows: countRows } = await db.execute(sql.raw(`SELECT COUNT(*) AS n FROM course_subjects`));
  const { rows: chNullRows } = await db.execute(sql.raw(`SELECT COUNT(*) AS n FROM chapters WHERE subject IS NOT NULL AND subject_id IS NULL`));
  const { rows: mtNullRows } = await db.execute(sql.raw(`SELECT COUNT(*) AS n FROM mock_tests WHERE subject IS NOT NULL AND subject_id IS NULL`));

  console.log(`\n🎉  Done!`);
  console.log(`   course_subjects rows:          ${countRows[0].n}`);
  console.log(`   chapters with subject but no FK: ${chNullRows[0].n} (should be 0)`);
  console.log(`   tests    with subject but no FK: ${mtNullRows[0].n} (should be 0)`);

  await pool.end();
}

migrate().catch(err => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
