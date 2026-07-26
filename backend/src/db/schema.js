import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, date, unique } from 'drizzle-orm/pg-core';

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 30 }).default('student').notNull(), // student | content_manager | super_admin
  googleId: varchar('google_id', { length: 255 }),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── COURSES ──────────────────────────────────────────────────────────────────
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // SSC CGL | SSC MTS | SSC CHSL | Banking (IBPS/SBI)
  examType: varchar('exam_type', { length: 100 }), // SSC | Banking
  price: integer('price').notNull().default(0),           // in paise
  originalPrice: integer('original_price'),               // in paise
  durationHours: integer('duration_hours').default(0),
  chaptersCount: integer('chapters_count').default(0),
  isFeatured: boolean('is_featured').default(false),
  isPublished: boolean('is_published').default(false),
  thumbnailUrl: text('thumbnail_url'),
  instructor: varchar('instructor', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── CHAPTERS ─────────────────────────────────────────────────────────────────
export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url'),     // External URL (YouTube / S3 / Drive)
  durationMin: integer('duration_min').default(0),
  orderIndex: integer('order_index').notNull().default(1),
  isFree: boolean('is_free').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── STUDY MATERIALS ──────────────────────────────────────────────────────────
export const studyMaterials = pgTable('study_materials', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  type: varchar('type', { length: 50 }).default('pdf'), // pdf | notes | pyq | practice
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── MOCK TESTS ───────────────────────────────────────────────────────────────
export const mockTests = pgTable('mock_tests', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  totalQuestions: integer('total_questions').default(0),
  difficulty: varchar('difficulty', { length: 50 }).default('medium'), // easy | medium | hard
  category: varchar('category', { length: 100 }),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  testId: integer('test_id').references(() => mockTests.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctOption: varchar('correct_option', { length: 1 }).notNull(), // a | b | c | d
  explanation: text('explanation'),
  marks: integer('marks').default(1),
  negativeMarks: decimal('negative_marks', { precision: 3, scale: 2 }).default('0.25'),
  orderIndex: integer('order_index').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  amount: integer('amount').notNull(),   // in paise
  currency: varchar('currency', { length: 10 }).default('INR'),
  status: varchar('status', { length: 30 }).default('pending'), // pending | success | failed
  gateway: varchar('gateway', { length: 50 }).default('mock'),  // mock | razorpay | stripe | cashfree
  gatewayOrderId: varchar('gateway_order_id', { length: 255 }),
  gatewayTxnId: varchar('gateway_txn_id', { length: 255 }),
  paymentMethod: varchar('payment_method', { length: 100 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),   // null = lifetime
  paymentId: integer('payment_id').references(() => payments.id),
}, (table) => ({
  unq: unique().on(table.userId, table.courseId),
}));

// ─── TEST ATTEMPTS ────────────────────────────────────────────────────────────
export const testAttempts = pgTable('test_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  testId: integer('test_id').references(() => mockTests.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').default(0),
  totalMarks: integer('total_marks').default(0),
  correctCount: integer('correct_count').default(0),
  wrongCount: integer('wrong_count').default(0),
  unattempted: integer('unattempted').default(0),
  timeTakenSec: integer('time_taken_sec'),
  status: varchar('status', { length: 20 }).default('completed'),
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
});

// ─── ATTEMPT ANSWERS ──────────────────────────────────────────────────────────
export const attemptAnswers = pgTable('attempt_answers', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id').references(() => testAttempts.id, { onDelete: 'cascade' }).notNull(),
  questionId: integer('question_id').references(() => questions.id).notNull(),
  selectedOption: varchar('selected_option', { length: 1 }), // null if skipped
  isCorrect: boolean('is_correct'),
});

// ─── USER STREAKS ─────────────────────────────────────────────────────────────
export const userStreaks = pgTable('user_streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).unique().notNull(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActive: date('last_active'),
});

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  body: text('body'),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
