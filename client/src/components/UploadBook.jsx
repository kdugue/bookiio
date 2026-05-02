import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { uploadBook, confirmBook } from "../store/librarySlice.js";

export default function UploadBook() {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "pdf" && ext !== "txt") return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const result = await dispatch(uploadBook(formData)).unwrap();
      setPending({ id: result.id, title: result.title, author: result.author });
    } catch {
      /* upload error handled by Redux */
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (!pending) return;
    dispatch(confirmBook({ bookId: pending.id, title: pending.title, author: pending.author }));
    setPending(null);
  };

  const handleCancel = () => {
    setPending(null);
  };

  const handleChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex items-center gap-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors ${
            uploading
              ? "bg-gray-400 text-white cursor-wait"
              : dragging
              ? "bg-gray-700 text-white ring-2 ring-gray-400"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {uploading ? (
            <span>Detecting book...</span>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {dragging ? "Drop here" : "Upload Book"}
            </>
          )}
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Is this your book?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              We detected the following info. Edit if needed.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={pending.title}
              onChange={(e) => setPending({ ...pending, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              value={pending.author}
              onChange={(e) => setPending({ ...pending, author: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Confirm & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
