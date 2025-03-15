import { X, ChevronRight, TerminalIcon, Users } from 'lucide-react';

const EditorHeader = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  isTerminalOpen, 
  toggleTerminal, 
  selectedFile,
  isCallPanelOpen,
  setIsCallPanelOpen,
  participantsCount
}) => {
  return (
    <div className="h-10 bg-[#2d2d2d] border-b border-gray-800 flex items-center px-4 justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-400 hover:text-gray-200 transition-colors duration-150"
        >
          {isSidebarOpen ? <X size={16} /> : <ChevronRight size={16} />}
        </button>
        <button
          onClick={toggleTerminal}
          className={`rounded px-2 py-1 flex items-center gap-1 text-xs font-medium
            ${isTerminalOpen ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}
        >
          <TerminalIcon size={14} />
        </button>
        <span className="text-sm font-medium">{selectedFile}</span>
      </div>
      
      {/* Call Controls in Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsCallPanelOpen(!isCallPanelOpen)}
          className={`rounded px-2 py-1 flex items-center gap-1 text-xs font-medium
            ${isCallPanelOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'}`}
        >
          <Users size={14} />
          <span>{participantsCount}</span>
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;