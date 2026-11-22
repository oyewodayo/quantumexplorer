import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { useNav } from '../hooks/useNav.ts';
import { useProgress } from '../hooks/useProgress.ts';
import { goToNode, setAppMode, switchToTab } from '../state/nav.ts';
import { resetProgress } from '../state/progress.ts';
import { showBlochTooltip, hideBlochTooltip } from '../core/blochRenderer.ts';
import {
  ROADMAP_LESSONS, ROADMAP_QUIZ, MINDMAP_TREE, MINDMAP_NODE_TITLE_KEYS, MINDMAP_LEVEL1_COLORS, type MindmapNode,
} from '../content/roadmapContent.ts';
import { firstSentence } from '../content/text.ts';
import { layoutMindmap } from '../core/mindmapLayout.ts';
import ConfirmModal from './ConfirmModal.tsx';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useNodeTitle() {
  const { t } = useI18n();
  return (node: MindmapNode) => {
    const lesson = node.tab ? ROADMAP_LESSONS.find((l) => l.id === node.id) : null;
    return lesson
      ? t(`lessons.${lesson.id}.title`, lesson.title)
      : t(MINDMAP_NODE_TITLE_KEYS[node.id] || '', node.title);
  };
}

function Mindmap({ visible }: { visible: boolean }) {
  const { t } = useI18n();
  const { completedLessons } = useProgress();
  const nodeTitle = useNodeTitle();
  const ref = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [size, setSize] = useState({ w: 900, h: 420 });
  const reduceMotion = useMemo(prefersReducedMotion, []);

  const layout = useMemo(() => layoutMindmap({ ...size, expanded }), [size, expanded]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visible) return undefined;
    const measure = () => {
      el.style.height = '';
      el.style.maxHeight = '';
      const rect = el.getBoundingClientRect();
      setSize((prev) => {
        const next = { w: rect.width || 900, h: rect.height || 420 };
        return prev.w === next.w && prev.h === next.h ? prev : next;
      });
    };
    measure();
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(measure, 150); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize); };
  }, [visible, expanded]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    if (layout.height > size.h) {
      el.style.height = `${layout.height}px`;
      el.style.maxHeight = 'none';
    }
  }, [layout, size.h, visible]);

  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const hit = target?.closest<HTMLElement>('[data-tooltip]');
    if (hit && hit.dataset.tooltip) showBlochTooltip(hit.dataset.tooltip, e.clientX, e.clientY);
    else hideBlochTooltip();
  };

  const centerTip = t('roadmap.centerTooltip', '{count} core quantum computing concepts, from a single qubit to entanglement and wave interference — click any topic to explore it.')
    .replace('{count}', String(ROADMAP_LESSONS.length));

  return (
    <div className="roadmap-mindmap" id="roadmap-mindmap" ref={ref} onMouseMove={onMouseMove} onMouseLeave={hideBlochTooltip}>
      <svg>
        {layout.branches.map((b) => (
          <g key={b.key}>
            <path d={b.d} fill={b.color} opacity="0.92" />
            {!reduceMotion && (
              <>
                <path id={`mindmap-branch-path-${b.key}`} d={b.center} fill="none" stroke="none" />
                {[0, 0.5].map((phase) => {
                  const dur = Math.max(1.2, b.dist / 120);
                  return (
                    <circle key={phase} r="2.6" fill={b.color} style={{ filter: `drop-shadow(0 0 3px ${b.color})` }}>
                      <animateMotion dur={`${dur.toFixed(2)}s`} begin={`${(-phase * dur).toFixed(2)}s`} repeatCount="indefinite">
                        <mpath href={`#mindmap-branch-path-${b.key}`} />
                      </animateMotion>
                    </circle>
                  );
                })}
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="mindmap-center" data-tooltip={centerTip} style={{ left: layout.cx, top: layout.cy }}>
        {t('mindmap.quantumWorld', 'Quantum World')}
      </div>
      {layout.nodes.map(({ node, x, y, depth, color }) => {
        const lesson = node.tab ? ROADMAP_LESSONS.find((l) => l.id === node.id) : null;
        const done = lesson ? completedLessons.includes(lesson.id) : false;
        const title = nodeTitle(node);
        const label = node.number ? `${node.number}. ${title}` : title;
        const tip = lesson
          ? `${label}${done ? ` — ${t('roadmap.read', 'read')}` : ''}: ${firstSentence(t(`lessons.${lesson.id}.body`, lesson.body))}`
          : label;
        const cls = ['mindmap-node'];
        if (depth > 0) cls.push('mindmap-node--sub');
        if (done) cls.push('is-done');
        if (!node.tab) cls.push('mindmap-node--static');
        return (
          <button
            key={node.id}
            className={cls.join(' ')}
            data-tooltip={tip}
            style={{ left: x, top: y, '--branch-color': color } as React.CSSProperties}
            onClick={() => node.tab && goToNode(node.id)}
          >
            {label}
            {done && <> <span className="mindmap-done-mark">✓</span></>}
            {node.children && (
              <span
                className="mindmap-toggle"
                onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
              >
                {expanded.has(node.id) ? '−' : '+'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MindmapFallback() {
  const { t } = useI18n();
  const { completedLessons } = useProgress();
  const nodeTitle = useNodeTitle();
  const navigable = MINDMAP_TREE.filter((n) => n.tab).sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  return (
    <div className="roadmap-mindmap-fallback" id="roadmap-mindmap-fallback">
      {navigable.map((node) => {
        const done = completedLessons.includes(node.id);
        return (
          <button
            key={node.id}
            className={`mindmap-fallback-item${done ? ' is-done' : ''}`}
            style={{ '--branch-color': MINDMAP_LEVEL1_COLORS[node.id] } as React.CSSProperties}
            onClick={() => goToNode(node.id)}
          >
            {node.number}. {nodeTitle(node)}{done ? ` — ${t('roadmap.read', 'read')}` : ''}
          </button>
        );
      })}
    </div>
  );
}

function ProgressPanel() {
  const { t } = useI18n();
  const { completedLessons, quizAnswers } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const total = ROADMAP_LESSONS.length;
  const done = completedLessons.length;
  const pct = Math.round((100 * done) / total);
  const answeredIds = Object.keys(quizAnswers);
  const correctCount = answeredIds.filter((id) => {
    const q = ROADMAP_QUIZ.find((item) => item.lessonId === id);
    return q && quizAnswers[id] === q.correct;
  }).length;

  return (
    <div id="roadmap-progress-panel" className="roadmap-panel">
      <div className="card">
        <div className="card-title">{t('roadmap.lessonsCompleted', 'Lessons Completed')}</div>
        <div className="progress-row">
          <div className="track">
            <div className={`fill${done === 0 ? ' zero-fill' : ''}`} id="roadmap-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="pct" id="roadmap-progress-pct">{done}/{total}</span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-title">{t('roadmap.quickCheckScore', 'Quick Check Score')}</div>
        <p className="bit-explainer" id="roadmap-quiz-score-text">
          {answeredIds.length === 0
            ? t('roadmap.notAttempted', 'Not attempted yet.')
            : t('roadmap.quizScoreSummary', '{correct} / {answered} quick checks correct so far ({total} concepts total).')
              .replace('{correct}', String(correctCount)).replace('{answered}', String(answeredIds.length)).replace('{total}', String(total))}
        </p>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-title">{t('roadmap.lessonChecklist', 'Lesson Checklist')}</div>
        <div className="roadmap-lesson-checklist" id="roadmap-checklist">
          {ROADMAP_LESSONS.map((l) => (
            <label className="roadmap-checklist-row" key={l.id}>
              <input type="checkbox" disabled checked={completedLessons.includes(l.id)} readOnly />
              <span dangerouslySetInnerHTML={{ __html: t(`lessons.${l.id}.title`, l.title) }} />
            </label>
          ))}
        </div>
        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setConfirming(true)}>
          {t('roadmap.resetProgress', 'Reset progress')}
        </button>
      </div>
      {confirming && (
        <ConfirmModal
          title={t('roadmap.resetConfirmTitle', 'Reset all progress?')}
          message={t('roadmap.resetConfirmMessage', 'This clears every lesson\'s "read" status and quiz answer, including all five Maths Concept sections. This can\'t be undone.')}
          confirmLabel={t('roadmap.resetProgress', 'Reset progress')}
          danger
          onConfirm={() => { resetProgress(); setConfirming(false); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

export default function RoadmapView() {
  const { t } = useI18n();
  const nav = useNav();
  const [subMode, setSubMode] = useState<'map' | 'progress'>('map');
  const active = nav.mode === 'roadmap';

  return (
    <section id="roadmap-view" className={active ? 'active' : ''}>
      <div className={`roadmap-hero${subMode === 'map' ? ' roadmap-hero--full' : ''}`} id="roadmap-hero">
        <div className="compare-header">
          <h1 className="compare-title">{t('roadmap.title', 'Quantum Concepts')}</h1>
          <p className="compare-subtitle">{t('roadmap.subtitle', 'Click any concept to open its simulation')}</p>
        </div>
        <div className="mode-grid roadmap-mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', maxWidth: 480, margin: '0 auto 20px' }}>
          <button className={`preset-btn mode-btn${subMode === 'map' ? ' active' : ''}`} onClick={() => setSubMode('map')}>
            {t('roadmap.conceptMap', 'Concept Map')}
          </button>
          <button className="preset-btn mode-btn" onClick={() => { setAppMode('sim'); switchToTab('important-concepts'); }}>
            {t('nav.importantConcepts', 'Important Concepts')}
          </button>
          <button className={`preset-btn mode-btn${subMode === 'progress' ? ' active' : ''}`} onClick={() => setSubMode('progress')}>
            {t('roadmap.myProgress', 'My Progress')}
          </button>
        </div>
        {subMode === 'map' && <Mindmap visible={active} />}
        {subMode === 'map' && <MindmapFallback />}
      </div>
      {subMode === 'progress' && <ProgressPanel />}
    </section>
  );
}
