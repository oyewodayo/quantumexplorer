// Saved learning progress: which lessons are marked read and which
// quick-check answers were given. Persisted in localStorage.
const STORAGE_KEY = 'qe-roadmap-progress';

function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { raw = null; }
  return {
    completedLessons: Array.isArray(raw && raw.completedLessons) ? raw.completedLessons : [],
    // { [lessonId]: chosenOptionIndex }
    quizAnswers: (raw && typeof raw.quizAnswers === 'object' && raw.quizAnswers !== null) ? raw.quizAnswers : {},
  };
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn());
}

export const getProgress = () => state;

export function subscribeProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toggleLesson(id) {
  const done = state.completedLessons.includes(id);
  commit({
    ...state,
    completedLessons: done
      ? state.completedLessons.filter((x) => x !== id)
      : [...state.completedLessons, id],
  });
}

/** Records a quick-check answer; answering also marks the lesson read. */
export function answerQuiz(id, choice) {
  commit({
    completedLessons: state.completedLessons.includes(id) ? state.completedLessons : [...state.completedLessons, id],
    quizAnswers: { ...state.quizAnswers, [id]: choice },
  });
}

export function resetProgress() {
  commit({ completedLessons: [], quizAnswers: {} });
}
