import { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Share, MessageSquare, Users } from 'lucide-react';
import ParticipantVideo from './ParticipantVideo';

const CallPanel = ({ participants, isAudioOn, isVideoOn, toggleAudio, toggleVideo }) => {
  const localVideoRef = useRef(null);
  
  // Handle local video stream
  useEffect(() => {
    if (isVideoOn && localVideoRef.current) {
      // This would be replaced with real WebRTC implementation
      navigator.mediaDevices.getUserMedia({ audio: isAudioOn, video: isVideoOn })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Error accessing media devices:", err));
    }
    
    return () => {
      // Clean up stream when component unmounts
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isVideoOn, isAudioOn]);

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-[#0c1529]/90 to-[#0a101f]/90 backdrop-blur-md h-full">
      {/* Header with session info */}
      <div className="px-4 py-3 border-b border-indigo-900/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-cyan-400" />
          <h3 className="font-medium text-cyan-100">Live Session</h3>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-cyan-300/70 bg-cyan-900/20 px-2 py-1 rounded-full border border-cyan-800/30">
            {participants.length} participants
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Main video display */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-indigo-900/40 bg-[#080d19] shadow-[inset_0_0_20px_rgba(56,189,248,0.1)]">
          {/* Main participant header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent z-10 p-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-sm font-medium text-white">
                {participants[0].name} {participants[0].isHost && <span className="text-cyan-400 text-xs ml-1">(Host)</span>}
              </span>
            </div>
          </div>

          {/* Connection quality indicator */}
          <div className="absolute bottom-3 right-3 z-10 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <div className="flex items-center space-x-px">
              <div className="h-3 w-1 bg-green-400 rounded-sm"></div>
              <div className="h-4 w-1 bg-green-400 rounded-sm"></div>
              <div className="h-5 w-1 bg-green-400 rounded-sm"></div>
            </div>
            <span className="text-xs text-green-300">Excellent</span>
          </div>

          {/* Main video */}
          <div className="absolute inset-0 bg-[#050a14]">
            <ParticipantVideo 
              participant={participants[0]} 
              isMain={true} 
              videoRef={localVideoRef} 
            />
          </div>
        </div>
        
        {/* Participants grid */}
        <div className="h-28 flex gap-3 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-cyan-900/40 scrollbar-track-transparent">
          {participants.slice(1).map(participant => (
            <div key={participant.id} className="h-full aspect-video flex-shrink-0 relative group">
              <div className="absolute inset-0 rounded-lg overflow-hidden border border-indigo-900/40 bg-[#080d19] shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <ParticipantVideo 
                  participant={participant} 
                  isMain={false} 
                />
              </div>
              
              {/* Participant name tooltip */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white">{participant.name}</span>
              </div>
              
              {/* Status indicators */}
              <div className="absolute top-2 right-2 flex space-x-1">
                {participant.isMuted && (
                  <div className="bg-red-500/80 rounded-full p-1">
                    <MicOff size={10} className="text-white" />
                  </div>
                )}
                {participant.isVideoOff && (
                  <div className="bg-red-500/80 rounded-full p-1">
                    <VideoOff size={10} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Call controls */}
      <div className="h-20 border-t border-indigo-900/30 flex items-center justify-center gap-3 bg-gradient-to-r from-[#0a101f]/80 to-[#0c1529]/80 backdrop-blur-md">
        <button 
          onClick={toggleAudio}
          className={`p-3 rounded-full ${isAudioOn 
            ? 'bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30' 
            : 'bg-red-500/80 hover:bg-red-600/80 border border-red-400/30'} 
            transition-all transform hover:scale-110 shadow-lg`}
        >
          {isAudioOn ? 
            <Mic size={22} className="text-cyan-300" /> : 
            <MicOff size={22} className="text-white" />
          }
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoOn 
            ? 'bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30' 
            : 'bg-red-500/80 hover:bg-red-600/80 border border-red-400/30'} 
            transition-all transform hover:scale-110 shadow-lg`}
        >
          {isVideoOn ? 
            <Video size={22} className="text-cyan-300" /> : 
            <VideoOff size={22} className="text-white" />
          }
        </button>
        
        <button className="p-3 rounded-full bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30 transition-all transform hover:scale-110 shadow-lg">
          <Share size={22} className="text-cyan-300" />
        </button>
        
        <button className="p-3 rounded-full bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30 transition-all transform hover:scale-110 shadow-lg">
          <MessageSquare size={22} className="text-cyan-300" />
        </button>
        
        <button className="p-3 rounded-full bg-red-500 hover:bg-red-600 border border-red-400/30 transition-all transform hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
          <Phone size={22} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default CallPanel;