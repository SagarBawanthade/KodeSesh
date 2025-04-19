import Monaco from "@monaco-editor/react";

const CodeEditor = ({ code, onChange, language, gitStatus = [] }) => {
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

  return (
    <div className="relative w-full h-full">
      {/* Git status indicator */}
      {getGitStatusIndicator()}
      
      <Monaco
        height="100%"
        defaultLanguage="javascript"
        language={language}
        value={code}
        theme="vs-dark"
        className={`w-full h-full bg-transparent text-gray-200 outline-none resize-none ${getLanguageClass()}`}
        onChange={(value) => onChange(value)}
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