import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Video, BookOpen, X, Save } from 'lucide-react';
import { adminApi } from '../api/admin.api.js';

const CATEGORIES = ['SSC CGL', 'SSC MTS', 'SSC CHSL', 'Banking (IBPS/SBI)'];
const EXAM_TYPES = ['SSC', 'Banking'];

const initCourse = { title: '', description: '', category: 'SSC CGL', examType: 'SSC', price: '', originalPrice: '', durationHours: '', instructor: '', thumbnailUrl: '', isPublished: false, isFeatured: false };
const initChapter = { title: '', description: '', videoUrl: '', durationMin: '', orderIndex: '', isFree: false };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [chapters, setChapters] = useState({});

  const [courseModal, setCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(initCourse);

  const [chapterModal, setChapterModal] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [chapterForm, setChapterForm] = useState(initChapter);
  const [chapterCourseId, setChapterCourseId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => adminApi.getCourses().then(r => setCourses(r.data.courses)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const loadChapters = (courseId) => adminApi.getChapters(courseId).then(r => setChapters(c => ({ ...c, [courseId]: r.data.chapters })));

  const toggleCourse = (id) => {
    if (expandedCourse === id) { setExpandedCourse(null); return; }
    setExpandedCourse(id);
    if (!chapters[id]) loadChapters(id);
  };

  const openCourseModal = (course = null) => { setEditCourse(course); setCourseForm(course ? { ...course, price: course.price / 100, originalPrice: course.originalPrice ? course.originalPrice / 100 : '' } : initCourse); setCourseModal(true); };
  const closeCourseModal = () => { setCourseModal(false); setEditCourse(null); };

  const saveCourse = async () => {
    setSaving(true); setMsg('');
    try {
      const payload = { ...courseForm, price: Math.round(parseFloat(courseForm.price) * 100), originalPrice: courseForm.originalPrice ? Math.round(parseFloat(courseForm.originalPrice) * 100) : null };
      if (editCourse) await adminApi.updateCourse(editCourse.id, payload);
      else await adminApi.createCourse(payload);
      setMsg('✅ Course saved!'); load(); closeCourseModal();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error saving course')); }
    finally { setSaving(false); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course? This will also delete all chapters.')) return;
    await adminApi.deleteCourse(id); load();
  };

  const openChapterModal = (courseId, chapter = null) => { setChapterCourseId(courseId); setEditChapter(chapter); setChapterForm(chapter || initChapter); setChapterModal(true); };
  const closeChapterModal = () => { setChapterModal(false); setEditChapter(null); };

  const saveChapter = async () => {
    setSaving(true); setMsg('');
    try {
      if (editChapter) await adminApi.updateChapter(editChapter.id, chapterForm);
      else await adminApi.createChapter(chapterCourseId, chapterForm);
      setMsg('✅ Chapter saved!'); loadChapters(chapterCourseId); closeChapterModal();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error saving chapter')); }
    finally { setSaving(false); }
  };

  const deleteChapter = async (id, courseId) => {
    if (!confirm('Delete this chapter?')) return;
    await adminApi.deleteChapter(id); loadChapters(courseId);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Courses & Chapters</h1><p className="page-subtitle">Manage course content and video lectures</p></div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer' }} onClick={() => toggleCourse(course.id)}>
                <div style={{ color: 'var(--text-muted)' }}>{expandedCourse === course.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{course.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{course.category}</span>
                    <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>{course.isPublished ? 'Published' : 'Draft'}</span>
                    {course.isFeatured && <span className="badge badge-info">Featured</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-outline" onClick={() => openCourseModal(course)}><Edit2 size={14} /></button>
                  <button className="btn btn-sm btn-error" onClick={() => deleteCourse(course.id)}><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Chapters */}
              {expandedCourse === course.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Chapters ({(chapters[course.id] || []).length})</span>
                    <button className="btn btn-sm btn-success" onClick={() => openChapterModal(course.id)}><Plus size={13} /> Add Chapter</button>
                  </div>
                  {(chapters[course.id] || []).map(ch => (
                    <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                      <Video size={15} color="var(--text-muted)" />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ch.orderIndex}. {ch.title}</span>
                        <span className={`badge ${ch.isFree ? 'badge-success' : 'badge-primary'}`} style={{ marginLeft: 8 }}>{ch.isFree ? 'Free' : 'Paid'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openChapterModal(course.id, ch)}><Edit2 size={12} /></button>
                        <button className="btn btn-sm btn-error" onClick={() => deleteChapter(ch.id, course.id)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
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

      {/* Chapter Modal */}
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
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={chapterForm.description} onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Video URL (YouTube/S3/Drive)</label>
                <input type="url" className="form-input" value={chapterForm.videoUrl} onChange={e => setChapterForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://www.youtube.com/embed/..." />
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
              <label className="form-check"><input type="checkbox" checked={chapterForm.isFree} onChange={e => setChapterForm(f => ({ ...f, isFree: e.target.checked }))} /> Free Preview (visible without enrollment)</label>
            </div>
            <div className="modal-footer">
              <button onClick={closeChapterModal} className="btn btn-outline">Cancel</button>
              <button onClick={saveChapter} disabled={saving} className="btn btn-primary"><Save size={15} /> {saving ? 'Saving...' : 'Save Chapter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
