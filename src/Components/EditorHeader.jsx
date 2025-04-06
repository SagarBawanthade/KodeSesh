import { X, ChevronRight, TerminalIcon, Users, Code2 } from 'lucide-react';

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
  setCurrentLanguage
}) => {
  // Languages we support
  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript', extension: 'js' },
    { id: 'python', name: 'Python', extension: 'py' }
  ];

  // Get language info for displaying icon/name
  const currentLangInfo = supportedLanguages.find(lang => lang.id === currentLanguage) || supportedLanguages[0];

  return (
    <div className="h-12 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-cyan-800/30 flex items-center px-4 justify-between shadow-md backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-400 hover:text-cyan-300 transition-colors duration-150 h-8 w-8 flex items-center justify-center rounded hover:bg-gray-700/30"
        >
          {isSidebarOpen ? <X size={16} /> : <ChevronRight size={16} />}
        </button>
        
        <button
          onClick={toggleTerminal}
          className={`rounded px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-all duration-200
            ${isTerminalOpen 
              ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/50 shadow-sm shadow-cyan-900/20' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700/50 hover:text-gray-200'}`}
        >
          <TerminalIcon size={14} />
          <span>Terminal</span>
        </button>
        
        <div className="h-4 border-r border-gray-700/50 mx-1"></div>
        
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></div>
          <span className="text-sm font-medium text-gray-200">{selectedFile}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="relative group">
          <div className="flex items-center gap-2 bg-gray-800/70 hover:bg-gray-700/70 text-gray-200 rounded-md px-3 py-1.5 text-xs font-medium border border-gray-700/50 cursor-pointer">
            <Code2 size={14} className="text-cyan-400" />
            <span>{currentLangInfo.name}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
            
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
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
        
        {/* Call Controls */}
        <button
          onClick={() => setIsCallPanelOpen(!isCallPanelOpen)}
          className={`rounded-md px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition-all duration-200
            ${isCallPanelOpen 
              ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50 shadow-sm shadow-blue-900/20' 
              : 'bg-gray-800/70 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-200'}`}
        >
          <Users size={14} />
          <span className="font-semibold">{participantsCount}</span>
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;