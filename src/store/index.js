import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './editorSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
  },
});