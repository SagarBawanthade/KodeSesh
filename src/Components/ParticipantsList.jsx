

import { useState } from 'react';
import { Users, Circle } from 'lucide-react';

const ParticipantsList = ({ participants = [] }) => {
  const [userColors] = useState({
    // Futuristic neon color palette
    colors: [
      '#00FFFF', // Cyan
      '#FF00FF', // Magenta
      '#00FF00', // Bright green
      '#FF3D00', // Bright orange
      '#FFFF00', // Yellow
      '#00B8FF', // Bright blue
      '#FF0099', // Hot pink
      '#7C4DFF', // Purple
      '#76FF03', // Lime
      '#1DE9B6'  // Teal
    ]
  });

  // Don't render if no participants
  if (!participants || participants.length === 0) return null;
  
  return (
    <div className="border-t border-indigo-800/50 bg-gradient-to-r from-gray-900/80 via-indigo-950/30 to-gray-900/80 backdrop-blur-md">
      {/* Participants Header */}
      <div className="text-xs font-bold px-3 py-2.5 flex items-center justify-between bg-gradient-to-r from-indigo-950/70 to-indigo-900/40 shadow-[0_-4px_12px_rgba(6,182,212,0.1)]">
        <div className="flex items-center">
          <div className="bg-indigo-600/80 p-1.5 rounded-md mr-2 shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-indigo-500/30">
            <Users size={12} className="text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.7)]" />
          </div>
          <div className="flex items-center">
            <span className="text-cyan-300 tracking-wider uppercase font-bold">PARTICIPANTS</span>
            <span className="ml-2 bg-indigo-900/80 text-cyan-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
              {participants.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Participants list with scrolling */}
      <div className="overflow-y-auto max-h-60">
        <div className="px-2 pt-2 pb-3 space-y-2">
          {participants.map((participant, index) => {
            // Generate color based on index
            const colorIndex = index % userColors.colors.length;
            const statusColor = userColors.colors[colorIndex];
            
            return (
              <div 
                key={participant.id || index} 
                className="relative flex items-center px-2.5 py-2 rounded-md bg-indigo-900/30 border-indigo-800/40 hover:border-indigo-600/50 hover:bg-indigo-900/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] border transition-all duration-200"
              >
                {/* User avatar with first letter */}
                <div 
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-900 border-2 mr-2 shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                  style={{ borderColor: statusColor }}
                >
                  <span className="text-xs font-bold text-white">
                    {participant.name ? participant.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-white truncate">
                      {participant.name || `User ${index + 1}`}
                    </span>
                  </div>
                  
                  {/* Status text - simple online status */}
                  <div className="text-[10px] truncate">
                    <span className="text-gray-400 flex items-center">
                      <Circle size={6} fill="#9CA3AF" className="mr-1" /> 
                      Online
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;