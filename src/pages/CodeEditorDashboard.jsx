import { useState } from 'react';
import Monaco from "@monaco-editor/react";
import { Folder, File, ChevronRight, ChevronDown, Plus, Settings, X } from 'lucide-react';

const CodeEditorDashboard = () => {
  const [code, setCode] = useState("// Start writing your code here!");
  const [selectedFile, setSelectedFile] = useState("index.js");
  const [expandedFolders, setExpandedFolders] = useState(["src"]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const fileStructure = {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "Header.jsx", type: "file" },
          { name: "Sidebar.jsx", type: "file" },
          { name: "Header.jsx", type: "file" }
        ]
      },
      { name: "index.js", type: "file" },
      { name: "App.jsx", type: "file" },
      { name: "styles.css", type: "file" }
    ]
  };

  const handleEditorChange = (value) => {
    setCode(value || "");
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => 
      prev.includes(folderName)
        ? prev.filter(f => f !== folderName)
        : [...prev, folderName]
    );
  };

  const renderFileTree = (item, depth = 0) => {
    const isExpanded = expandedFolders.includes(item.name);
    const paddingLeft = `${depth * 12}px`;

    if (item.type === "folder") {
      return (
        <div key={item.name} className="transition-all duration-200">
          <div 
            className="flex items-center py-1.5 px-2 hover:bg-gray-800/50 cursor-pointer text-gray-300 transition-colors duration-150"
            style={{ paddingLeft }}
            onClick={() => toggleFolder(item.name)}
          >
            <div className="transform transition-transform duration-200">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            <Folder size={14} className="mx-2 text-blue-400" />
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
            {item.children?.map(child => renderFileTree(child, depth + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.name}
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors duration-150
          ${selectedFile === item.name 
            ? 'bg-gray-800/80 text-white' 
            : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200'
          }`}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        onClick={() => setSelectedFile(item.name)}
      >
        <File size={14} className="mx-2" />
        <span className="text-sm">{item.name}</span>
      </div>  
    );
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-gray-300">
      {/* Sidebar Toggle */}
      <div 
        className={`h-screen flex transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-0' : '-ml-64'}`}
      >
        {/* File Explorer Sidebar */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-[#252526]">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#2d2d2d]">
            <h2 className="text-sm font-semibold uppercase tracking-wide">KodeSesh</h2>
            <div className="flex gap-2">
              <Plus size={18} className="text-gray-400 cursor-pointer hover:text-gray-200 transition-colors duration-150" />
              <Settings size={18} className="text-gray-400 cursor-pointer hover:text-gray-200 transition-colors duration-150" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 py-2">
            {renderFileTree(fileStructure)}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="h-10 bg-[#2d2d2d] border-b border-gray-800 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-gray-200 transition-colors duration-150"
            >
              {isSidebarOpen ? <X size={16} /> : <ChevronRight size={16} />}
            </button>
            <span className="text-sm font-medium">{selectedFile}</span>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 transition-all duration-300">
          <Monaco
            height="100%"
            defaultLanguage="javascript"
            value={code}
            theme="vs-dark"
            onChange={handleEditorChange}
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
      </div>
    </div>
  );
};

export default CodeEditorDashboard;