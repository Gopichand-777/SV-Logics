import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  Video, BookOpen, X, Save, Tag, Check, Pencil, GripVertical,
} from 'lucide-react';
import { adminApi } from '../api/admin.api.js';
import FileUploader from '../components/FileUploader.jsx';

const CATEGORIES = ['SSC CGL', 'SSC MTS', 'SSC CHSL', 'Banking (IBPS/SBI)'];
const EXAM_TYPES = ['SSC', 'Banking'];

const SUBJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];
const subjectColor = (idx) => SUBJECT_COLORS[idx % SUBJECT_COLORS.length];

const initCourse  = { title: '', description: '', category: 'SSC CGL', examType: 'SSC', price: '', originalPrice: '', durationHours: '', instructor: '', thumbnailUrl: '', isPublished: false, isFeatured: false };
const initChapter = { title: '', subjectId: '', description: '', videoKey: '', videoUrl: '', durationMin: '', orderIndex: '', isFree: false };

// ── Reusable confirm modal — replaces browser confirm() ───────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 18, width: '100%', maxWidth: 400,
        boxShadow: '0 25px 70px rgba(0,0,0,0.55)', overflow: 'hidden',
      }}>
        {/* Red gradient header */}
        <div style={{
          background: 'linear-gradient(135deg,#dc2626,#ef4444)',
          padding: '20px 22px 18px', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Trash2 size={22} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{title}</h3>
        </div>
        {/* Body */}
        <div style={{ padding: '18px 22px 20px' }}>
          <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button
              onClick={onConfirm}
              style={{
                flex: 2, padding: '10px 16px',
                background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
              }}
            >
              <Trash2 size={14} /> Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCourses() {
  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [chapters, setChapters]             = useState({});

  // subjects[courseId] = [{ id, name, orderIndex }, ...]
  const [subjects, setSubjects] = useState({});

  const [courseModal, setCourseModal] = useState(false);
  const [editCourse, setEditCourse]   = useState(null);
  const [courseForm, setCourseForm]   = useState(initCourse);

  const [chapterModal, setChapterModal]         = useState(false);
  const [editChapter, setEditChapter]           = useState(null);
  const [chapterForm, setChapterForm]           = useState(initChapter);
  const [chapterCourseId, setChapterCourseId]   = useState(null);

  // Subject inline editing state
  const [newSubjectName, setNewSubjectName]       = useState('');
  const [newSubjectOrder, setNewSubjectOrder]     = useState('');
  const [addingSubject, setAddingSubject]         = useState(null);  // courseId
  const [editingSubjectId, setEditingSubjectId]   = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [editingSubjectOrder, setEditingSubjectOrder] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  // Chapter video field mode: 'upload' = R2 private upload, 'url' = external YouTube/Drive link
  const [chapterVideoMode, setChapterVideoMode] = useState('upload');

  // Custom confirm modal state — replaces browser confirm()
  const [confirmState, setConfirmState] = useState(null); // { title, message, onConfirm }
  const closeConfirm = () => setConfirmState(null);
  const askConfirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });

  const load = () =>
    adminApi.getCourses().then(r => setCourses(r.data.courses)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const loadChapters = (courseId) =>
    adminApi.getChapters(courseId).then(r => setChapters(c => ({ ...c, [courseId]: r.data.chapters })));

  const loadSubjects = useCallback((courseId) =>
    adminApi.getSubjects(courseId).then(r => setSubjects(s => ({ ...s, [courseId]: r.data.subjects }))), []);

  const toggleCourse = (id) => {
    if (expandedCourse === id) { setExpandedCourse(null); return; }
    setExpandedCourse(id);
    if (!chapters[id]) loadChapters(id);
    if (!subjects[id]) loadSubjects(id);
  };

  // ── COURSE CRUD ──────────────────────────────────────────────────────────────
  const openCourseModal = (course = null) => {
    setEditCourse(course);
    setCourseForm(course
      ? { ...course, price: course.price / 100, originalPrice: course.originalPrice ? course.originalPrice / 100 : '' }
      : initCourse);
    setCourseModal(true);
  };
  const closeCourseModal = () => { setCourseModal(false); setEditCourse(null); };

  const saveCourse = async () => {
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...courseForm,
        price: Math.round(parseFloat(courseForm.price) * 100),
        originalPrice: courseForm.originalPrice ? Math.round(parseFloat(courseForm.originalPrice) * 100) : null,
      };
      if (editCourse) await adminApi.updateCourse(editCourse.id, payload);
      else            await adminApi.createCourse(payload);
      setMsg('✅ Course saved!'); load(); closeCourseModal();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error saving course')); }
    finally { setSaving(false); }
  };

  const deleteCourse = (id) => {
    askConfirm(
      'Delete Course?',
      'This will permanently delete the course and ALL its chapters. This cannot be undone.',
      async () => { closeConfirm(); await adminApi.deleteCourse(id); load(); }
    );
  };

  // ── SUBJECT CRUD ─────────────────────────────────────────────────────────────
  const startAddSubject = (courseId) => {
    setAddingSubject(courseId);
    setNewSubjectName('');
    setNewSubjectOrder('');
  };

  const saveNewSubject = async (courseId) => {
    if (!newSubjectName.trim()) return;
    try {
      await adminApi.createSubject(courseId, { name: newSubjectName.trim(), orderIndex: parseInt(newSubjectOrder) || undefined });
      await loadSubjects(courseId);
      setAddingSubject(null);
      setNewSubjectName('');
    } catch { setMsg('❌ Error saving subject'); }
  };

  const startEditSubject = (s) => {
    setEditingSubjectId(s.id);
    setEditingSubjectName(s.name);
    setEditingSubjectOrder(String(s.orderIndex));
  };

  const saveEditSubject = async (subjectId, courseId) => {
    if (!editingSubjectName.trim()) return;
    try {
      await adminApi.updateSubject(subjectId, { name: editingSubjectName.trim(), orderIndex: parseInt(editingSubjectOrder) || undefined });
      await loadSubjects(courseId);
      // Also refresh chapters since subjectName display has changed
      loadChapters(courseId);
      setEditingSubjectId(null);
      setMsg('✅ Subject renamed — all chapters updated instantly!');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Error updating subject'); }
  };

  const deleteSubject = (subjectId, courseId) => {
    askConfirm(
      'Delete Subject?',
      'Chapters under this subject will move to “General”. The chapters themselves are not deleted.',
      async () => {
        closeConfirm();
        await adminApi.deleteSubject(subjectId);
        await loadSubjects(courseId);
        loadChapters(courseId);
      }
    );
  };

  // ── CHAPTER CRUD ─────────────────────────────────────────────────────────────
  const openChapterModal = (courseId, chapter = null) => {
    setChapterCourseId(courseId);
    setEditChapter(chapter);
    if (chapter) {
      setChapterForm({
        title:       chapter.title,
        subjectId:   chapter.subjectId || '',
        description: chapter.description || '',
        videoKey:    chapter.videoKey   || '',
        videoUrl:    chapter.videoUrl   || '',
        durationMin: chapter.durationMin || '',
        orderIndex:  chapter.orderIndex  || '',
        isFree:      chapter.isFree      || false,
      });
      // Default to 'upload' mode if chapter already has an R2 key, else 'url'
      setChapterVideoMode(chapter.videoKey ? 'upload' : 'url');
    } else {
      setChapterForm(initChapter);
      setChapterVideoMode('upload');
    }
    setChapterModal(true);
  };
  const closeChapterModal = () => { setChapterModal(false); setEditChapter(null); };

  const saveChapter = async () => {
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...chapterForm,
        videoKey:  chapterForm.videoKey  || null,
        videoUrl:  chapterForm.videoUrl  || null,
        subjectId: chapterForm.subjectId || null,
      };
      if (editChapter) await adminApi.updateChapter(editChapter.id, payload);
      else             await adminApi.createChapter(chapterCourseId, payload);
      setMsg('✅ Chapter saved!'); loadChapters(chapterCourseId); closeChapterModal(); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error saving chapter')); }
    finally { setSaving(false); }
  };

  const deleteChapter = (id, courseId) => {
    askConfirm(
      'Delete Chapter?',
      'This will permanently delete the chapter. This cannot be undone.',
      async () => { closeConfirm(); await adminApi.deleteChapter(id); loadChapters(courseId); load(); }
    );
  };

  // ── Chapter grouping ─────────────────────────────────────────────────────────
  const groupChaptersBySubject = (chList, courseSubjects) => {
    // Use subjectId to group so renames reflect immediately
    const groups = {};
    const subMap = {};
    (courseSubjects || []).forEach(s => { subMap[s.id] = s.name; });

    for (const ch of chList) {
      const key   = ch.subjectId ? String(ch.subjectId) : '__general__';
      const label = ch.subjectName || ch.subject || 'General';
      if (!groups[key]) groups[key] = { label, chapters: [] };
      groups[key].chapters.push(ch);
    }
    return groups;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses &amp; Chapters</h1>
          <p className="page-subtitle">Manage courses, subjects, and chapters — subjects are the single source of truth</p>
        </div>
        <button className="btn btn-primary" onClick={() => openCourseModal()}><Plus size={16} /> Add Course</button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>{msg}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map(course => (
            <div key={course.id} className="card">
              {/* Course Row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => toggleCourse(course.id)}
              >
                <div style={{ color: 'var(--text-muted)' }}>
                  {expandedCourse === course.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{course.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{course.category}</span>
                    <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {course.isFeatured && <span className="badge badge-info">Featured</span>}
                    <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      <BookOpen size={11} style={{ marginRight: 4 }} />{course.chaptersCount} chapters
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-outline" onClick={() => openCourseModal(course)}><Edit2 size={14} /></button>
                  <button className="btn btn-sm btn-error"   onClick={() => deleteCourse(course.id)}><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Expanded Panel */}
              {expandedCourse === course.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>

                  {/* ── SUBJECTS MANAGER ─────────────────────────────────────── */}
                  <div style={{
                    background: 'var(--surface-2)', borderRadius: 10,
                    border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 20,
                  }}>
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={13} /> Subjects ({(subjects[course.id] || []).length})
                      </span>
                      <button className="btn btn-sm btn-outline" onClick={() => startAddSubject(course.id)}>
                        <Plus size={12} /> Add Subject
                      </button>
                    </div>

                    {(subjects[course.id] || []).length === 0 && addingSubject !== course.id && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No subjects yet — add one to organise your chapters.</p>
                    )}

                    {/* Subject rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(subjects[course.id] || []).map((s, idx) => (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', background: 'var(--surface)',
                          borderRadius: 8, border: '1px solid var(--border)',
                        }}>
                          <GripVertical size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: subjectColor(idx), flexShrink: 0 }} />

                          {editingSubjectId === s.id ? (
                            <>
                              <input
                                autoFocus
                                className="form-input"
                                style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem', height: 32 }}
                                value={editingSubjectName}
                                onChange={e => setEditingSubjectName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEditSubject(s.id, course.id); if (e.key === 'Escape') setEditingSubjectId(null); }}
                              />
                              <input
                                type="number"
                                className="form-input"
                                style={{ width: 60, padding: '4px 8px', fontSize: '0.85rem', height: 32 }}
                                value={editingSubjectOrder}
                                onChange={e => setEditingSubjectOrder(e.target.value)}
                                placeholder="#"
                              />
                              <button className="btn btn-sm btn-success" onClick={() => saveEditSubject(s.id, course.id)}><Check size={13} /></button>
                              <button className="btn btn-sm btn-outline"  onClick={() => setEditingSubjectId(null)}><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: subjectColor(idx) }}>{s.name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 4 }}>#{s.orderIndex}</span>
                              <button className="btn btn-sm btn-outline" onClick={() => startEditSubject(s)} title="Rename subject"><Pencil size={12} /></button>
                              <button className="btn btn-sm btn-error"   onClick={() => deleteSubject(s.id, course.id)} title="Delete subject"><Trash2 size={12} /></button>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add new subject inline form */}
                      {addingSubject === course.id && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', background: 'var(--surface)',
                          borderRadius: 8, border: '2px solid var(--color-primary)',
                        }}>
                          <Plus size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                          <input
                            autoFocus
                            className="form-input"
                            style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem', height: 32 }}
                            placeholder="Subject name, e.g. Quantitative Aptitude"
                            value={newSubjectName}
                            onChange={e => setNewSubjectName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveNewSubject(course.id); if (e.key === 'Escape') setAddingSubject(null); }}
                          />
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 60, padding: '4px 8px', fontSize: '0.85rem', height: 32 }}
                            placeholder="Order"
                            value={newSubjectOrder}
                            onChange={e => setNewSubjectOrder(e.target.value)}
                          />
                          <button className="btn btn-sm btn-success" onClick={() => saveNewSubject(course.id)}><Check size={13} /> Add</button>
                          <button className="btn btn-sm btn-outline"  onClick={() => setAddingSubject(null)}><X size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── CHAPTERS ───────────────────────────────────────────── */}
                  <div className="flex-between" style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Chapters ({(chapters[course.id] || []).length}) — grouped by subject
                    </span>
                    <button className="btn btn-sm btn-success" onClick={() => openChapterModal(course.id)}>
                      <Plus size={13} /> Add Chapter
                    </button>
                  </div>

                  {(() => {
                    const chList = chapters[course.id] || [];
                    if (chList.length === 0) return (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>No chapters yet. Add one above.</p>
                    );
                    const groups = groupChaptersBySubject(chList, subjects[course.id]);
                    return Object.entries(groups).map(([key, { label, chapters: subChapters }], gIdx) => (
                      <div key={key} style={{ marginBottom: 16 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                          paddingBottom: 6, borderBottom: '1px solid var(--border)',
                        }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: key === '__general__' ? '#6b7280' : subjectColor(gIdx) }} />
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: key === '__general__' ? 'var(--text-muted)' : subjectColor(gIdx), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({subChapters.length})</span>
                        </div>

                        {subChapters.map(ch => (
                          <div key={ch.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', background: 'var(--surface-2)',
                            borderRadius: 8, marginBottom: 6, border: '1px solid var(--border)',
                          }}>
                            <Video size={14} color="var(--text-muted)" />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ch.orderIndex}. {ch.title}</span>
                              <span className={`badge ${ch.isFree ? 'badge-success' : 'badge-primary'}`} style={{ marginLeft: 8 }}>
                                {ch.isFree ? 'Free' : 'Paid'}
                              </span>
                              {ch.durationMin > 0 && (
                                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.durationMin}m</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-sm btn-outline" onClick={() => openChapterModal(course.id, ch)}><Edit2 size={12} /></button>
                              <button className="btn btn-sm btn-error"   onClick={() => deleteChapter(ch.id, course.id)}><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Course Modal ──────────────────────────────────────────────────────── */}
      {courseModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{editCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button onClick={closeCourseModal} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Course Title *</label>
                <input className="form-input" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="SSC CGL Complete Course 2024" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Exam Type</label>
                <select className="form-select" value={courseForm.examType} onChange={e => setCourseForm(f => ({ ...f, examType: e.target.value }))}>
                  {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input type="number" className="form-input" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))} placeholder="2999" />
              </div>
              <div className="form-group">
                <label className="form-label">Original Price (₹)</label>
                <input type="number" className="form-input" value={courseForm.originalPrice} onChange={e => setCourseForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="5999" />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours)</label>
                <input type="number" className="form-input" value={courseForm.durationHours} onChange={e => setCourseForm(f => ({ ...f, durationHours: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Instructor</label>
                <input className="form-input" value={courseForm.instructor} onChange={e => setCourseForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Expert Faculty" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Thumbnail URL</label>
                <input type="url" className="form-input" value={courseForm.thumbnailUrl} onChange={e => setCourseForm(f => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', gap: 24, gridColumn: '1/-1' }}>
                <label className="form-check"><input type="checkbox" checked={courseForm.isPublished} onChange={e => setCourseForm(f => ({ ...f, isPublished: e.target.checked }))} /> Published</label>
                <label className="form-check"><input type="checkbox" checked={courseForm.isFeatured} onChange={e => setCourseForm(f => ({ ...f, isFeatured: e.target.checked }))} /> Featured</label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeCourseModal} className="btn btn-outline">Cancel</button>
              <button onClick={saveCourse} disabled={saving} className="btn btn-primary"><Save size={15} /> {saving ? 'Saving...' : 'Save Course'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chapter Modal ─────────────────────────────────────────────────────── */}
      {chapterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editChapter ? 'Edit Chapter' : 'Add Chapter'}</h3>
              <button onClick={closeChapterModal} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Chapter Title *</label>
                <input className="form-input" value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} placeholder="Introduction to Number System" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={13} /> Subject
                </label>
                <select
                  className="form-select"
                  value={chapterForm.subjectId}
                  onChange={e => setChapterForm(f => ({ ...f, subjectId: e.target.value }))}
                >
                  <option value="">— No Subject (General) —</option>
                  {(subjects[chapterCourseId] || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {(subjects[chapterCourseId] || []).length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    No subjects yet — add subjects in the course panel first.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={chapterForm.description} onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Video size={13} /> Chapter Video
                </label>

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[
                    { key: 'upload', label: '⬆ Upload to Private Storage' },
                    { key: 'url',    label: '🔗 External URL (YouTube)'   },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => {
                        setChapterVideoMode(key);
                        setChapterForm(f => ({ ...f, videoKey: '', videoUrl: '' }));
                      }}
                      style={{
                        padding: '5px 14px', borderRadius: 6, fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${chapterVideoMode === key ? 'var(--primary)' : 'var(--border)'}`,
                        background: chapterVideoMode === key ? 'var(--primary)' : 'transparent',
                        color: chapterVideoMode === key ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {chapterVideoMode === 'upload' ? (
                  // Shows drag-and-drop with progress bar; uploads directly from browser → R2
                  // Returns the R2 key (e.g. "videos/uuid.mp4") via onUploaded
                  <>
                    <FileUploader
                      type="video"
                      onUploaded={(key) => setChapterForm(f => ({ ...f, videoKey: key, videoUrl: '' }))}
                      onClear={() => setChapterForm(f => ({ ...f, videoKey: '' }))}
                    />
                    {chapterForm.videoKey && (
                      <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4 }}>
                        🔒 Stored in private storage — students access via time-limited signed URL
                      </p>
                    )}
                  </>
                ) : (
                  <input
                    type="url"
                    className="form-input"
                    value={chapterForm.videoUrl}
                    onChange={e => setChapterForm(f => ({ ...f, videoUrl: e.target.value, videoKey: '' }))}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input type="number" className="form-input" value={chapterForm.durationMin} onChange={e => setChapterForm(f => ({ ...f, durationMin: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Order Index</label>
                  <input type="number" className="form-input" value={chapterForm.orderIndex} onChange={e => setChapterForm(f => ({ ...f, orderIndex: e.target.value }))} />
                </div>
              </div>
              <label className="form-check">
                <input type="checkbox" checked={chapterForm.isFree} onChange={e => setChapterForm(f => ({ ...f, isFree: e.target.checked }))} /> Free Preview (visible without enrollment)
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={closeChapterModal} className="btn btn-outline">Cancel</button>
              <button onClick={saveChapter} disabled={saving} className="btn btn-primary"><Save size={15} /> {saving ? 'Saving...' : 'Save Chapter'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete modal (replaces browser confirm()) ── */}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
