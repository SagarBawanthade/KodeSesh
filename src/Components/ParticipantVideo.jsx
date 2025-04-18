import { useEffect, useState, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

const ParticipantVideo = ({ participant, isMain = false, videoRef = null, stream = null }) => {
  const internalVideoRef = useRef(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [attemptedPlay, setAttemptedPlay] = useState(false);
  
  // If participant is not defined, show a placeholder
  if (!participant) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-gray-700 ${isMain ? 'h-full w-full' : 'h-full w-full'} bg-gray-900 flex items-center justify-center`}>
        <span className="text-gray-400 text-sm">No participant</span>
      </div>
    );
  }
  
  const { id, name, isHost, isMuted, isVideoOff } = participant;
  const isLocalUser = id.toString() === localStorage.getItem("userId");
  
  // Debug props
  useEffect(() => {
    console.log(`ParticipantVideo rendered for ${id} (${isLocalUser ? 'local' : 'remote'})`);
    console.log(`Props: isMain=${isMain}, hasVideoRef=${!!videoRef}, hasStream=${!!stream}`);
    if (stream) {
      console.log(`Stream tracks: video=${stream.getVideoTracks().length}, audio=${stream.getAudioTracks().length}`);
    }
    if (isLocalUser && videoRef?.current?.srcObject) {
      const localStream = videoRef.current.srcObject;
      console.log(`Local stream: video=${localStream.getVideoTracks().length}, audio=${localStream.getAudioTracks().length}`);
    }
  }, [id, isLocalUser, isMain, videoRef, stream]);
  
  // Force the video to play when it becomes available
  useEffect(() => {
    const playVideo = async () => {
      // Don't attempt to play if we've already tried
      if (attemptedPlay) return;
      
      const videoElement = isLocalUser ? videoRef?.current : internalVideoRef.current;
      if (!videoElement || !videoElement.srcObject) return;
      
      try {
        await videoElement.play();
        console.log(`Successfully played video for ${id}`);
        setAttemptedPlay(true);
      } catch (err) {
        console.warn(`Could not autoplay video for ${id}:`, err);
      }
    };
    
    playVideo();
  }, [id, isLocalUser, videoRef, attemptedPlay]);
  
  // Handle when stream changes or video ref becomes available
  useEffect(() => {
    // First, let's check if we actually have a video element to work with
    const videoElement = isLocalUser && videoRef ? 
      videoRef.current : 
      internalVideoRef.current;
    
    if (!videoElement) {
      console.log(`No video element for participant ${id}`);
      return;
    }
    
    // Handle remote participant with stream
    if (!isLocalUser && stream) {
      console.log(`Setting external stream for remote participant ${id}`, stream);
      
      try {
        // Only set srcObject if it's different to avoid reload loops
        if (videoElement.srcObject !== stream) {
          videoElement.srcObject = stream;
          
          // Reset the play attempt flag to try again with the new stream
          setAttemptedPlay(false);
          
          // Manually check stream for tracks
          const videoTracks = stream.getVideoTracks();
          const hasVideo = videoTracks.length > 0;
          setHasVideoTrack(hasVideo);
          
          const audioTracks = stream.getAudioTracks();
          const hasAudio = audioTracks.length > 0;
          setHasAudioTrack(hasAudio);
          
          console.log(`Remote stream for ${id}: video=${hasVideo}, audio=${hasAudio}`);
          
          // Track enabled state changes
          const trackStateChanged = () => {
            const videoEnabled = videoTracks.length > 0 && videoTracks[0].enabled;
            const audioEnabled = audioTracks.length > 0 && audioTracks[0].enabled;
            setHasVideoTrack(videoEnabled);
            setHasAudioTrack(audioEnabled);
            console.log(`Track state changed for ${id}: video=${videoEnabled}, audio=${audioEnabled}`);
          };
          
          // Listen for track events
          videoTracks.forEach(track => {
            track.addEventListener('ended', trackStateChanged);
            track.addEventListener('mute', trackStateChanged);
            track.addEventListener('unmute', trackStateChanged);
          });
          
          audioTracks.forEach(track => {
            track.addEventListener('ended', trackStateChanged);
            track.addEventListener('mute', trackStateChanged);
            track.addEventListener('unmute', trackStateChanged);
          });
          
          return () => {
            // Clean up event listeners
            videoTracks.forEach(track => {
              track.removeEventListener('ended', trackStateChanged);
              track.removeEventListener('mute', trackStateChanged);
              track.removeEventListener('unmute', trackStateChanged);
            });
            
            audioTracks.forEach(track => {
              track.removeEventListener('ended', trackStateChanged);
              track.removeEventListener('mute', trackStateChanged);
              track.removeEventListener('unmute', trackStateChanged);
            });
          };
        }
      } catch (error) {
        console.error(`Error setting stream for participant ${id}:`, error);
      }
    } 
    // Handle local user's stream through videoRef
    else if (isLocalUser && videoRef && videoRef.current && videoRef.current.srcObject) {
      console.log(`Checking local stream from videoRef for participant ${id}`);
      
      const localStream = videoRef.current.srcObject;
      
      // Update track state for local user
      const videoTracks = localStream.getVideoTracks();
      const hasVideo = videoTracks.length > 0 && videoTracks[0].enabled;
      setHasVideoTrack(hasVideo);
      
      const audioTracks = localStream.getAudioTracks();
      const hasAudio = audioTracks.length > 0 && audioTracks[0].enabled;
      setHasAudioTrack(hasAudio);
      
      console.log(`Local stream for ${id}: video=${hasVideo}, audio=${hasAudio}`);
      
      // Track state listener for local stream
      const trackStateChanged = () => {
        const videoEnabled = videoTracks.length > 0 && videoTracks[0].enabled;
        const audioEnabled = audioTracks.length > 0 && audioTracks[0].enabled;
        setHasVideoTrack(videoEnabled);
        setHasAudioTrack(audioEnabled);
        console.log(`Local track state changed: video=${videoEnabled}, audio=${audioEnabled}`);
      };
      
      // Set up listeners
      videoTracks.forEach(track => {
        track.addEventListener('ended', trackStateChanged);
        track.addEventListener('mute', trackStateChanged);
        track.addEventListener('unmute', trackStateChanged);
      });
      
      audioTracks.forEach(track => {
        track.addEventListener('ended', trackStateChanged);
        track.addEventListener('mute', trackStateChanged);
        track.addEventListener('unmute', trackStateChanged);
      });
      
      return () => {
        // Clean up event listeners
        videoTracks.forEach(track => {
          track.removeEventListener('ended', trackStateChanged);
          track.removeEventListener('mute', trackStateChanged);
          track.removeEventListener('unmute', trackStateChanged);
        });
        
        audioTracks.forEach(track => {
          track.removeEventListener('ended', trackStateChanged);
          track.removeEventListener('mute', trackStateChanged);
          track.removeEventListener('unmute', trackStateChanged);
        });
      };
    }
  }, [stream, id, isMain, isLocalUser, videoRef]);

  // Handle video loaded event
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    console.log(`Video loaded for participant ${id}`);
  };

  // Check if we should show video - this is the key function
  const shouldShowVideo = () => {
    // For local user
    if (isLocalUser) {
      // Must have video ref and source object
      if (!videoRef || !videoRef.current || !videoRef.current.srcObject) {
        console.log(`Local user ${id} missing video source`);
        return false;
      }
      
      // Check for video tracks that are enabled
      const localStream = videoRef.current.srcObject;
      const videoTracks = localStream.getVideoTracks();
      const hasVideoEnabled = videoTracks.length > 0 && videoTracks[0].enabled;
      
      console.log(`Local user ${id} video check: hasTrack=${videoTracks.length > 0}, enabled=${videoTracks.length > 0 ? videoTracks[0].enabled : false}, off=${isVideoOff}`);
      
      // Only show if track exists, is enabled, and user hasn't turned it off
      return hasVideoEnabled && !isVideoOff;
    }
    
    // For remote users
    if (!stream) {
      console.log(`Remote user ${id} has no stream`);
      return false;
    }
    
    // Check for video tracks that are enabled
    const videoTracks = stream.getVideoTracks();
    const hasVideoEnabled = videoTracks.length > 0 && videoTracks[0].enabled;
    
    console.log(`Remote user ${id} video check: hasTrack=${videoTracks.length > 0}, enabled=${videoTracks.length > 0 ? videoTracks[0].enabled : false}, off=${isVideoOff}`);
    
    // Only show if track exists, is enabled, and user hasn't turned it off
    return hasVideoEnabled && !isVideoOff;
  };

  // Determine if video should be shown
  const showVideo = shouldShowVideo();

  return (
    <div className={`relative rounded-lg overflow-hidden ${isMain ? 'h-full w-full' : 'h-full w-full'} bg-gray-900 flex items-center justify-center`}>
      {showVideo ? (
        <video 
          ref={isLocalUser ? videoRef : internalVideoRef} 
          autoPlay 
          playsInline
          muted={isLocalUser || isMuted} // Mute for local user or if participant is muted
          className={`h-full w-full object-cover ${videoLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoadedMetadata={handleVideoLoad}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className={`${isMain ? 'h-20 w-20' : 'h-12 w-12'} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-lg`}>
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {isMain && (
            <span className="text-gray-300 text-sm mt-2">
              {isVideoOff ? 'Camera is off' : 'Video unavailable'}
            </span>
          )}
        </div>
      )}
      
      {/* Status overlay - only show on main view */}
      {isMain && (
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center">
          <div className="text-sm text-white font-medium">
            {name}{isLocalUser ? ' (You)' : ''}
            {isHost && <span className="ml-2 px-2 py-0.5 bg-blue-500/60 rounded-full text-xs">Host</span>}
          </div>
          <div className="flex items-center space-x-2">
            {(!hasAudioTrack || isMuted) && (
              <div className="bg-red-500/80 rounded-full p-1.5">
                <MicOff size={14} className="text-white" />
              </div>
            )}
            {(!hasVideoTrack || isVideoOff) && (
              <div className="bg-red-500/80 rounded-full p-1.5 ml-1">
                <VideoOff size={14} className="text-white" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mini status indicators for thumbnail view */}
      {!isMain && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 flex justify-between items-center">
          <span className="text-xs text-white truncate">{name}{isLocalUser ? ' (You)' : ''}</span>
          <div className="flex space-x-1">
            {(!hasAudioTrack || isMuted) && <MicOff size={10} className="text-red-400" />}
            {(!hasVideoTrack || isVideoOff) && <VideoOff size={10} className="text-red-400" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantVideo;