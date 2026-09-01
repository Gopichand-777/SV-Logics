import { ScrollText, UserCheck, BookOpen, AlertTriangle, CreditCard, Shield, RefreshCw, Mail } from 'lucide-react';

const LAST_UPDATED = 'September 1, 2026';
const CONTACT_EMAIL = 'support@svlogics.com';

const sections = [
  {
    icon: <UserCheck size={20} />,
    title: '1. Acceptance of Terms',
    content: `By accessing or using the SV Logics platform, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.

• These Terms apply to all users of the platform, including students enrolled in courses.
• If you do not agree with any part of these Terms, you must discontinue use of the platform immediately.
• These Terms constitute the entire agreement between you and SV Logics regarding your use of the platform.
• We reserve the right to update these Terms at any time. Continued use constitutes acceptance of any changes.`,
  },
  {
    icon: <BookOpen size={20} />,
    title: '2. Platform Access & Accounts',
    content: `Access to SV Logics is by invitation only. Student accounts are created exclusively by SV Logics administrators.

• **Account Creation**: Only administrators can create student accounts. Self-registration is not permitted.
• **Credentials**: You are responsible for maintaining the confidentiality of your login credentials. Do not share your username or password with anyone.
• **Account Security**: You are solely responsible for all activities that occur under your account. Notify us immediately at ${CONTACT_EMAIL} if you suspect unauthorized access.
• **Accurate Information**: You agree to keep your profile information accurate and up to date.
• **One Account Per Student**: Creating multiple accounts for the same student is strictly prohibited.`,
  },
  {
    icon: <BookOpen size={20} />,
    title: '3. Course Enrollment & Content',
    content: `SV Logics provides digital learning content including video lectures, mock tests, and study materials for government exam preparation.

• **Enrollment**: Access to specific courses is granted by your administrator based on your enrollment.
• **Content Ownership**: All course content including videos, PDFs, test questions, and explanations are the intellectual property of SV Logics and its content partners.
• **Personal Use Only**: Course content is licensed for your personal, non-commercial educational use only.
• **No Redistribution**: You may not download, copy, record, share, resell, or redistribute any course content in any form.
• **Content Updates**: We reserve the right to update, modify, or remove course content at any time to ensure accuracy.`,
  },
  {
    icon: <AlertTriangle size={20} />,
    title: '4. Prohibited Conduct',
    content: `The following activities are strictly prohibited on the SV Logics platform:

• **Cheating**: Sharing test questions, answers, or solutions with others during or after a test session.
• **Impersonation**: Allowing another person to take tests or attend sessions on your behalf.
• **Unauthorized Access**: Attempting to access other students' accounts, admin panels, or restricted content.
• **Screen Recording**: Recording, screenshotting, or capturing platform content using any method.
• **Reverse Engineering**: Attempting to decompile, disassemble, or extract source code from the platform.
• **Harmful Activity**: Uploading malware, engaging in denial-of-service attacks, or otherwise harming platform infrastructure.
• **Violation of these rules may result in immediate account suspension without refund.**`,
  },
  {
    icon: <CreditCard size={20} />,
    title: '5. Fees & Payments',
    content: `Course fees and payment terms are determined by SV Logics and communicated directly to enrolled students.

• **Fee Structure**: Course fees are communicated at the time of enrollment. Fees may vary by batch, course, and duration.
• **Payment**: Payments are processed through secure, authorized payment channels as directed by your administrator.
• **Refund Policy**: Refund requests must be submitted within 7 days of enrollment. After this period, refunds are not guaranteed and are subject to review.
• **No Unauthorized Payments**: SV Logics will never request payment through informal channels (e.g., personal UPI IDs not officially communicated).
• **Fee Changes**: We reserve the right to revise fees for new enrollments. Existing enrollments will not be retroactively charged.`,
  },
  {
    icon: <Shield size={20} />,
    title: '6. Intellectual Property',
    content: `All content and materials on SV Logics are protected by applicable intellectual property laws.

• **Ownership**: The SV Logics name, logo, course content, test questions, video lectures, and all related materials are the exclusive property of SV Logics.
• **Limited License**: We grant you a limited, non-exclusive, non-transferable license to access and use the platform solely for your personal learning.
• **User Feedback**: Any feedback, suggestions, or ideas you provide to us may be used by SV Logics without any obligation or compensation to you.
• **Third-Party Content**: Some content may be licensed from third parties. Such content remains the property of the respective owners.`,
  },
  {
    icon: <AlertTriangle size={20} />,
    title: '7. Disclaimers & Limitation of Liability',
    content: `SV Logics provides its platform and content on an "as is" and "as available" basis.

• **No Guarantee of Results**: While our courses are designed to maximize your chances of success, we do not guarantee selection, qualifying marks, or any specific exam outcome.
• **Content Accuracy**: We strive for accuracy but cannot guarantee that all content is error-free, complete, or up to date with the latest exam patterns.
• **Service Availability**: We do not guarantee uninterrupted or error-free access to the platform. Scheduled and emergency maintenance may affect availability.
• **Limitation of Liability**: To the maximum extent permitted by law, SV Logics shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.`,
  },
  {
    icon: <RefreshCw size={20} />,
    title: '8. Termination',
    content: `We reserve the right to suspend or terminate your account at any time for violations of these Terms.

• **By Us**: We may suspend or terminate access immediately and without notice for violations of these Terms, fraudulent activity, or at our sole discretion.
• **By You**: You may request account deletion by contacting your administrator or emailing ${CONTACT_EMAIL}.
• **Effect of Termination**: Upon termination, your right to access the platform and all enrolled content ceases immediately.
• **Survival**: Provisions relating to intellectual property, disclaimers, and limitation of liability survive termination.`,
  },
  {
    icon: <ScrollText size={20} />,
    title: '9. Governing Law',
    content: `These Terms and Conditions are governed by the laws of India.

• **Jurisdiction**: Any disputes arising from or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in India.
• **Dispute Resolution**: Before pursuing formal legal action, both parties agree to attempt to resolve disputes through good-faith negotiation.
• **Severability**: If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
• **Entire Agreement**: These Terms, together with our Privacy Policy, constitute the entire agreement between you and SV Logics.`,
  },
];

