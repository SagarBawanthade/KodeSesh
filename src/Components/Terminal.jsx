import { useState, useRef, useEffect } from 'react';

const Terminal = ({ isOpen, height }) => {
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'output', content: 'Welcome to KodeSesh Terminal' },
    { type: 'output', content: 'Type "help" for available commands' },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    
    if (!currentCommand.trim()) return;
    
    // Add command to history
    setTerminalHistory(prev => [
      ...prev, 
      { type: 'input', content: `$ ${currentCommand}` }
    ]);
    
    // Process command (simplified example)
    const processedOutput = processCommand(currentCommand);
    
    // Add output to history
    setTerminalHistory(prev => [
      ...prev, 
      { type: 'output', content: processedOutput }
    ]);
    
    // Clear input
    setCurrentCommand('');
  };

  const processCommand = (cmd) => {
    const command = cmd.trim().toLowerCase();
    
    if (command === 'help') {
      return 'Available commands: help, clear, echo, version';
    } else if (command === 'clear') {
      setTimeout(() => {
        setTerminalHistory([{ type: 'output', content: 'Terminal cleared' }]);
      }, 0);
      return '';
    } else if (command === 'version') {
      return 'KodeSesh Terminal v1.0.0';
    } else if (command.startsWith('echo ')) {
      return command.substring(5);
    } else {
      return `Command not found: ${command}`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-sm">
      <div 
        ref={historyRef}
        className="flex-1 p-2 overflow-y-auto font-mono text-gray-300"
        style={{ height: `${height - 32}px` }}
      >
        {terminalHistory.map((item, index) => (
          <div 
            key={index} 
            className={`mb-1 ${item.type === 'input' ? 'text-green-400' : 'text-gray-300'}`}
          >
            {item.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleCommandSubmit} className="flex border-t border-gray-800">
        <span className="p-2 text-green-400 font-mono">$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none p-2 text-gray-300 font-mono"
          placeholder="Enter command..."
        />
      </form>
    </div>
  );
};

export default Terminal;