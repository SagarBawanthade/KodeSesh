import { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Plus, Settings } from 'lucide-react';

const FileExplorer = ({ fileStructure, selectedFile, onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState(["src"]);

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
        onClick={() => onFileSelect(item.name)}
      >
        <File size={14} className="mx-2" />
        <span className="text-sm">{item.name}</span>
      </div>  
    );
  };

  return renderFileTree(fileStructure);
};

// Creating a sub-component for the controls
FileExplorer.Controls = function FileExplorerControls() {
  return (
    <div className="flex gap-2">
      <Plus size={18} className="text-gray-400 cursor-pointer hover:text-gray-200 transition-colors duration-150" />
      <Settings size={18} className="text-gray-400 cursor-pointer hover:text-gray-200 transition-colors duration-150" />
    </div>
  );
};

export default FileExplorer;