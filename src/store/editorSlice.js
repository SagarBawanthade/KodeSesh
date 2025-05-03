import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for updating code with error handling
export const updateCodeAsync = createAsyncThunk(
  'editor/updateCodeAsync',
  async ({ sessionId, fileName, code }, { rejectWithValue }) => {
    try {
      // First save to localStorage
      localStorage.setItem(`code_${sessionId}_${fileName}`, code);
      return { sessionId, fileName, code };
    } catch (error) {
      console.error("Failed to save code to localStorage:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to safely get code from localStorage
const getSavedCodeFromLocalStorage = (sessionId, fileName) => {
  try {
    return localStorage.getItem(`code_${sessionId}_${fileName}`);
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
};

const initialState = {
  code: {},
  selectedFile: "index.js",
  activeSessionId: "demo-session",
  error: null,
  loading: false
};

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // Synchronous update with error handling
    updateCode: (state, action) => {
      try {
        const { sessionId, fileName, code } = action.payload;
        
        // Validate inputs to prevent errors
        if (!sessionId || !fileName || typeof code !== 'string') {
          console.error("Invalid parameters for updateCode:", action.payload);
          state.error = "Invalid parameters for code update";
          return;
        }
        
        // Save to localStorage first, to ensure persistence
        localStorage.setItem(`code_${sessionId}_${fileName}`, code);
        
        // Then update state
        if (!state.code[sessionId]) {
          state.code[sessionId] = {};
        }
        state.code[sessionId][fileName] = code;
        state.error = null;
      } catch (error) {
        console.error("Error updating code:", error);
        state.error = error.message;
      }
    },
    
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
    
    // Load initial code from localStorage with improved error handling
    loadSavedCode: (state) => {
      try {
        const { activeSessionId, selectedFile } = state;
        
        if (!state.code[activeSessionId]) {
          state.code[activeSessionId] = {};
        }
        
        // If no code exists for this file in redux state, try to load from localStorage
        if (!state.code[activeSessionId][selectedFile]) {
          const savedCode = getSavedCodeFromLocalStorage(activeSessionId, selectedFile);
          
          if (savedCode) {
            state.code[activeSessionId][selectedFile] = savedCode;
          } else {
            state.code[activeSessionId][selectedFile] = "// Start writing your code here!";
          }
        }
        
        state.error = null;
      } catch (error) {
        console.error("Error loading saved code:", error);
        state.error = error.message;
      }
    },
    
    // New action to clear errors
    clearError: (state) => {
      state.error = null;
    },
    
    // New action to recover code from localStorage when state might be corrupted
    recoverCodeFromLocalStorage: (state) => {
      try {
        const { activeSessionId, selectedFile } = state;
        
        const savedCode = getSavedCodeFromLocalStorage(activeSessionId, selectedFile);
        
        if (savedCode) {
          if (!state.code[activeSessionId]) {
            state.code[activeSessionId] = {};
          }
          state.code[activeSessionId][selectedFile] = savedCode;
          state.error = null;
        }
      } catch (error) {
        console.error("Error recovering code:", error);
        state.error = error.message;
      }
    }
  },
  extraReducers: (builder) => {
    // Handle async updateCode actions
    builder.addCase(updateCodeAsync.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateCodeAsync.fulfilled, (state, action) => {
      const { sessionId, fileName, code } = action.payload;
      if (!state.code[sessionId]) {
        state.code[sessionId] = {};
      }
      state.code[sessionId][fileName] = code;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(updateCodeAsync.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to update code";
      console.error("Failed to update code:", action.payload);
    });
  }
});

export const { 
  updateCode, 
  setSelectedFile, 
  setActiveSessionId, 
  loadSavedCode,
  clearError,
  recoverCodeFromLocalStorage
} = editorSlice.actions;

// Enhanced selectors with error handling
export const selectCode = (state) => {
  try {
    const { activeSessionId, selectedFile, code } = state.editor;
    
    // First try Redux state
    if (code[activeSessionId] && code[activeSessionId][selectedFile]) {
      return code[activeSessionId][selectedFile];
    }
    
    // If not in Redux state, try localStorage as fallback
    const savedCode = getSavedCodeFromLocalStorage(activeSessionId, selectedFile);
    if (savedCode) {
      return savedCode;
    }
    
    // Default fallback
    return "// Start writing your code here!";
  } catch (error) {
    console.error("Error in selectCode selector:", error);
    return "// Error loading code. Please refresh the page.";
  }
};

export const selectSelectedFile = (state) => state.editor.selectedFile;
export const selectActiveSessionId = (state) => state.editor.activeSessionId;
export const selectEditorError = (state) => state.editor.error;
export const selectIsLoading = (state) => state.editor.loading;

export default editorSlice.reducer;