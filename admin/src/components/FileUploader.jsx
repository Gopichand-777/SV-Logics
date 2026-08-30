import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Video, CheckCircle, AlertCircle, X } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';
import { uploadToR2, formatBytes, estimateUploadTime } from '../api/upload.api.js';

const FILE_CONFIG = {
  pdf: {
    mime:   ['application/pdf'],
    label:  'PDF Document',
    ext:    '.pdf',
    maxMB:  50,
    icon:   FileText,
    color:  '#ef4444',
  },
  video: {
    mime:   ['video/mp4', 'video/webm', 'video/quicktime'],
    label:  'Video (MP4 / WebM / MOV)',
    ext:    '.mp4, .webm, .mov',
    maxMB:  4096,  // 4 GB
    icon:   Video,
    color:  '#8b5cf6',
  },
};

/**
 * FileUploader — drag-and-drop file uploader with direct browser→R2 upload.
 *
 * @prop {string}   type       - 'pdf' or 'video'
 * @prop {Function} onUploaded - Called with the R2 key string when upload succeeds
 * @prop {Function} onClear    - Called when user clears an uploaded file
 */
export default function FileUploader({ type = 'pdf', onUploaded, onClear }) {
  const [status, setStatus]       = useState('idle');    // idle | uploading | done | error
  const [progress, setProgress]   = useState(0);         // 0–100
  const [loaded, setLoaded]       = useState(0);         // bytes uploaded
  const [total, setTotal]         = useState(0);         // total bytes
  const [fileName, setFileName]   = useState('');
  const [fileSize, setFileSize]   = useState(0);
  const [errMsg, setErrMsg]       = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const inputRef                  = useRef();
  const cfg                       = FILE_CONFIG[type] || FILE_CONFIG.pdf;
  const Icon                      = cfg.icon;

  // Prevent accidental tab close during upload
  useEffect(() => {
    const handler = (e) => {
      if (status === 'uploading') {
        e.preventDefault();
        e.returnValue = 'File upload in progress. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate MIME type
    if (!cfg.mime.includes(file.type)) {
      setErrMsg(`Invalid file type. Please upload: ${cfg.label}`);
      setStatus('error');
      return;
    }
    // Validate size
    const maxBytes = cfg.maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrMsg(`File too large. Maximum size is ${cfg.maxMB >= 1024 ? `${cfg.maxMB / 1024}GB` : `${cfg.maxMB}MB`} for ${type}.`);
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setFileName(file.name);
    setFileSize(file.size);
    setTotal(file.size);
    setLoaded(0);
    setProgress(0);
    setErrMsg('');

    try {
      // 1. Get presigned PUT URL from backend (auth check happens here)
      const { data } = await adminApi.getUploadPresignedUrl(file.name, file.type, file.size);

      // 2. Upload directly from browser to R2 (no server bandwidth used)
      await uploadToR2(file, data.uploadUrl, (pct, loadedBytes) => {
        setProgress(pct);
        setLoaded(loadedBytes || 0);
      });

      // 3. Upload complete — pass R2 key to parent (key is what gets stored in DB)
      setStatus('done');
      onUploaded(data.key);
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Upload failed. Please try again.');
    }
  };

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setLoaded(0);
    setTotal(0);
    setFileName('');
    setFileSize(0);
    setErrMsg('');
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── IDLE: drag-and-drop zone ─────────────────────────────────────────────────
  if (status === 'idle') return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? cfg.color : 'var(--border)'}`,
          borderRadius: 10,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? `${cfg.color}08` : 'transparent',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <Icon size={32} color={dragOver ? cfg.color : 'var(--text-muted)'} style={{ marginBottom: 10 }} />
        <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
          Drag & drop or click to upload
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          {cfg.label}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
          Max: {cfg.maxMB >= 1024 ? `${cfg.maxMB / 1024} GB` : `${cfg.maxMB} MB`}
          {type === 'video' && ' · Uploads directly to private cloud storage'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={cfg.mime.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );

  // ── UPLOADING: progress bar ───────────────────────────────────────────────────
  if (status === 'uploading') return (
    <div style={{ padding: '16px 0' }}>
      {/* Large file warning */}
      {fileSize > 500 * 1024 * 1024 && (
        <div style={{
          marginBottom: 10, padding: '8px 12px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 6, fontSize: '0.8rem', color: '#d97706',
        }}>
          ⚠️ Large file ({formatBytes(fileSize)}) — keep this tab open. Est. time: {estimateUploadTime(fileSize)}
        </div>
      )}

      {/* File name + percentage */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
          {fileName}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--border)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--primary), #818cf8)',
          borderRadius: 99,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Bytes transferred */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {formatBytes(loaded)} / {formatBytes(total)}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Uploading to private storage...
        </span>
      </div>
    </div>
  );

  // ── DONE ─────────────────────────────────────────────────────────────────────
  if (status === 'done') return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      background: 'rgba(16,185,129,0.08)',
      border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 8,
    }}>
      <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Stored in private cloud · {formatBytes(fileSize)}
        </p>
      </div>
      <button onClick={reset} title="Remove and upload a different file"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  if (status === 'error') return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 8,
    }}>
      <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ flex: 1, fontSize: '0.85rem', color: '#ef4444' }}>{errMsg}</p>
      <button onClick={reset}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );

  return null;
}
