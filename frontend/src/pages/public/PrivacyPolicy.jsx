import { Shield, Lock, Eye, Bell, Trash2, Mail } from 'lucide-react';

const LAST_UPDATED = 'September 1, 2026';
const CONTACT_EMAIL = 'support@svlogics.com';

const sections = [
  {
    icon: <Eye size={20} />,
    title: '1. Information We Collect',
    content: `We collect information you provide directly when you use SV Logics:

• **Account Information**: Username, full name, and password (hashed — never stored in plain text) when your account is created by an administrator.
• **Usage Data**: Pages visited, courses viewed, mock tests attempted, time spent, and answers submitted during tests.
• **Device & Technical Data**: IP address, browser type, operating system, and device identifiers for security and analytics purposes.
• **Performance Data**: Test scores, progress milestones, and learning analytics to improve your experience.

We do not collect financial information or require you to provide any payment details on this platform.`,
  },
  {
    icon: <Shield size={20} />,
    title: '2. How We Use Your Information',
    content: `Your information is used solely to provide and improve the SV Logics learning experience:

• **Service Delivery**: To grant access to enrolled courses, mock tests, and study materials.
• **Progress Tracking**: To display your performance analytics, scores, and completion records on your dashboard.
• **Platform Improvement**: Aggregated, anonymized usage patterns help us improve content and features.
• **Communication**: Critical notifications about your enrolled courses, new test batches, or platform updates.
• **Security**: To detect and prevent unauthorized access, fraud, or abuse of the platform.

We do not sell, trade, or rent your personal information to any third party.`,
  },
  {
    icon: <Bell size={20} />,
    title: '3. Cookies & Local Storage',
    content: `SV Logics uses cookies and browser local storage to enhance functionality:

• **Authentication Token**: A secure JWT token stored in local storage to keep you logged in across sessions.
• **Theme Preference**: Your selected light/dark mode preference is saved locally on your device.
• **Dismissed Announcements**: IDs of banners you have closed are stored locally so they do not reappear.
• **Session Cookies**: Temporary session data used to maintain your active test sessions.

You can clear cookies and local storage through your browser settings at any time. Note that clearing authentication data will log you out.`,
  },
  {
    icon: <Lock size={20} />,
    title: '4. Data Security',
    content: `We take the security of your data seriously and implement industry-standard measures:

• **Encrypted Passwords**: All passwords are hashed using bcrypt before storage. Administrators cannot view your password.
• **HTTPS Encryption**: All data transmitted between your browser and our servers is encrypted via TLS/SSL.
• **Token-Based Auth**: Access is controlled by signed JSON Web Tokens (JWT) with expiry periods.
• **Role-Based Access**: Students can only access their own data. Admin data is restricted to authorized administrators.
• **Server Security**: Our backend servers are protected with firewalls, rate limiting, and regular security audits.

While we implement strong safeguards, no system is 100% secure. If you suspect unauthorized access to your account, contact us immediately.`,
  },
  {
    icon: <Shield size={20} />,
    title: '5. Data Sharing',
    content: `We do not share your personal data with third parties except in these limited circumstances:

• **Service Providers**: Trusted infrastructure providers (hosting, CDN) who process data only on our behalf and under strict data processing agreements.
• **Legal Requirements**: If required by law, court order, or government regulation, we may disclose data to comply with legal obligations.
• **Aggregated Analytics**: Non-identifiable, aggregated statistics (e.g., "total students enrolled") may be shared publicly.

Your individual data is never sold, licensed, or disclosed to advertisers, marketing companies, or data brokers.`,
  },
  {
    icon: <Trash2 size={20} />,
    title: '6. Data Retention & Deletion',
    content: `We retain your data for as long as your account remains active or as needed to provide services:

• **Active Accounts**: Your profile, progress, and test history are retained for the duration of your enrollment.
• **Inactive Accounts**: Accounts inactive for more than 3 years may be archived or deleted after notice.
• **Account Deletion**: If your account is deleted by an administrator, your personal data is purged within 30 days, except where retention is required by law.

To request deletion of your data, contact your course administrator or email us at ${CONTACT_EMAIL}.`,
  },
  {
    icon: <Eye size={20} />,
    title: '7. Your Rights',
    content: `As a user of SV Logics, you have the following rights regarding your personal data:

• **Access**: You can view your profile information and test history from your student dashboard at any time.
• **Correction**: Contact your administrator to update incorrect account details.
• **Data Portability**: You may request an export of your test scores and progress records.
• **Restriction**: You may request that we limit processing of your data in certain circumstances.
• **Complaint**: You have the right to lodge a complaint with the relevant data protection authority in your jurisdiction.

To exercise any of these rights, please contact us at ${CONTACT_EMAIL}.`,
  },
  {
    icon: <Bell size={20} />,
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy periodically to reflect changes in our practices or applicable law.

• Any significant changes will be communicated via an announcement banner on the platform.
• The "Last Updated" date at the top of this page will always reflect the most recent revision.
• Continued use of SV Logics after changes are posted constitutes your acceptance of the revised policy.

We encourage you to review this policy periodically.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        padding: '64px 0 48px',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.15)', borderRadius: 40,
            padding: '8px 20px', marginBottom: 20,
          }}>
            <Shield size={16} color="white" />
            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>Your Privacy Matters</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 520, margin: '0 auto 16px' }}>
            We are committed to protecting your personal information and being transparent about how we use it.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Last Updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ maxWidth: 860, padding: '56px 24px 80px' }}>

        {/* Intro box */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: 48,
          fontSize: '0.95rem',
          lineHeight: 1.7,
          color: 'var(--color-text-muted)',
        }}>
          This Privacy Policy describes how <strong style={{ color: 'var(--color-text)' }}>SV Logics</strong> collects, uses, and protects your information when you access our online exam preparation platform. By using our service, you agree to the collection and use of information as described in this policy.
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
                <span style={{
                  color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center',
                }}>{s.icon}</span>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {s.title}
                </h2>
              </div>
              {/* Section body */}
              <div style={{ padding: '20px 24px' }}>
                {s.content.split('\n').map((line, j) => {
                  if (line.trim() === '') return <div key={j} style={{ height: 8 }} />;
                  if (line.startsWith('•')) {
                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--color-primary)', marginTop: 4, flexShrink: 0 }}>•</span>
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
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
        }}>
          <Mail size={32} color="rgba(255,255,255,0.6)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 8 }}>Questions About Privacy?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: 16 }}>
            If you have any questions or concerns about this Privacy Policy, please reach out to us.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
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
