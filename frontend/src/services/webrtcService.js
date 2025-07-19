class WebRTCService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.otherUserId = null;
    this.callType = null;
    this.isInitiator = false;
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.onEvent = null;
    
    // ICE servers for WebRTC
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  init(socket, currentUserId) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.setupSocketListeners();
    console.log('🔔 WebRTC Service initialized');
  }

  setupSocketListeners() {
    // Handle incoming call offers
    this.socket.on('call_offer', async (data) => {
      console.log('🔔 Received call offer:', data);
      this.otherUserId = data.from;
      this.callType = data.callType;
      this.isInitiator = false;
      
      // Emit call received event
      this.emit('callReceived', {
        from: data.from,
        callType: data.callType
      });
    });

    // Handle call accepted (recipient accepted the call)
    this.socket.on('call_accepted', async (data) => {
      console.log('🔔 Call accepted by recipient:', data);
      
      // Only the caller should create peer connection and send offer
      if (this.isInitiator) {
        try {
          await this.createPeerConnection();
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          
          this.socket.emit('call_offer_webrtc', {
            to: this.otherUserId,
            from: this.currentUserId,
            offer: offer
          });
          
          console.log('🔔 WebRTC offer sent after call accepted');
        } catch (error) {
          console.error('❌ Error creating offer after call accepted:', error);
        }
      }
      
      this.emit('callAccepted', data);
    });

    // Handle WebRTC offer (after call is accepted)
    this.socket.on('call_offer_webrtc', async (data) => {
      console.log('🔔 Received WebRTC offer:', data);
      try {
        if (!this.peerConnection) {
          await this.createPeerConnection();
        }
        
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('call_answer', {
          to: this.otherUserId,
          from: this.currentUserId,
          answer: answer
        });
        
        console.log('🔔 WebRTC answer sent to caller');
      } catch (error) {
        console.error('❌ Error handling WebRTC offer:', error);
      }
    });

    // Handle call answer (WebRTC answer)
    this.socket.on('call_answer', async (data) => {
      console.log('🔔 Received call answer:', data);
      try {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('🔔 Remote description set successfully');
          this.emit('callConnected');
        } else {
          console.error('❌ No peer connection when receiving answer');
        }
      } catch (error) {
        console.error('❌ Error setting remote description:', error);
      }
    });

    // Handle ICE candidates
    this.socket.on('ice_candidate', async (data) => {
      console.log('🔔 Received ICE candidate:', data);
      try {
        if (this.peerConnection && this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    });

    // Handle call end
    this.socket.on('call_ended', (data) => {
      console.log('🔔 Call ended:', data);
      this.cleanup();
      this.emit('callEnded', data);
    });

    // Handle call rejected
    this.socket.on('call_rejected', (data) => {
      console.log('🔔 Call rejected:', data);
      this.cleanup();
      this.emit('callRejected', data);
    });
  }

  // Create peer connection
  async createPeerConnection() {
    try {
      console.log('🔔 Creating peer connection...');
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });

      // Add local stream tracks to peer connection
      if (this.localStream) {
        console.log('🔔 Adding local stream tracks to peer connection');
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('🔔 Received remote stream');
        this.remoteStream = event.streams[0];
        this.emit('remoteStreamReceived', this.remoteStream);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🔔 Sending ICE candidate');
          this.socket.emit('ice_candidate', {
            to: this.otherUserId,
            from: this.currentUserId,
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔔 Connection state:', this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === 'connected') {
          console.log('🔔 WebRTC connection established');
          this.emit('callConnected');
        } else if (this.peerConnection.connectionState === 'failed') {
          console.log('🔔 WebRTC connection failed');
          this.emit('callFailed');
        }
      };

      console.log('🔔 Peer connection created successfully');
      return this.peerConnection;
    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
      throw error;
    }
  }

  // Get user media (camera/microphone)
  async getUserMedia(constraints = {}) {
    try {
      console.log('🔔 Getting user media with constraints:', constraints);
      const defaultConstraints = {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      const finalConstraints = { ...defaultConstraints, ...constraints };
      this.localStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      
      console.log('🔔 Got user media:', this.localStream);
      this.emit('localStreamReceived', this.localStream);
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      throw error;
    }
  }

  // Start a call
  async startCall(otherUserId, callType) {
    try {
      console.log('🔔 Starting call to:', otherUserId, 'Type:', callType);
      this.otherUserId = otherUserId;
      this.callType = callType;
      this.isInitiator = true;

      // Get user media first
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      await this.getUserMedia(constraints);

      // Send initial call offer
      this.socket.emit('call_offer', {
        to: otherUserId,
        from: this.currentUserId,
        callType: callType
      });

      console.log('🔔 Call offer sent - waiting for answer');
      this.emit('callRinging', { callType, otherUserId });

    } catch (error) {
      console.error('❌ Error starting call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Accept incoming call
  async acceptCall() {
    try {
      console.log('🔔 Accepting incoming call...');
      
      // Notify caller that call is accepted
      this.socket.emit('call_accept', {
        to: this.otherUserId,
        from: this.currentUserId
      });

      // Get user media
      const constraints = {
        audio: true,
        video: this.callType === 'video'
      };
      
      await this.getUserMedia(constraints);

      console.log('🔔 Call accepted - waiting for WebRTC offer from caller');
      this.emit('callAccepted');

    } catch (error) {
      console.error('❌ Error accepting call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Reject call
  rejectCall() {
    console.log('🔔 Rejecting call...');
    this.socket.emit('call_reject', {
      to: this.otherUserId,
      from: this.currentUserId
    });
    this.cleanup();
    this.emit('callRejected');
  }

  // End call
  endCall() {
    console.log('🔔 Ending call...');
    this.socket.emit('call_end', {
      to: this.otherUserId,
      from: this.currentUserId
    });
    this.cleanup();
    this.emit('callEnded');
  }

  // Toggle mute
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.emit('muteToggled', !audioTrack.enabled);
      }
    }
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.emit('videoToggled', !videoTrack.enabled);
      }
    }
  }

  // Cleanup resources
  cleanup() {
    console.log('🔔 Cleaning up WebRTC resources...');
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Reset state
    this.remoteStream = null;
    this.otherUserId = null;
    this.callType = null;
    this.isInitiator = false;

    console.log('🔔 WebRTC cleanup completed');
  }

  // Event emitter
  emit(event, data) {
    console.log('🔔 Emitting event:', event, data);
    if (this.onEvent) {
      this.onEvent(event, data);
    }
  }

  // Set event handler
  on(event, callback) {
    this.onEvent = callback;
  }

  // Get current streams
  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}

// Create singleton instance
const webrtcService = new WebRTCService();
export default webrtcService; 