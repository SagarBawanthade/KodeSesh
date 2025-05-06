import { useState, useEffect, useRef } from 'react';
import { TerminalIcon, X, Trash2, ChevronUp, Code, Zap, ShieldAlert } from 'lucide-react';

const TerminalPanel = ({ 
  isOpen, 
  onClose, 
  height, 
  onHeightChange, 
  terminalHistory = [], 
  setTerminalHistory = () => {} 
}) => {
  const terminalRef = useRef(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [typingEntryIndex, setTypingEntryIndex] = useState(-1);
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const typewriterSpeed = 25; // ms per character
  
  // Animation on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 50);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  // Auto-scroll terminal to bottom when content changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory, typingText]);
  
  // Typewriter effect for new entries
  useEffect(() => {
    if (terminalHistory.length > 0) {
      const lastIndex = terminalHistory.length - 1;
      const lastEntry = terminalHistory[lastIndex];
      
      // Only animate output and error entries
      if (lastEntry.type === 'output' || lastEntry.type === 'error') {
        // Start typing animation for the new entry
        setTypingEntryIndex(lastIndex);
        setTypingText('');
        setShowCursor(true);
        
        const content = lastEntry.content;
        let charIndex = 0;
        
        const typeNextChar = () => {
          if (charIndex < content.length) {
            setTypingText(content.substring(0, charIndex + 1));
            charIndex++;
            setTimeout(typeNextChar, typewriterSpeed);
          } else {
            // Typing complete
            setShowCursor(false);
            setTypingEntryIndex(-1);
          }
        };
        
        typeNextChar();
      }
    }
  }, [terminalHistory.length]);

  // Add global styles on component mount
  useEffect(() => {
    // Add necessary CSS styles for custom animations
    const addGlobalStyles = () => {
      // Check if styles already exist to avoid duplicates
      if (document.getElementById('terminal-panel-styles')) return;
      
      const styleEl = document.createElement('style');
      styleEl.id = 'terminal-panel-styles';
      styleEl.textContent = `
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 8px rgba(6, 182, 212, 0.3); }
          50% { text-shadow: 0 0 12px rgba(6, 182, 212, 0.6); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .typewriter-cursor {
          display: inline-block;
          width: 0.5em;
          height: 1em;
          background-color: rgba(6, 182, 212, 0.7);
          margin-left: 1px;
          animation: blink 1s infinite;
        }
        
        .animate-text-glow {
          animation: text-glow 2s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        
        .delay-75 {
          animation-delay: 0.75s;
        }
        
        .delay-150 {
          animation-delay: 1.5s;
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        .shadow-glow-red {
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }
        
        .shadow-glow-yellow {
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.6);
        }
        
        .shadow-glow-green {
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }
        
        /* Scrollbar Styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `;
      document.head.appendChild(styleEl);
    };
    
    addGlobalStyles();
    
    // Cleanup function to remove styles if needed
    return () => {
      // Optional: remove styles on unmount
      // const styleEl = document.getElementById('terminal-panel-styles');
      // if (styleEl) styleEl.remove();
    };
  }, []);

  // Function to clear terminal
  const clearTerminal = () => {
    setTerminalHistory([]);
  };

  // Get content based on typewriter state
  const getEntryContent = (entry, index) => {
    if (index === typingEntryIndex) {
      return (
        <>
          {typingText}
          {showCursor && <span className="typewriter-cursor"></span>}
        </>
      );
    }
    return entry.content;
  };

  return (
    <div 
      className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-black border border-cyan-800/30 rounded-t-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{
        boxShadow: "0 0 20px rgba(6, 182, 212, 0.15), 0 0 60px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Terminal Header with holographic effect */}
      <div className="flex items-center justify-between py-2 px-4 bg-black/40 backdrop-blur-sm border-b border-cyan-700/20">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500 shadow-glow-red animate-pulse-slow"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-glow-yellow animate-pulse-slow delay-75"></div>
          <div className="h-3 w-3 rounded-full bg-green-500 shadow-glow-green animate-pulse-slow delay-150"></div>
          <div className="ml-3 flex items-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
            <TerminalIcon size={16} className="text-cyan-400 mr-2" />
            <span className="text-sm font-medium text-transparent">Terminal</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={clearTerminal}
            className="text-xs text-gray-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-900/20 transition-all duration-200 flex items-center group"
          >
            <Trash2 size={14} className="mr-1 group-hover:rotate-12 transition-transform duration-200" />
            <span className="opacity-80 group-hover:opacity-100">Clear</span>
          </button>
          <div 
            className="cursor-ns-resize h-6 w-12 flex items-center justify-center hover:bg-cyan-900/20 rounded transition-colors group"
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
            <ChevronUp size={14} className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-200" />
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-300 p-1 rounded hover:bg-cyan-900/20 transition-all duration-200 hover:rotate-90 transform"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Terminal Content with custom scrollbar and grid background */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-gradient-to-b from-[#0a0e1a] to-[#0d1326] text-gray-300 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 100%, rgba(16, 185, 219, 0.08) 0%, transparent 60%),
            linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 20px 20px, 20px 20px",
          boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.5)"
        }}
      >
        {terminalHistory.length === 0 ? (
          <div className="text-cyan-500/50 italic flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-2 opacity-70">
                <TerminalIcon size={24} className="inline-block animate-pulse-slow" />
              </div>
              <span className="animate-text-glow">Terminal ready. Run code to see output.</span>
              <div className="mt-3 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-cyan-800/30 to-transparent"></div>
            </div>
          </div>
        ) : (
          terminalHistory.map((item, index) => (
            <div key={index} className="mb-2 last:mb-0 transition-opacity duration-300 ease-in opacity-100">
              {item.type === 'input' && (
                <div className="text-cyan-400 font-bold flex items-center">
                  <span className="text-cyan-600 mr-2 animate-blink">❯</span>
                  <Code size={14} className="mr-2 text-cyan-600" />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {item.content}
                  </span>
                </div>
              )}
              {item.type === 'output' && (
                <div className="text-gray-300 whitespace-pre-wrap ml-4 border-l-2 border-cyan-900/30 pl-2 group hover:border-cyan-700/50 transition-colors duration-200">
                  <div className="flex items-center mb-1">
                    <Zap size={12} className="text-green-400 mr-1" />
                    <span className="text-xs text-green-400 opacity-70">output</span>
                  </div>
                  <div className="output-text group-hover:text-gray-100 transition-colors duration-200">
                    {getEntryContent(item, index)}
                  </div>
                </div>
              )}
              {item.type === 'error' && (
                <div className="text-red-400 whitespace-pre-wrap ml-4 border-l-2 border-red-900/50 pl-2 bg-red-900/10 rounded-r transition-all duration-200 hover:bg-red-900/15">
                  <div className="flex items-center mb-1">
                    <ShieldAlert size={12} className="text-red-500 mr-1 animate-pulse" />
                    <span className="text-xs text-red-500">error</span>
                  </div>
                  <div className="error-text">
                    {getEntryContent(item, index)}
                  </div>
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