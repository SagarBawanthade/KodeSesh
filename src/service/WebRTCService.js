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
    
    // ICE servers configuration (STUN/TURN servers)
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    };
    
    // Socket event listeners
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
        // Create a new peer connection for this participant
        this.createPeerConnection(participantId);
        
        // Only the participant with the higher ID initiates the offer
        // This prevents both sides from sending offers simultaneously
        if (this.userId.toString() > participantId.toString()) {
          console.log(`I have higher ID, initiating offer to ${participantId}`);
          // Wait a moment before sending the offer to ensure peer connection is ready
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
      console.log(`Received offer from: ${senderId}`, sdp);
      if (senderId !== this.userId) {
        try {
          // Store the offer if we can't process it immediately
          if (!this.peerConnections[senderId] || !this.isInitialized) {
            console.log(`Storing offer from ${senderId} for later processing`);
            this.pendingOffers[senderId] = sdp;
            
            // Create a peer connection if it doesn't exist
            if (!this.peerConnections[senderId]) {
              this.createPeerConnection(senderId);
            }
            return;
          }
          
          await this.handleOffer(senderId, sdp);
        } catch (error) {
          console.error(`Error handling offer from ${senderId}:`, error);
          this.cleanupPeerConnection(senderId);
          
          // Try to create a new connection
          setTimeout(() => {
            this.createPeerConnection(senderId);
          }, 2000);
        }
      }
    });
    
    // Handle incoming answers
    this.socket.on("rtcAnswer", ({ senderId, sdp }) => {
      console.log(`Received answer from: ${senderId}`, sdp);
      if (senderId !== this.userId) {
        // Store the answer if we can't process it immediately
        if (!this.peerConnections[senderId] || !this.connectionState[senderId] || this.connectionState[senderId] !== 'offer-sent') {
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
        // Always store candidates
        if (!this.pendingIceCandidates[senderId]) {
          this.pendingIceCandidates[senderId] = [];
        }
        this.pendingIceCandidates[senderId].push(candidate);
        
        // Try to apply if connection exists and is in right state
        if (this.peerConnections[senderId] && 
            this.peerConnections[senderId].remoteDescription) {
          this.applyIceCandidate(senderId, candidate);
        } else {
          console.log(`Storing ICE candidate for ${senderId} until connection is ready`);
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
    
    // New event to explicitly request a connection
    this.socket.on("rtcRequestConnection", ({ requesterId }) => {
      console.log(`Connection requested from: ${requesterId}`);
      if (requesterId !== this.userId) {
        if (!this.peerConnections[requesterId]) {
          this.createPeerConnection(requesterId);
        }
        
        // Only the participant with the higher ID initiates the offer
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
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      // Get user media with very basic constraints to ensure compatibility
      const constraints = {
        audio: audioEnabled,
        video: videoEnabled
      };
      
      console.log("Requesting media with constraints:", constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Local media stream obtained successfully", this.localStream);
      
      // Debug the tracks we received
      this.localStream.getTracks().forEach(track => {
        console.log(`Local track: kind=${track.kind}, enabled=${track.enabled}, state=${track.readyState}`);
        
        // Explicitly enable all tracks
        track.enabled = true;
      });
      
      // Flag that we've successfully initialized
      this.isInitialized = true;
      
      // Process any pending offers
      for (const peerId in this.pendingOffers) {
        console.log(`Processing pending offer from ${peerId}`);
        this.handleOffer(peerId, this.pendingOffers[peerId])
          .catch(err => console.error(`Error handling pending offer from ${peerId}:`, err));
        delete this.pendingOffers[peerId];
      }
      
      // Process any pending answers
      for (const peerId in this.pendingAnswers) {
        console.log(`Processing pending answer from ${peerId}`);
        this.handleAnswer(peerId, this.pendingAnswers[peerId]);
        delete this.pendingAnswers[peerId];
      }
      
      // Update all peer connections with the new stream
      Object.keys(this.peerConnections).forEach(peerId => {
        this.updatePeerConnection(peerId);
      });
      
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert(`Error accessing camera/microphone: ${error.message}. Please ensure your browser has permission to access your camera and microphone.`);
      
      // Try fallback with just audio if video fails
      if (videoEnabled) {
        console.log("Trying fallback to audio only");
        return this.initLocalStream(audioEnabled, false);
      }
      throw error;
    }
  }
  
  // Update existing peer connection with current local stream
  updatePeerConnection(peerId) {
    const pc = this.peerConnections[peerId];
    if (!pc) {
      console.warn(`No peer connection found for ${peerId}`);
      return;
    }
    
    try {
      // Remove all existing senders
      const senders = pc.getSenders();
      senders.forEach(sender => {
        pc.removeTrack(sender);
      });
      
      // Add all tracks from local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to peer ${peerId}`);
          pc.addTrack(track, this.localStream);
        });
      } else {
        console.warn("No local stream available when updating peer connection");
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
  
  // Create a new peer connection for a specific participant
  createPeerConnection(participantId) {
    // First clean up any existing connection
    if (this.peerConnections[participantId]) {
      console.log(`Peer connection already exists for ${participantId}, resetting it`);
      this.cleanupPeerConnection(participantId);
    }
    
    console.log(`Creating new peer connection for ${participantId}`);
    
    try {
      // Initialize tracking structures for this peer
      if (!this.pendingIceCandidates[participantId]) {
        this.pendingIceCandidates[participantId] = [];
      }
      this.connectionState[participantId] = 'new';
      
      // Create new RTCPeerConnection with ICE servers
      const pc = new RTCPeerConnection(this.iceServers);
      
      // Add local tracks to the connection if available
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to new peer connection for ${participantId}`);
          pc.addTrack(track, this.localStream);
        });
      } else {
        console.warn("No local stream available when creating peer connection");
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
      
      // Handler for ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${participantId}: ${pc.iceConnectionState}`);
        
        // If connection fails, retry
        if (pc.iceConnectionState === 'failed') {
          console.log(`ICE connection failed for ${participantId}, restarting`);
          
          if (!this.connectionRetries[participantId]) {
            this.connectionRetries[participantId] = 0;
          }
          
          if (this.connectionRetries[participantId] < 3) {
            this.connectionRetries[participantId]++;
            pc.restartIce();
            
            // If we were the offerer, send a new offer
            if (this.connectionState[participantId] === 'offer-sent') {
              setTimeout(() => {
                this.sendOffer(participantId);
              }, 2000);
            }
          } else {
            console.log(`Too many retries for ${participantId}, recreating connection`);
            this.cleanupPeerConnection(participantId);
            
            // Try to recreate the connection
            setTimeout(() => {
              this.createPeerConnection(participantId);
              
              // Only initiate if we're the higher ID
              if (this.userId.toString() > participantId.toString()) {
                this.sendOffer(participantId);
              }
            }, 3000);
          }
        }
        
        // Reset retry counter if connection becomes stable
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          this.connectionRetries[participantId] = 0;
        }
      };
      
      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${participantId}: ${pc.connectionState}`);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.log(`Connection lost with ${participantId}, cleaning up`);
          this.cleanupPeerConnection(participantId);
          
          // After a delay, try to reconnect
          setTimeout(() => {
            this.createPeerConnection(participantId);
            
            // Only initiate if we're the higher ID
            if (this.userId.toString() > participantId.toString()) {
              this.sendOffer(participantId);
            }
          }, 5000);
        }
      };
      
      // Don't use negotiationneeded - it can cause race conditions
      
      // Handle incoming tracks/streams
      pc.ontrack = (event) => {
        console.log(`Received remote track from ${participantId}:`, event.track.kind, event.streams);
        
        // Ensure the stream has an ID for identification
        const stream = event.streams[0];
        if (stream) {
          // Add a data attribute to identify this stream
          stream.participantId = participantId;
          
          // Debug stream tracks
          stream.getTracks().forEach(track => {
            console.log(`Remote track: ${track.kind}, enabled=${track.enabled}, state=${track.readyState}`);
          });
          
          // Notify the application of the new stream
          if (this.onRemoteStreamUpdate) {
            this.onRemoteStreamUpdate(participantId, stream);
          }
        }
      };
      
      // Store the peer connection
      this.peerConnections[participantId] = pc;
      
      return pc;
    } catch (error) {
      console.error(`Error creating peer connection for ${participantId}:`, error);
      return null;
    }
  }
  
  // Apply a single ICE candidate
  async applyIceCandidate(peerId, candidate) {
    try {
      const pc = this.peerConnections[peerId];
      if (!pc) {
        console.log(`No peer connection for ${peerId} when applying ICE candidate`);
        return false;
      }
      
      if (!pc.remoteDescription) {
        console.log(`Cannot apply ICE candidate for ${peerId} without remote description`);
        return false;
      }
      
      // Add the ICE candidate to the peer connection
      console.log(`Adding ICE candidate to peer ${peerId}`);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (error) {
      console.error(`Error applying ICE candidate for ${peerId}:`, error);
      return false;
    }
  }
  
  // Apply any pending ICE candidates
  async applyPendingIceCandidates(peerId) {
    const pc = this.peerConnections[peerId];
    const pendingCandidates = this.pendingIceCandidates[peerId] || [];
    
    if (!pc || !pc.remoteDescription) {
      console.log(`Cannot apply pending ICE candidates for ${peerId} - not ready`);
      return;
    }
    
    if (pendingCandidates.length > 0) {
      console.log(`Applying ${pendingCandidates.length} pending ICE candidates for ${peerId}`);
      
      // Create a copy before we start modifying the array
      const candidates = [...pendingCandidates];
      
      // Clear pending candidates list immediately to avoid race conditions
      this.pendingIceCandidates[peerId] = [];
      
      // Try to apply each candidate
      for (const candidate of candidates) {
        await this.applyIceCandidate(peerId, candidate);
      }
    }
  }
  
  // Send an offer to a specific participant
  async sendOffer(participantId) {
    try {
      const pc = this.peerConnections[participantId];
      if (!pc) {
        console.error(`No peer connection for ${participantId} when trying to send offer`);
        // Try to create a new connection
        this.createPeerConnection(participantId);
        return;
      }
      
      // Update connection state
      this.connectionState[participantId] = 'creating-offer';
      
      console.log(`Creating offer for ${participantId}`);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      console.log(`Setting local description for ${participantId}`);
      await pc.setLocalDescription(offer);
      
      // Update connection state
      this.connectionState[participantId] = 'offer-sent';
      
      // Send the offer immediately
      console.log(`Sending offer to ${participantId}`);
      this.socket.emit("rtcOffer", {
        sessionId: this.sessionId,
        senderId: this.userId,
        receiverId: participantId,
        sdp: pc.localDescription
      });
    } catch (error) {
      console.error(`Error creating offer for ${participantId}:`, error);
      
      // Reset connection state
      this.connectionState[participantId] = 'error';
      
      // Try to recreate the connection
      this.cleanupPeerConnection(participantId);
      setTimeout(() => {
        this.createPeerConnection(participantId);
      }, 2000);
    }
  }
  
  // Handle an incoming offer
  async handleOffer(senderId, sdp) {
    try {
      console.log(`Handling offer from ${senderId}`);
      
      // Update connection state
      this.connectionState[senderId] = 'handling-offer';
      
      // Create new connection if it doesn't exist
      let pc = this.peerConnections[senderId];
      if (!pc) {
        pc = this.createPeerConnection(senderId);
        if (!pc) {
          throw new Error("Failed to create peer connection");
        }
      }
      
      // Make sure we're in a clean state
      if (pc.signalingState !== 'stable') {
        console.log(`Resetting peer connection for ${senderId} - not in stable state`);
        this.cleanupPeerConnection(senderId);
        pc = this.createPeerConnection(senderId);
        if (!pc) {
          throw new Error("Failed to create peer connection");
        }
      }
      
      // Set remote description (the offer)
      console.log(`Setting remote description from ${senderId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      // Apply any pending ICE candidates now that we have the remote description
      await this.applyPendingIceCandidates(senderId);
      
      // Create answer
      console.log(`Creating answer for ${senderId}`);
      const answer = await pc.createAnswer();
      
      // Set local description (our answer)
      console.log(`Setting local description for ${senderId}`);
      await pc.setLocalDescription(answer);
      
      // Update connection state
      this.connectionState[senderId] = 'answer-sent';
      
      // Send the answer back
      console.log(`Sending answer to ${senderId}`);
      this.socket.emit("rtcAnswer", {
        sessionId: this.sessionId,
        senderId: this.userId,
        receiverId: senderId,
        sdp: pc.localDescription
      });
    } catch (error) {
      console.error(`Error handling offer from ${senderId}:`, error);
      
      // Update connection state
      this.connectionState[senderId] = 'error';
      
      // Try to clean up and create a fresh connection
      this.cleanupPeerConnection(senderId);
      
      // We don't need to request reconnection, the other side will retry
    }
  }
  
  // Handle an incoming answer
  async handleAnswer(senderId, sdp) {
    try {
      console.log(`Handling answer from ${senderId}`);
      const pc = this.peerConnections[senderId];
      if (!pc) {
        console.error(`No peer connection for ${senderId} when handling answer`);
        // Store answer for later
        this.pendingAnswers[senderId] = sdp;
        return;
      }
      
      if (pc.signalingState !== 'have-local-offer') {
        console.log(`Peer ${senderId} not in the right state to receive answer, current state: ${pc.signalingState}`);
        // Store answer for later
        this.pendingAnswers[senderId] = sdp;
        return;
      }
      
      // Apply the remote description (their answer)
      console.log(`Setting remote description from ${senderId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      // Update connection state
      this.connectionState[senderId] = 'connected';
      
      // Apply any pending ICE candidates now that we have the remote description
      await this.applyPendingIceCandidates(senderId);
      
      console.log(`Connection established with ${senderId}`);
    } catch (error) {
      console.error(`Error handling answer from ${senderId}:`, error);
      
      // Update connection state
      this.connectionState[senderId] = 'error';
      
      // Try to recreate the connection
      this.cleanupPeerConnection(senderId);
      setTimeout(() => {
        this.createPeerConnection(senderId);
        
        // Only reinitiate if we're the higher ID
        if (this.userId.toString() > senderId.toString()) {
          this.sendOffer(senderId);
        }
      }, 3000);
    }
  }
  
  // Clean up a peer connection
  cleanupPeerConnection(participantId) {
    const pc = this.peerConnections[participantId];
    if (pc) {
      console.log(`Cleaning up peer connection for ${participantId}`);
      
      // Remove all event handlers
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onicegatheringstatechange = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      
      // Close the connection
      pc.close();
      
      // Remove from our connections map
      delete this.peerConnections[participantId];
      delete this.connectionRetries[participantId];
      delete this.connectionState[participantId];
    }
  }
  
  // Toggle audio
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        console.log(`Setting audio track enabled: ${enabled}`);
        track.enabled = enabled;
      });
    }
  }
  
  // Toggle video
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        console.log(`Setting video track enabled: ${enabled}`);
        track.enabled = enabled;
      });
    }
  }
  
  // Get all active peer connections
  getActivePeers() {
    return Object.keys(this.peerConnections);
  }
  
  // Clean up all connections and resources
  cleanup() {
    console.log("Cleaning up WebRTC service");
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Close all peer connections
    Object.keys(this.peerConnections).forEach(peerId => {
      this.cleanupPeerConnection(peerId);
    });
    
    // Clear callbacks
    this.onRemoteStreamUpdate = null;
    this.onParticipantDisconnect = null;
    
    // Reset state
    this.isInitialized = false;
    this.pendingIceCandidates = {};
    this.pendingOffers = {};
    this.pendingAnswers = {};
    this.connectionState = {};
  }
  
  // Notify server that this client is ready for WebRTC
  signalReady() {
    console.log("Signaling WebRTC ready to other participants");
    
    if (!this.socket) {
      console.error("Cannot signal ready: Socket not available");
      return;
    }
    
    // Notify the server that we're ready for WebRTC connections
    this.socket.emit("rtcReady", {
      sessionId: this.sessionId,
      userId: this.userId
    });
    
    // Get existing participants to establish connections
    this.socket.emit("getParticipants", this.sessionId);
    
    // Listen for the participants list to create connections
    this.socket.once("participantsList", (participants) => {
      console.log("Received participants list for establishing connections:", participants);
      
      participants.forEach(participant => {
        // Don't create connection to ourselves
        if (participant.id.toString() !== this.userId.toString()) {
          console.log(`Initiating connection to participant ${participant.id}`);
          
          // Request a connection to each participant
          this.socket.emit("rtcRequestConnection", {
            sessionId: this.sessionId,
            requesterId: this.userId,
            targetId: participant.id
          });
          
          // Create our side of the connection
          this.createPeerConnection(participant.id);
          
          // Only the participant with the higher ID initiates the offer
          if (this.userId.toString() > participant.id.toString()) {
            console.log(`I have higher ID, sending offer to ${participant.id}`);
            this.sendOffer(participant.id);
          } else {
            console.log(`I have lower ID, waiting for offer from ${participant.id}`);
          }
        }
      });
    });
  }
  
  // Request reconnection to all peers (useful if things aren't working)
  reconnectAll() {
    console.log("Attempting to reconnect to all peers");
    
    // Clean up existing connections first
    Object.keys(this.peerConnections).forEach(peerId => {
      this.cleanupPeerConnection(peerId);
    });
    
    // Get fresh list of participants
    this.socket.emit("getParticipants", this.sessionId);
    
    // Handle the response
    this.socket.once("participantsList", (participants) => {
      participants.forEach(participant => {
        if (participant.id.toString() !== this.userId.toString()) {
          // Create fresh connections to each
          this.createPeerConnection(participant.id);
          
          // Only the participant with the higher ID initiates the offer
          if (this.userId.toString() > participant.id.toString()) {
            this.sendOffer(participant.id);
          }
        }
      });
    });
  }
}

export default WebRTCService;