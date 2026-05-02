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
      });
  },
});

export default librarySlice.reducer;
