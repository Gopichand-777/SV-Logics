import { db } from '../db/index.js';
import { mockTests, questions, testAttempts, attemptAnswers, userStreaks } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export const getTests = async (req, res) => {
  try {
    const { category } = req.query;
    let conditions = [eq(mockTests.isPublished, true)];
    if (category) conditions.push(eq(mockTests.category, category));

    const tests = await db.select().from(mockTests).where(and(...conditions));
    return res.json({ tests });
  } catch (err) {
    console.error('Get tests error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const [test] = await db.select().from(mockTests).where(
      and(eq(mockTests.id, parseInt(id)), eq(mockTests.isPublished, true))
    );
    if (!test) return res.status(404).json({ error: 'Test not found.' });

    const testQuestions = await db.select({
      id: questions.id,
      questionText: questions.questionText,
      optionA: questions.optionA,
      optionB: questions.optionB,
      optionC: questions.optionC,
      optionD: questions.optionD,
      marks: questions.marks,
      negativeMarks: questions.negativeMarks,
      orderIndex: questions.orderIndex,
      // DO NOT send correctOption here — security
    }).from(questions).where(eq(questions.testId, parseInt(id))).orderBy(questions.orderIndex);

    return res.json({ test, questions: testQuestions });
  } catch (err) {
    console.error('Get test error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const submitTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeTakenSec } = req.body;
    // answers: [{ questionId, selectedOption }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required.' });
    }

    const [test] = await db.select().from(mockTests).where(eq(mockTests.id, parseInt(id)));
    if (!test) return res.status(404).json({ error: 'Test not found.' });

    // Fetch all questions with correct answers
    const testQuestions = await db.select().from(questions).where(eq(questions.testId, parseInt(id)));

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattempted = 0;
    const totalMarks = testQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const answerMap = {};
    answers.forEach(a => { answerMap[a.questionId] = a.selectedOption; });

    const answerResults = testQuestions.map(q => {
      const selected = answerMap[q.id] || null;
      let isCorrect = null;

      if (!selected) {
        unattempted++;
        return { questionId: q.id, selectedOption: null, isCorrect: null };
      }

      isCorrect = selected === q.correctOption;
      if (isCorrect) {
        score += q.marks || 1;
        correctCount++;
      } else {
        score -= parseFloat(q.negativeMarks || 0);
        wrongCount++;
      }

      return { questionId: q.id, selectedOption: selected, isCorrect };
    });

    score = Math.max(0, Math.round(score * 100) / 100);

    // Save attempt
    const [attempt] = await db.insert(testAttempts).values({
      userId: req.user.id,
      testId: parseInt(id),
      score: Math.round(score),
      totalMarks,
      correctCount,
      wrongCount,
      unattempted,
      timeTakenSec: timeTakenSec || 0,
      status: 'completed',
    }).returning();

    // Save individual answers
    if (answerResults.length > 0) {
      await db.insert(attemptAnswers).values(
        answerResults.map(a => ({ ...a, attemptId: attempt.id }))
      );
    }

    // Update streak
    await updateStreak(req.user.id);

    return res.json({
      message: 'Test submitted successfully!',
      attempt: {
        id: attempt.id,
        score,
        totalMarks,
        correctCount,
        wrongCount,
        unattempted,
        percentage: Math.round((score / totalMarks) * 100),
      },
    });
  } catch (err) {
    console.error('Submit test error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const [attempt] = await db.select().from(testAttempts).where(
      and(eq(testAttempts.id, parseInt(attemptId)), eq(testAttempts.userId, req.user.id))
    );
    if (!attempt) return res.status(404).json({ error: 'Result not found.' });

    const answers = await db.select({
      questionId: attemptAnswers.questionId,
      selectedOption: attemptAnswers.selectedOption,
      isCorrect: attemptAnswers.isCorrect,
      questionText: questions.questionText,
      optionA: questions.optionA,
      optionB: questions.optionB,
      optionC: questions.optionC,
      optionD: questions.optionD,
      correctOption: questions.correctOption,
      explanation: questions.explanation,
      marks: questions.marks,
      negativeMarks: questions.negativeMarks,
    }).from(attemptAnswers)
      .leftJoin(questions, eq(attemptAnswers.questionId, questions.id))
      .where(eq(attemptAnswers.attemptId, parseInt(attemptId)));

    return res.json({
      attempt: {
        ...attempt,
        percentage: Math.round((attempt.score / attempt.totalMarks) * 100),
      },
      answers,
    });
  } catch (err) {
    console.error('Get result error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getAttemptHistory = async (req, res) => {
  try {
    const attempts = await db.select({
      id: testAttempts.id,
      score: testAttempts.score,
      totalMarks: testAttempts.totalMarks,
      correctCount: testAttempts.correctCount,
      wrongCount: testAttempts.wrongCount,
      timeTakenSec: testAttempts.timeTakenSec,
      attemptedAt: testAttempts.attemptedAt,
      testTitle: mockTests.title,
      testCategory: mockTests.category,
    }).from(testAttempts)
      .leftJoin(mockTests, eq(testAttempts.testId, mockTests.id))
      .where(eq(testAttempts.userId, req.user.id))
      .orderBy(desc(testAttempts.attemptedAt));

    return res.json({ attempts });
  } catch (err) {
    console.error('Get history error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

async function updateStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));

    if (!streak) {
      await db.insert(userStreaks).values({ userId, currentStreak: 1, longestStreak: 1, lastActive: today });
      return;
    }

    const lastDate = streak.lastActive;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = 1;
    if (lastDate === today) return; // Already active today
    if (lastDate === yesterday) newStreak = streak.currentStreak + 1;

    const longest = Math.max(newStreak, streak.longestStreak);
    await db.update(userStreaks)
      .set({ currentStreak: newStreak, longestStreak: longest, lastActive: today })
      .where(eq(userStreaks.userId, userId));
  } catch (e) {
    console.error('Streak update error:', e);
  }
}
