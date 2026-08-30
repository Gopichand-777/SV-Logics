import { db } from '../db/index.js';
import { payments, enrollments, courses } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// ── Mock Payment Flow ─────────────────────────────────────────────────────────
// To switch to real gateway: change PAYMENT_GATEWAY in .env
// and replace initiateMock / verifyMock with Razorpay/Stripe/Cashfree SDK calls

export const initiatePayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'Course ID is required.' });

    const [course] = await db.select().from(courses).where(eq(courses.id, parseInt(courseId)));
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    if (!course.isPublished) return res.status(404).json({ error: 'Course not available.' });

    // Check already enrolled
    const [existing] = await db.select().from(enrollments).where(
      and(eq(enrollments.studentId, req.user.id), eq(enrollments.courseId, parseInt(courseId)))
    );
    if (existing) return res.status(409).json({ error: 'You are already enrolled in this course.' });

    const gateway = process.env.PAYMENT_GATEWAY || 'mock';

    if (gateway === 'mock') {
      // Create pending payment record
      const [payment] = await db.insert(payments).values({
        studentId: req.user.id,
        courseId: parseInt(courseId),
        amount: course.price,
        currency: 'INR',
        status: 'pending',
        gateway: 'mock',
        gatewayOrderId: `MOCK_ORDER_${Date.now()}`,
      }).returning();

      return res.json({
        orderId: payment.gatewayOrderId,
        paymentId: payment.id,
        amount: course.price,
        currency: 'INR',
        gateway: 'mock',
        courseName: course.title,
      });
    }

    // Future: Razorpay / Stripe / Cashfree integration here
    return res.status(501).json({ error: 'Payment gateway not configured.' });
  } catch (err) {
    console.error('Initiate payment error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'Payment ID is required.' });

    const [payment] = await db.select().from(payments).where(eq(payments.id, parseInt(paymentId)));
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (payment.studentId !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

    const gateway = process.env.PAYMENT_GATEWAY || 'mock';

    if (gateway === 'mock') {
      // Mock always succeeds — simulate 1.5s delay on frontend
      await db.update(payments).set({
        status: 'success',
        gatewayTxnId: `MOCK_TXN_${Date.now()}`,
        paidAt: new Date(),
      }).where(eq(payments.id, payment.id));

      // Create enrollment
      const [enrollment] = await db.insert(enrollments).values({
        studentId: req.user.id,
        courseId: payment.courseId,
        paymentId: payment.id,
      }).onConflictDoNothing().returning();

      return res.json({
        success: true,
        message: 'Payment successful! You are now enrolled.',
        enrollment,
      });
    }

    // Future: verify signature with Razorpay / Stripe webhook
    return res.status(501).json({ error: 'Payment gateway not configured.' });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const history = await db.select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      gateway: payments.gateway,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      courseTitle: courses.title,
    }).from(payments)
      .leftJoin(courses, eq(payments.courseId, courses.id))
      .where(eq(payments.studentId, req.user.id));

    return res.json({ payments: history });
  } catch (err) {
    console.error('Payment history error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const checkEnrollment = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const [enrollment] = await db.select({ id: enrollments.id, enrolledAt: enrollments.enrolledAt })
      .from(enrollments)
      .where(and(eq(enrollments.studentId, req.user.id), eq(enrollments.courseId, courseId)));
    return res.json({ isEnrolled: !!enrollment, enrolledAt: enrollment?.enrolledAt || null });
  } catch (err) {
    console.error('Check enrollment error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getEnrollments = async (req, res) => {
  try {
    const userEnrollments = await db.select({
      id: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      courseId: courses.id,
      courseTitle: courses.title,
      courseCategory: courses.category,
      courseThumbnail: courses.thumbnailUrl,
    }).from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, req.user.id));

    return res.json({ enrollments: userEnrollments });
  } catch (err) {
    console.error('Get enrollments error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
