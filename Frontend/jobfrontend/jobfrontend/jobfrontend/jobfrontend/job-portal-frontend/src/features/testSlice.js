import { createSlice } from '@reduxjs/toolkit';

const TEST_STORAGE_KEY = 'jobPortalTestState';

const testQuestions = [];

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(TEST_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function savePersistedState(state) {
  const payload = {
    answers: state.answers,
    submitted: state.submitted,
    score: state.score,
    percentage: state.percentage,
    correctCount: state.correctCount,
    wrongCount: state.wrongCount,
    attemptedCount: state.attemptedCount,
    lastSubmittedAt: state.lastSubmittedAt,
  };

  localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(payload));
}

function clearPersistedState() {
  localStorage.removeItem(TEST_STORAGE_KEY);
}

const persistedState = loadPersistedState();

const initialState = {
  questions: testQuestions,
  answers: persistedState?.answers || {},
  submitted: persistedState?.submitted || false,
  score: persistedState?.score || 0,
  percentage: persistedState?.percentage || 0,
  correctCount: persistedState?.correctCount || 0,
  wrongCount: persistedState?.wrongCount || 0,
  attemptedCount: persistedState?.attemptedCount || 0,
  lastSubmittedAt: persistedState?.lastSubmittedAt || null,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    selectAnswer: (state, action) => {
      if (state.submitted) {
        return;
      }

      const { questionId, optionId } = action.payload;
      state.answers[questionId] = optionId;
      savePersistedState(state);
    },
    submitTest: (state) => {
      const correctCount = state.questions.reduce((total, question) => {
        return total + Number(state.answers[question.id] === question.correctOptionId);
      }, 0);
      const attemptedCount = state.questions.filter(
        (question) => typeof state.answers[question.id] === 'string'
      ).length;

      state.submitted = true;
      state.correctCount = correctCount;
      state.score = correctCount;
      state.attemptedCount = attemptedCount;
      state.wrongCount = attemptedCount - correctCount;
      state.percentage = Math.round((correctCount / state.questions.length) * 100);
      state.lastSubmittedAt = new Date().toISOString();

      savePersistedState(state);
    },
    resetTest: (state) => {
      state.answers = {};
      state.submitted = false;
      state.score = 0;
      state.percentage = 0;
      state.correctCount = 0;
      state.wrongCount = 0;
      state.attemptedCount = 0;
      state.lastSubmittedAt = null;

      clearPersistedState();
    },
  },
});

export const { selectAnswer, submitTest, resetTest } = testSlice.actions;
export default testSlice.reducer;
