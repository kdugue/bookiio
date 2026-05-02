import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios.js";

export const generateQuiz = createAsyncThunk(
  "quiz/generate",
  async ({ bookId, type, count, chapterId }) => {
    const { data } = await api.post("/api/v1/assessments/generate", {
      bookId,
      type,
      count,
      chapterId,
    });
    return data;
  }
);

export const analyzeAnswers = createAsyncThunk(
  "quiz/analyze",
  async (_, { getState }) => {
    const { quiz } = getState();
    const wrongAnswers = quiz.questions
      .filter((q) => quiz.answers[q.id] !== q.correctIndex)
      .map((q) => ({
        questionId: q.id,
        question: q.question,
        userAnswer: q.options[quiz.answers[q.id]],
        correctAnswer: q.options[q.correctIndex],
      }));

    if (wrongAnswers.length === 0) return { analyses: [] };

    const { data } = await api.post("/api/v1/assessments/analyze", {
      bookId: quiz.bookId,
      wrongAnswers,
    });
    return data;
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState: {
    bookId: null,
    questions: [],
    answers: {},
    currentIndex: 0,
    submitted: false,
    analyses: [],
    analysisStatus: "idle",
    status: "idle",
    error: null,
  },
  reducers: {
    resetQuiz: () => ({
      bookId: null,
      questions: [],
      answers: {},
      currentIndex: 0,
      submitted: false,
      analyses: [],
      analysisStatus: "idle",
      status: "idle",
      error: null,
    }),
    selectAnswer: (state, action) => {
      const { questionId, answerIndex } = action.payload;
      state.answers[questionId] = answerIndex;
    },
    goToQuestion: (state, action) => {
      state.currentIndex = action.payload;
    },
    submitQuiz: (state) => {
      state.submitted = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateQuiz.pending, (state) => {
        state.status = "loading";
      })
      .addCase(generateQuiz.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bookId = action.payload.bookId;
        state.questions = action.payload.questions;
        state.answers = {};
        state.currentIndex = 0;
        state.submitted = false;
        state.analyses = [];
        state.analysisStatus = "idle";
      })
      .addCase(generateQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(analyzeAnswers.pending, (state) => {
        state.analysisStatus = "loading";
      })
      .addCase(analyzeAnswers.fulfilled, (state, action) => {
        state.analysisStatus = "succeeded";
        state.analyses = action.payload.analyses;
      })
      .addCase(analyzeAnswers.rejected, (state) => {
        state.analysisStatus = "failed";
      });
  },
});

export const { resetQuiz, selectAnswer, goToQuestion, submitQuiz } = quizSlice.actions;
export default quizSlice.reducer;
