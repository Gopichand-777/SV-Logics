import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Starting split-users migration...');

    await client.query('CREATE TABLE IF NOT EXISTS students (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, phone VARCHAR(20), is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW())');
    await client.query('CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW())');
    await client.query('CREATE TABLE IF NOT EXISTS content_managers (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW())');
    console.log('Tables created.');

    const adminRes = await client.query("INSERT INTO admins (name,email,password_hash,is_active,created_at,updated_at) SELECT name,email,password_hash,is_active,created_at,updated_at FROM users WHERE role='super_admin' AND password_hash IS NOT NULL ON CONFLICT(email) DO NOTHING RETURNING id");
    console.log('Migrated ' + adminRes.rowCount + ' super_admin(s).');

    const cmRes = await client.query("INSERT INTO content_managers (name,email,password_hash,is_active,created_at,updated_at) SELECT name,email,password_hash,is_active,created_at,updated_at FROM users WHERE role='content_manager' AND password_hash IS NOT NULL ON CONFLICT(email) DO NOTHING RETURNING id");
    console.log('Migrated ' + cmRes.rowCount + ' content_manager(s).');

    const studentRows = await client.query("SELECT id,name,phone,password_hash,is_active,created_at,updated_at FROM users WHERE role='student' AND password_hash IS NOT NULL ORDER BY id");
    const oldToNew = {};
    for (const row of studentRows.rows) {
      let base = (row.name||'student').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+\$/g,'').slice(0,80) || 'student';
      let username = base; let attempt = 0;
      while (true) {
        const ex = await client.query('SELECT 1 FROM students WHERE username=$1', [username]);
        if (ex.rowCount === 0) break;
        attempt++; username = base + '_' + attempt;
      }
      const ins = await client.query('INSERT INTO students(name,username,password_hash,phone,is_active,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id', [row.name, username, row.password_hash, row.phone, row.is_active, row.created_at, row.updated_at]);
      oldToNew[row.id] = ins.rows[0].id;
      console.log('  Student: ' + row.name + ' -> @' + username);
    }
    console.log('Migrated ' + studentRows.rowCount + ' student(s).');

    await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_id INTEGER');
    await client.query('ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS student_id INTEGER');
    await client.query('ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS student_id INTEGER');
    await client.query('ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS student_id INTEGER');

    for (const [oldId, newId] of Object.entries(oldToNew)) {
      await client.query('UPDATE payments SET student_id=$1 WHERE user_id=$2', [newId, oldId]);
      await client.query('UPDATE enrollments SET student_id=$1 WHERE user_id=$2', [newId, oldId]);
      await client.query('UPDATE test_attempts SET student_id=$1 WHERE user_id=$2', [newId, oldId]);
      await client.query('UPDATE user_streaks SET student_id=$1 WHERE user_id=$2', [newId, oldId]);
    }
    console.log('FK columns populated.');

    await client.query('ALTER TABLE payments ADD CONSTRAINT IF NOT EXISTS fk_pay_student FOREIGN KEY(student_id) REFERENCES students(id)');
    await client.query('ALTER TABLE enrollments ADD CONSTRAINT IF NOT EXISTS fk_enr_student FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE');
    await client.query('ALTER TABLE test_attempts ADD CONSTRAINT IF NOT EXISTS fk_att_student FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE');
    await client.query('ALTER TABLE user_streaks ADD CONSTRAINT IF NOT EXISTS fk_str_student FOREIGN KEY(student_id) REFERENCES students(id)');
    await client.query('ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_course_id_key');
    await client.query('ALTER TABLE enrollments ADD CONSTRAINT IF NOT EXISTS enrollments_student_course_unq UNIQUE(student_id,course_id)');
    await client.query('ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_created_by_fkey');
    await client.query('ALTER TABLE announcements ADD CONSTRAINT IF NOT EXISTS ann_created_by_fkey FOREIGN KEY(created_by) REFERENCES admins(id)');
    console.log('Constraints added.');

    await client.query('ALTER TABLE payments DROP COLUMN IF EXISTS user_id');
    await client.query('ALTER TABLE enrollments DROP COLUMN IF EXISTS user_id');
    await client.query('ALTER TABLE test_attempts DROP COLUMN IF EXISTS user_id');
    await client.query('ALTER TABLE user_streaks DROP COLUMN IF EXISTS user_id');
    console.log('Old user_id columns dropped.');

    const [s, a, c] = await Promise.all([client.query('SELECT COUNT(*) FROM students'), client.query('SELECT COUNT(*) FROM admins'), client.query('SELECT COUNT(*) FROM content_managers')]);
    console.log('Final counts -> students:', s.rows[0].count, '| admins:', a.rows[0].count, '| content_managers:', c.rows[0].count);

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    console.log('Old users table kept — run: DROP TABLE users; when ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration FAILED - rolled back:', err.message);
    process.exit(1);
  } finally { client.release(); await pool.end(); }
}
run();
