import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';

import { coursesApi } from '../../api/courses.api.js';
import CourseCard from '../../components/ui/CourseCard.jsx';
import { useSearchParams } from 'react-router-dom';

export default function Courses() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // full list for category derivation
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All Courses');

  // Derive unique category tabs from the full course list (dynamic, not hardcoded)
  const categories = useMemo(() => {
    const unique = [...new Set(allCourses.map(c => c.category).filter(Boolean))].sort();
    return ['All Courses', ...unique];
  }, [allCourses]);

  // Fetch full list once on mount for category derivation
  useEffect(() => {
    coursesApi.getAll({})
      .then(res => setAllCourses(res.data.courses || []))
      .catch(() => setAllCourses([]));
  }, []);

  const fetchCourses = (cat, q) => {
    setLoading(true);
    const params = {};
    if (cat && cat !== 'All Courses') params.category = cat;
    if (q) params.search = q;
    coursesApi.getAll(params)
      .then(res => setCourses(res.data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses(activeCategory, search);
  }, [activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses(activeCategory, search);
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    if (cat !== 'All Courses') setSearchParams({ category: cat });
    else setSearchParams({});
  };

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1f3d 0%, #1d3a8a 50%, #1e1b4b 100%)',
        padding: '56px 0 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', pointerEvents: 'none' }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <h1 className="heading-lg" style={{ color: 'white', marginBottom: 12 }}>
            All Courses
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 32, fontSize: '1.05rem' }}>
            Choose your exam, pick a course, and start your preparation today.
          </p>
          <form onSubmit={handleSearch} className="search-bar" style={{ margin: '0 auto', maxWidth: 520 }}>
            <Search size={18} className="search-icon" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
            />
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="section">
        <div className="container">
          {/* Filter Tabs — dynamically built from fetched course categories */}
          <div className="filter-tabs" style={{ marginBottom: 40 }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategory(cat)}
              >
                {cat}
              </button>
            ))}
            {/* Skeleton tabs while categories haven't loaded yet */}
            {categories.length === 1 && (
              [1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ width: 100, height: 38, borderRadius: 99 }} />
              ))
            )}
          </div>

          {loading ? (
            <div className="grid-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card" style={{ height: 380 }}>
                  <div className="skeleton" style={{ height: 180 }} />
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="skeleton" style={{ height: 20, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Search size={48} color="var(--color-text-light)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: 8, color: 'var(--color-text-muted)' }}>No courses found</h3>
              <p className="text-muted">Try a different category or search term.</p>
            </div>
          ) : (
            <>
              <p className="text-muted" style={{ marginBottom: 24 }}>
                Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
                {activeCategory !== 'All Courses' && ` in "${activeCategory}"`}
              </p>
              <div className="grid-3">
                {courses.map(course => <CourseCard key={course.id} course={course} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
