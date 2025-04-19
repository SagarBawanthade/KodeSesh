import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const Terminal = ({ 
  className, 
  terminalHistory = [], 
  onCommand = () => {}, 
  socket = null,
  sessionId = null
}) => {
  const [command, setCommand] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll terminal to bottom when content changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

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

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className={`font-mono text-sm h-full flex flex-col ${className}`}
    >
      {/* Terminal output container with scrolling */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto py-2 bg-gradient-to-b from-[#0a0e1a] to-[#0d1326]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 100%, rgba(16, 185, 219, 0.05) 0%, transparent 70%)`,
          boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Display terminal history */}
        {terminalHistory.length === 0 ? (
          <div className="text-cyan-500/50 italic flex items-center justify-center h-full">
            <div className="text-center">
              Terminal ready. Type a command to begin.
            </div>
          </div>
        ) : (
          terminalHistory.map((entry, index) => (
            <div key={index} className="mb-2 last:mb-0 px-3">
              {entry.type === 'input' && (
                <div className="text-cyan-400 flex items-center">
                  <ChevronRight size={16} className="text-cyan-600 mr-1" />
                  <span>{entry.content}</span>
                </div>
              )}
              {entry.type === 'output' && (
                <div className="text-gray-300 whitespace-pre-wrap ml-6 border-l-2 border-cyan-900/30 pl-2">
                  {entry.content}
                </div>
              )}
              {entry.type === 'error' && (
                <div className="text-red-400 whitespace-pre-wrap ml-6 border-l-2 border-red-900/30 pl-2 bg-red-900/10 rounded-r">
                  {entry.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Command input with animated cursor */}
      <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 bg-[#0a0e1a] border-t border-cyan-900/30">
        <ChevronRight size={16} className="text-cyan-600 mr-1" />
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-1 bg-transparent outline-none text-cyan-100 caret-cyan-400 py-1"
          placeholder="Type command here..."
          autoFocus
          style={{
            animation: "cursor-blink 1.2s steps(1) infinite"
          }}
        />
      </form>

      {/* Add CSS for blinking cursor */}
      <style jsx>{`
        @keyframes cursor-blink {
          0%, 100% { caret-color: transparent; }
          50% { caret-color: rgb(34, 211, 238); }
        }
      `}</style>
    </div>
  );
};

export default Terminal;