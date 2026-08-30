import { useEffect, useState, useCallback } from 'react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import api from '../api/axios.js';

/**
 * SecurePlayer — fetches a signed URL from the backend and renders the
 * appropriate viewer (Vidstack for video, sandboxed iframe for PDF).
 *
 * The signed URL is fetched AFTER auth + enrollment check on the backend.
 * Videos get a 6-hour URL; PDFs get 1 hour.
 *
 * @prop {number}  materialId  - studyMaterials.id  (use this OR chapterId)
 * @prop {number}  chapterId   - chapters.id        (use this OR materialId)
 * @prop {string}  type        - 'video' | 'pdf' | 'link'
 * @prop {string}  title       - Display title for the player
 */
export default function SecurePlayer({ materialId, chapterId, type, title }) {
  const [src, setSrc]         = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSignedUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = chapterId
        ? `/courses/chapters/${chapterId}/video`
        : `/courses/materials/${materialId}/stream`;
      const { data } = await api.get(endpoint);
      setSrc(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [materialId, chapterId]);

  useEffect(() => { fetchSignedUrl(); }, [fetchSignedUrl]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 300, background: '#111', borderRadius: 12,
      color: '#aaa', gap: 12, fontSize: '0.9rem',
    }}>
      <div style={{
        width: 24, height: 24, border: '3px solid #333',
        borderTopColor: '#6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading secure content...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 300, background: '#111',
      borderRadius: 12, color: '#ef4444', gap: 12, padding: 24, textAlign: 'center',
    }}>
      <span style={{ fontSize: '2rem' }}>🔒</span>
      <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{error}</p>
      <button
        onClick={fetchSignedUrl}
        style={{
          padding: '8px 20px', borderRadius: 8, border: 'none',
          background: '#6366f1', color: '#fff', cursor: 'pointer',
          fontSize: '0.85rem', fontWeight: 600,
        }}>
        Try Again
      </button>
    </div>
  );

  // ── PDF Viewer ─────────────────────────────────────────────────────────────
  if (type === 'pdf') return (
    <iframe
      src={src}
      title={title || 'Study Material'}
      style={{ width: '100%', height: '82vh', border: 'none', borderRadius: 12 }}
      sandbox="allow-scripts allow-same-origin"
      onContextMenu={(e) => e.preventDefault()}
    />
  );

  // ── External link (non-R2) ────────────────────────────────────────────────
  if (type === 'link') return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <a href={src} target="_blank" rel="noreferrer"
        style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 10,
          background: '#6366f1', color: '#fff', fontWeight: 600,
          textDecoration: 'none', fontSize: '0.95rem',
        }}>
        Open Resource ↗
      </a>
    </div>
  );

  // ── Video Player (Vidstack) ────────────────────────────────────────────────
  // Features:
  //   • Speed control: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
  //   • Keyboard shortcuts: Space(play), ←/→(±10s), ↑/↓(volume), F(fullscreen), M(mute)
  //   • Download button hidden
  //   • Right-click context menu disabled
  //   • Purple brand color (#6366f1)
  //   • Auto re-fetches signed URL if it expires (onError)
  //   • R2 supports HTTP Range headers → instant seek in 2-hour videos ✅
  return (
    <>
      <style>{`
        /* SV Logics purple brand theme for Vidstack */
        .vds-player {
          --media-brand:          #6366f1;
          --media-focus-ring:     #6366f1;
          --media-slider-thumb:   #6366f1;
          --media-controls-bg:    linear-gradient(transparent, rgba(0,0,0,0.85));
          border-radius: 12px;
          overflow: hidden;
        }
        .vds-time-slider .vds-slider-track-fill {
          background: #6366f1;
        }
        .vds-volume-slider .vds-slider-track-fill {
          background: #6366f1;
        }
      `}</style>

      <MediaPlayer
        title={title}
        src={src}
        onError={fetchSignedUrl}  // auto-refresh if signed URL expires after 6h
        style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}
      >
        <MediaProvider onContextMenu={(e) => e.preventDefault()} />
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
          slots={{
            // Remove download button — files must stay within the platform
            downloadButton: null,
          }}
        />
      </MediaPlayer>
    </>
  );
}
