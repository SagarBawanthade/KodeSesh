import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  code: {},
  selectedFile: "index.js",
  activeSessionId: "demo-session",
};

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    updateCode: (state, action) => {
      const { sessionId, fileName, code } = action.payload;
      if (!state.code[sessionId]) {
        state.code[sessionId] = {};
      }
      state.code[sessionId][fileName] = code;
      
      // Also save to localStorage as backup
      localStorage.setItem(`code_${sessionId}_${fileName}`, code);
    },
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
    // Load initial code from localStorage if available
    loadSavedCode: (state) => {
      const { activeSessionId, selectedFile } = state;
      if (!state.code[activeSessionId]) {
        state.code[activeSessionId] = {};
      }
      
      // If no code exists for this file in redux state, try to load from localStorage
      if (!state.code[activeSessionId][selectedFile]) {
        const savedCode = localStorage.getItem(`code_${activeSessionId}_${selectedFile}`);
        if (savedCode) {
          state.code[activeSessionId][selectedFile] = savedCode;
        } else {
          state.code[activeSessionId][selectedFile] = "// Start writing your code here!";
        }
      }
    }
  },
});

export const { updateCode, setSelectedFile, setActiveSessionId, loadSavedCode } = editorSlice.actions;

// Selectors
export const selectCode = (state) => {
  const { activeSessionId, selectedFile, code } = state.editor;
  if (code[activeSessionId] && code[activeSessionId][selectedFile]) {
    return code[activeSessionId][selectedFile];
  }
  return "// Start writing your code here!";
};


export const selectSelectedFile = (state) => state.editor.selectedFile;
export const selectActiveSessionId = (state) => state.editor.activeSessionId;

export default editorSlice.reducer;
