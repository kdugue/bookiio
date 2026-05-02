import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAnswer, goToQuestion, submitQuiz, resetQuiz, analyzeAnswers } from "../store/quizSlice.js";

export default function Quiz() {
  const dispatch = useDispatch();
  const { questions, answers, currentIndex, submitted, status, error } = useSelector(
    (s) => s.quiz
  );

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Generating quiz...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => dispatch(resetQuiz())}
          className="text-sm text-gray-600 underline"
        >
          Back to library
        </button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  if (submitted) return <Results />;

  const q = questions[currentIndex];
  const selected = answers[q.id];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <button
          onClick={() => dispatch(resetQuiz())}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Exit quiz
        </button>
      </div>

      <ProgressBar current={currentIndex} answers={answers} questions={questions} />

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-5">{q.question}</h3>

        <div className="flex flex-col gap-3">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => dispatch(selectAnswer({ questionId: q.id, answerIndex: idx }))}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                selected === idx
                  ? "border-gray-900 bg-gray-50 font-medium"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm text-gray-500 mr-2">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => dispatch(goToQuestion(currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => dispatch(goToQuestion(currentIndex + 1))}
            disabled={selected === undefined}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => dispatch(submitQuiz())}
            disabled={Object.keys(answers).length < questions.length}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ current, answers, questions }) {
  return (
    <div className="flex gap-1.5">
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => {}}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i === current
              ? "bg-gray-900"
              : answers[q.id] !== undefined
              ? "bg-gray-400"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function Results() {
  const dispatch = useDispatch();
  const { questions, answers, analyses, analysisStatus } = useSelector((s) => s.quiz);

  const score = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0),
    0
  );
  const pct = Math.round((score / questions.length) * 100);
  const hasWrong = score < questions.length;

  useEffect(() => {
    if (hasWrong && analysisStatus === "idle") {
      dispatch(analyzeAnswers());
    }
  }, [hasWrong, analysisStatus, dispatch]);

  const analysisMap = {};
  analyses.forEach((a) => { analysisMap[a.questionId] = a; });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl font-bold text-gray-900 mb-1">{pct}%</div>
        <p className="text-gray-500">
          {score} of {questions.length} correct
        </p>
        {hasWrong && analysisStatus === "loading" && (
          <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Analyzing wrong answers...
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q) => {
          const userAnswer = answers[q.id];
          const correct = userAnswer === q.correctIndex;
          const analysis = analysisMap[q.id];

          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl border p-5 ${
                correct ? "border-emerald-200" : "border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 text-lg ${correct ? "text-emerald-500" : "text-red-500"}`}>
                  {correct ? "\u2713" : "\u2717"}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                  <p className="text-sm text-gray-500">
                    Your answer:{" "}
                    <span className={correct ? "text-emerald-600" : "text-red-600"}>
                      {q.options[userAnswer]}
                    </span>
                  </p>
                  {!correct && (
                    <p className="text-sm text-gray-500">
                      Correct answer:{" "}
                      <span className="text-emerald-600">{q.options[q.correctIndex]}</span>
                    </p>
                  )}
                  {analysis && (
                    <div className="mt-3 bg-red-50 rounded-lg p-3 text-sm space-y-2">
                      <p className="text-red-800">
                        <span className="font-medium">Why incorrect:</span> {analysis.whyWrong}
                      </p>
                      <p className="text-emerald-800">
                        <span className="font-medium">Why correct:</span> {analysis.whyRight}
                      </p>
                      {analysis.relevantPassage && (
                        <p className="text-gray-500 italic border-l-2 border-gray-300 pl-3">
                          {analysis.relevantPassage}
                        </p>
                      )}
                    </div>
                  )}
                  {!analysis && correct && q.explanation && (
                    <p className="text-sm text-gray-400 mt-2 italic">{q.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => dispatch(resetQuiz())}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          Back to library
        </button>
      </div>
    </div>
  );
}
