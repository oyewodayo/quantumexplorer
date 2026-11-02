import { useI18n } from '../hooks/useI18n.js';
import { useProgress } from '../hooks/useProgress.js';
import { toggleLesson, answerQuiz } from '../state/progress.js';
import { ROADMAP_LESSONS, ROADMAP_QUIZ } from '../content/roadmapContent.js';

// Lesson and quiz strings are hand-written locale text that may contain
// inline markup, so they are inserted as HTML (never user input).
const Html = ({ as: Tag = 'span', html, ...rest }) => <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;

function QuickCheck({ lesson }) {
  const { t } = useI18n();
  const { quizAnswers } = useProgress();
  const q = ROADMAP_QUIZ.find((item) => item.lessonId === lesson.id);
  if (!q) return null;

  const key = `quiz.${lesson.id}`;
  const options = q.options.map((opt, i) => t(`${key}.options.${i}`, opt));
  const answered = quizAnswers[lesson.id];

  if (answered === undefined) {
    return (
      <div className="roadmap-quickcheck">
        <div className="roadmap-quickcheck-label">{t('roadmap.quickCheck', 'Quick check')}</div>
        <Html as="p" className="roadmap-quickcheck-q" html={t(`${key}.q`, q.q)} />
        <div className="roadmap-quiz-options" data-quickcheck-lesson={lesson.id}>
          {options.map((opt, i) => (
            <Html as="button" key={i} className="preset-btn" html={opt} onClick={() => answerQuiz(lesson.id, i)} />
          ))}
        </div>
      </div>
    );
  }

  const correct = answered === q.correct;
  return (
    <div className="roadmap-quickcheck">
      <div className="roadmap-quickcheck-label">
        {t('roadmap.quickCheck', 'Quick check')} — {correct ? t('roadmap.correct', 'correct') : t('roadmap.review', 'review')}
      </div>
      <Html as="p" className="roadmap-quickcheck-q" html={t(`${key}.q`, q.q)} />
      <div className="roadmap-quiz-options">
        {options.map((opt, i) => {
          let cls = 'preset-btn';
          if (i === q.correct) cls += ' quiz-correct';
          else if (i === answered) cls += ' quiz-incorrect';
          return <Html as="button" key={i} className={cls} disabled html={opt} />;
        })}
      </div>
      <Html as="p" className="bit-explainer" style={{ marginTop: 8 }} html={t(`${key}.explanation`, q.explanation)} />
    </div>
  );
}

/** The lesson text, "Mark as read" button and quick check shown at the
 *  bottom of a concept's page. */
export default function LessonEmbed({ id }) {
  const { t } = useI18n();
  const { completedLessons } = useProgress();
  const lesson = ROADMAP_LESSONS.find((l) => l.id === id);
  if (!lesson) return null;
  const done = completedLessons.includes(id);

  return (
    <div className="lesson-embed" id={`lesson-embed-${id}`}>
      <div className="card">
        <div className="card-title">
          <Html html={t(`lessons.${id}.title`, lesson.title)} />{done ? ` — ${t('roadmap.read', 'read')}` : ''}
        </div>
        <Html as="p" className="bit-explainer" html={t(`lessons.${id}.body`, lesson.body)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button className={`btn-secondary${done ? ' is-done' : ''}`} onClick={() => toggleLesson(id)}>
            {done ? t('roadmap.markUnread', 'Mark unread') : t('roadmap.markAsRead', 'Mark as read')}
          </button>
        </div>
        <QuickCheck lesson={lesson} />
      </div>
    </div>
  );
}
