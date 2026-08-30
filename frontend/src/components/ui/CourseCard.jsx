import { Link } from 'react-router-dom';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';


// Default images per exam category
const CATEGORY_IMAGES = {
  'SSC CGL':            '/course-images/ssc-cgl.png',
  'SSC MTS':            '/course-images/ssc-mts.png',
  'SSC CHSL':           '/course-images/ssc-chsl.png',
  'Banking (IBPS/SBI)': '/course-images/banking.png',
};
const DEFAULT_IMAGE = '/course-images/default-course.png';

const formatPrice = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function CourseCard({ course }) {

  return (
    <div className="card course-card">
      <div className="course-card-image">
        <img
          src={course.thumbnailUrl || CATEGORY_IMAGES[course.category] || DEFAULT_IMAGE}
          alt={course.title}
          loading="lazy"
          onError={e => { e.currentTarget.src = DEFAULT_IMAGE; }}
        />
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
            <BookOpen size={13} /> {course.chaptersCount} Chapters
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
            View Details <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
