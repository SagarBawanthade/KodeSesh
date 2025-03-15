import { TerminalIcon, X } from 'lucide-react';
import Terminal from './Terminal';

const TerminalPanel = ({ isOpen, onClose, height, onHeightChange }) => {
  return (
    <div 
      className="border-t border-gray-700 bg-[#1a1a1a]"
      style={{ height: `${height}px` }}
    >
      <div className="flex justify-between items-center px-3 py-1 bg-[#2d2d2d] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-green-400" />
          <span className="text-xs font-medium">Terminal</span>
        </div>
        <div 
          className="cursor-ns-resize h-1 w-12 bg-gray-600 rounded-full my-1"
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
        />
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors duration-150"
        >
            <X size={14} />
        </button>
         </div>
      <Terminal 
        isOpen={isOpen}
        onClose={onClose}
        height={height - 30} // Subtract header height
        onHeightChange={(newHeight) => onHeightChange(newHeight + 30)} // Add header height
      />
    </div>
  );
};

export default TerminalPanel;