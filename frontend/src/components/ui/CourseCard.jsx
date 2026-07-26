import { Link } from 'react-router-dom';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';
import { useLang } from '../../context/LanguageContext.jsx';

const formatPrice = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function CourseCard({ course }) {
  const { t } = useLang();
  return (
    <div className="card course-card">
      <div className="course-card-image">
        {course.thumbnailUrl
          ? <img src={course.thumbnailUrl} alt={course.title} loading="lazy" />
          : <BookOpen size={48} color="var(--color-text-light)" />
        }
        <div className="course-card-badge">
          <span className="badge badge-primary">{course.category}</span>
        </div>
      </div>
      <div className="course-card-body">
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.description}</p>
        <div className="course-card-meta">
          <span className="course-card-meta-item">
            <Clock size={13} /> {course.durationHours}h
          </span>
          <span className="course-card-meta-item">
            <BookOpen size={13} /> {course.chaptersCount} {t('course.chapters')}
          </span>
        </div>
        <div className="course-card-footer">
          <div className="course-price">
            <span className="course-price-current">{formatPrice(course.price)}</span>
            {course.originalPrice && (
              <span className="course-price-original">{formatPrice(course.originalPrice)}</span>
            )}
          </div>
          <Link to={`/courses/${course.id}`} className="course-card-link">
            {t('course.viewDetails')} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
