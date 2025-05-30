// WebRTCService.js
class WebRTCService {
  constructor(socket, userId, sessionId) {
    this.socket = socket;
    this.userId = userId;
    this.sessionId = sessionId;
    this.peerConnections = {}; // Store peer connections by user ID
    this.localStream = null;    // Local media stream
    this.onRemoteStreamUpdate = null; // Callback for remote stream updates
    this.onParticipantDisconnect = null; // Callback for disconnections
    this.isInitialized = false; // Track if local media is initialized
    this.connectionRetries = {}; // Track connection retry attempts
    this.pendingIceCandidates = {}; // Store ICE candidates until peer connection is ready
    this.pendingOffers = {}; // Store offers until they can be processed
    this.pendingAnswers = {}; // Store answers until they can be processed
    this.connectionState = {}; // Track connection state for each peer
    
    // ICE servers configuration - improved STUN/TURN servers
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10
    };
    
    // Setup socket listeners
    this.setupSocketListeners();
    
    console.log(`WebRTC Service initialized for user ${userId} in session ${sessionId}`);
  }
  
  setupSocketListeners() {
    if (!this.socket) {
      console.error("Socket not available for WebRTC service");
      return;
    }

    // Listen for new participants joining
    this.socket.on("rtcNewParticipant", ({ participantId }) => {
      console.log(`New participant joined: ${participantId}`);
      if (participantId !== this.userId) {
        this.createPeerConnection(participantId);
        
        // Only the participant with the higher ID initiates the offer
        if (this.userId.toString() > participantId.toString()) {
          console.log(`I have higher ID, initiating offer to ${participantId}`);
          setTimeout(() => {
            this.sendOffer(participantId);
          }, 1000);
        } else {
          console.log(`I have lower ID, waiting for offer from ${participantId}`);
        }
      }
    });
    
    // Handle incoming offers
    this.socket.on("rtcOffer", async ({ senderId, sdp }) => {
      console.log(`Received offer from: ${senderId}`);
      if (senderId !== this.userId) {
        try {
          if (!this.peerConnections[senderId] || !this.isInitialized) {
            console.log(`Storing offer from ${senderId} for later processing`);
            this.pendingOffers[senderId] = sdp;
            
            if (!this.peerConnections[senderId]) {
              this.createPeerConnection(senderId);
            }
            return;
          }
          
          await this.handleOffer(senderId, sdp);
        } catch (error) {
          console.error(`Error handling offer from ${senderId}:`, error);
          this.cleanupPeerConnection(senderId);
          setTimeout(() => {
            this.createPeerConnection(senderId);
          }, 2000);
        }
      }
    });
    
    // Handle incoming answers
    this.socket.on("rtcAnswer", ({ senderId, sdp }) => {
      console.log(`Received answer from: ${senderId}`);
      if (senderId !== this.userId) {
        if (!this.peerConnections[senderId] || this.connectionState[senderId] !== 'offer-sent') {
          console.log(`Storing answer from ${senderId} for later processing`);
          this.pendingAnswers[senderId] = sdp;
          return;
        }
        
        this.handleAnswer(senderId, sdp);
      }
    });
    
    // Handle ICE candidates
    this.socket.on("rtcIceCandidate", ({ senderId, candidate }) => {
      console.log(`Received ICE candidate from: ${senderId}`);
      if (senderId !== this.userId) {
        if (!this.pendingIceCandidates[senderId]) {
          this.pendingIceCandidates[senderId] = [];
        }
        this.pendingIceCandidates[senderId].push(candidate);
        
        if (this.peerConnections[senderId] && 
            this.peerConnections[senderId].remoteDescription) {
          this.applyIceCandidate(senderId, candidate);
        }
      }
    });
    
    // Handle participant disconnection
    this.socket.on("participantLeft", (participantId) => {
      console.log(`Participant ${participantId} left, cleaning up connection`);
      this.cleanupPeerConnection(participantId);
      if (this.onParticipantDisconnect) {
        this.onParticipantDisconnect(participantId);
      }
    });
    
    // Handle connection requests
    this.socket.on("rtcRequestConnection", ({ requesterId }) => {
      console.log(`Connection requested from: ${requesterId}`);
      if (requesterId !== this.userId) {
        if (!this.peerConnections[requesterId]) {
          this.createPeerConnection(requesterId);
        }
        
        if (this.userId.toString() > requesterId.toString()) {
          this.sendOffer(requesterId);
        }
      }
    });
  }
  
  async initLocalStream(audioEnabled = true, videoEnabled = true) {
    try {
      console.log(`Initializing local media stream. Audio: ${audioEnabled}, Video: ${videoEnabled}`);
      
      // Stop any existing tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
      
      // Enhanced constraints for better quality and compatibility
      const constraints = {
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        } : false,
        video: videoEnabled ? {
          width: { ideal: 1280, max: 1920, min: 320 },
          height: { ideal: 720, max: 1080, min: 240 },
          frameRate: { ideal: 30, max: 60, min: 15 },
          facingMode: 'user',
          aspectRatio: { ideal: 16/9 }
        } : false
      };
      
      console.log("Requesting media with constraints:", constraints);
      
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn("Failed with ideal constraints, trying fallback:", error);
        
        // Fallback with basic constraints
        const fallbackConstraints = {
          audio: audioEnabled,
          video: videoEnabled ? { 
            width: 640, 
            height: 480,
            frameRate: 15 
          } : false
        };
        
        this.localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }
      
      console.log("Local media stream obtained successfully", this.localStream);
      
      // Log track details
      this.localStream.getTracks().forEach(track => {
        console.log(`Local track: kind=${track.kind}, enabled=${track.enabled}, state=${track.readyState}, label=${track.label}`);
        
        // Ensure tracks are enabled
        track.enabled = track.kind === 'audio' ? audioEnabled : videoEnabled;
        
        // Add event listeners for track state changes
        track.addEventListener('ended', () => {
          console.log(`${track.kind} track ended`);
        });
        
        track.addEventListener('mute', () => {
          console.log(`${track.kind} track muted`);
        });
        
        track.addEventListener('unmute', () => {
          console.log(`${track.kind} track unmuted`);
        });
      });
      
      this.isInitialized = true;
      
      // Process any pending offers
      for (const peerId in this.pendingOffers) {
        console.log(`Processing pending offer from ${peerId}`);
        try {
          await this.handleOffer(peerId, this.pendingOffers[peerId]);
        } catch (err) {
          console.error(`Error handling pending offer from ${peerId}:`, err);
        }
        delete this.pendingOffers[peerId];
      }
      
      // Process any pending answers
      for (const peerId in this.pendingAnswers) {
        console.log(`Processing pending answer from ${peerId}`);
        try {
          await this.handleAnswer(peerId, this.pendingAnswers[peerId]);
        } catch (err) {
          console.error(`Error handling pending answer from ${peerId}:`, err);
        }
        delete this.pendingAnswers[peerId];
      }
      
      // Update all peer connections with the new stream
      Object.keys(this.peerConnections).forEach(peerId => {
        this.updatePeerConnection(peerId);
      });
      
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      
      // Provide user-friendly error messages
      let errorMessage = "Error accessing camera/microphone: ";
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage += "Permission denied. Please allow camera and microphone access.";
          break;
        case 'NotFoundError':
          errorMessage += "No camera or microphone found. Please connect your devices.";
          break;
        case 'NotReadableError':
          errorMessage += "Camera or microphone is already in use by another application.";
          break;
        case 'OverconstrainedError':
          errorMessage += "Camera/microphone doesn't support the requested settings.";
          break;
        default:
          errorMessage += error.message;
      }
      
      // Try audio-only fallback if video fails
      if (videoEnabled && error.name !== 'NotAllowedError') {
        console.log("Trying audio-only fallback");
        try {
          return await this.initLocalStream(audioEnabled, false);
        } catch (audioError) {
          console.error("Audio-only fallback also failed:", audioError);
        }
      }
      
      throw new Error(errorMessage);
    }
  }
  
  updatePeerConnection(peerId) {
    const pc = this.peerConnections[peerId];
    if (!pc) {
      console.warn(`No peer connection found for ${peerId}`);
      return;
    }
    
    try {
      console.log(`Updating peer connection for ${peerId}`);
      
      // Get current senders
      const senders = pc.getSenders();
      
      if (this.localStream) {
        const streamTracks = this.localStream.getTracks();
        
        // Update existing senders or add new tracks
        streamTracks.forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          
          if (sender) {
            console.log(`Replacing ${track.kind} track for peer ${peerId}`);
            sender.replaceTrack(track).catch(err => {
              console.error(`Error replacing ${track.kind} track:`, err);
              // If replace fails, remove and add
              pc.removeTrack(sender);
              pc.addTrack(track, this.localStream);
            });
          } else {
            console.log(`Adding ${track.kind} track to peer ${peerId}`);
            pc.addTrack(track, this.localStream);
          }
        });
        
        // Remove senders for tracks that no longer exist
        senders.forEach(sender => {
          if (sender.track && !streamTracks.find(t => t.kind === sender.track.kind)) {
            console.log(`Removing ${sender.track.kind} sender for peer ${peerId}`);
            pc.removeTrack(sender);
          }
        });
      } else {
        console.warn("No local stream available when updating peer connection");
        // Remove all tracks if no stream
        senders.forEach(sender => {
          if (sender.track) {
            pc.removeTrack(sender);
          }
        });
      }
    } catch (error) {
      console.error(`Error updating peer connection for ${peerId}:`, error);
      
      // Try to recreate the connection
      this.cleanupPeerConnection(peerId);
      setTimeout(() => {
        this.createPeerConnection(peerId);
      }, 1000);
    }
  }
  
  createPeerConnection(participantId) {
    if (this.peerConnections[participantId]) {
      console.log(`Peer connection already exists for ${participantId}, cleaning up first`);
      this.cleanupPeerConnection(participantId);
    }
    
    console.log(`Creating new peer connection for ${participantId}`);
    
    try {
      this.connectionState[participantId] = 'new';
      
      if (!this.pendingIceCandidates[participantId]) {
        this.pendingIceCandidates[participantId] = [];
      }
      
      const pc = new RTCPeerConnection(this.iceServers);
      
      // Add local tracks immediately if available
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to new peer connection for ${participantId}`);
          pc.addTrack(track, this.localStream);
        });
      }
      
      // Handle ICE candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Generated ICE candidate for ${participantId}`);
          this.socket.emit("rtcIceCandidate", {
            sessionId: this.sessionId,
            senderId: this.userId,
            receiverId: participantId,
            candidate: event.candidate
          });
        } else {
          console.log(`ICE candidate gathering complete for ${participantId}`);
        }
      };
      
      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${participantId}: ${pc.iceConnectionState}`);
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          this.connectionRetries[participantId] = 0;
        } else if (pc.iceConnectionState === 'failed') {
          console.log(`ICE connection failed for ${participantId}`);
          
          if (!this.connectionRetries[participantId]) {
            this.connectionRetries[participantId] = 0;
          }
          
          if (this.connectionRetries[participantId] < 3) {
            this.connectionRetries[participantId]++;
            console.log(`Restarting ICE for ${participantId} (attempt ${this.connectionRetries[participantId]})`);
            pc.restartIce();
          } else {
            console.log(`Too many ICE restart attempts for ${participantId}, recreating connection`);
            this.cleanupPeerConnection(participantId);
            setTimeout(() => {
              this.createPeerConnection(participantId);
            }, 3000);
          }
        }
      };
      
      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${participantId}: ${pc.connectionState}`);
        
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.log(`Connection lost with ${participantId}`);
          setTimeout(() => {
            if (this.peerConnections[participantId] === pc) {
              this.cleanupPeerConnection(participantId);
              this.createPeerConnection(participantId);
            }
          }, 5000);
        }
      };
      
      // Handle incoming tracks/streams
      pc.ontrack = (event) => {
        console.log(`Received remote track from ${participantId}:`, event.track.kind, event.streams);
        
        const stream = event.streams[0];
        if (stream && stream.active) {
          stream.participantId = participantId;
          
          // Log track details
          stream.getTracks().forEach(track => {
            console.log(`Remote track from ${participantId}: ${track.kind}, enabled=${track.enabled}, state=${track.readyState}`);
          });
          
          // Notify the application
          if (this.onRemoteStreamUpdate) {
            this.onRemoteStreamUpdate(participantId, stream);
          }
        }
      };
      
      this.peerConnections[participantId] = pc;
      return pc;
    } catch (error) {
      console.error(`Error creating peer connection for ${participantId}:`, error);
      return null;
    }
  }
  
  async applyIceCandidate(peerId, candidate) {
    try {
      const pc = this.peerConnections[peerId];
      if (!pc || !pc.remoteDescription) {
        return false;
      }
      
      console.log(`Adding ICE candidate to peer ${peerId}`);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (error) {
      console.error(`Error applying ICE candidate for ${peerId}:`, error);
      return false;
    }
  }
  
  async applyPendingIceCandidates(peerId) {
    const pc = this.peerConnections[peerId];
    const pendingCandidates = this.pendingIceCandidates[peerId] || [];
    
    if (!pc || !pc.remoteDescription || pendingCandidates.length === 0) {
      return;
    }
    
    console.log(`Applying ${pendingCandidates.length} pending ICE candidates for ${peerId}`);
    
    const candidates = [...pendingCandidates];
    this.pendingIceCandidates[peerId] = [];
    
    for (const candidate of candidates) {
      await this.applyIceCandidate(peerId, candidate);
    }
  }
  
  async sendOffer(participantId) {
    try {
      const pc = this.peerConnections[participantId];
      if (!pc) {
        console.error(`No peer connection for ${participantId} when trying to send offer`);
        this.createPeerConnection(participantId);
        return;
      }
      
      this.connectionState[participantId] = 'creating-offer';
      
      console.log(`Creating offer for ${participantId}`);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: false
      });
      
      console.log(`Setting local description for ${participantId}`);
      await pc.setLocalDescription(offer);
      
      this.connectionState[participantId] = 'offer-sent';
      
      console.log(`Sending offer to ${participantId}`);
      this.socket.emit("rtcOffer", {
        sessionId: this.sessionId,
        senderId: this.userId,
        receiverId: participantId,
        sdp: pc.localDescription
      });
    } catch (error) {
      console.error(`Error creating offer for ${participantId}:`, error);
      this.connectionState[participantId] = 'error';
      
      this.cleanupPeerConnection(participantId);
      setTimeout(() => {
        this.createPeerConnection(participantId);
      }, 2000);
    }
  }
  
  async handleOffer(senderId, sdp) {
    try {
      console.log(`Handling offer from ${senderId}`);
      this.connectionState[senderId] = 'handling-offer';
      
      let pc = this.peerConnections[senderId];
      if (!pc) {
        pc = this.createPeerConnection(senderId);
        if (!pc) {
          throw new Error("Failed to create peer connection");
        }
      }
      
      if (pc.signalingState !== 'stable') {
        console.log(`Resetting peer connection for ${senderId} - not in stable state (${pc.signalingState})`);
        this.cleanupPeerConnection(senderId);
        pc = this.createPeerConnection(senderId);
        if (!pc) {
          throw new Error("Failed to create peer connection");
        }
      }
      
      console.log(`Setting remote description from ${senderId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      await this.applyPendingIceCandidates(senderId);
      
      console.log(`Creating answer for ${senderId}`);
      const answer = await pc.createAnswer();
      
      console.log(`Setting local description for ${senderId}`);
      await pc.setLocalDescription(answer);
      
      this.connectionState[senderId] = 'answer-sent';
      
      console.log(`Sending answer to ${senderId}`);
      this.socket.emit("rtcAnswer", {
        sessionId: this.sessionId,
        senderId: this.userId,
        receiverId: senderId,
        sdp: pc.localDescription
      });
    } catch (error) {
      console.error(`Error handling offer from ${senderId}:`, error);
      this.connectionState[senderId] = 'error';
      this.cleanupPeerConnection(senderId);
    }
  }
  
  async handleAnswer(senderId, sdp) {
    try {
      console.log(`Handling answer from ${senderId}`);
      const pc = this.peerConnections[senderId];
      
      if (!pc) {
        console.error(`No peer connection for ${senderId} when handling answer`);
        this.pendingAnswers[senderId] = sdp;
        return;
      }
      
      if (pc.signalingState !== 'have-local-offer') {
        console.log(`Peer ${senderId} not in correct state for answer (${pc.signalingState})`);
        this.pendingAnswers[senderId] = sdp;
        return;
      }
      
      console.log(`Setting remote description from ${senderId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      this.connectionState[senderId] = 'connected';
      
      await this.applyPendingIceCandidates(senderId);
      
      console.log(`Connection established with ${senderId}`);
    } catch (error) {
      console.error(`Error handling answer from ${senderId}:`, error);
      this.connectionState[senderId] = 'error';
      
      this.cleanupPeerConnection(senderId);
      setTimeout(() => {
        this.createPeerConnection(senderId);
        
        if (this.userId.toString() > senderId.toString()) {
          this.sendOffer(senderId);
        }
      }, 3000);
    }
  }
  
  cleanupPeerConnection(participantId) {
    const pc = this.peerConnections[participantId];
    if (pc) {
      console.log(`Cleaning up peer connection for ${participantId}`);
      
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onicegatheringstatechange = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      
      try {
        pc.close();
      } catch (error) {
        console.error(`Error closing peer connection for ${participantId}:`, error);
      }
      
      delete this.peerConnections[participantId];
      delete this.connectionRetries[participantId];
      delete this.connectionState[participantId];
      delete this.pendingIceCandidates[participantId];
      delete this.pendingOffers[participantId];
      delete this.pendingAnswers[participantId];
    }
  }
  
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
        console.log(`Audio track enabled: ${enabled}`);
      });
    }
  }
  
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
        console.log(`Video track enabled: ${enabled}`);
      });
    }
  }
  
  getActivePeers() {
    return Object.keys(this.peerConnections);
  }
  
  cleanup() {
    console.log("Cleaning up WebRTC service");
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }
    
    Object.keys(this.peerConnections).forEach(peerId => {
      this.cleanupPeerConnection(peerId);
    });
    
    this.onRemoteStreamUpdate = null;
    this.onParticipantDisconnect = null;
    this.isInitialized = false;
  }
  
  signalReady() {
    console.log("Signaling WebRTC ready to other participants");
    
    if (!this.socket) {
      console.error("Cannot signal ready: Socket not available");
      return;
    }
    
    this.socket.emit("rtcReady", {
      sessionId: this.sessionId,
      userId: this.userId
    });
    
    this.socket.emit("getParticipants", this.sessionId);
    
    this.socket.once("participantsList", (participants) => {
      console.log("Received participants list for establishing connections:", participants);
      
      participants.forEach(participant => {
        if (participant.id.toString() !== this.userId.toString()) {
          console.log(`Initiating connection to participant ${participant.id}`);
          
          this.socket.emit("rtcRequestConnection", {
            sessionId: this.sessionId,
            requesterId: this.userId,
            targetId: participant.id
          });
          
          this.createPeerConnection(participant.id);
          
          if (this.userId.toString() > participant.id.toString()) {
            console.log(`I have higher ID, sending offer to ${participant.id}`);
            setTimeout(() => {
              this.sendOffer(participant.id);
            }, 1000);
          } else {
            console.log(`I have lower ID, waiting for offer from ${participant.id}`);
          }
        }
      });
    });
  }
  
  reconnectAll() {
    console.log("Attempting to reconnect to all peers");
    
    Object.keys(this.peerConnections).forEach(peerId => {
      this.cleanupPeerConnection(peerId);
    });
    
    this.socket.emit("getParticipants", this.sessionId);
    
    this.socket.once("participantsList", (participants) => {
      participants.forEach(participant => {
        if (participant.id.toString() !== this.userId.toString()) {
          this.createPeerConnection(participant.id);
          
          if (this.userId.toString() > participant.id.toString()) {
            setTimeout(() => {
              this.sendOffer(participant.id);
            }, 1000);
          }
        }
      });
    });
  }
}

export default WebRTCService;