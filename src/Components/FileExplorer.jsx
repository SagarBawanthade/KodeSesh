import { useState, useEffect } from 'react'; 
import {   
  Folder,   
  File,   
  ChevronRight,   
  ChevronDown,   
  Plus,   
  Settings,
  GitBranch,
  GitCommit,
  GitMerge,
  Upload,
  Download,
  PlusCircle,
  RefreshCw,
  Github,
  AlertCircle,
  Info,
  X,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorSmartphone,
  Circle,
  MessageSquare,
  Zap,
  Activity
} from 'lucide-react';  

const FileExplorer = ({   
  fileStructure,   
  selectedFile,   
  onFileSelect,   
  currentLanguage,
  gitOperations,
  currentBranch = 'main',
  isHost = false,
  participants = [],
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
  
  // Git Operation Button sub-component
  const GitOperationButton = ({ icon, label, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);
    
    return (
      <button 
        className={`flex items-center py-1.5 px-2 bg-gray-900/70 hover:bg-indigo-900/30 rounded text-gray-300 text-xs border border-indigo-700/30 transition-all duration-200 ${
          isHovering ? 'shadow-[0_0_12px_rgba(99,102,241,0.3)]' : ''
        }`}
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };
  
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
  
  // Render Git Panel with operations
  const renderGitPanel = () => {
    return (
      <div className="border-t border-gray-700 bg-gradient-to-r from-gray-900/60 via-indigo-900/10 to-gray-900/60 backdrop-blur">
        {/* Git Panel Header */}
        <div 
          className="text-xs font-semibold text-gray-400 px-3 py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <div className="bg-indigo-900/50 p-1.5 rounded-md shadow-[0_0_8px_rgba(79,70,229,0.4)] mr-2">
              <Github size={12} className="text-indigo-300" />
            </div>
            <span className="text-indigo-300 tracking-wider">GIT OPERATIONS</span>
          </div>
        </div>
        
        <div className="px-3 pb-3">
          <button 
            className="flex items-center w-full py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 rounded mt-2 text-gray-100 text-xs border border-indigo-500/30 transition-all duration-200 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
            onClick={() => gitOperations?.authenticate && gitOperations.authenticate()}
          >
            <Github size={14} className="mr-2 text-white" />
            <span>GitHub Login</span>
          </button>
          
          {/* Warning message about GitHub login */}
          <div className="mb-2 p-2 mt-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs">
            <div className="flex">
              <Info size={14} className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium">Important</p>
                <p className="text-gray-300 mt-1">Please login to GitHub first after creating a new session.</p>
              </div>
            </div>
          </div>
          
          {/* Git Operations */}
          <div className="space-y-1">
            {/* Branch info */}
            <div className="flex items-center py-1.5 px-2 text-gray-300 text-sm bg-indigo-900/20 rounded-md border border-indigo-700/30 shadow-[0_0_8px_rgba(79,70,229,0.1)]">
              <GitBranch size={14} className="mr-2 text-cyan-400" />
              <span className="text-xs">Branch: </span>
              <span className="text-xs text-cyan-400 ml-1 font-medium">{currentBranch}</span>
            </div>
            
            {/* Git operations grid */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {/* Git operations buttons with hover glow effect */}
              <GitOperationButton 
                icon={<RefreshCw size={14} className="mr-2 text-blue-400" />}
                label="Status"
                onClick={() => gitOperations?.status && gitOperations.status()}
              />
              
              <GitOperationButton 
                icon={<PlusCircle size={14} className="mr-2 text-blue-400" />}
                label="Add"
                onClick={() => gitOperations?.add && gitOperations.add()}
              />
              
              <GitOperationButton 
                icon={<GitCommit size={14} className="mr-2 text-yellow-400" />}
                label="Commit"
                onClick={() => gitOperations?.commit && gitOperations.commit()}
              />
              
              <GitOperationButton 
                icon={<Upload size={14} className="mr-2 text-green-400" />}
                label="Push"
                onClick={() => gitOperations?.push && gitOperations.push()}
              />
              
              <GitOperationButton 
                icon={<Download size={14} className="mr-2 text-purple-400" />}
                label="Pull"
                onClick={() => gitOperations?.pull && gitOperations.pull()}
              />
              
              <GitOperationButton 
                icon={<GitMerge size={14} className="mr-2 text-red-400" />}
                label="Merge"
                onClick={() => gitOperations?.merge && gitOperations.merge()}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render participants list
  const renderParticipantsList = () => {
    if (!participants || participants.length === 0) return null;
    
    return (
      <div className="border-t border-gray-700 bg-gradient-to-r from-gray-900/60 via-indigo-900/10 to-gray-900/60 backdrop-blur">
        {/* Participants Header */}
        <div 
          className="text-xs font-bold px-3 py-2.5 flex items-center justify-between"
          style={{ 
            background: 'linear-gradient(90deg, rgba(49,46,129,0.3) 0%, rgba(79,70,229,0.2) 50%, rgba(49,46,129,0.3) 100%)',
            boxShadow: '0 0 15px rgba(99,102,241,0.4) inset'
          }}
        >
          <div className="flex items-center">
            <div className="bg-indigo-600 p-1.5 rounded-md mr-2 shadow-[0_0_10px_rgba(99,102,241,0.7)]">
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
        
        {/* Participants list with scrolling */}
        <div className="overflow-y-auto max-h-60 custom-scrollbar">
          <div className="px-2 pt-2 pb-3 space-y-2">
            {participants.map((participant) => {
              // Generate status indicator color
              const statusColor = participant.isTyping 
                ? '#06B6D4' // Cyan when typing
                : participant.isActive 
                  ? '#818CF8' // Indigo when active
                  : generateUserColor(participant.id);
                  
              // Check if this participant is expanded/selected
              const isSelected = activeParticipantId === participant.id;
              
              return (
                <div key={participant.id} className="animate-fadeIn">
                  {/* Main participant card with frosted glass effect */}
                  <div 
                    className={`relative flex items-center px-2.5 py-2 rounded-md transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                      isSelected
                        ? 'bg-indigo-900/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                        : 'hover:bg-indigo-900/20'
                    }`}
                    onClick={() => setActiveParticipantId(isSelected ? null : participant.id)}
                    style={{ 
                      borderLeft: isSelected ? `2px solid ${statusColor}` : '',
                      background: isSelected 
                        ? `linear-gradient(90deg, rgba(49,46,129,0.3) 0%, rgba(79,70,229,0.1) 100%)` 
                        : ''
                    }}
                  >
                    {/* Status indicator with pulsing animation */}
                    <div className="relative mr-3">
                      {/* Background glow effect */}
                      <div 
                        className={`absolute inset-0 rounded-full ${
                          participant.isTyping ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          backgroundColor: `${statusColor}20`,
                          boxShadow: `0 0 12px ${statusColor}40`,
                          transform: 'scale(1.6)'
                        }}
                      />
                      
                      {/* User avatar with first letter */}
                      <div className="h-9 w-9 rounded-md flex items-center justify-center overflow-hidden relative bg-gray-900 border-2"
                        style={{ borderColor: statusColor }}
                      >
                        <span className="text-xs font-bold text-white">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                        
                        {/* Tiny status dot */}
                        <div 
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-gray-900"
                          style={{ 
                            backgroundColor: statusColor,
                            boxShadow: `0 0 8px ${statusColor}`
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="text-xs font-semibold text-white truncate">
                          {participant.name}
                        </span>
                        {participant.isHost && (
                          <span className="ml-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded-sm font-medium border border-yellow-500/20 shadow-[0_0_8px_rgba(252,211,77,0.2)]">
                            HOST
                          </span>
                        )}
                      </div>
                      
                      {/* Status text */}
                      <div className="text-[10px] truncate">
                        {participant.isTyping ? (
                          <span className="text-cyan-400 flex items-center animate-pulse">
                            <Circle size={6} fill="#06B6D4" className="mr-1" /> 
                            <span className="flex items-center">Typing<span className="typing-dots">...</span></span>
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
                    
                    {/* Status icons */}
                    <div className="flex space-x-1.5">
                      {participant.isMuted && (
                        <div className="bg-red-500/10 p-1 rounded-md text-red-400 border border-red-500/20" title="Microphone muted">
                          <MicOff size={12} />
                        </div>
                      )}
                      
                      {participant.isVideoOff && (
                        <div className="bg-red-500/10 p-1 rounded-md text-red-400 border border-red-500/20" title="Video off">
                          <VideoOff size={12} />
                        </div>
                      )}
                      
                      {participant.isScreenSharing && (
                        <div className="bg-blue-500/10 p-1 rounded-md text-blue-400 border border-blue-500/20" title="Sharing screen">
                          <MonitorSmartphone size={12} />
                        </div>
                      )}
                      
                      {/* Expand indicator */}
                      <div 
                        className="bg-indigo-900/30 p-1 rounded-md text-indigo-400 transform transition-transform duration-300 border border-indigo-500/20" 
                        style={{ transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded user actions panel with smooth transition */}
                  {isSelected && (
                    <div className="mt-1 ml-10 mb-2 bg-gray-900/60 rounded-md border border-indigo-900/30 overflow-hidden animate-fadeIn backdrop-blur-sm shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                      <div className="grid grid-cols-3 divide-x divide-indigo-900/30 text-gray-300 text-[10px]">
                        <button className="flex flex-col items-center py-2 hover:bg-indigo-900/30 transition-colors">
                          <MessageSquare size={14} className="mb-1 text-cyan-400" />
                          Message
                        </button>
                        <button className="flex flex-col items-center py-2 hover:bg-indigo-900/30 transition-colors">
                          {participant.isMuted ? (
                            <>
                              <MicOff size={14} className="mb-1 text-red-400" />
                              Muted
                            </>
                          ) : (
                            <>
                              <Mic size={14} className="mb-1 text-green-400" />
                              Unmuted
                            </>
                          )}
                        </button>
                        <button className="flex flex-col items-center py-2 hover:bg-indigo-900/30 transition-colors">
                          {participant.isVideoOff ? (
                            <>
                              <VideoOff size={14} className="mb-1 text-red-400" />
                              No Video
                            </>
                          ) : (
                            <>
                              <Video size={14} className="mb-1 text-green-400" />
                              Video On
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
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
        
        {/* Git Operations Panel - directly below file structure */}
        {renderGitPanel()}
        
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
        .typing-dots::after {
          content: "...";
          animation: typingDots 1.5s infinite;
          width: 1em;
          display: inline-block;
        }
        @keyframes typingDots {
          0%, 20% { content: "."; }
          40% { content: ".."; }
          60%, 100% { content: "..."; }
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