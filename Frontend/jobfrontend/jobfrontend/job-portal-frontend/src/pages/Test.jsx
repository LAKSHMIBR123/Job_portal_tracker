import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage';
import { resetTest, selectAnswer, submitTest } from '../features/testSlice';

function Test() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { questions, answers, submitted } = useSelector((state) => state.test);
  const [errorMsg, setErrorMsg] = useState('');

  if (questions.length === 0) {
    return (
      <section className="test-page">
        <div className="test-shell">
          <section className="test-panel test-panel--inline">
            <div>
              <p className="test-panel__eyebrow">Assessment</p>
              <h1 className="test-panel__title">No fixed MCQ questions available</h1>
              <p className="test-panel__text">
                The previous fixed test questions have been removed.
              </p>
            </div>
          </section>
        </div>
      </section>
    );
  }

  const answeredCount = questions.filter(
    (question) => typeof answers[question.id] === 'string'
  ).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const handleSelectAnswer = (questionId, optionId) => {
    dispatch(selectAnswer({ questionId, optionId }));

    if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleSubmit = () => {
    if (answeredCount !== questions.length) {
      setErrorMsg('Please answer every question before submitting the test.');
      return;
    }

    dispatch(submitTest());
    navigate('/result', { replace: true });
  };

  const handleReset = () => {
    dispatch(resetTest());
    setErrorMsg('');
  };

  if (submitted) {
    return (
      <section className="test-page">
        <div className="test-shell">
          <section className="test-hero">
            <div className="test-hero__copy">
              <p className="auth-kicker test-hero__kicker">Test center</p>
              <h1 className="test-title">Your latest attempt is already submitted</h1>
              <p className="test-copy">
                You can open the result page to review your score or reset the test and
                start a fresh attempt.
              </p>
            </div>

            <div className="test-hero__meta">
              <span className="test-hero__meta-label">Attempt status</span>
              <strong>Submitted</strong>
            </div>
          </section>

          <section className="test-panel test-panel--inline">
            <div>
              <p className="test-panel__eyebrow">Next step</p>
              <h2 className="test-panel__title">Review or retake</h2>
              <p className="test-panel__text">
                Results are ready. Open the score breakdown or clear the attempt to take
                the test again.
              </p>
            </div>

            <div className="test-actions">
              <Link className="top-nav__link top-nav__link--primary" to="/result">
                View result
              </Link>
              <button className="top-nav__button" type="button" onClick={handleReset}>
                Retake test
              </button>
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="test-page">
      <div className="test-shell">
        <section className="test-hero">
          <div className="test-hero__copy">
            <p className="auth-kicker test-hero__kicker">Assessment</p>
            <h1 className="test-title">Frontend readiness test</h1>
            <p className="test-copy">
              Answer all questions to complete this short frontend skills assessment and
              view your result instantly.
            </p>
          </div>

          <div className="test-hero__meta">
            <span className="test-hero__meta-label">Progress</span>
            <strong>
              {answeredCount}/{questions.length}
            </strong>
          </div>
        </section>

        <section className="test-layout">
          <aside className="test-panel">
            <p className="test-panel__eyebrow">Overview</p>
            <h2 className="test-panel__title">Assessment details</h2>
            <div className="test-summary-list">
              <div className="test-summary-item">
                <span>Total questions</span>
                <strong>{questions.length}</strong>
              </div>
              <div className="test-summary-item">
                <span>Answered</span>
                <strong>{answeredCount}</strong>
              </div>
              <div className="test-summary-item">
                <span>Completion</span>
                <strong>{progress}%</strong>
              </div>
            </div>

            <div className="test-progress">
              <div className="test-progress__track" aria-hidden="true">
                <span className="test-progress__fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="test-panel__text">
                Finish every question before submitting so the result page can calculate
                the full score.
              </p>
            </div>

            <div className="test-actions">
              <button className="auth-button test-actions__primary" type="button" onClick={handleSubmit}>
                Submit test
              </button>
              <button className="top-nav__button" type="button" onClick={handleReset}>
                Reset answers
              </button>
            </div>

            <StatusMessage
              message={errorMsg}
              title="Test incomplete"
              variant="error"
            />
          </aside>

          <section className="test-questions">
            {questions.map((question, index) => (
              <article className="test-question-card" key={question.id}>
                <div className="test-question-card__header">
                  <span className="test-question-card__count">Question {index + 1}</span>
                  <span className="test-question-card__topic">{question.topic}</span>
                </div>

                <h2 className="test-question-card__title">{question.prompt}</h2>

                <div className="test-options" role="radiogroup" aria-label={question.prompt}>
                  {question.options.map((option) => {
                    const isSelected = answers[question.id] === option.id;

                    return (
                      <label
                        className={`test-option${isSelected ? ' test-option--selected' : ''}`}
                        key={option.id}
                      >
                        <input
                          checked={isSelected}
                          className="test-option__input"
                          name={question.id}
                          onChange={() => handleSelectAnswer(question.id, option.id)}
                          type="radio"
                          value={option.id}
                        />
                        <span className="test-option__marker" aria-hidden="true" />
                        <span className="test-option__text">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        </section>
      </div>
    </section>
  );
}

export default Test;
