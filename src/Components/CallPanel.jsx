import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Share, RefreshCw, Users } from 'lucide-react';
import ParticipantVideo from './ParticipantVideo';
import WebRTCService from '../service/WebRTCService.js';

const CallPanel = ({ 
  participants, 
  isAudioOn, 
  isVideoOn, 
  toggleAudio, 
  toggleVideo, 
  socket, 
  activeSessionId 
}) => {
  const localVideoRef = useRef(null);
  const [webrtcService, setWebrtcService] = useState(null);
  const [participantStreams, setParticipantStreams] = useState({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [activeMainParticipant, setActiveMainParticipant] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Initialize WebRTC service
  useEffect(() => {
    if (!socket || !activeSessionId) return;
    
    const userId = localStorage.getItem("userId") || Date.now().toString();
    console.log("Initializing WebRTC service for user:", userId, "session:", activeSessionId);
    
    const rtcService = new WebRTCService(socket, userId, activeSessionId);
    
    // Set up callback for remote stream updates
    rtcService.onRemoteStreamUpdate = (participantId, stream) => {
      console.log(`Received stream from participant ${participantId}`, stream);
      
      // Ensure we have a valid stream
      if (stream && stream.active) {
        setParticipantStreams(prev => {
          // Make a deep copy to ensure React detects the change
          const newStreams = { ...prev };
          newStreams[participantId] = stream;
          return newStreams;
        });
        
        // Update connection status
        setConnectionStatus('connected');
      }
    };
    
    // Set up callback for participant disconnection
    rtcService.onParticipantDisconnect = (participantId) => {
      console.log(`Participant ${participantId} disconnected`);
      setParticipantStreams(prev => {
        const updated = { ...prev };
        delete updated[participantId];
        return updated;
      });
      
      // If this was the main participant, reset to self
      if (activeMainParticipant === participantId) {
        setActiveMainParticipant(null);
      }
    };
    
    setWebrtcService(rtcService);
    
    // Clean up WebRTC service on unmount
    return () => {
      if (rtcService) {
        console.log("Cleaning up WebRTC service");
        rtcService.cleanup();
      }
    };
  }, [socket, activeSessionId]);

  // Handle local video stream and initialize WebRTC
  useEffect(() => {
    const initializeMedia = async () => {
      if (webrtcService) {
        try {
          console.log("Initializing local media streams");
          setConnectionStatus('connecting');
          
          const stream = await webrtcService.initLocalStream(isAudioOn, isVideoOn);
          
          // Update local video preview
          if (localVideoRef.current) {
            console.log("Setting local video stream");
            localVideoRef.current.srcObject = stream;
            
            // Force a reload of the video element
            localVideoRef.current.load();
            
            // Try to play the video (may fail due to autoplay policies)
            try {
              await localVideoRef.current.play();
            } catch (err) {
              console.warn("Couldn't autoplay local video:", err);
            }
          }
          
          // Store our own stream in the participant streams
          const userId = localStorage.getItem("userId") || Date.now().toString();
          setParticipantStreams(prev => ({
            ...prev,
            [userId]: stream
          }));
          
          // After successful media initialization, signal readiness
          console.log("Local media initialized, signaling ready to server");
          webrtcService.signalReady();
        } catch (err) {
          console.error("Error initializing media:", err);
          setConnectionStatus('error');
        }
      }
    };
    
    if (webrtcService) {
      initializeMedia();
    }
  }, [webrtcService, isAudioOn, isVideoOn]);

  // Update audio state when it changes
  useEffect(() => {
    if (webrtcService) {
      console.log("Toggling audio:", isAudioOn);
      webrtcService.toggleAudio(isAudioOn);
      
      // Notify other participants via socket
      const userId = localStorage.getItem("userId") || Date.now().toString();
      socket.emit("audioToggled", {
        sessionId: activeSessionId,
        userId,
        isMuted: !isAudioOn
      });
    }
  }, [isAudioOn, webrtcService, socket, activeSessionId]);

  // Update video state when it changes
  useEffect(() => {
    if (webrtcService) {
      console.log("Toggling video:", isVideoOn);
      webrtcService.toggleVideo(isVideoOn);
      
      // Notify other participants via socket
      const userId = localStorage.getItem("userId") || Date.now().toString();
      socket.emit("videoToggled", {
        sessionId: activeSessionId,
        userId,
        isVideoOff: !isVideoOn
      });
    }
  }, [isVideoOn, webrtcService, socket, activeSessionId]);

  // Monitor connection status based on participants
  useEffect(() => {
    if (participants.length > 1) {
      const remoteParticipants = participants.filter(p => 
        p.id.toString() !== localStorage.getItem("userId")
      );
      
      if (remoteParticipants.length > 0) {
        // Check if we have any remote streams for these participants
        const connectedParticipants = remoteParticipants.filter(p => 
          participantStreams[p.id]
        );
        
        if (connectedParticipants.length > 0) {
          setConnectionStatus('connected');
        } else {
          // Only show connecting if we haven't previously connected
          if (connectionStatus !== 'connected') {
            setConnectionStatus('connecting');
          }
        }
      }
    }
  }, [participants, participantStreams, connectionStatus]);

  // Force reconnection when participants change
  useEffect(() => {
    // Only trigger reconnection if we already have a service initialized
    if (webrtcService && webrtcService.isInitialized && participants.length > 1) {
      console.log("Participants changed, ensuring connections");
      
      // Check if we need to create new connections
      const currentConnections = webrtcService.getActivePeers();
      const remoteParticipants = participants
        .filter(p => p.id.toString() !== localStorage.getItem("userId"))
        .map(p => p.id.toString());
      
      // Find participants we're not connected to
      const missingConnections = remoteParticipants.filter(
        id => !currentConnections.includes(id)
      );
      
      if (missingConnections.length > 0) {
        console.log("Missing connections to:", missingConnections);
        
        // Signal ready again to request connections to these participants
        setTimeout(() => {
          webrtcService.signalReady();
        }, 1000);
      }
    }
  }, [participants, webrtcService]);

  // Handle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenShareStream) {
          screenShareStream.getTracks().forEach(track => track.stop());
          setScreenShareStream(null);
        }
        setIsScreenSharing(false);
        
        // Notify other participants
        socket.emit("screenSharingEnded", {
          sessionId: activeSessionId,
          userId: localStorage.getItem("userId") || Date.now().toString()
        });
        
        // Reinitialize webcam
        if (webrtcService) {
          await webrtcService.initLocalStream(isAudioOn, isVideoOn);
          if (localVideoRef.current && webrtcService.localStream) {
            localVideoRef.current.srcObject = webrtcService.localStream;
          }
        }
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setScreenShareStream(stream);
        setIsScreenSharing(true);
        
        // Replace tracks in all peer connections
        if (webrtcService) {
          // Replace local stream with screen share stream
          webrtcService.localStream = stream;
          
          // Update all peer connections
          Object.keys(webrtcService.peerConnections).forEach(peerId => {
            webrtcService.updatePeerConnection(peerId);
          });
          
          // Update local video
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
        
        // Notify other participants
        socket.emit("screenSharingStarted", {
          sessionId: activeSessionId,
          userId: localStorage.getItem("userId") || Date.now().toString()
        });
        
        // Handle the case when user stops sharing via the browser UI
        stream.getVideoTracks()[0].onended = async () => {
          setIsScreenSharing(false);
          setScreenShareStream(null);
          
          // Notify other participants
          socket.emit("screenSharingEnded", {
            sessionId: activeSessionId,
            userId: localStorage.getItem("userId") || Date.now().toString()
          });
          
          // Reinitialize webcam
          if (webrtcService) {
            await webrtcService.initLocalStream(isAudioOn, isVideoOn);
            if (localVideoRef.current && webrtcService.localStream) {
              localVideoRef.current.srcObject = webrtcService.localStream;
            }
          }
        };
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
      setIsScreenSharing(false);
    }
  };

  // Force reconnection to all participants
  const forceReconnect = () => {
    if (webrtcService) {
      setConnectionStatus('connecting');
      setReconnectAttempts(prev => prev + 1);
      
      // First reinitialize media
      webrtcService.initLocalStream(isAudioOn, isVideoOn)
        .then(() => {
          // Then reconnect to all peers
          webrtcService.reconnectAll();
        })
        .catch(err => {
          console.error("Failed to reconnect:", err);
          setConnectionStatus('error');
        });
    }
  };

  // Set active main participant
  const showParticipantAsMain = (participantId) => {
    setActiveMainParticipant(prevId => prevId === participantId ? null : participantId);
  };

  // Find the participant info for the main display
  const mainParticipant = activeMainParticipant 
    ? participants.find(p => p.id.toString() === activeMainParticipant.toString())
    : participants[0];

  // Get the stream for the main participant
  const mainParticipantId = mainParticipant?.id?.toString();
  const mainStream = mainParticipantId ? participantStreams[mainParticipantId] : null;
  
  // Debug output
  const debugInfo = {
    participants: participants.length,
    streams: Object.keys(participantStreams).length,
    connections: webrtcService ? webrtcService.getActivePeers().length : 0,
    status: connectionStatus
  };
  console.log("Call panel debug:", debugInfo);

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-[#0c1529]/90 to-[#0a101f]/90 backdrop-blur-md h-full">
      {/* Header with session info */}
      <div className="px-4 py-3 border-b border-indigo-900/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-cyan-400" />
          <h3 className="font-medium text-cyan-100">Live Session</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${connectionStatus === 'connected' ? 'text-green-300/70 bg-green-900/20 border-green-800/30' : connectionStatus === 'connecting' ? 'text-yellow-300/70 bg-yellow-900/20 border-yellow-800/30' : 'text-red-300/70 bg-red-900/20 border-red-800/30'} px-2 py-1 rounded-full border flex items-center`}>
            <span className={`h-2 w-2 rounded-full mr-1 ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></span>
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Connection Error'}
          </span>
          <span className="text-xs text-cyan-300/70 bg-cyan-900/20 px-2 py-1 rounded-full border border-cyan-800/30">
            {participants.length} participants
          </span>
          <button 
            onClick={forceReconnect}
            className="bg-cyan-900/30 hover:bg-cyan-800/40 text-cyan-300 p-1 rounded-full border border-cyan-800/30"
            title="Reconnect"
          >
            <RefreshCw size={14} className={`${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Main video display */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-indigo-900/40 bg-[#080d19] shadow-[inset_0_0_20px_rgba(56,189,248,0.1)]">
          {/* Main participant header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent z-10 p-3">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium text-white">
                {mainParticipant?.name || 'You'} 
                {mainParticipant?.isHost && <span className="text-cyan-400 text-xs ml-1">(Host)</span>}
                {isScreenSharing && mainParticipant?.id.toString() === localStorage.getItem("userId") && <span className="text-green-400 text-xs ml-1">(Screen Sharing)</span>}
              </span>
            </div>
          </div>

          {/* Connection quality indicator */}
          <div className="absolute bottom-3 right-3 z-10 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <div className="flex items-center space-x-px">
              <div className={`h-3 w-1 ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'} rounded-sm`}></div>
              <div className={`h-4 w-1 ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'} rounded-sm`}></div>
              <div className={`h-5 w-1 ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'} rounded-sm`}></div>
            </div>
            <span className={`text-xs ${connectionStatus === 'connected' ? 'text-green-300' : connectionStatus === 'connecting' ? 'text-yellow-300' : 'text-red-300'}`}>
              {connectionStatus === 'connected' ? 'Excellent' : connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnect'}
            </span>
          </div>

          {/* Main video */}
          <div className="absolute inset-0 bg-[#050a14]">
            {/* Check if we're showing our own stream */}
            {mainParticipant?.id.toString() === localStorage.getItem("userId") ? (
              <ParticipantVideo 
                participant={mainParticipant} 
                isMain={true} 
                videoRef={localVideoRef}
                stream={null} // We use videoRef for the local stream
              />
            ) : (
              <ParticipantVideo 
                participant={mainParticipant} 
                isMain={true} 
                videoRef={null}
                stream={mainStream}
              />
            )}
          </div>
        </div>
        
        {/* Participants grid */}
        <div className="h-28 flex gap-3 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-cyan-900/40 scrollbar-track-transparent">
          {participants.map(participant => {
            const isLocalUser = participant.id.toString() === localStorage.getItem("userId");
            return (
              <div 
                key={participant.id} 
                className={`h-full aspect-video flex-shrink-0 relative group cursor-pointer ${activeMainParticipant === participant.id ? 'ring-2 ring-cyan-400' : ''}`}
                onClick={() => showParticipantAsMain(participant.id)}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden border border-indigo-900/40 bg-[#080d19] shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                  {isLocalUser ? (
                    <ParticipantVideo 
                      participant={participant} 
                      isMain={false}
                      videoRef={localVideoRef}
                      stream={null} // For local user, we use videoRef directly
                    />
                  ) : (
                    <ParticipantVideo 
                      participant={participant} 
                      isMain={false}
                      videoRef={null}
                      stream={participantStreams[participant.id]}
                    />
                  )}
                </div>
                
                {/* Participant name tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white">{participant.name}</span>
                  {isLocalUser && " (You)"}
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
            );
          })}
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
          aria-label={isAudioOn ? "Mute microphone" : "Unmute microphone"}
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
          aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoOn ? 
            <Video size={22} className="text-cyan-300" /> : 
            <VideoOff size={22} className="text-white" />
          }
        </button>
        
        
        
        <button 
          onClick={forceReconnect}
          className={`p-3 rounded-full bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30 transition-all transform hover:scale-110 shadow-lg ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}
          aria-label="Reconnect to all participants"
          disabled={connectionStatus === 'connecting'}
        >
          <RefreshCw size={22} className={`text-cyan-300 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
        </button>
        
       
      </div>
      
      {/* Connection status message (only shown when there's an issue) */}
      {connectionStatus !== 'connected' && participants.length > 1 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg px-4 py-2 text-white text-sm backdrop-blur-md border border-yellow-500/30 shadow-lg">
          {connectionStatus === 'connecting' ? (
            <p className="flex items-center">
              <span className="animate-spin mr-2"><RefreshCw size={14} /></span>
              Establishing connection with other participants...
            </p>
          ) : (
            <p className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              Connection issue detected. Try pressing the reconnect button.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CallPanel;