import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios.js";

export const fetchBooks = createAsyncThunk("library/fetchBooks", async () => {
  const { data } = await api.get("/api/v1/library");
  return data;
});

export const uploadBook = createAsyncThunk(
  "library/uploadBook",
  async (formData) => {
    const { data } = await api.post("/api/v1/library/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
);

export const confirmBook = createAsyncThunk(
  "library/confirmBook",
  async ({ bookId, title, author }) => {
    const { data } = await api.patch(`/api/v1/library/${bookId}`, { title, author });
    return data;
  }
);

export const deleteBook = createAsyncThunk(
  "library/deleteBook",
  async (bookId) => {
    await api.delete(`/api/v1/library/${bookId}`);
    return bookId;
  }
);

const librarySlice = createSlice({
  name: "library",
  initialState: {
    books: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(uploadBook.fulfilled, (state, action) => {
        state.books.push(action.payload);
      })
      .addCase(confirmBook.fulfilled, (state, action) => {
        const idx = state.books.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.books[idx] = action.payload;
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.books = state.books.filter((b) => b.id !== action.payload);
      });
  },
});

export default librarySlice.reducer;
