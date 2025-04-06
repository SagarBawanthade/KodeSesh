import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './editorSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    user: userReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['user/login/rejected', 'user/register/rejected'],
      },
    }),
});

export default store;