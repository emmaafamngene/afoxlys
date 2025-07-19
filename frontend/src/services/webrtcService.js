class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.socket = null;
    this.currentUserId = null;
    this.otherUserId = null;
    this.callType = null;
    this.isInitiator = false;
    
    // ICE servers for WebRTC
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ];
  }

  // Initialize the service
  init(socket, currentUserId) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.setupSocketListeners();
  }

  // Setup socket event listeners
  setupSocketListeners() {
    if (!this.socket) return;

    // Handle incoming call offers
    this.socket.on('call_offer', async (data) => {
      console.log('🔔 Received call offer:', data);
      this.otherUserId = data.from;
      this.callType = data.callType;
      this.isInitiator = false;
      
      // Emit call received event
      this.emit('callReceived', {
        from: data.from,
        callType: data.callType,
        offer: data.offer
      });
    });

    // Handle call answer
    this.socket.on('call_answer', async (data) => {
      console.log('🔔 Received call answer:', data);
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Handle ICE candidates
    this.socket.on('ice_candidate', async (data) => {
      console.log('🔔 Received ICE candidate:', data);
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
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
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });

      // Add local stream tracks to peer connection
      if (this.localStream) {
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
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔔 Connection state:', this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === 'connected') {
          this.emit('callConnected');
        } else if (this.peerConnection.connectionState === 'failed') {
          this.emit('callFailed');
        }
      };

      return this.peerConnection;
    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
      throw error;
    }
  }

  // Get user media (camera/microphone)
  async getUserMedia(constraints = {}) {
    try {
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
      this.otherUserId = otherUserId;
      this.callType = callType;
      this.isInitiator = true;

      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      await this.getUserMedia(constraints);

      // Create peer connection
      await this.createPeerConnection();

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer
      this.socket.emit('call_offer', {
        to: otherUserId,
        from: this.currentUserId,
        callType: callType,
        offer: offer
      });

      console.log('🔔 Call offer sent');
      this.emit('callStarted', { callType, otherUserId });

    } catch (error) {
      console.error('❌ Error starting call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Accept incoming call
  async acceptCall(offer) {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: this.callType === 'video'
      };
      
      await this.getUserMedia(constraints);

      // Create peer connection
      await this.createPeerConnection();

      // Set remote description (offer)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer
      this.socket.emit('call_answer', {
        to: this.otherUserId,
        from: this.currentUserId,
        answer: answer
      });

      console.log('🔔 Call accepted');
      this.emit('callAccepted');

    } catch (error) {
      console.error('❌ Error accepting call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Reject call
  rejectCall() {
    this.socket.emit('call_reject', {
      to: this.otherUserId,
      from: this.currentUserId
    });
    this.cleanup();
    this.emit('callRejected');
  }

  // End call
  endCall() {
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