import { useState, useEffect, useRef } from 'react';
import { TerminalIcon, X, Trash2, ChevronUp } from 'lucide-react';

const TerminalPanel = ({ 
  isOpen, 
  onClose, 
  height, 
  onHeightChange, 
  terminalHistory = [], 
  setTerminalHistory = () => {} 
}) => {
  const terminalRef = useRef(null);

  // Auto-scroll terminal to bottom when content changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Function to clear terminal
  const clearTerminal = () => {
    setTerminalHistory([]);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black border border-cyan-800/30 rounded-t-lg shadow-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between py-2 px-4 bg-black/40 backdrop-blur-sm border-b border-cyan-700/20">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500 shadow-glow-red"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-glow-yellow"></div>
          <div className="h-3 w-3 rounded-full bg-green-500 shadow-glow-green"></div>
          <div className="ml-3 flex items-center">
            <TerminalIcon size={16} className="text-cyan-400 mr-2" />
            <span className="text-sm font-medium text-cyan-100">Terminal</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={clearTerminal}
            className="text-xs text-gray-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-900/20 transition-colors flex items-center"
          >
            <Trash2 size={14} className="mr-1" />
            <span>Clear</span>
          </button>
          <div 
            className="cursor-ns-resize h-6 w-12 flex items-center justify-center hover:bg-cyan-900/20 rounded transition-colors"
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startHeight = height;
              
              const onMouseMove = (moveEvent) => {
                const deltaY = startY - moveEvent.clientY;
                const newHeight = Math.max(100, Math.min(600, startHeight + deltaY));
                onHeightChange(newHeight);
              };
              
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          >
            <ChevronUp size={14} className="text-cyan-400" />
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-300 p-1 rounded hover:bg-cyan-900/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-gradient-to-b from-[#0a0e1a] to-[#0d1326] text-gray-300"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 100%, rgba(16, 185, 219, 0.05) 0%, transparent 60%)`,
          boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.5)"
        }}
      >
        {terminalHistory.length === 0 ? (
          <div className="text-cyan-500/50 italic flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-2 opacity-70">
                <TerminalIcon size={24} className="inline-block" />
              </div>
              Terminal ready. Run code to see output.
            </div>
          </div>
        ) : (
          terminalHistory.map((item, index) => (
            <div key={index} className="mb-2 last:mb-0">
              {item.type === 'input' && (
                <div className="text-cyan-400 font-bold flex">
                  <span className="text-cyan-600 mr-2">❯</span>
                  {item.content}
                </div>
              )}
              {item.type === 'output' && (
                <div className="text-gray-300 whitespace-pre-wrap ml-4 border-l-2 border-cyan-900/30 pl-2">
                  {item.content}
                </div>
              )}
              {item.type === 'error' && (
                <div className="text-red-400 whitespace-pre-wrap ml-4 border-l-2 border-red-900/30 pl-2 bg-red-900/10 rounded-r">
                  {item.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TerminalPanel;