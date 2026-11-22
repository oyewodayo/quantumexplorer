// Saved learning progress: which lessons are marked read and which
// quick-check answers were given. Persisted in localStorage.
const STORAGE_KEY = 'qe-roadmap-progress';

export interface ProgressState {
  completedLessons: string[];
  quizAnswers: Record<string, number>;
}

function load(): ProgressState {
  let raw: unknown = null;
  try {
    const item = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    raw = item ? JSON.parse(item) : null;
  } catch {
    raw = null;
  }
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  return {
    completedLessons: Array.isArray(obj?.completedLessons) ? (obj!.completedLessons as string[]) : [],
    quizAnswers:
      obj && typeof obj.quizAnswers === 'object' && obj.quizAnswers !== null
        ? (obj.quizAnswers as Record<string, number>)
        : {},
  };
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function commit(next: ProgressState): void {
  state = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn());
}

export const getProgress = (): ProgressState => state;

export function subscribeProgress(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toggleLesson(id: string): void {
  const done = state.completedLessons.includes(id);
  commit({
    ...state,
    completedLessons: done
      ? state.completedLessons.filter((x) => x !== id)
      : [...state.completedLessons, id],
  });
}

/** Records a quick-check answer; answering also marks the lesson read. */
export function answerQuiz(id: string, choice: number): void {
  commit({
    completedLessons: state.completedLessons.includes(id) ? state.completedLessons : [...state.completedLessons, id],
    quizAnswers: { ...state.quizAnswers, [id]: choice },
  });
}

export function resetProgress(): void {
  commit({ completedLessons: [], quizAnswers: {} });
}
