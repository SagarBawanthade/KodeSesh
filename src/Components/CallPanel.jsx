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
  const [localStream, setLocalStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [activeMainParticipant, setActiveMainParticipant] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [mediaError, setMediaError] = useState(null);

  // Initialize WebRTC service
  useEffect(() => {
    if (!socket || !activeSessionId) return;
    
    const userId = localStorage.getItem("userId") || Date.now().toString();
    console.log("Initializing WebRTC service for user:", userId, "session:", activeSessionId);
    
    const rtcService = new WebRTCService(socket, userId, activeSessionId);
    
    // Set up callback for remote stream updates
    rtcService.onRemoteStreamUpdate = (participantId, stream) => {
      console.log(`Received stream from participant ${participantId}`, stream);
      
      if (stream && stream.active) {
        setParticipantStreams(prev => ({
          ...prev,
          [participantId]: stream
        }));
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
      
      if (activeMainParticipant === participantId) {
        setActiveMainParticipant(null);
      }
    };
    
    setWebrtcService(rtcService);
    
    return () => {
      if (rtcService) {
        console.log("Cleaning up WebRTC service");
        rtcService.cleanup();
      }
    };
  }, [socket, activeSessionId]);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      if (!webrtcService) return;
      
      try {
        console.log("Initializing local media streams");
        setConnectionStatus('connecting');
        setMediaError(null);
        
        // Get user media with proper constraints
        const constraints = {
          audio: isAudioOn ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } : false,
          video: isVideoOn ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
          } : false
        };
        
        console.log("Requesting media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set local stream
        setLocalStream(stream);
        
        // Initialize WebRTC with the stream
        await webrtcService.initLocalStream(isAudioOn, isVideoOn);
        
        // Set up local video immediately
        if (localVideoRef.current && stream) {
          console.log("Setting up local video element");
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Always mute local video to prevent feedback
          
          // Try to play the video
          try {
            await localVideoRef.current.play();
            console.log("Local video playing successfully");
          } catch (playError) {
            console.warn("Autoplay failed, user interaction required:", playError);
            // Add click handler to start video on user interaction
            const playOnClick = async () => {
              try {
                await localVideoRef.current.play();
                console.log("Local video started after user interaction");
                document.removeEventListener('click', playOnClick);
              } catch (err) {
                console.error("Failed to play video even after user interaction:", err);
              }
            };
            document.addEventListener('click', playOnClick);
          }
        }
        
        // Store our own stream in participant streams
        const userId = localStorage.getItem("userId") || Date.now().toString();
        setParticipantStreams(prev => ({
          ...prev,
          [userId]: stream
        }));
        
        // Signal readiness to other participants
        console.log("Local media initialized, signaling ready to server");
        webrtcService.signalReady();
        
        setConnectionStatus('connected');
        
      } catch (err) {
        console.error("Error initializing media:", err);
        setMediaError(err.message);
        setConnectionStatus('error');
        
        // Show user-friendly error message
        if (err.name === 'NotAllowedError') {
          alert('Camera and microphone access denied. Please allow access and refresh the page.');
        } else if (err.name === 'NotFoundError') {
          alert('No camera or microphone found. Please connect your devices and refresh.');
        } else {
          alert(`Media error: ${err.message}. Please check your camera/microphone and refresh.`);
        }
      }
    };
    
    if (webrtcService) {
      initializeMedia();
    }
  }, [webrtcService]);

  // Handle audio/video toggle changes
  useEffect(() => {
    if (!localStream) return;
    
    // Update audio tracks
    localStream.getAudioTracks().forEach(track => {
      track.enabled = isAudioOn;
      console.log(`Audio track enabled: ${track.enabled}`);
    });
    
    // Update video tracks
    localStream.getVideoTracks().forEach(track => {
      track.enabled = isVideoOn;
      console.log(`Video track enabled: ${track.enabled}`);
    });
    
    // Update WebRTC service
    if (webrtcService) {
      webrtcService.toggleAudio(isAudioOn);
      webrtcService.toggleVideo(isVideoOn);
    }
    
    // Notify other participants
    if (socket && socket.connected) {
      const userId = localStorage.getItem("userId") || Date.now().toString();
      socket.emit("audioToggled", {
        sessionId: activeSessionId,
        userId,
        isMuted: !isAudioOn
      });
      socket.emit("videoToggled", {
        sessionId: activeSessionId,
        userId,
        isVideoOff: !isVideoOn
      });
    }
  }, [isAudioOn, isVideoOn, localStream, webrtcService, socket, activeSessionId]);

  // Monitor connection status
  useEffect(() => {
    if (participants.length > 1) {
      const remoteParticipants = participants.filter(p => 
        p.id.toString() !== localStorage.getItem("userId")
      );
      
      if (remoteParticipants.length > 0) {
        const connectedParticipants = remoteParticipants.filter(p => 
          participantStreams[p.id]
        );
        
        if (connectedParticipants.length > 0) {
          setConnectionStatus('connected');
        } else if (connectionStatus !== 'connected') {
          setConnectionStatus('connecting');
        }
      }
    }
  }, [participants, participantStreams, connectionStatus]);

  // Force reconnection
  const forceReconnect = async () => {
    if (!webrtcService) return;
    
    setConnectionStatus('connecting');
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // Stop existing streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Reinitialize media
      const constraints = {
        audio: isAudioOn ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: isVideoOn ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(newStream);
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play();
      }
      
      // Reinitialize WebRTC
      await webrtcService.initLocalStream(isAudioOn, isVideoOn);
      webrtcService.reconnectAll();
      
      setConnectionStatus('connected');
    } catch (err) {
      console.error("Failed to reconnect:", err);
      setConnectionStatus('error');
      setMediaError(err.message);
    }
  };

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
        
        // Reinitialize webcam
        const constraints = {
          audio: isAudioOn,
          video: isVideoOn ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: 'user'
          } : false
        };
        
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(newStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
        }
        
        if (webrtcService) {
          await webrtcService.initLocalStream(isAudioOn, isVideoOn);
        }
        
        socket.emit("screenSharingEnded", {
          sessionId: activeSessionId,
          userId: localStorage.getItem("userId")
        });
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
          audio: true
        });
        
        setScreenShareStream(stream);
        setIsScreenSharing(true);
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
        }
        
        // Update WebRTC
        if (webrtcService) {
          webrtcService.localStream = stream;
          Object.keys(webrtcService.peerConnections).forEach(peerId => {
            webrtcService.updatePeerConnection(peerId);
          });
        }
        
        socket.emit("screenSharingStarted", {
          sessionId: activeSessionId,
          userId: localStorage.getItem("userId")
        });
        
        // Handle screen share end
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenSharing(); // This will stop screen sharing
        };
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
      setIsScreenSharing(false);
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
  const userId = localStorage.getItem("userId");
  const isMainParticipantLocal = mainParticipant?.id?.toString() === userId;
  const mainStream = isMainParticipantLocal ? localStream : participantStreams[mainParticipant?.id];

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-[#0c1529]/90 to-[#0a101f]/90 backdrop-blur-md h-full">
      {/* Header with session info */}
      <div className="px-4 py-3 border-b border-indigo-900/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-cyan-400" />
          <h3 className="font-medium text-cyan-100">Live Session</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${
            connectionStatus === 'connected' ? 'text-green-300/70 bg-green-900/20 border-green-800/30' : 
            connectionStatus === 'connecting' ? 'text-yellow-300/70 bg-yellow-900/20 border-yellow-800/30' : 
            'text-red-300/70 bg-red-900/20 border-red-800/30'
          } px-2 py-1 rounded-full border flex items-center`}>
            <span className={`h-2 w-2 rounded-full mr-1 ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
              'bg-red-400'
            }`}></span>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             'Connection Error'}
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
              <div className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium text-white">
                {mainParticipant?.name || 'You'} 
                {mainParticipant?.isHost && <span className="text-cyan-400 text-xs ml-1">(Host)</span>}
                {isScreenSharing && isMainParticipantLocal && <span className="text-green-400 text-xs ml-1">(Screen Sharing)</span>}
              </span>
            </div>
          </div>

          {/* Main video */}
          <div className="absolute inset-0 bg-[#050a14]">
            {isMainParticipantLocal ? (
              <video 
                ref={localVideoRef}
                autoPlay 
                playsInline
                muted={true}
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror local video
              />
            ) : (
              <ParticipantVideo 
                participant={mainParticipant} 
                isMain={true} 
                stream={mainStream}
              />
            )}
            
            {/* No video fallback */}
            {!mainStream && (
              <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-lg">
                  {mainParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-gray-300 text-sm mt-2">
                  {mediaError ? `Error: ${mediaError}` : 'Video unavailable'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Participants grid */}
        <div className="h-28 flex gap-3 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-cyan-900/40 scrollbar-track-transparent">
          {participants.map(participant => {
            const isLocalUser = participant.id.toString() === userId;
            const participantStream = isLocalUser ? localStream : participantStreams[participant.id];
            
            return (
              <div 
                key={participant.id} 
                className={`h-full aspect-video flex-shrink-0 relative group cursor-pointer ${
                  activeMainParticipant === participant.id ? 'ring-2 ring-cyan-400' : ''
                }`}
                onClick={() => showParticipantAsMain(participant.id)}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden border border-indigo-900/40 bg-[#080d19] shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                  {isLocalUser ? (
                    <video 
                      ref={isLocalUser ? localVideoRef : null}
                      autoPlay 
                      playsInline
                      muted={true}
                      className="h-full w-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <ParticipantVideo 
                      participant={participant} 
                      isMain={false}
                      stream={participantStream}
                    />
                  )}
                  
                  {/* No video fallback for thumbnails */}
                  {!participantStream && (
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                        {participant.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Participant name tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white">
                    {participant.name}{isLocalUser && " (You)"}
                  </span>
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
          onClick={toggleScreenSharing}
          className={`p-3 rounded-full ${isScreenSharing 
            ? 'bg-green-500/80 hover:bg-green-600/80 border border-green-400/30' 
            : 'bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30'} 
            transition-all transform hover:scale-110 shadow-lg`}
          aria-label={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
        >
          <Share size={22} className={isScreenSharing ? "text-white" : "text-cyan-300"} />
        </button>
        
        <button 
          onClick={forceReconnect}
          className={`p-3 rounded-full bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/30 transition-all transform hover:scale-110 shadow-lg ${
            connectionStatus === 'connecting' ? 'animate-pulse' : ''
          }`}
          aria-label="Reconnect to all participants"
          disabled={connectionStatus === 'connecting'}
        >
          <RefreshCw size={22} className={`text-cyan-300 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Connection status message */}
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
              {mediaError && <span className="ml-2 text-yellow-300">({mediaError})</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CallPanel;