import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  startOutgoingRingback,
  stopOutgoingRingback,
  playCallEndSound,
} from '../../services/sound.service';
import './CallModal.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function CallModal({
  isOpen,
  isCaller = true,
  callType = 'video', // 'video' | 'audio'
  targetUser, // { id, name, avatarUrl, role }
  currentUser, // { id, name, avatarUrl, role }
  socket,
  onClose,
}) {
  const [callStatus, setCallStatus] = useState(isCaller ? 'Calling...' : 'Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callType === 'audio');
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isTerminatedRef = useRef(false);

  // Format call seconds to MM:SS
  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Safe cleanup of media & peer connection
  const cleanupCall = useCallback(() => {
    stopOutgoingRingback();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }
  }, []);

  // End Call Handler
  const handleEndCall = useCallback((notifyPeer = true) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;

    playCallEndSound();
    if (notifyPeer && socket && targetUser?.id) {
      socket.emit('call_end', { toUserId: targetUser.id });
    }

    cleanupCall();
    onClose?.();
  }, [cleanupCall, onClose, socket, targetUser]);

  // Initialize WebRTC PeerConnection
  const initPeerConnection = useCallback((stream) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Attach local tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE Candidate Exchange
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetUser?.id) {
        socket.emit('call_signal', {
          toUserId: targetUser.id,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('Connected');
        stopOutgoingRingback();
        // Start duration counter
        if (!timerIntervalRef.current) {
          timerIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall(false);
      }
    };

    return pc;
  }, [handleEndCall, socket, targetUser]);

  // Main Call Lifecycle
  useEffect(() => {
    if (!isOpen || !targetUser?.id) return;
    isTerminatedRef.current = false;

    let isMounted = true;

    async function startMedia() {
      try {
        const wantsVideo = callType === 'video';
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: wantsVideo ? { facingMode } : false,
            audio: true,
          });
        } catch (mediaErr) {
          // If video failed (e.g. no camera attached), fallback to audio only
          if (wantsVideo) {
            console.warn('Video device error, falling back to audio only:', mediaErr);
            toast('Camera unavailable, continuing with audio only');
            setIsVideoDisabled(true);
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } else {
            throw mediaErr;
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && wantsVideo) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = initPeerConnection(stream);

        if (isCaller) {
          // Caller: emit initiate and play outgoing ringtone
          startOutgoingRingback();
          setCallStatus('Ringing...');

          socket.emit('call_initiate', {
            toUserId: targetUser.id,
            callType,
            callerName: currentUser?.name || 'Fortaa Leader',
            callerAvatar: currentUser?.avatarUrl || null,
            callerRole: currentUser?.role || 'Direct Seller',
          });
        } else {
          // Receiver: we just accepted, inform caller
          setCallStatus('Connecting...');
          socket.emit('call_accept', { toUserId: targetUser.id });
        }
      } catch (err) {
        console.error('Media permission error:', err);
        toast.error('Could not access microphone/camera. Please check permissions.');
        handleEndCall(true);
      }
    }

    startMedia();

    // ── SOCKET LISTENERS ──
    // 1. Recipient accepted call -> Caller creates offer
    const handleCallAccepted = async () => {
      setCallStatus('Connecting...');
      stopOutgoingRingback();
      try {
        const pc = pcRef.current;
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call_signal', {
          toUserId: targetUser.id,
          signal: { type: 'offer', sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('Create offer error:', err);
      }
    };

    // 2. Recipient rejected or busy
    const handleCallRejected = ({ reason }) => {
      stopOutgoingRingback();
      setCallStatus(reason === 'busy' ? 'User Busy' : 'Call Declined');
      toast.error(reason === 'busy' ? 'User is busy on another call' : 'Call declined');
      setTimeout(() => handleEndCall(false), 1500);
    };

    // 3. User is offline
    const handleUserOffline = () => {
      stopOutgoingRingback();
      setCallStatus('User Offline');
      toast.error(`${targetUser.name || 'User'} is currently offline`);
      setTimeout(() => handleEndCall(false), 1500);
    };

    // 4. WebRTC Signaling (Offer / Answer / ICE Candidates)
    const handleCallSignal = async ({ signal }) => {
      const pc = pcRef.current;
      if (!pc || !signal) return;

      try {
        if (signal.type === 'offer') {
          // Receiver gets offer -> sets remote description & sends answer
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('call_signal', {
            toUserId: targetUser.id,
            signal: { type: 'answer', sdp: pc.localDescription },
          });
        } else if (signal.type === 'answer') {
          // Caller gets answer
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate') {
          // Add ICE Candidate
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (candErr) {
            console.warn('Error adding ICE candidate:', candErr);
          }
        }
      } catch (sigErr) {
        console.error('Signal handling error:', sigErr);
      }
    };

    // 5. Peer ended call
    const handlePeerEnded = () => {
      toast('Call ended by user');
      handleEndCall(false);
    };

    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_user_offline', handleUserOffline);
    socket.on('call_signal', handleCallSignal);
    socket.on('call_ended', handlePeerEnded);

    return () => {
      isMounted = false;
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_user_offline', handleUserOffline);
      socket.off('call_signal', handleCallSignal);
      socket.off('call_ended', handlePeerEnded);
      cleanupCall();
    };
  }, [
    isOpen,
    isCaller,
    callType,
    facingMode,
    targetUser,
    currentUser,
    socket,
    initPeerConnection,
    handleEndCall,
    cleanupCall,
  ]);

  // Toggle Microphone Mute
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted((prev) => !prev);
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        setIsVideoDisabled((prev) => !prev);
      }
    }
  };

  // Flip Camera (Front / Back on Mobile)
  const flipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    if (localStreamRef.current && pcRef.current) {
      try {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Replace track in peer connection
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }

        localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current.addTrack(newVideoTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      } catch (err) {
        console.error('Failed to flip camera:', err);
      }
    }
  };

  if (!isOpen) return null;

  const isVideoCall = callType === 'video';

  return (
    <div className="call-modal-overlay" role="dialog" aria-modal="true">
      <div className="call-modal-container">
        {/* Top Header Strip */}
        <div className="call-header-strip">
          <div className="call-user-meta">
            {targetUser.avatarUrl ? (
              <img src={targetUser.avatarUrl} alt="" className="call-header-avatar" />
            ) : (
              <div className="call-header-avatar-fallback">
                {(targetUser.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="call-header-name">{targetUser.name || 'Fortaa Leader'}</h4>
              <div className="call-status-row">
                <span className={`call-status-dot ${callStatus !== 'Connected' ? 'ringing' : ''}`} />
                <span>
                  {callStatus === 'Connected' ? formatTimer(callDuration) : callStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Viewport */}
        <div className="call-viewport">
          {isVideoCall && !isVideoDisabled ? (
            <>
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="call-remote-video"
              />

              {/* Local Video PIP Thumbnail */}
              <div className="call-local-pip">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="call-local-video"
                />
              </div>
            </>
          ) : (
            /* Audio Stage with Animated Ripples */
            <div className="call-audio-stage">
              <div className="call-audio-avatar-wrap">
                <div className="call-audio-ring" />
                <div className="call-audio-ring ring-2" />
                {targetUser.avatarUrl ? (
                  <img src={targetUser.avatarUrl} alt="" className="call-audio-avatar" />
                ) : (
                  <div className="call-audio-avatar-fallback">
                    {(targetUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="call-audio-name">{targetUser.name || 'Fortaa Leader'}</h3>
              <p className="call-audio-status">
                {callStatus === 'Connected' ? `In call • ${formatTimer(callDuration)}` : callStatus}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="call-toolbar">
          {/* Mute Mic */}
          <button
            type="button"
            className={`call-tool-btn ${isMicMuted ? 'off' : ''}`}
            onClick={toggleMic}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <FiMicOff /> : <FiMic />}
          </button>

          {/* Toggle Camera (if video call) */}
          {isVideoCall && (
            <>
              <button
                type="button"
                className={`call-tool-btn ${isVideoDisabled ? 'off' : ''}`}
                onClick={toggleVideo}
                title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoDisabled ? <FiVideoOff /> : <FiVideo />}
              </button>

              <button
                type="button"
                className="call-tool-btn"
                onClick={flipCamera}
                title="Flip Camera"
              >
                <FiRefreshCw />
              </button>
            </>
          )}

          {/* End Call (Red Button) */}
          <button
            type="button"
            className="call-tool-btn btn-hangup"
            onClick={() => handleEndCall(true)}
            title="End Call"
          >
            <FiPhoneOff />
          </button>
        </div>
      </div>
    </div>
  );
}
