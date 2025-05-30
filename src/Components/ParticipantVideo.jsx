import { useEffect, useState, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

const ParticipantVideo = ({ 
  participant, 
  isMain = false, 
  stream = null 
}) => {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // If participant is not defined, show a placeholder
  if (!participant) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-gray-700 ${
        isMain ? 'h-full w-full' : 'h-full w-full'
      } bg-gray-900 flex items-center justify-center`}>
        <span className="text-gray-400 text-sm">No participant</span>
      </div>
    );
  }
  
  const { id, name, isHost, isMuted, isVideoOff } = participant;
  const userId = localStorage.getItem("userId");
  const isLocalUser = id?.toString() === userId?.toString();
  
  // Set up video stream when stream changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !stream) {
      setIsVideoPlaying(false);
      return;
    }
    
    console.log(`Setting up video for participant ${id} (${isLocalUser ? 'local' : 'remote'})`);
    
    const setupVideo = async () => {
      try {
        setVideoError(null);
        
        // Only set srcObject if it's different
        if (videoElement.srcObject !== stream) {
          videoElement.srcObject = stream;
          
          // Set video properties
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.muted = isLocalUser; // Only mute local video to prevent feedback
          
          // Mirror local video
          if (isLocalUser) {
            videoElement.style.transform = 'scaleX(-1)';
          } else {
            videoElement.style.transform = 'none';
          }
          
          // Wait for metadata to load
          await new Promise((resolve, reject) => {
            const handleLoadedMetadata = () => {
              videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
              videoElement.removeEventListener('error', handleError);
              resolve();
            };
            
            const handleError = (e) => {
              videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
              videoElement.removeEventListener('error', handleError);
              reject(new Error(`Video load error: ${e.target.error?.message || 'Unknown error'}`));
            };
            
            if (videoElement.readyState >= 1) {
              resolve(); // Already loaded
            } else {
              videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
              videoElement.addEventListener('error', handleError);
            }
          });
          
          // Try to play the video
          try {
            await videoElement.play();
            setIsVideoPlaying(true);
            console.log(`Video playing for participant ${id}`);
          } catch (playError) {
            console.warn(`Autoplay failed for participant ${id}:`, playError);
            
            // If autoplay fails, try to play on user interaction
            if (playError.name === 'NotAllowedError') {
              const playOnInteraction = async () => {
                try {
                  await videoElement.play();
                  setIsVideoPlaying(true);
                  console.log(`Video started playing after user interaction for ${id}`);
                  document.removeEventListener('click', playOnInteraction);
                  document.removeEventListener('touchstart', playOnInteraction);
                } catch (err) {
                  console.error(`Failed to play video for ${id} even after interaction:`, err);
                }
              };
              
              document.addEventListener('click', playOnInteraction);
              document.addEventListener('touchstart', playOnInteraction);
            }
          }
        }
      } catch (error) {
        console.error(`Error setting up video for participant ${id}:`, error);
        setVideoError(error.message);
        setIsVideoPlaying(false);
      }
    };
    
    setupVideo();
    
    // Cleanup function
    return () => {
      if (videoElement && videoElement.srcObject === stream) {
        videoElement.pause();
        setIsVideoPlaying(false);
      }
    };
  }, [stream, id, isLocalUser]);
  
  // Check if we should show video
  const shouldShowVideo = () => {
    if (!stream) return false;
    
    // Check if stream has active video tracks
    const videoTracks = stream.getVideoTracks();
    const hasActiveVideoTrack = videoTracks.length > 0 && 
                                videoTracks.some(track => track.enabled && track.readyState === 'live');
    
    // Show video if we have active tracks and user hasn't turned video off
    return hasActiveVideoTrack && !isVideoOff && isVideoPlaying;
  };
  
  const showVideo = shouldShowVideo();
  
  return (
    <div className={`relative rounded-lg overflow-hidden ${
      isMain ? 'h-full w-full' : 'h-full w-full'
    } bg-gray-900 flex items-center justify-center`}>
      
      {/* Video element - always render but conditionally show */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline
        muted={isLocalUser}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          showVideo ? 'opacity-100' : 'opacity-0 absolute'
        }`}
        onLoadedMetadata={() => {
          console.log(`Video metadata loaded for ${id}`);
        }}
        onError={(e) => {
          console.error(`Video error for ${id}:`, e);
          setVideoError(e.target.error?.message || 'Video playback error');
          setIsVideoPlaying(false);
        }}
        onPlay={() => {
          setIsVideoPlaying(true);
          console.log(`Video started playing for ${id}`);
        }}
        onPause={() => {
          setIsVideoPlaying(false);
        }}
      />
      
      {/* Fallback when video is not showing */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className={`${
            isMain ? 'h-20 w-20' : 'h-12 w-12'
          } rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg`}>
            <span className={isMain ? 'text-2xl' : 'text-lg'}>
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          {isMain && (
            <div className="text-center mt-3">
              <span className="text-gray-300 text-sm block">
                {videoError ? `Error: ${videoError}` :
                 isVideoOff ? 'Camera is off' : 
                 !stream ? 'Connecting...' :
                 'Video loading...'}
              </span>
              {videoError && (
                <button 
                  onClick={() => {
                    setVideoError(null);
                    if (videoRef.current && stream) {
                      videoRef.current.load();
                    }
                  }}
                  className="text-cyan-400 text-xs mt-1 hover:text-cyan-300"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Status overlays */}
      {isMain && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex justify-between items-start">
            <div className="text-sm text-white font-medium">
              <span>{name}{isLocalUser ? ' (You)' : ''}</span>
              {isHost && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500/60 rounded-full text-xs">
                  Host
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isMuted && (
                <div className="bg-red-500/80 rounded-full p-1.5">
                  <MicOff size={14} className="text-white" />
                </div>
              )}
              {isVideoOff && (
                <div className="bg-red-500/80 rounded-full p-1.5">
                  <VideoOff size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Mini status indicators for thumbnail view */}
      {!isMain && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 flex justify-between items-center">
          <span className="text-xs text-white truncate flex-1">
            {name}{isLocalUser ? ' (You)' : ''}
          </span>
          <div className="flex space-x-1 ml-1">
            {isMuted && <MicOff size={10} className="text-red-400" />}
            {isVideoOff && <VideoOff size={10} className="text-red-400" />}
          </div>
        </div>
      )}
      
      {/* Connection indicator */}
      <div className="absolute top-2 left-2">
        <div className={`h-2 w-2 rounded-full ${
          isVideoPlaying ? 'bg-green-400' : 
          stream ? 'bg-yellow-400' : 
          'bg-red-400'
        }`}></div>
      </div>
    </div>
  );
};

export default ParticipantVideo;