import { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Share, MessageSquare } from 'lucide-react';
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
    <div className="w-4/12 border-l border-gray-800 bg-[#1a1a1a] flex flex-col">
      {/* Video area */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        {/* Main video display */}
        <div className="flex-1 relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
          <ParticipantVideo 
            participant={participants[0]} 
            isMain={true} 
            videoRef={localVideoRef} 
          />
        </div>
        
        {/* Participants row */}
        <div className="h-24 flex gap-2 overflow-x-auto py-1">
          {participants.slice(1).map(participant => (
            <ParticipantVideo 
              key={participant.id}
              participant={participant} 
              isMain={false} 
            />
          ))}
        </div>
      </div>
      
      {/* Call controls */}
      <div className="h-16 border-t border-gray-800 flex items-center justify-center gap-2 bg-[#252526]">
        <button 
          onClick={toggleAudio}
          className={`p-2 rounded-full ${isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
        >
          {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`p-2 rounded-full ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        
        <button className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
          <Share size={20} />
        </button>
        
        <button className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
          <MessageSquare size={20} />
        </button>
        
        <button className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors">
          <Phone size={20} />
        </button>
      </div>
    </div>
  );
};

export default CallPanel;