export default function TermsAndConditions() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        padding: '64px 0 48px',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.12)', borderRadius: 40,
            padding: '8px 20px', marginBottom: 20,
          }}>
            <ScrollText size={16} color="white" />
            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>Legal Agreement</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 12 }}>
            Terms & Conditions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: 520, margin: '0 auto 16px' }}>
            Please read these terms carefully before using the SV Logics platform. Your access constitutes acceptance.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>Last Updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ maxWidth: 860, padding: '56px 24px 80px' }}>

        {/* Intro box */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid #f59e0b',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: 48,
          fontSize: '0.95rem',
          lineHeight: 1.7,
          color: 'var(--color-text-muted)',
        }}>
          These Terms and Conditions govern your use of <strong style={{ color: 'var(--color-text)' }}>SV Logics</strong>, an online exam preparation platform for SSC and Banking exams. By using the platform, you confirm that you have read, understood, and agree to be bound by these Terms. These Terms apply alongside our Privacy Policy.
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {sections.map((s, i) => (
            <div key={i} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-alt)',
              }}>
                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {s.title}
                </h2>
              </div>
              {/* Section body */}
              <div style={{ padding: '20px 24px' }}>
                {s.content.split('\n').map((line, j) => {
                  if (line.trim() === '') return <div key={j} style={{ height: 8 }} />;
                  if (line.startsWith('•')) {
                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>');
                    const isWarning = line.toLowerCase().includes('violation') || line.toLowerCase().includes('suspended') || line.toLowerCase().includes('prohibited');
                    return (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: isWarning ? '#ef4444' : '#f59e0b', marginTop: 4, flexShrink: 0 }}>•</span>
                        <span
                          style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}
                          dangerouslySetInnerHTML={{ __html: bold.replace(/^•\s*/, '') }}
                        />
                      </div>
                    );
                  }
                  return (
                    <p key={j} style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 8px' }}
                      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>') }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact box */}
        <div style={{
          marginTop: 48,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
        }}>
          <Mail size={32} color="rgba(255,255,255,0.55)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 8 }}>Have Questions About These Terms?</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 16 }}>
            If you have any questions or require clarification about our Terms and Conditions, please get in touch.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white', padding: '10px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none',
          }}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
