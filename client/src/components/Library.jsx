import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchBooks } from "../store/librarySlice.js";
import BookCard from "./BookCard.jsx";
import UploadBook from "./UploadBook.jsx";

export default function Library() {
  const dispatch = useDispatch();
  const { books, status } = useSelector((s) => s.library);
  const pollRef = useRef(null);

  useEffect(() => {
    if (status === "idle") dispatch(fetchBooks());
  }, [status, dispatch]);

  const hasProcessing = books.some((b) => b.status === "processing");

  useEffect(() => {
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(() => dispatch(fetchBooks()), 3000);
    }
    if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasProcessing, dispatch]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-700">All Books</h2>
        <UploadBook />
      </div>

      {status === "loading" && books.length === 0 && (
        <p className="text-gray-400 text-sm">Loading library...</p>
      )}

      {status === "failed" && (
        <p className="text-red-500 text-sm">
          Failed to load library. Is the server running?
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
