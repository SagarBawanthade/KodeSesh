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
  Users,
  Circle,
} from 'lucide-react';
import GitPanel from './GitPanel'; // Import the separated GitPanel component

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
}) => {   
  const [expandedFolders, setExpandedFolders] = useState(['src']);
  const [showGitPanel, setShowGitPanel] = useState(true);
  const [showHostMessage, setShowHostMessage] = useState(false);
  const [userColors, setUserColors] = useState({});
  const [activeParticipantId, setActiveParticipantId] = useState(null);
  const [isHoveringFolder, setIsHoveringFolder] = useState(null);
    
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

  // Helper function to generate consistent colors for users
  const generateUserColor = (userId) => {
    if (userColors[userId]) return userColors[userId];
    
    // Futuristic neon color palette
    const colorPalette = [
      '#00FFFF', // Cyan
      '#FF00FF', // Magenta
      '#00FF00', // Bright green
      '#FF3D00', // Bright orange
      '#FFFF00', // Yellow
      '#00B8FF', // Bright blue
      '#FF0099', // Hot pink
      '#7C4DFF', // Purple
      '#76FF03', // Lime
      '#1DE9B6'  // Teal
    ];
    
    const colorIndex = Object.keys(userColors).length % colorPalette.length;
    const newColor = colorPalette[colorIndex];
    
    setUserColors(prev => ({
      ...prev,
      [userId]: newColor
    }));
    
    return newColor;
  };
    
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
      
    if (item.type === 'folder') {       
      return (         
        <div key={item.name} className="transition-all duration-200">           
          <div             
            className={`flex items-center py-1.5 px-2 hover:bg-indigo-900/30 cursor-pointer transition-colors duration-150 rounded-md ${
              isHovering ? 'bg-indigo-900/20' : ''
            }`}             
            style={{ paddingLeft }}             
            onClick={() => toggleFolder(item.name)}
            onMouseEnter={() => setIsHoveringFolder(item.name)}
            onMouseLeave={() => setIsHoveringFolder(null)}
          >             
            <div className="transform transition-transform duration-200">               
              {isExpanded ? 
                <ChevronDown size={14} className="text-indigo-400" /> : 
                <ChevronRight size={14} className="text-indigo-400" />
              }             
            </div>             
            <Folder size={14} className="mx-2 text-cyan-400" />             
            <span className="text-sm font-medium text-gray-300">{item.name}</span>           
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
    
    return (       
      <div         
        key={item.name}         
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-all duration-150 rounded-md ${           
          selectedFile === item.name             
            ? 'bg-indigo-800/40 text-white border-l-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'             
            : 'text-gray-400 hover:bg-indigo-900/20 hover:text-gray-200'         
        }`}         
        style={{ paddingLeft: `${depth * 12 + 20}px` }}         
        onClick={() => onFileSelect(item.name)}       
      >         
        <File size={14} className={`mx-2 ${selectedFile === item.name ? 'text-cyan-400' : 'text-gray-500'}`} />         
        <span className="text-sm">{item.name}</span>       
      </div>     
    );   
  };    
  
  // Render Toast Message for non-host users
  const renderHostMessage = () => {
    if (!showHostMessage) return null;
    
    return (
      <div className="fixed bottom-10 right-10 max-w-sm bg-gray-900 border-l-4 border-cyan-400 shadow-lg rounded-lg p-4 z-50 animate-slideIn backdrop-blur-md">
        <div className="flex items-start space-x-3">
          <AlertCircle size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
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

  // Render participants list - simplified version without audio/video controls
  const renderParticipantsList = () => {
    if (!participants || participants.length === 0) return null;
    
    return (
      <div className="border-t border-gray-700 bg-gradient-to-r from-gray-900/60 via-indigo-900/10 to-gray-900/60 backdrop-blur">
        {/* Participants Header */}
        <div className="text-xs font-bold px-3 py-2.5 flex items-center justify-between bg-indigo-900/30">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-1.5 rounded-md mr-2">
              <Users size={12} className="text-white" />
            </div>
            <div className="flex items-center">
              <span className="text-cyan-300 tracking-wider uppercase font-bold">PARTICIPANTS</span>
              <span className="ml-2 bg-indigo-900/60 text-cyan-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-cyan-500/20">
                {participants.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Participants list with scrolling - simplified */}
        <div className="overflow-y-auto max-h-60 custom-scrollbar">
          <div className="px-2 pt-2 pb-3 space-y-2">
            {participants.map((participant) => {
              // Generate status indicator color
              const statusColor = participant.isTyping 
                ? '#06B6D4' // Cyan when typing
                : participant.isActive 
                  ? '#818CF8' // Indigo when active
                  : generateUserColor(participant.id);
              
              return (
                <div key={participant.id} className="relative flex items-center px-2.5 py-2 rounded-md bg-indigo-900/20 border border-indigo-900/30">
                  {/* User avatar with first letter */}
                  <div className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-900 border-2 mr-2"
                    style={{ borderColor: statusColor }}
                  >
                    <span className="text-xs font-bold text-white">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="text-xs font-semibold text-white truncate">
                        {participant.name}
                      </span>
                      {participant.isHost && (
                        <span className="ml-1.5 bg-yellow-500/20 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded-sm font-medium border border-yellow-500/20">
                          HOST
                        </span>
                      )}
                    </div>
                    
                    {/* Status text */}
                    <div className="text-[10px] truncate">
                      {participant.isTyping ? (
                        <span className="text-cyan-400 flex items-center">
                          <Circle size={6} fill="#06B6D4" className="mr-1" /> 
                          <span>Typing...</span>
                        </span>
                      ) : participant.isActive ? (
                        <span className="text-indigo-400 flex items-center">
                          <Circle size={6} fill="#818CF8" className="mr-1" /> 
                          Active now
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center">
                          <Circle size={6} fill="#9CA3AF" className="mr-1" /> 
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900/90 backdrop-blur-sm overflow-hidden">
      {/* Files Section Header */}
      <div 
        className="text-xs font-bold px-3 py-2.5 flex items-center justify-between border-b border-gray-800"
        style={{ 
          background: 'linear-gradient(90deg, rgba(17,24,39,0.95) 0%, rgba(79,70,229,0.1) 100%)',
        }}
      >
        <div className="flex items-center">
          <div className="bg-gray-800 p-1.5 rounded-md mr-2 shadow-[0_0_8px_rgba(79,70,229,0.2)]">
            <Folder size={12} className="text-cyan-400" />
          </div>
          <span className="text-cyan-300 tracking-wider uppercase">FILES</span>
        </div>
      </div>
      
      {/* Main sections layout - stacked vertically */}
      <div className="flex flex-col h-full">
        {/* File Tree Section - scrollable */}
        <div className="overflow-y-auto flex-grow custom-scrollbar min-h-0">
          {renderFileTree(filteredFileStructure)}
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
        
        {/* Participants List - at the bottom */}
        {renderParticipantsList()}
      </div>
      
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