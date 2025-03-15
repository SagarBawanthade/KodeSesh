import { MicOff } from 'lucide-react';

const ParticipantVideo = ({ participant, isMain, videoRef = null }) => {
  // Add a default empty object if participant is undefined
  const { id, name, isHost, isMuted, isVideoOff } = participant || {};
  
  // If no participant is provided, show a placeholder
  if (!participant) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden border border-gray-700 
          ${isMain ? 'h-full w-full' : 'h-20 w-32'}`}
      >
        <div className="bg-gray-700 h-full w-full flex items-center justify-center">
          <span className="text-gray-400 text-sm">No participant</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden border border-gray-700 
        ${isMain ? 'h-full w-full' : 'h-20 w-32'}`}
    >
      {isVideoOff ? (
        <div className="bg-gray-700 h-full w-full flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {name?.charAt(0) || '?'}
          </div>
        </div>
      ) : (
        id === 1 ? 
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="h-full w-full object-cover bg-gray-800" 
          /> :
          <div className="bg-gray-800 h-full w-full flex items-center justify-center">
            <div className="animate-pulse h-full w-full bg-gray-700 opacity-50"></div>
          </div>
      )}
      
      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-xs text-white truncate">{name || 'Unknown'}</span>
          {isHost && (
            <span className="text-[10px] bg-blue-500 px-1 rounded text-white">Host</span>
          )}
        </div>
        {isMuted && <MicOff size={12} className="text-red-500" />}
      </div>
    </div>
  );
};

export default ParticipantVideo;