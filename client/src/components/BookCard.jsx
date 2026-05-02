import { useState } from "react";
import { useDispatch } from "react-redux";
import { generateQuiz } from "../store/quizSlice.js";
import { deleteBook } from "../store/librarySlice.js";

const statusStyles = {
  ready: "bg-emerald-100 text-emerald-800",
  processing: "bg-amber-100 text-amber-800",
  pending_review: "bg-blue-100 text-blue-800",
  error: "bg-red-100 text-red-800",
};

const statusLabels = {
  ready: "ready",
  processing: "processing",
  pending_review: "pending review",
  error: "error",
};

const sourceLabels = {
  internal: "Internal",
  user_upload: "User Upload",
};

export default function BookCard({ book }) {
  const dispatch = useDispatch();
  const [showChapters, setShowChapters] = useState(false);
  const badge = statusStyles[book.status] ?? "bg-gray-100 text-gray-600";
  const isReady = book.status === "ready";
  const hasChapters = book.chapters?.length >= 2;

  const startQuiz = (type, chapterId = null) => {
    dispatch(generateQuiz({ bookId: book.id, type, count: 5, chapterId }));
    setShowChapters(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight">
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${badge}`}
          >
            {statusLabels[book.status] ?? book.status}
          </span>
          <button
            onClick={() => {
              if (confirm(`Delete "${book.title}"?`)) {
                dispatch(deleteBook(book.id));
              }
            }}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Delete book"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {isReady && (
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {sourceLabels[book.source] ?? book.source}
            </span>
            <div className="flex gap-2">
              {hasChapters ? (
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {showChapters ? "Close" : "Quiz"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => startQuiz("mcq")}
                    className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Quiz
                  </button>
                  <button
                    onClick={() => startQuiz("tf")}
                    className="text-xs font-medium px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    T/F
                  </button>
                </>
              )}
            </div>
          </div>

          {showChapters && hasChapters && (
            <div className="border-t border-gray-100 pt-2 flex flex-col gap-1.5">
              {book.chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => startQuiz("mcq", ch.id)}
                  className="text-left text-xs px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 truncate"
                  title={ch.title}
                >
                  <span className="text-gray-400 mr-1.5">Ch. {i + 1}</span>
                  {ch.title}
                </button>
              ))}
              <button
                onClick={() => startQuiz("mcq")}
                className="text-left text-xs px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium border-t border-gray-100 mt-1 pt-2"
              >
                Whole Book Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {!isReady && (
        <div className="mt-auto">
          <span className="text-xs text-gray-400">
            {sourceLabels[book.source] ?? book.source}
          </span>
        </div>
      )}
    </div>
  );
}
