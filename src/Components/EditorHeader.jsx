import { X, ChevronRight, TerminalIcon, Users, Code2, Play, Loader, LogOut, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import PRNotificationBadge from '../Components/PRNotificationBadge';

const EditorHeader = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  isTerminalOpen, 
  toggleTerminal, 
  selectedFile,
  isCallPanelOpen,
  setIsCallPanelOpen,
  participantsCount,
  currentLanguage,
  setCurrentLanguage,
  executeCode,
  isExecuting,
  socket,
  activeSessionId,
  onEndSession,
  isHost = false, // Default to false if not provided
  onOpenPRReviewPanel = () => {},
}) => {
  // Add state for modal dialog
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
  
  // Languages we support
  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript', extension: 'js' },
    { id: 'python', name: 'Python', extension: 'py' }
  ];

  // Get language info for displaying icon/name
  const currentLangInfo = supportedLanguages.find(lang => lang.id === currentLanguage) || supportedLanguages[0];

  // Handle language change with socket broadcast
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setCurrentLanguage(newLanguage);
    
    // Broadcast language change to all participants if socket exists
    if (socket && socket.connected) {
      console.log("Broadcasting language change:", newLanguage);
      socket.emit("languageUpdate", { 
        sessionId: activeSessionId, 
        language: newLanguage 
      });
    }
  };
  
  // Handle opening end session dialog
  const handleOpenEndSessionModal = () => {
    setIsEndSessionModalOpen(true);
  };
  
  // Handle confirming end session
  const handleConfirmEndSession = () => {
    // First close the modal
    setIsEndSessionModalOpen(false);
    
    // Then call the parent's onEndSession function
    if (typeof onEndSession === 'function') {
      onEndSession();
    }
  };
  
  // Handle closing modal
  const handleCloseModal = () => {
    setIsEndSessionModalOpen(false);
  };
  
  // Use effect to add escape key handler
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isEndSessionModalOpen) {
        setIsEndSessionModalOpen(false);
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleEscKey);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isEndSessionModalOpen]);

  // Add this inside the EditorHeader component, near other function declarations
const openPRReviewPanel = () => {
  if (typeof onOpenPRReviewPanel === 'function') {
    onOpenPRReviewPanel();
  }
};

  return (
    <>
      <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-b border-cyan-800/30 flex items-center px-4 justify-between shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-400 hover:text-cyan-300 transition-colors duration-150 h-8 w-8 flex items-center justify-center rounded hover:bg-gray-700/30"
          >
            {isSidebarOpen ? <X size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></div>
            <span className="text-sm font-medium text-gray-200">{selectedFile}</span>
          </div>
          
          <div className="h-4 border-r border-gray-700/50 mx-2"></div>
          
          {/* Language Selector */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-gray-800/40 hover:bg-gray-700/50 text-gray-200 rounded-md px-3 py-1.5 text-xs font-medium border border-gray-700/50 cursor-pointer transition-all duration-200">
              <Code2 size={14} className="text-cyan-400" />
              <span>{currentLangInfo.name}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              
              <select
                value={currentLanguage}
                onChange={handleLanguageChange}
                className="absolute bg-slate-950 inset-0 opacity-0 cursor-pointer w-full"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* End Session Button - Only visible for hosts */}
          
            <button
              onClick={handleOpenEndSessionModal}
              className="ml-2 px-3 py-1.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-red-900/30 hover:shadow-md hover:shadow-red-900/40 border border-red-500/30"
            >
              <LogOut size={14} />
              <span>End Session</span>
            </button>
        
        </div>
        
        <div className="flex items-center gap-3">
           {isHost && (
    <div className="ml-2">
      <PRNotificationBadge 
        sessionId={activeSessionId}
        onClick={openPRReviewPanel}
        isHost={isHost}
      />
    </div>
  )}
          {/* Run Code Button */}
          <button
            onClick={executeCode}
            disabled={isExecuting}
            className={`rounded-md px-4 py-1.5 flex items-center gap-2 text-xs font-medium transition-all duration-200
              ${isExecuting 
                ? 'bg-gray-800/70 text-gray-400 border border-gray-700/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border border-green-500/50 shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30'
              }`}
          >
            {isExecuting ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-white" />
                <span>Run Code</span>
              </>
            )}
          </button>
          
          <button
            onClick={toggleTerminal}
            className={`rounded-md px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-all duration-200
              ${isTerminalOpen 
                ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/50 shadow-sm shadow-cyan-900/20' 
                : 'bg-gray-800/40 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-200'}`}
          >
            <TerminalIcon size={14} />
            <span>Terminal</span>
          </button>
          
          {/* Call Controls */}
          <button
            onClick={() => setIsCallPanelOpen(!isCallPanelOpen)}
            className={`rounded-md px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-all duration-200
              ${isCallPanelOpen 
                ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50 shadow-sm shadow-blue-900/20' 
                : 'bg-gray-800/40 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-200'}`}
          >
            <Users size={14} />
            <span className="font-semibold">{participantsCount}</span>
          </button>
        </div>
      </div>
      
      {/* Futuristic End Session Modal with fixed closing functionality */}
      {isEndSessionModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={handleCloseModal} // Close when clicking outside the modal
        >
          <div 
            className="w-full max-w-md mx-auto"
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-400 rounded-lg opacity-20 blur-md animate-pulse"></div>
            
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 border border-red-500/30 rounded-lg shadow-xl overflow-hidden">
              {/* Header with warning icon and close button */}
              <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-red-300">Confirm Session Termination</h3>
                </div>
                
                {/* Close button */}
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-700/50"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-300 mb-3">
                    You are about to end this collaborative session for all participants.
                  </p>
                  <p className="text-gray-400 text-sm">
                    All unsaved work will be lost. Participants will be disconnected from this session.
                  </p>
                </div>
                
                {/* Circuit-like decoration */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/30 to-transparent mb-6 relative">
                  <div className="absolute -top-1 left-1/4 w-1 h-1 bg-red-400 rounded-full"></div>
                  <div className="absolute -top-1 left-3/4 w-1 h-1 bg-red-400 rounded-full"></div>
                </div>
                
                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmEndSession}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white border border-red-500/30 shadow-sm shadow-red-900/30 transition-all duration-200"
                  >
                    End Session
                  </button>
                </div>
              </div>
              
              {/* Bottom decorative accents */}
              <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorHeader;