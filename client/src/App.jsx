import { useSelector, useDispatch } from "react-redux";
import Library from "./components/Library.jsx";
import Quiz from "./components/Quiz.jsx";
import { resetQuiz } from "./store/quizSlice.js";

export default function App() {
  const dispatch = useDispatch();
  const quizStatus = useSelector((s) => s.quiz.status);
  const showQuiz = quizStatus === "loading" || quizStatus === "succeeded" || quizStatus === "failed";

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1
          className="text-2xl font-bold tracking-tight cursor-pointer"
          onClick={() => dispatch(resetQuiz())}
        >Bookio</h1>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {showQuiz ? <Quiz /> : <Library />}
      </main>
    </div>
  );
}
