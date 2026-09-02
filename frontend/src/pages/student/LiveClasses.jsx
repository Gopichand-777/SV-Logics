import { useState, useEffect, useMemo } from 'react';
import { Video, ExternalLink, Clock, Calendar, RefreshCw, Wifi } from 'lucide-react';
import { liveClassesApi } from '../../api/liveclasses.api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute the next occurrence of a recurring class.
 * recurrenceRule: "weekly:monday" | "weekly:monday,wednesday"
 * scheduledAt: the first/base occurrence (used to get the time-of-day)
 */
function getNextOccurrence(scheduledAt, recurrenceRule) {
  if (!recurrenceRule) return new Date(scheduledAt);

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const days = recurrenceRule.replace('weekly:', '').split(',').filter(Boolean);
  const dayNumbers = days.map((d) => dayNames.indexOf(d.trim())).filter((n) => n >= 0);

  const base = new Date(scheduledAt);
  const now = new Date();

  // Try each day of the week to find the nearest upcoming occurrence
  let nearest = null;
  for (const dayNum of dayNumbers) {
    const candidate = new Date(now);
    candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
    const diff = (dayNum - now.getDay() + 7) % 7;
    candidate.setDate(now.getDate() + (diff === 0 && candidate <= now ? 7 : diff));
    if (!nearest || candidate < nearest) nearest = candidate;
  }
  return nearest || base;
}

/**
 * Classify a class into 'live' | 'upcoming' | 'past'
 */
function classifyClass(cls) {
  const now = new Date();
  let start;
  if (cls.isRecurring && cls.recurrenceRule) {
    start = getNextOccurrence(cls.scheduledAt, cls.recurrenceRule);
  } else {
    start = new Date(cls.scheduledAt);
  }
  const end = new Date(start.getTime() + cls.durationMinutes * 60 * 1000);

  if (now >= start && now <= end) return { status: 'live', nextStart: start, end };
  if (now < start) return { status: 'upcoming', nextStart: start, end };
  if (cls.isRecurring) {
    // Recurring past slots cycle — treat as upcoming (next week)
    const next = getNextOccurrence(cls.scheduledAt, cls.recurrenceRule);
    return { status: 'upcoming', nextStart: next, end: new Date(next.getTime() + cls.durationMinutes * 60 * 1000) };
  }
  return { status: 'past', nextStart: start, end };
}

const platformLabel = (p) => p === 'google_meet' ? 'Google Meet' : 'Zoom';
const platformColor = (p) => p === 'google_meet' ? '#16a34a' : '#2563eb';
const platformBg    = (p) => p === 'google_meet' ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.12)';

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) + ' IST';

// ── Sub-components ────────────────────────────────────────────────────────────

function LiveClassCard({ cls, info }) {
  const { status, nextStart } = info;
  const isLive = status === 'live';
  const isPast = status === 'past';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${isLive ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      boxShadow: isLive ? '0 0 24px rgba(239,68,68,0.1)' : 'var(--shadow-sm)',
      opacity: isPast ? 0.6 : 1,
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Live glow stripe */}
      {isLive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #ef4444, #f97316)',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Platform badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
            background: platformBg(cls.platform), color: platformColor(cls.platform),
            border: `1px solid ${platformColor(cls.platform)}40`,
          }}>
            <Video size={11} /> {platformLabel(cls.platform)}
          </span>

          {/* LIVE badge */}
          {isLive && (
            <span className="live-badge">
              <span className="live-badge-dot" />
              LIVE NOW
            </span>
          )}

          {/* Recurring badge */}
          {cls.isRecurring && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(139,92,246,0.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.2)' }}>
              <RefreshCw size={10} /> Weekly
            </span>
          )}
        </div>

        {/* Duration */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          <Clock size={13} /> {cls.durationMinutes} min
        </span>
      </div>

      {/* Title + description */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, lineHeight: 1.4, color: 'var(--color-text)' }}>
        {cls.title}
      </h3>
      {cls.description && (
        <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          {cls.description}
        </p>
      )}

      {/* Schedule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
        <Calendar size={13} />
        {isPast ? 'Ended: ' : isLive ? 'Started: ' : 'Starts: '}
        {fmtDate(nextStart)}
        {cls.isRecurring && cls.recurrenceRule && (
          <span style={{ marginLeft: 4 }}>
            · {cls.recurrenceRule.replace('weekly:', '').replace(/,/g, ', ')}
          </span>
        )}
      </div>

      {/* CTA button */}
      {!isPast ? (
        <a
          href={cls.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: isLive
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : platformColor(cls.platform),
            color: 'white', fontWeight: 700, fontSize: '0.875rem',
            textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <ExternalLink size={15} />
          {isLive ? 'Join Now' : 'Open Meeting Link'}
        </a>
      ) : (
        <div style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-border)', color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
          Session Ended
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, count, children, accentColor }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
          {icon}
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{title}</h2>
        <span style={{ padding: '2px 10px', borderRadius: 99, background: `${accentColor}18`, color: accentColor, fontSize: '0.75rem', fontWeight: 800 }}>{count}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LiveClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    liveClassesApi.getAll()
      .then((res) => setClasses(res.data.liveClasses || []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const classified = useMemo(() => {
    const live = [], upcoming = [], past = [];
    classes.forEach((cls) => {
      const info = classifyClass(cls);
      if (info.status === 'live')     live.push({ cls, info });
      else if (info.status === 'upcoming') upcoming.push({ cls, info });
      else past.push({ cls, info });
    });
    // Sort upcoming by nextStart ascending
    upcoming.sort((a, b) => a.info.nextStart - b.info.nextStart);
    return { live, upcoming, past };
  }, [classes]);

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1d3a8a 50%, #1e1b4b 100%)', padding: '48px 0 72px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi size={22} color="#ef4444" />
            </div>
            {classified.live.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 99, background: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                <span className="live-badge-dot" style={{ width: 8, height: 8 }} />
                {classified.live.length} LIVE NOW
              </span>
            )}
          </div>
          <h1 className="heading-lg" style={{ color: 'white', marginBottom: 8 }}>Live Classes</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem' }}>
            Join live Zoom & Google Meet sessions with your instructors
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px 60px', marginTop: -32 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            <div className="loader-spinner" />
            <p style={{ color: 'var(--color-text-muted)' }}>Loading live classes…</p>
          </div>
        ) : classes.length === 0 ? (
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: '80px 40px', textAlign: 'center',
            marginTop: 8, boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Video size={28} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Live Classes Scheduled</h3>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 360, margin: '0 auto' }}>
              Check back soon — your instructors will schedule live sessions here.
            </p>
          </div>
        ) : (
          <>
            {/* 🔴 Live Now */}
            <Section title="Live Now" icon={<Wifi size={18} />} count={classified.live.length} accentColor="#ef4444">
              {classified.live.map(({ cls, info }) => (
                <LiveClassCard key={cls.id} cls={cls} info={info} />
              ))}
            </Section>

            {/* 📅 Upcoming */}
            <Section title="Upcoming" icon={<Calendar size={18} />} count={classified.upcoming.length} accentColor="#3b82f6">
              {classified.upcoming.map(({ cls, info }) => (
                <LiveClassCard key={cls.id} cls={cls} info={info} />
              ))}
            </Section>

            {/* ⏳ Past */}
            <Section title="Past Sessions" icon={<Clock size={18} />} count={classified.past.length} accentColor="#6b7280">
              {classified.past.map(({ cls, info }) => (
                <LiveClassCard key={cls.id} cls={cls} info={info} />
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
