import { useState, useEffect } from 'react'; 
import {   
  Folder,   
  File,   
  ChevronRight,   
  ChevronDown,   
  Plus,   
  Settings,
  GitBranch, // Git branch icon
  GitCommit, // Git commit icon
  GitPullRequest, // Git pull request icon
  GitMerge, // Git merge icon
  Upload, // For push
  Download, // For pull
  PlusCircle, // For add
} from 'lucide-react';  

const FileExplorer = ({   
  fileStructure,   
  selectedFile,   
  onFileSelect,   
  currentLanguage,
  gitOperations, // New prop for Git operations
  currentBranch = 'main',
}) => {   
  const [expandedFolders, setExpandedFolders] = useState(['src']);
  const [showGitPanel, setShowGitPanel] = useState(false); // State for Git panel visibility
    
  const toggleFolder = (folderName) => {     
    setExpandedFolders((prev) =>       
      prev.includes(folderName)         
        ? prev.filter((f) => f !== folderName)         
        : [...prev, folderName]     
    );   
  };
  
  // Toggle Git panel (both local and from parent component)
  const toggleGitPanel = () => {
    setShowGitPanel(!showGitPanel);
    if (gitOperations?.toggleGitPanel) {
      gitOperations.toggleGitPanel();
    }
  };

  // Use effect to sync with parent component
  useEffect(() => {
    if (gitOperations?.isShowingGitPanel !== undefined) {
      setShowGitPanel(gitOperations.isShowingGitPanel);
    }
  }, [gitOperations?.isShowingGitPanel]);
    
  // Recursive function to filter files based on language   
  const filterFilesByLanguage = (item) => {     
    if (!item) return null;      
    
    if (item.type === 'folder') {       
      const filteredChildren = item.children         
        ?.map(filterFilesByLanguage)         
        .filter(Boolean); // Remove nulls        
      
      if (!filteredChildren || filteredChildren.length === 0) return null;        
      
      return {         
        ...item,         
        children: filteredChildren,       
      };     
    } else {       
      // For demo purpose, show all files but highlight the main file
      return item;
    }   
  };    
  
  const filteredFileStructure = fileStructure; // Show all files  
  
  const renderFileTree = (item, depth = 0) => {     
    if (!item) return null;      
    
    const isExpanded = expandedFolders.includes(item.name);     
    const paddingLeft = `${depth * 12}px`;      
    
    if (item.type === 'folder') {       
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
          <div             
            className={`overflow-hidden transition-all duration-200 ${               
              isExpanded ? 'max-h-96' : 'max-h-0'             
            }`}           
          >             
            {item.children?.map((child) => renderFileTree(child, depth + 1))}           
          </div>         
        </div>       
      );     
    }      
    
    return (       
      <div         
        key={item.name}         
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors duration-150 ${           
          selectedFile === item.name             
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
  
  // Render Git Panel with operations
  const renderGitPanel = () => {
    if (!showGitPanel) return null;
    
    return (
      <div className="border-t border-gray-700 mt-2 pt-2 pb-2 bg-gray-900/40">
        <div className="text-xs font-semibold text-gray-400 px-3 mb-2">GIT OPERATIONS</div>
        
        {/* Git Operations */}
        <div className="px-2 space-y-1">
          {/* Branch info */}
          <div className="flex items-center py-1 px-2 text-gray-300 text-sm">
            <GitBranch size={14} className="mr-2 text-green-500" />
            <span>Branch: {currentBranch}</span>
          </div>
          
          {/* Git status button */}
          <button 
            className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
            onClick={() => gitOperations?.status && gitOperations.status()}
          >
            <GitCommit size={14} className="mr-2 text-blue-400" />
            <span>Status</span>
          </button>
          
          {/* Git add button */}
          <button 
            className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
            onClick={() => gitOperations?.add && gitOperations.add()}
          >
            <PlusCircle size={14} className="mr-2 text-blue-400" />
            <span>Add Changes</span>
          </button>
          
          {/* Git commit button */}
          <button 
            className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
            onClick={() => gitOperations?.commit && gitOperations.commit()}
          >
            <GitCommit size={14} className="mr-2 text-yellow-400" />
            <span>Commit</span>
          </button>
          
          {/* Git push button */}
          <button 
            className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
            onClick={() => gitOperations?.push && gitOperations.push()}
          >
            <Upload size={14} className="mr-2 text-green-500" />
            <span>Push</span>
          </button>
          
          {/* Git pull button */}
          <button 
            className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
            onClick={() => gitOperations?.pull && gitOperations.pull()}
          >
            <Download size={14} className="mr-2 text-purple-400" />
            <span>Pull</span>
          </button>
          
          {/* Git merge button */}
          <button 
            className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
            onClick={() => gitOperations?.merge && gitOperations.merge()}
          >
            <GitMerge size={14} className="mr-2 text-red-400" />
            <span>Merge</span>
          </button>


          {/* GitHub Auth button */}
<button 
  className="flex items-center w-full py-1 px-2 hover:bg-gray-800 rounded text-gray-300 text-sm"
  onClick={() => gitOperations?.authenticate && gitOperations.authenticate()}
>
  <GitBranch size={14} className="mr-2 text-cyan-400" />
  <span>GitHub Login</span>
</button>
        </div>
        
      </div>
    );
  };
  
  return (
    <div>
      {renderFileTree(filteredFileStructure)}
      {renderGitPanel()}
    </div>
  ); 
};  

// Sub-component for controls 
FileExplorer.Controls = function FileExplorerControls({ toggleGitPanel }) {   
  return (     
    <div className="flex gap-2">       
      <Plus         
        size={18}         
        className="text-gray-400 cursor-pointer hover:text-gray-200 transition-colors duration-150"       
      />       
      <GitBranch         
        size={18}         
        className="text-gray-400 cursor-pointer hover:text-green-400 transition-colors duration-150"
        onClick={toggleGitPanel}
      />
      <Settings         
        size={18}         
        className="text-gray-400 cursor-pointer hover:text-gray-200 transition-colors duration-150"       
      />     
    </div>   
  ); 
};  

export default FileExplorer;