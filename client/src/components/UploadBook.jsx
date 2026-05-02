import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { uploadBook } from "../store/librarySlice.js";

export default function UploadBook() {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "pdf" && ext !== "txt") return;

    const formData = new FormData();
    formData.append("file", file);
    dispatch(uploadBook(formData));
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

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors ${
          dragging
            ? "bg-gray-700 text-white ring-2 ring-gray-400"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
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
      </div>
    </>
  );
}
