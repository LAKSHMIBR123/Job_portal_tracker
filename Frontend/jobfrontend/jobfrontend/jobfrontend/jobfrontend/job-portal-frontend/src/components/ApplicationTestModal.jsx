import { useState, useEffect } from 'react';
import { frontendBank, backendBank, generalBank } from '../data/questionBanks';

function getRandomQuestions(bank, count = 10) {
  const shuffled = [...bank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function ApplicationTestModal({ job, onClose, onSuccess }) {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const initQuestions = () => {
    const title = (job?.title || '').toLowerCase();
    let bank = generalBank;
    
    if (title.includes('frontend') || title.includes('react') || title.includes('ui') || title.includes('css') || title.includes('html')) {
      bank = frontendBank;
    } else if (title.includes('backend') || title.includes('node') || title.includes('api') || title.includes('java') || title.includes('python') || title.includes('data')) {
      bank = backendBank;
    }

    setQuestions(getRandomQuestions(bank, 10));
    setCurrentStep(0);
    setAnswers({});
    setIsFinished(false);
    setScore(0);
  };

  useEffect(() => {
    initQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  if (questions.length === 0) {
    return null;
  }

  // Constants
  const passingScore = Math.ceil(questions.length * 0.6); // 60%
  
  const handleOptionSelect = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        newScore += 1;
      }
    });

    setScore(newScore);
    setIsFinished(true);
  };

  const handleApply = () => {
    onSuccess(job);
  };

  const handleRetry = () => {
    initQuestions();
  };

  return (
    <div className="test-modal-overlay">
      <div className="test-modal">
        <button className="test-modal__close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        {!isFinished ? (
          <div className="test-modal__content">
            <div className="test-modal__header">
              <span className="test-modal__eyebrow">Skill Assessment</span>
              <h2 className="test-modal__title">Application Test</h2>
              <p className="test-modal__subtitle">
                Score at least 60% to apply for the {job.title} role at {job.company}.
              </p>
            </div>

            <div className="test-modal__progress">
              <div className="test-modal__progress-bar">
                <div 
                  className="test-modal__progress-fill" 
                  style={{ width: `${((currentStep) / questions.length) * 100}%` }}
                ></div>
              </div>
              <span className="test-modal__progress-text">
                Question {currentStep + 1} of {questions.length}
              </span>
            </div>

            <div className="test-modal__question-block">
              <h3 className="test-modal__question">
                {questions[currentStep].question}
              </h3>
              
              <div className="test-modal__options">
                {questions[currentStep].options.map((option, index) => (
                  <button
                    key={index}
                    className={`test-modal__option ${answers[currentStep] === index ? 'test-modal__option--selected' : ''}`}
                    onClick={() => handleOptionSelect(currentStep, index)}
                  >
                    <span className="test-modal__option-indicator">
                       {String.fromCharCode(65 + index)}
                    </span>
                    <span className="test-modal__option-text">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="test-modal__footer">
              {currentStep > 0 && (
                <button 
                  className="test-modal__btn test-modal__btn--secondary" 
                  onClick={handlePrevious}
                >
                  Previous
                </button>
              )}
              <button 
                className="test-modal__btn auth-button" 
                onClick={handleNext}
                disabled={answers[currentStep] === undefined}
              >
                {currentStep === questions.length - 1 ? 'Finish Test' : 'Next Question'}
              </button>
            </div>
          </div>
        ) : (
          <div className="test-modal__result">
            {score >= passingScore ? (
              <div className="test-result-success">
                <div className="test-result-icon">✨</div>
                <h2>You Passed!</h2>
                <p>Great job! You scored <strong>{score} out of {questions.length}</strong>.</p>
                <p className="test-result-msg">You can now proceed with your application.</p>
                <div className="test-modal__footer">
                  <button className="test-modal__btn auth-button" onClick={handleApply}>
                    Submit Application
                  </button>
                </div>
              </div>
            ) : (
              <div className="test-result-fail">
                <div className="test-result-icon test-result-icon--fail">⚠️</div>
                <h2>Not Quite There</h2>
                <p>You scored <strong>{score} out of {questions.length}</strong>.</p>
                <p className="test-result-msg">A score of {passingScore} or higher is required to apply for this role. Review your knowledge and try again.</p>
                <div className="test-modal__footer test-modal__footer--split">
                   <button className="test-modal__btn test-modal__btn--secondary" onClick={onClose}>
                    Close
                  </button>
                  <button className="test-modal__btn auth-button" onClick={handleRetry}>
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
