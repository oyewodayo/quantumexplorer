import { useI18n } from '../hooks/useI18n.js';
import { engineApi } from '../state/nav.js';
import { ROADMAP_LESSONS } from '../content/roadmapContent.js';
import { firstSentence } from '../content/text.js';

/** The Introduction tab's "Suggested learning path": one row per lesson,
 *  in the same order as the sidebar and concept map. */
export default function IntroLearningPath() {
  const { t } = useI18n();
  return (
    <div className="intro-path" id="intro-learning-path">
      {ROADMAP_LESSONS.map((lesson, i) => (
        <div className="intro-path-item" key={lesson.id}>
          <div className="intro-path-num">{i + 1}</div>
          <div className="intro-path-body">
            <div className="intro-path-title" dangerouslySetInnerHTML={{ __html: t(`lessons.${lesson.id}.title`, lesson.title) }} />
            <div className="intro-path-desc" dangerouslySetInnerHTML={{ __html: firstSentence(t(`lessons.${lesson.id}.body`, lesson.body)) }} />
          </div>
          <button className="btn-secondary" onClick={() => engineApi.goToNode(lesson.id)}>
            {t('roadmap.start', 'Start →')}
          </button>
        </div>
      ))}
    </div>
  );
}
