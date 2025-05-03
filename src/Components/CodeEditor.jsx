import { useEffect, useRef } from 'react';
import Monaco from "@monaco-editor/react";

const CodeEditor = ({ 
  code, 
  onChange, 
  language, 
  gitStatus = [], 
  activeTypist = null
}) => {
  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  
  // Extremely bright, unmissable neon colors
  const COLORS = [
    '#FF0000', // Pure Red
    '#00FF00', // Pure Green
    '#0000FF', // Pure Blue
    '#FF00FF', // Pure Magenta
    '#00FFFF', // Pure Cyan
    '#FF7700', // Pure Orange
    '#7700FF'  // Pure Purple
  ];
  
  // Get color for user
  const getUserColor = (userId) => {
    if (!userId) return COLORS[0];
    const hash = String(userId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
  };
  
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Initialize global styles once
    if (!document.getElementById('typing-indicator-global-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'typing-indicator-global-styles';
      styleElement.innerHTML = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes dots-animation {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        .user-typing-cursor-overlay {
          pointer-events: none;
          z-index: 100;
        }
      `;
      document.head.appendChild(styleElement);
    }
  };
  
  const getLanguageClass = () => {
    switch (language) {
      case 'python':
        return 'language-python';
      case 'javascript':
      default:
        return 'language-javascript';
    }
  };

  // Find git status for the current file being edited
  const getGitStatusIndicator = () => {
    // Extract filename from language setting
    const currentFile = `main.${language === 'javascript' ? 'js' : 'py'}`;
    
    // Find status for current file
    const fileStatus = gitStatus.find(item => item.path === currentFile);
    
    if (!fileStatus) return null;
    
    // Return appropriate indicator based on status
    switch (fileStatus.status) {
      case 'modified':
        return (
          <div className="absolute top-2 right-2 z-10 flex items-center bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">
            <span className="mr-1">●</span> Modified
          </div>
        );
      case 'added':
        return (
          <div className="absolute top-2 right-2 z-10 flex items-center bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">
            <span className="mr-1">+</span> Added
          </div>
        );
      case 'deleted':
        return (
          <div className="absolute top-2 right-2 z-10 flex items-center bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">
            <span className="mr-1">-</span> Deleted
          </div>
        );
      case 'renamed':
        return (
          <div className="absolute top-2 right-2 z-10 flex items-center bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">
            <span className="mr-1">→</span> Renamed
          </div>
        );
      default:
        return null;
    }
  };
  
  // Create avatar initials from username
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Convert hex color to RGB format for use in rgba()
  function hexToRGB(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }

  // Lighten a hex color by a percentage
  function lightenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Lighten each value
    r = Math.min(255, r + Math.floor(r * percent / 100));
    g = Math.min(255, g + Math.floor(g * percent / 100));
    b = Math.min(255, b + Math.floor(b * percent / 100));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Effect to create enhanced futuristic typing indicators
  useEffect(() => {
    if (!editorRef.current || !activeTypist) return;
    
    const { position, userName, userId } = activeTypist;
    const userColor = getUserColor(userId);
    
    // Default position if none provided
    const lineNumber = position?.lineNumber || 1;
    const column = position?.column || 1;
    
    // Get the Monaco editor model and instance
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    
    // Create line decorations with high-visibility styling
    const decorations = editor.deltaDecorations([], [
      // Add a full-line highlight with improved aesthetics
      {
        range: {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: model.getLineMaxColumn(lineNumber)
        },
        options: {
          isWholeLine: true,
          className: `typing-line-${userId}`,
          glyphMarginClassName: `typing-glyph-${userId}`,
          linesDecorationsClassName: `typing-line-decoration-${userId}`,
          marginClassName: `typing-margin-${userId}`,
          inlineClassName: `typing-inline-${userId}`,
          overviewRuler: {
            color: userColor,
            position: 1,
            darkColor: userColor
          },
          minimap: {
            color: userColor,
            position: 1
          }
        }
      },
      // Add a blinking vertical bar cursor
      {
        range: {
          startLineNumber: lineNumber,
          startColumn: column,
          endLineNumber: lineNumber,
          endColumn: column + 1
        },
        options: {
          inlineClassName: `typing-cursor-${userId}`,
          beforeContentClassName: `typing-cursor-before-${userId}`
        }
      }
    ]);
    
    // Add custom styles for this specific user with futuristic styling
    const styleId = `typist-style-${userId}`;
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Create futuristic styling that matches the app's UI
    styleElement.innerHTML = `
      /* Futuristic line highlight */
      .typing-line-${userId} {
        background: linear-gradient(to right, 
          rgba(${hexToRGB(userColor)}, 0.05) 0%,
          rgba(${hexToRGB(userColor)}, 0.15) 50%,
          rgba(${hexToRGB(userColor)}, 0.05) 100%) !important;
        border-left: 3px solid ${userColor} !important;
        box-shadow: inset 0 0 8px rgba(${hexToRGB(userColor)}, 0.1) !important;
        animation: glow-${userId} 2s infinite ease-in-out !important;
      }
      
      @keyframes glow-${userId} {
        0%, 100% { border-left-color: ${userColor}; }
        50% { border-left-color: ${lightenColor(userColor, 30)}; }
      }
      
      /* Clean glyph in the margin */
      .typing-glyph-${userId}::after {
        content: "▎";
        color: ${userColor};
        font-weight: bold;
        font-size: 16px;
        margin-left: 5px;
        text-shadow: 0 0 3px rgba(${hexToRGB(userColor)}, 0.7);
      }
      
      /* Clean decoration for line number */
      .typing-line-decoration-${userId}::before {
        content: "•";
        color: ${userColor};
        font-weight: bold;
        font-size: 14px;
        margin-right: 3px;
        opacity: 0.9;
      }
      
      /* Futuristic cursor styling */
      .typing-cursor-${userId} {
        background-color: ${userColor} !important;
        border-radius: 0;
        width: 2px !important;
        opacity: 0.9;
        animation: cursor-blink-${userId} 1s infinite !important;
        box-shadow: 0 0 8px ${userColor} !important;
      }
      
      @keyframes cursor-blink-${userId} {
        0%, 100% { opacity: 1; box-shadow: 0 0 8px ${userColor}; }
        50% { opacity: 0.5; box-shadow: 0 0 4px ${userColor}; }
      }
    `;
    
    // Create cursor position overlay with avatar
    const cursorCoords = editor.getScrolledVisiblePosition({ 
      lineNumber, 
      column 
    });
    
    if (cursorCoords) {
      const overlayId = `typing-overlay-${userId}`;
      let overlayElement = document.getElementById(overlayId);
      
      if (!overlayElement) {
        const editorContainer = editor.getDomNode()?.parentElement;
        if (editorContainer) {
          // Create overlay container
          overlayElement = document.createElement('div');
          overlayElement.id = overlayId;
          overlayElement.className = 'user-typing-cursor-overlay';
          
          // Create a flex container for avatar and name
          overlayElement.style.display = 'flex';
          overlayElement.style.alignItems = 'center';
          overlayElement.style.position = 'absolute';
          overlayElement.style.left = `${cursorCoords.left - 10}px`;
          overlayElement.style.top = `${cursorCoords.top - 30}px`;
          overlayElement.style.transition = 'all 0.2s ease-out';
          overlayElement.style.zIndex = '100';
          
          // Create futuristic name badge
          const badge = document.createElement('div');
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.background = `linear-gradient(90deg, ${userColor} 0%, rgba(10,16,31,0.9) 100%)`;
          badge.style.color = 'white';
          badge.style.padding = '3px 8px 3px 3px';
          badge.style.borderRadius = '12px';
          badge.style.fontSize = '11px';
          badge.style.fontWeight = 'bold';
          badge.style.boxShadow = `0 2px 5px rgba(0,0,0,0.3), 0 0 10px rgba(${hexToRGB(userColor)}, 0.3)`;
          badge.style.border = '1px solid rgba(255,255,255,0.1)';
          badge.style.backdropFilter = 'blur(4px)';
          
          // Avatar with initials
          const avatar = document.createElement('div');
          avatar.style.display = 'flex';
          avatar.style.alignItems = 'center';
          avatar.style.justifyContent = 'center';
          avatar.style.width = '18px';
          avatar.style.height = '18px';
          avatar.style.borderRadius = '50%';
          avatar.style.background = 'rgba(255,255,255,0.9)';
          avatar.style.color = userColor;
          avatar.style.fontSize = '10px';
          avatar.style.fontWeight = 'bold';
          avatar.style.marginRight = '5px';
          avatar.textContent = getInitials(userName);
          
          // Name
          const name = document.createElement('span');
          name.textContent = userName;
          
          badge.appendChild(avatar);
          badge.appendChild(name);
          overlayElement.appendChild(badge);
          editorContainer.appendChild(overlayElement);
        }
      } else {
        // Update position if already exists
        overlayElement.style.left = `${cursorCoords.left - 10}px`;
        overlayElement.style.top = `${cursorCoords.top - 30}px`;
      }
    }
    
    // Set a timeout to automatically clear typing indicators
    const timeout = setTimeout(() => {
      // Remove decorations
      if (editorRef.current) {
        editorRef.current.deltaDecorations(decorations, []);
      }
      
      // Remove overlay with animation
      const overlayElement = document.getElementById(`typing-overlay-${userId}`);
      if (overlayElement && overlayElement.parentNode) {
        overlayElement.style.opacity = '0';
        overlayElement.style.transform = 'translateY(-10px)';
        overlayElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
          if (overlayElement.parentNode) {
            overlayElement.parentNode.removeChild(overlayElement);
          }
        }, 300);
      }
      
      // Remove style
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    }, 3000);
    
    // Update minimap colors to make typing line stand out
    if (editor.updateOptions) {
      // Temporarily enhance minimap to make typing line more visible
      editor.updateOptions({
        minimap: {
          enabled: true,
          scale: 2,
          showSlider: 'always'
        }
      });
      
      // Reset minimap after timeout
      setTimeout(() => {
        editor.updateOptions({
          minimap: {
            enabled: true,
            scale: 1,
            showSlider: 'mouseover'
          }
        });
      }, 3000);
    }
    
    // Clean up function
    return () => {
      clearTimeout(timeout);
      
      if (editorRef.current) {
        editorRef.current.deltaDecorations(decorations, []);
      }
      
      // Remove overlay
      const overlayEl = document.getElementById(`typing-overlay-${userId}`);
      if (overlayEl && overlayEl.parentNode) {
        overlayEl.parentNode.removeChild(overlayEl);
      }
      
      // Remove style
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [activeTypist]);

  return (
    <div className="relative w-full h-full" ref={editorContainerRef}>
      {/* Git status indicator */}
      {getGitStatusIndicator()}
      
      <Monaco
        height="100%"
        defaultLanguage="javascript"
        language={language}
        value={code}
        theme="vs-dark"
        className={`w-full h-full bg-transparent text-gray-200 outline-none resize-none ${getLanguageClass()}`}
        onChange={(value, event) => onChange(value, event)}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 10 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: true,
          folding: true,
          lineNumbers: "on",
          roundedSelection: false,
          selectOnLineNumbers: true,
          mouseWheelZoom: true,
          renderLineHighlight: "all",
          scrollbar: {
            useShadows: true,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;