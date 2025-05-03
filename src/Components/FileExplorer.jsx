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
  X, // For closing
  Users, // For participants section
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorSmartphone,
  Circle,
  MessageSquare
} from 'lucide-react';  

const FileExplorer = ({   
  fileStructure,   
  selectedFile,   
  onFileSelect,   
  currentLanguage,
  gitOperations, // Git operations prop
  currentBranch = 'main',
  isHost = false, // Host check prop
  participants = [], // Add participants prop
}) => {   
  const [expandedFolders, setExpandedFolders] = useState(['src']);
  const [showGitPanel, setShowGitPanel] = useState(false); // State for Git panel visibility
  const [showHostMessage, setShowHostMessage] = useState(false); // For non-host message
  const [activeTab, setActiveTab] = useState('operations'); // For git panel tabs
  const [userColors, setUserColors] = useState({}); // For participant colors
  const [expandedSections, setExpandedSections] = useState({
    files: true,
    git: true,
    participants: true
  });
  const [activeParticipantId, setActiveParticipantId] = useState(null);
    
  // Toggle folder expansion
  const toggleFolder = (folderName) => {     
    setExpandedFolders((prev) =>       
      prev.includes(folderName)         
        ? prev.filter((f) => f !== folderName)         
        : [...prev, folderName]     
    );   
  };

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  // Helper function to generate consistent colors for users
  const generateUserColor = (userId) => {
    // If user already has a color assigned, return it
    if (userColors[userId]) return userColors[userId];
    
    // List of bright, distinct colors good for indicators
    const colorPalette = [
      '#FF5733', // Coral red
      '#33FF57', // Bright green
      '#3357FF', // Bright blue
      '#FF33A8', // Pink
      '#33FFF5', // Cyan
      '#F5FF33', // Yellow
      '#FF8C33', // Orange
      '#8C33FF', // Purple
      '#33FFB8', // Mint
      '#FF33FF'  // Magenta
    ];
    
    // Assign a color based on how many users already have colors
    const colorIndex = Object.keys(userColors).length % colorPalette.length;
    const newColor = colorPalette[colorIndex];
    
    // Save the color assignment
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
        <div 
          className="text-xs font-semibold text-gray-400 px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-gray-800/30"
          onClick={() => toggleSection('git')}
        >
          <div className="flex items-center">
            <Github size={12} className="mr-1.5 text-gray-400" />
            GIT OPERATIONS
          </div>
          <div className="transform transition-transform duration-200">
            {expandedSections.git ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
        
        <div 
          className={`overflow-hidden transition-all duration-200 ${
            expandedSections.git ? 'max-h-96' : 'max-h-0'
          }`}
        >
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
          </div>
        </div>
      </div>
    );
  };

  // Render participants list - ENHANCED FUTURISTIC VERSION
  const renderParticipantsList = () => {
    if (!participants || participants.length === 0) return null;
    
    return (
      <div className="mt-4 border-t border-indigo-900/50 bg-gradient-to-b from-gray-900/60 to-gray-900/30 backdrop-blur rounded-md shadow-lg">
        {/* Header with neon glow effect */}
        <div 
          className="text-xs font-bold px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-indigo-900/20 transition-all duration-300 rounded-t-md"
          onClick={() => toggleSection('participants')}
          style={{ 
            background: 'linear-gradient(90deg, rgba(16,24,39,0.8) 0%, rgba(67,56,202,0.1) 50%, rgba(16,24,39,0.8) 100%)',
            boxShadow: expandedSections.participants ? '0 0 10px rgba(99,102,241,0.3) inset' : 'none'
          }}
        >
          <div className="flex items-center">
            <div className="bg-indigo-600 p-1.5 rounded-full mr-2 shadow-[0_0_10px_rgba(99,102,241,0.7)]">
              <Users size={10} className="text-white" />
            </div>
            <div>
              <span className="text-indigo-300 tracking-wider uppercase">PARTICIPANTS</span>
              <span className="ml-2 bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{participants.length}</span>
            </div>
          </div>
          <div className="transform transition-transform duration-300">
            {expandedSections.participants ? 
              <ChevronDown size={14} className="text-indigo-400" /> : 
              <ChevronRight size={14} className="text-indigo-400" />
            }
          </div>
        </div>
        
        {/* Participants list with expanded animation */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expandedSections.participants ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Filter Tabs - Active / All */}
          <div className="flex mx-2.5 mt-2 border-b border-indigo-900/30 text-[10px] font-medium">
            <div className="px-3 py-1.5 text-indigo-300 border-b-2 border-indigo-500 cursor-pointer">
              ACTIVE NOW
            </div>
            <div className="px-3 py-1.5 text-gray-400 cursor-pointer hover:text-indigo-300 transition-colors">
              ALL
            </div>
          </div>
          
          {/* Participants Grid */}
          <div className="px-2 pt-2 pb-3 space-y-1.5 overflow-y-auto max-h-56 scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-gray-900/30">
            {participants.map((participant) => {
              // Generate status indicator color
              const statusColor = participant.isTyping 
                ? '#10B981' // Green when typing
                : participant.isActive 
                  ? '#3B82F6' // Blue when active
                  : generateUserColor(participant.id);
                  
              // Check if this participant is expanded/selected
              const isSelected = activeParticipantId === participant.id;
              
              return (
                <div key={participant.id}>
                  {/* Main participant card */}
                  <div 
                    className={`relative flex items-center px-2.5 py-2 rounded-md transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-900/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'hover:bg-gray-800/60'
                    }`}
                    onClick={() => setActiveParticipantId(isSelected ? null : participant.id)}
                  >
                    {/* Status indicator with pulsing animation */}
                    <div className="relative mr-3">
                      {/* Background glow effect */}
                      <div 
                        className={`absolute inset-0 rounded-full ${
                          participant.isTyping ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          backgroundColor: `${statusColor}30`,
                          boxShadow: `0 0 12px ${statusColor}50`,
                          transform: 'scale(1.6)'
                        }}
                      />
                      
                      {/* User avatar with first letter */}
                      <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden relative bg-gray-800 border-2"
                        style={{ borderColor: statusColor }}
                      >
                        <span className="text-xs font-bold text-white">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                        
                        {/* Tiny status dot */}
                        <div 
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-gray-800"
                          style={{ 
                            backgroundColor: statusColor,
                            boxShadow: `0 0 6px ${statusColor}`
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
                          <span className="ml-1.5 bg-yellow-500/20 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded-sm font-medium">
                            HOST
                          </span>
                        )}
                      </div>
                      
                      {/* Status text */}
                      <div className="text-[10px] truncate">
                        {participant.isTyping ? (
                          <span className="text-green-400 flex items-center animate-pulse">
                            <Circle size={6} fill="#10B981" className="mr-1" /> 
                            Typing...
                          </span>
                        ) : participant.isActive ? (
                          <span className="text-blue-400 flex items-center">
                            <Circle size={6} fill="#3B82F6" className="mr-1" /> 
                            Active now
                          </span>
                        ) : (
                          <span className="text-gray-400">Online</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status icons */}
                    <div className="flex space-x-1.5">
                      {participant.isMuted && (
                        <div className="bg-red-500/10 p-1 rounded-full text-red-400" title="Microphone muted">
                          <MicOff size={10} />
                        </div>
                      )}
                      
                      {participant.isVideoOff && (
                        <div className="bg-red-500/10 p-1 rounded-full text-red-400" title="Video off">
                          <VideoOff size={10} />
                        </div>
                      )}
                      
                      {participant.isScreenSharing && (
                        <div className="bg-blue-500/10 p-1 rounded-full text-blue-400" title="Sharing screen">
                          <MonitorSmartphone size={10} />
                        </div>
                      )}
                      
                      {/* Expand indicator */}
                      <div className="bg-gray-700/30 p-1 rounded-full text-gray-400 transform transition-transform duration-300" 
                        style={{ transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <ChevronDown size={10} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded user actions panel with smooth transition */}
                  {isSelected && (
                    <div className="mt-1 ml-10 mb-2 bg-gray-800/50 rounded border border-indigo-900/30 overflow-hidden animate-fadeIn">
                      <div className="grid grid-cols-3 divide-x divide-indigo-900/30 text-gray-300 text-[10px]">
                        <button className="flex flex-col items-center py-2 hover:bg-indigo-900/30 transition-colors">
                          <MessageSquare size={12} className="mb-1 text-blue-400" />
                          Message
                        </button>
                        <button className="flex flex-col items-center py-2 hover:bg-indigo-900/30 transition-colors">
                          {participant.isMuted ? (
                            <>
                              <MicOff size={12} className="mb-1 text-red-400" />
                              Muted
                            </>
                          ) : (
                            <>
                              <Mic size={12} className="mb-1 text-green-400" />
                              Unmuted
                            </>
                          )}
                        </button>
                        <button className="flex flex-col items-center py-2 hover:bg-indigo-900/30 transition-colors">
                          {participant.isVideoOff ? (
                            <>
                              <VideoOff size={12} className="mb-1 text-red-400" />
                              No Video
                            </>
                          ) : (
                            <>
                              <Video size={12} className="mb-1 text-green-400" />
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {renderFileTree(filteredFileStructure)}
      </div>
      {renderGitPanel()}
      {renderParticipantsList()}
      {renderHostMessage()}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 100px; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
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
        className="text-gray-400 cursor-pointer hover:text-green-400 transition-colors duration-150"
        onClick={toggleGitPanel}
      />
    </div>   
  ); 
};  

export default FileExplorer;