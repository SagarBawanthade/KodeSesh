import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Terminal as TerminalIcon, Zap, ShieldAlert, Code } from 'lucide-react';

const Terminal = ({ 
  className, 
  terminalHistory = [], 
  onCommand = () => {}, 
  socket = null,
  sessionId = null
}) => {
  const [command, setCommand] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const [typingEntryIndex, setTypingEntryIndex] = useState(-1);
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const typewriterSpeed = 25; // ms per character

  // Animation on mount
  useEffect(() => {
    setAnimateIn(true);
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Add global styles on component mount
  useEffect(() => {
    // Add necessary CSS styles for custom animations
    const addGlobalStyles = () => {
      // Check if styles already exist to avoid duplicates
      if (document.getElementById('terminal-styles')) return;
      
      const styleEl = document.createElement('style');
      styleEl.id = 'terminal-styles';
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
        
        @keyframes cursor-blink {
          0%, 100% { caret-color: transparent; }
          50% { caret-color: rgb(34, 211, 238); }
        }
        
        .animate-text-glow {
          animation: text-glow 2s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        .typewriter-cursor {
          display: inline-block;
          width: 0.5em;
          height: 1em;
          background-color: rgba(6, 182, 212, 0.7);
          margin-left: 1px;
          animation: blink 1s infinite;
        }
        
        .glow-element {
          filter: drop-shadow(0 0 2px rgba(6, 182, 212, 0.5));
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
        
        .scale-98 {
          transform: scale(0.98);
        }
      `;
      document.head.appendChild(styleEl);
    };
    
    addGlobalStyles();
    
    // Cleanup function to remove styles if needed
    return () => {
      // Optional: remove styles on unmount
      // const styleEl = document.getElementById('terminal-styles');
      // if (styleEl) styleEl.remove();
    };
  }, []);

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

  // Set up socket listeners for terminal updates
  useEffect(() => {
    if (socket) {
      // Listen for terminal updates from other participants
      socket.on("terminalUpdate", (data) => {
        if (data.sessionId === sessionId) {
          // We don't directly modify terminalHistory here
          // Instead, we bubble up the event to the parent component
          onTerminalUpdate(data.entry);
        }
      });

      return () => {
        socket.off("terminalUpdate");
      };
    }
  }, [socket, sessionId]);

  // Focus on input when clicking anywhere in the terminal
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      // Create the terminal entry
      const entry = { type: 'input', content: command };
      
      // Call the onCommand handler from props
      onCommand(command);
      
      // Emit terminal update to all participants if socket is available
      if (socket && sessionId) {
        socket.emit("terminalUpdate", {
          sessionId,
          entry
        });
      }
      
      // Clear the command input
      setCommand('');
    }
  };

  // Handle terminal updates from other participants
  const onTerminalUpdate = (entry) => {
    // Pass the entry to the parent component to update terminalHistory
    // This is typically handled by the parent component (CodeEditorDashboard)
    if (typeof onCommand === 'function') {
      onCommand(entry.content, entry);
    }
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
      ref={containerRef}
      onClick={handleContainerClick}
      className={`font-mono text-sm h-full flex flex-col ${className} transition-all duration-300 ease-in-out ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-98'}`}
    >
      {/* Terminal output container with scrolling */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto py-2 bg-gradient-to-b from-[#0a0e1a] to-[#0d1326] scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent"
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
        {/* Display terminal history */}
        {terminalHistory.length === 0 ? (
          <div className="text-cyan-500/50 italic flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-2 opacity-70">
                <TerminalIcon size={24} className="inline-block animate-pulse-slow" />
              </div>
              <span className="animate-text-glow">Terminal ready. Type a command to begin.</span>
              <div className="mt-3 h-px w-48 mx-auto bg-gradient-to-r from-transparent via-cyan-800/30 to-transparent"></div>
            </div>
          </div>
        ) : (
          terminalHistory.map((entry, index) => (
            <div key={index} className="mb-2 last:mb-0 px-3 transition-opacity duration-300 ease-in opacity-100">
              {entry.type === 'input' && (
                <div className="text-cyan-400 flex items-center">
                  <ChevronRight size={16} className="text-cyan-600 mr-1 animate-blink" />
                  <Code size={14} className="mr-2 text-cyan-600" />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {entry.content}
                  </span>
                </div>
              )}
              {entry.type === 'output' && (
                <div className="text-gray-300 whitespace-pre-wrap ml-6 border-l-2 border-cyan-900/30 pl-2 group hover:border-cyan-700/50 transition-colors duration-200">
                  <div className="flex items-center mb-1">
                    <Zap size={12} className="text-green-400 mr-1" />
                    <span className="text-xs text-green-400 opacity-70">output</span>
                  </div>
                  <div className="output-text group-hover:text-gray-100 transition-colors duration-200">
                    {getEntryContent(entry, index)}
                  </div>
                </div>
              )}
              {entry.type === 'error' && (
                <div className="text-red-400 whitespace-pre-wrap ml-6 border-l-2 border-red-900/50 pl-2 bg-red-900/10 rounded-r transition-all duration-200 hover:bg-red-900/15">
                  <div className="flex items-center mb-1">
                    <ShieldAlert size={12} className="text-red-500 mr-1 animate-pulse" />
                    <span className="text-xs text-red-500">error</span>
                  </div>
                  <div className="error-text">
                    {getEntryContent(entry, index)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Command input with animated cursor and futuristic design */}
      <form 
        onSubmit={handleSubmit} 
        className="flex items-center px-3 py-2 bg-[#0a0e1a] border-t border-cyan-900/30 relative"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(6, 182, 212, 0.05), transparent 50%)",
          boxShadow: "0 -5px 15px rgba(0, 0, 0, 0.3)"
        }}
      >
        {/* Input decorative elements */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-500/30 to-transparent"></div>
        <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-r from-transparent to-cyan-500/10"></div>
        
        {/* Command chevron with glow effect */}
        <ChevronRight size={16} className="text-cyan-600 mr-1 glow-element" />
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-1 bg-transparent outline-none text-cyan-100 caret-cyan-400 py-1"
          placeholder="Type command here..."
          autoFocus
          style={{
            animation: "cursor-blink 1.2s steps(1) infinite",
            textShadow: "0 0 5px rgba(6, 182, 212, 0.3)"
          }}
        />
        
        {/* Hidden submit button for form submission */}
        <button type="submit" className="hidden">Submit</button>
      </form>
    </div>
  );
};

export default Terminal;