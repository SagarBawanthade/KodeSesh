// FileExplorer.js
import { useState, useEffect } from 'react'; 
import {   
  Folder,   
  File,   
  ChevronRight,   
  ChevronDown,   
  GitBranch,
  AlertCircle,
  Info,
  X,
  Hexagon,
  Grid,
  Zap,
  Server,
} from 'lucide-react';
import GitPanel from './GitPanel'; // Import the separated GitPanel component
import ParticipantsList from './ParticipantsList'; // Import the separated ParticipantsList component
import PRList from '../Components/PRList';

const FileExplorer = ({   
  fileStructure,   
  selectedFile,   
  onFileSelect,   
  currentLanguage,
  gitOperations,
  currentBranch = 'main',
  isHost = false,
  participants = [],
  isGitAuthenticated = false,
  githubUser = null,
  sessionId,
  onViewPR,
  onReviewPR,
}) => {   
  const [expandedFolders, setExpandedFolders] = useState(['src']);
  const [showGitPanel, setShowGitPanel] = useState(true);
  const [showHostMessage, setShowHostMessage] = useState(false);
  const [isHoveringFolder, setIsHoveringFolder] = useState(null);
  const [showFileStats, setShowFileStats] = useState(false);
  const [hoverHighlight, setHoverHighlight] = useState(null);
    
  // Toggle folder expansion
  const toggleFolder = (folderName) => {     
    setExpandedFolders((prev) =>       
      prev.includes(folderName)         
        ? prev.filter((f) => f !== folderName)         
        : [...prev, folderName]     
    );   
  };
  
  // Host check for Git panel
  const checkHostForGit = () => {
    if (!isHost) {
      setShowHostMessage(true);
      setTimeout(() => setShowHostMessage(false), 3000);
      return false;
    }
    return true;
  };
  
  // Toggle Git panel
  const toggleGitPanel = () => {
    if (!checkHostForGit()) return;
    
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
        .filter(Boolean);
      
      if (!filteredChildren || filteredChildren.length === 0) return null;        
      
      return {         
        ...item,         
        children: filteredChildren,       
      };     
    } else {       
      return item;
    }   
  };    
  
  const filteredFileStructure = fileStructure;
  
  const renderFileTree = (item, depth = 0) => {     
    if (!item) return null;      
    
    const isExpanded = expandedFolders.includes(item.name);     
    const paddingLeft = `${depth * 12}px`;
    const isHovering = isHoveringFolder === item.name;
    const isHoverHighlighted = hoverHighlight === item.name;
      
    if (item.type === 'folder') {       
      return (         
        <div key={item.name} className="transition-all duration-200">           
          <div             
            className={`flex items-center py-1.5 px-2 hover:bg-indigo-900/40 cursor-pointer transition-all duration-150 rounded-md ${
              isHovering ? 'bg-indigo-900/30' : ''
            } ${
              isHoverHighlighted ? 'neon-highlight' : ''
            }`}             
            style={{ paddingLeft }}             
            onClick={() => toggleFolder(item.name)}
            onMouseEnter={() => {
              setIsHoveringFolder(item.name);
              setHoverHighlight(item.name);
              setTimeout(() => setHoverHighlight(null), 1500);
            }}
            onMouseLeave={() => setIsHoveringFolder(null)}
          >             
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>               
              {isExpanded ? 
                <ChevronDown size={14} className="text-cyan-400" /> : 
                <ChevronRight size={14} className="text-cyan-400" />
              }             
            </div>             
            <div className={`mx-2 flex items-center justify-center folder-icon-container ${isExpanded ? 'folder-open' : ''}`}>
              <Folder size={14} className="text-cyan-400 folder-icon" />
            </div>
            <span className="text-sm font-medium text-gray-300 folder-name">{item.name}</span>
            {/* File count badge */}
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-cyan-300 border border-indigo-700/30">
              {item.children?.length || 0}
            </span>
          </div>           
          <div             
            className={`overflow-hidden transition-all duration-300 ease-in-out ${               
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'             
            }`}           
          >             
            {item.children?.map((child) => renderFileTree(child, depth + 1))}           
          </div>         
        </div>       
      );     
    }      
    
    // Get file extension for icon styling
    const fileExt = item.name.split('.').pop().toLowerCase();
    const getFileIconColor = (ext) => {
      const colorMap = {
        js: 'text-yellow-400',
        jsx: 'text-blue-400',
        ts: 'text-blue-500',
        tsx: 'text-blue-400',
        css: 'text-pink-400',
        html: 'text-orange-400',
        json: 'text-green-400',
        md: 'text-purple-400',
        default: 'text-gray-400'
      };
      return colorMap[ext] || colorMap.default;
    };
    
    return (       
      <div         
        key={item.name}         
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-all duration-150 rounded-md ${           
          selectedFile === item.name             
            ? 'bg-indigo-800/50 text-white border-l-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'             
            : 'text-gray-400 hover:bg-indigo-900/30 hover:text-gray-200 hover:border-l border-indigo-500/50'         
        }`}         
        style={{ paddingLeft: `${depth * 12 + 20}px` }}         
        onClick={() => onFileSelect(item.name)}  
        onMouseEnter={() => {
          setShowFileStats(item.name);
          setHoverHighlight(item.name);
          setTimeout(() => setHoverHighlight(null), 800);
        }}
        onMouseLeave={() => setShowFileStats(false)}     
      >         
        <File 
          size={14} 
          className={`mx-2 transition-all duration-200 ${getFileIconColor(fileExt)} ${
            selectedFile === item.name ? 'scale-110' : ''
          }`} 
        />         
        <span className={`text-sm transition-all duration-150 ${
          selectedFile === item.name ? 'font-medium' : ''
        }`}>{item.name}</span>
        
        {/* File stats that appear on hover - simulated for the UI */}
        {showFileStats === item.name && (
          <div className="ml-auto flex items-center space-x-2 text-[10px] text-cyan-300/80 animate-fadeIn">
            <span className="px-1 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/30">
              {fileExt}
            </span>
          </div>
        )}
      </div>     
    );   
  };    
  
  // Render Toast Message for non-host users
  const renderHostMessage = () => {
    if (!showHostMessage) return null;
    
    return (
      <div className="fixed bottom-10 right-10 max-w-sm bg-gray-900/90 border-l-4 border-cyan-400 shadow-lg rounded-lg p-4 z-50 animate-slideIn backdrop-blur-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white text-sm font-medium">Host-only feature</h4>
            <p className="text-gray-300 text-xs mt-1">Only the session host can control Git operations.</p>
          </div>
          <button onClick={() => setShowHostMessage(false)} className="text-gray-400 hover:text-white transition-colors duration-150">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-indigo-950/80 backdrop-blur-sm overflow-hidden border-r border-indigo-900/30">
      {/* Files Section Header */}
     
      
      {/* Main sections layout - stacked vertically */}
      <div className="flex flex-col ">
        {/* File Tree Section - scrollable */}
        <div className="overflow-y-auto flex-grow custom-scrollbar min-h-0 file-explorer-container">
          <div className="p-2">
            {renderFileTree(filteredFileStructure)}
          </div>
        </div>
        
        {/* Git Operations Panel - using the separated GitPanel component */}
        {showGitPanel && (
          <GitPanel 
            isGitAuthenticated={isGitAuthenticated}
            gitOperations={gitOperations}
            currentBranch={currentBranch}
            gitUser={githubUser}
            isHost={isHost}
          />
        )}
        
        {/* Participants List - using the separated ParticipantsList component */}
        <ParticipantsList
        participants={participants}
        isHost={isHost} />
      </div>

      {/* Pull Requests List - ADD THIS */}
<PRList 
  sessionId={sessionId}
  onViewPR={(prId) => onViewPR && onViewPR(prId)}
  onReviewPR={(prId) => onReviewPR && onReviewPR(prId)}
  isHost={isHost}
  className="mx-2 mb-3"
/>
      
      {renderHostMessage()}
      
      {/* CSS for animations and custom scrollbar that matches theme */}
      <style jsx>{`
        /* Custom scrollbar styling to match theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.4);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.5);
          border-radius: 4px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 100px; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .text-shadow {
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
        }
        
        .neon-highlight {
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
          border: 1px solid rgba(6, 182, 212, 0.3);
          animation: neonPulse 1.5s ease-out;
        }
        
        @keyframes neonPulse {
          0% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.3); border-color: rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.5); border-color: rgba(6, 182, 212, 0.5); }
          100% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.3); border-color: rgba(6, 182, 212, 0.3); }
        }
        
        .file-explorer-container {
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 60%, rgba(6, 182, 212, 0.03) 0%, transparent 50%);
        }
        
        .folder-icon-container {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .folder-icon {
          transition: all 0.3s ease;
        }
        
        .folder-open .folder-icon {
          transform: scale(1.1);
          filter: drop-shadow(0 0 3px rgba(6, 182, 212, 0.5));
        }
        
        .folder-name {
          position: relative;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  ); 
};  

// Sub-component for controls 
FileExplorer.Controls = function FileExplorerControls({ toggleGitPanel }) {   
  return (     
    <div className="flex gap-2">       
      <GitBranch         
        size={18}         
        className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors duration-150"
        onClick={toggleGitPanel}
      />
    
    </div>   
  ); 
};  

export default FileExplorer;