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

  GitMerge, // Git merge icon
  Upload, // For push
  Download, // For pull
  PlusCircle, // For add,
  RefreshCw, // For status
  Github, // GitHub logo
  AlertCircle, // For alerts

  Info, // For info alerts
  X // For closing
} from 'lucide-react';  

const FileExplorer = ({   
  fileStructure,   
  selectedFile,   
  onFileSelect,   
  currentLanguage,
  gitOperations, // New prop for Git operations
  currentBranch = 'main',
  isHost = false, // Host check prop
}) => {   
  const [expandedFolders, setExpandedFolders] = useState(['src']);
  const [showGitPanel, setShowGitPanel] = useState(false); // State for Git panel visibility
  const [showHostMessage, setShowHostMessage] = useState(false); // For non-host message
  const [activeTab, setActiveTab] = useState('operations'); // For git panel tabs
    
  const toggleFolder = (folderName) => {     
    setExpandedFolders((prev) =>       
      prev.includes(folderName)         
        ? prev.filter((f) => f !== folderName)         
        : [...prev, folderName]     
    );   
  };
  
  // Toggle Git panel (both local and from parent component)
  const toggleGitPanel = () => {
    // Check if user is host
    if (!isHost) {
      setShowHostMessage(true);
      // Auto-hide message after 3 seconds
      setTimeout(() => setShowHostMessage(false), 3000);
      return;
    }
    
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
  
  // Render Toast Message for non-host users
  const renderHostMessage = () => {
    if (!showHostMessage) return null;
    
    return (
      <div className="fixed bottom-10 right-10 max-w-sm bg-gray-800 border-l-4 border-yellow-400 shadow-lg rounded-lg p-4 z-50">
        <div className="flex items-start space-x-3">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white text-sm font-medium">Host-only feature</h4>
            <p className="text-gray-300 text-xs mt-1">Only the session host can control Git operations.</p>
          </div>
          <button onClick={() => setShowHostMessage(false)} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };
  
  // Render Git Panel with operations
  const renderGitPanel = () => {
    if (!showGitPanel) return null;
    
    return (
      <div className="mt-2 border-t border-gray-700 pt-2 pb-2 bg-gray-900/40">
        <div className="text-xs font-semibold text-gray-400 px-3 mb-2 flex items-center">
          <Github size={12} className="mr-1.5 text-gray-400" />
          GIT OPERATIONS
        </div>
        <button 
            className="flex items-center w-full py-1.5 px-2 bg-blue-600/30 hover:bg-blue-600/50 rounded mt-2 text-gray-100 text-xs border border-blue-500/30"
            onClick={() => gitOperations?.authenticate && gitOperations.authenticate()}
          >
            <Github size={14} className="mr-2 text-white" />
            <span>GitHub Login</span>
          </button>
        
        {/* Warning message about GitHub login */}
        <div className="mx-2 mb-2 p-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs">
          <div className="flex">
            <Info size={14} className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 font-medium">Important</p>
              <p className="text-gray-300 mt-1">Please login to GitHub first after creating a new session.</p>
            </div>
          </div>
        </div>
        
        {/* Git Operations */}
        <div className="px-2 space-y-1">
          {/* Branch info */}
          <div className="flex items-center py-1 px-2 text-gray-300 text-sm bg-gray-800/40 rounded-md border border-gray-700/30">
            <GitBranch size={14} className="mr-2 text-green-500" />
            <span className="text-xs">Branch: </span>
            <span className="text-xs text-green-400 ml-1 font-medium">{currentBranch}</span>
          </div>
          
          {/* Git operations grid */}
          <div className="grid grid-cols-2 gap-1 mt-2">
            {/* Git status button */}
            <button 
              className="flex items-center py-1.5 px-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-gray-300 text-xs border border-gray-700/30"
              onClick={() => gitOperations?.status && gitOperations.status()}
            >
              <RefreshCw size={14} className="mr-2 text-blue-400" />
              <span>Status</span>
            </button>
            
            {/* Git add button */}
            <button 
              className="flex items-center py-1.5 px-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-gray-300 text-xs border border-gray-700/30"
              onClick={() => gitOperations?.add && gitOperations.add()}
            >
              <PlusCircle size={14} className="mr-2 text-blue-400" />
              <span>Add</span>
            </button>
            
            {/* Git commit button */}
            <button 
              className="flex items-center py-1.5 px-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-gray-300 text-xs border border-gray-700/30"
              onClick={() => gitOperations?.commit && gitOperations.commit()}
            >
              <GitCommit size={14} className="mr-2 text-yellow-400" />
              <span>Commit</span>
            </button>
            
            {/* Git push button */}
            <button 
              className="flex items-center py-1.5 px-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-gray-300 text-xs border border-gray-700/30"
              onClick={() => gitOperations?.push && gitOperations.push()}
            >
              <Upload size={14} className="mr-2 text-green-500" />
              <span>Push</span>
            </button>
            
            {/* Git pull button */}
            <button 
              className="flex items-center py-1.5 px-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-gray-300 text-xs border border-gray-700/30"
              onClick={() => gitOperations?.pull && gitOperations.pull()}
            >
              <Download size={14} className="mr-2 text-purple-400" />
              <span>Pull</span>
            </button>
            
            {/* Git merge button */}
            <button 
              className="flex items-center py-1.5 px-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-gray-300 text-xs border border-gray-700/30"
              onClick={() => gitOperations?.merge && gitOperations.merge()}
            >
              <GitMerge size={14} className="mr-2 text-red-400" />
              <span>Merge</span>
            </button>
          </div>

          {/* GitHub Auth button */}
         
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {renderFileTree(filteredFileStructure)}
      {renderGitPanel()}
      {renderHostMessage()}
    </div>
  ); 
};  

// Sub-component for controls 
FileExplorer.Controls = function FileExplorerControls({ toggleGitPanel }) {   
  return (     
    <div className="flex gap-2">       
        
      <GitBranch         
        size={18}         
        className="text-gray-400 cursor-pointer hover:text-green-400 transition-colors duration-150"
        onClick={toggleGitPanel}
      />
   
    </div>   
  ); 
};  

export default FileExplorer;