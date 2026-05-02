import { configureStore } from "@reduxjs/toolkit";
import libraryReducer from "./librarySlice.js";
import quizReducer from "./quizSlice.js";

export const store = configureStore({
  reducer: {
    library: libraryReducer,
    quiz: quizReducer,
  },
});
