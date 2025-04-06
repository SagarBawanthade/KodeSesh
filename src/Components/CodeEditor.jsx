import Monaco from "@monaco-editor/react";






const CodeEditor = ({ code, onChange, language }) => {


  const getLanguageClass = () => {
    switch (language) {
      case 'python':
        return 'language-python';
      case 'javascript':
      default:
        return 'language-javascript';
    }
  };
    return (
      <Monaco
        height="100%"
        defaultLanguage="javascript"
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
    );
  };
export default CodeEditor;