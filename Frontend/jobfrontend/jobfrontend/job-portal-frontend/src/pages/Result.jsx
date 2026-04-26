import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { resetTest } from '../features/testSlice';

function formatSubmittedTime(value) {
  if (!value) {
    return 'Not submitted yet';
  }

  const submittedDate = new Date(value);

  if (Number.isNaN(submittedDate.getTime())) {
    return 'Not submitted yet';
  }

  return submittedDate.toLocaleString();
}

function Result() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    answers,
    attemptedCount,
    correctCount,
    lastSubmittedAt,
    percentage,
    questions,
    submitted,
    wrongCount,
  } = useSelector((state) => state.test);

  const hasResult = submitted && attemptedCount > 0;
  const isPassed = percentage >= 60;

  const handleRetake = () => {
    dispatch(resetTest());
    navigate('/test');
  };

  if (!hasResult) {
    return (
      <section className="result-page">
        <div className="result-shell">
          <section className="result-hero">
            <div className="result-hero__copy">
              <p className="auth-kicker result-hero__kicker">Result</p>
              <h1 className="result-title">No test result yet</h1>
              <p className="result-copy">
                Take the assessment first to generate your score report and question-by-question breakdown.
              </p>
            </div>
          </section>

          <section className="result-card result-card--empty">
            <p className="test-panel__eyebrow">Start here</p>
            <h2 className="test-panel__title">Open the test page</h2>
            <p className="test-panel__text">
              Once you submit the assessment, this page will show your score, pass status,
              and the correct answers.
            </p>

            <div className="result-actions">
              <Link className="top-nav__link top-nav__link--primary" to="/test">
                Go to test
              </Link>
              <Link className="top-nav__link" to="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="result-page">
      <div className="result-shell">
        <section className="result-hero">
          <div className="result-hero__copy">
            <p className="auth-kicker result-hero__kicker">Result</p>
            <h1 className="result-title">
              {isPassed ? 'Great work. You passed the assessment.' : 'Assessment complete.'}
            </h1>
            <p className="result-copy">
              {isPassed
                ? 'Your latest attempt shows a solid foundation across frontend basics.'
                : 'Your result is ready. Review the breakdown below and retake the test whenever you want.'}
            </p>
          </div>

          <div className={`result-badge${isPassed ? ' result-badge--pass' : ' result-badge--retry'}`}>
            <span className="result-badge__label">Score</span>
            <strong>{percentage}%</strong>
          </div>
        </section>

        <section className="result-stats" aria-label="Result summary">
          <article className="result-card">
            <span className="result-card__label">Correct answers</span>
            <strong className="result-card__value">{correctCount}</strong>
          </article>

          <article className="result-card">
            <span className="result-card__label">Wrong answers</span>
            <strong className="result-card__value">{wrongCount}</strong>
          </article>

          <article className="result-card">
            <span className="result-card__label">Questions attempted</span>
            <strong className="result-card__value">{attemptedCount}</strong>
          </article>
        </section>

        <section className="result-card result-card--detail">
          <div className="result-card__header">
            <div>
              <p className="test-panel__eyebrow">Attempt summary</p>
              <h2 className="test-panel__title">Latest submission</h2>
            </div>
            <span className="result-card__timestamp">{formatSubmittedTime(lastSubmittedAt)}</span>
          </div>

          <p className="test-panel__text">
            You answered {correctCount} out of {questions.length} questions correctly.
            Pass mark is 60%.
          </p>

          <div className="result-actions">
            <button className="auth-button" type="button" onClick={handleRetake}>
              Retake test
            </button>
            <Link className="top-nav__link" to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </section>

        <section className="result-breakdown">
          {questions.map((question, index) => {
            const selectedOption = question.options.find(
              (option) => option.id === answers[question.id]
            );
            const correctOption = question.options.find(
              (option) => option.id === question.correctOptionId
            );
            const isCorrect = selectedOption?.id === correctOption?.id;

            return (
              <article className="result-question-card" key={question.id}>
                <div className="result-question-card__header">
                  <span className="test-question-card__count">Question {index + 1}</span>
                  <span
                    className={`result-question-card__status${
                      isCorrect ? ' result-question-card__status--correct' : ' result-question-card__status--wrong'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Needs review'}
                  </span>
                </div>

                <h2 className="result-question-card__title">{question.prompt}</h2>

                <div className="result-answer-grid">
                  <div className="result-answer">
                    <span className="result-answer__label">Your answer</span>
                    <strong>{selectedOption?.label || 'Not answered'}</strong>
                  </div>

                  <div className="result-answer">
                    <span className="result-answer__label">Correct answer</span>
                    <strong>{correctOption?.label || 'Unavailable'}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </section>
  );
}

export default Result;
