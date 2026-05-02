import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Library from "./components/Library.jsx";
import Quiz from "./components/Quiz.jsx";
import { resetQuiz } from "./store/quizSlice.js";

export default function App() {
  const dispatch = useDispatch();
  const quizStatus = useSelector((s) => s.quiz.status);
  const showQuiz = quizStatus === "loading" || quizStatus === "succeeded" || quizStatus === "failed";
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    fetch("http://ip-api.com/json/?fields=regionName")
      .then((r) => r.json())
      .then((data) => {
        if (data.regionName === "Texas") {
          setGreeting("Привет, малышка, спасибо что попробовала моё приложение 💜");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl font-bold tracking-tight cursor-pointer"
            onClick={() => dispatch(resetQuiz())}
          >Bookio</h1>
          {greeting && (
            <p className="text-sm font-medium text-purple-600 animate-pulse">{greeting}</p>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {showQuiz ? <Quiz /> : <Library />}
      </main>
    </div>
  );
}
