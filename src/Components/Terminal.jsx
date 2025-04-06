import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const Terminal = ({ className, terminalHistory = [], onCommand = () => {} }) => {
  const [command, setCommand] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Focus on input when clicking anywhere in the terminal
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      onCommand(command);
      setCommand('');
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className={`font-mono text-sm ${className} bg-gradient-to-b from-[#0a0e1a] to-[#0d1326]`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 100%, rgba(16, 185, 219, 0.05) 0%, transparent 70%)`,
        boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Display terminal history */}
      {terminalHistory.map((entry, index) => (
        <div key={index} className="mb-2 last:mb-0 px-1">
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
      ))}

      {/* Command input with animated cursor */}
      <form onSubmit={handleSubmit} className="flex items-center px-1 mt-2">
        <ChevronRight size={16} className="text-cyan-600 mr-1" />
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-1 bg-transparent outline-none text-cyan-100 caret-cyan-400 py-1"
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