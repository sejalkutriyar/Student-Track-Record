import React, { useEffect, useRef, useState } from 'react';
import socket from '../socket';
import './VideoCall.css';

const VideoCall = ({ currentUser, isCaller, targetUserId, targetName, peerSocketId: initialPeerSocketId, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [callStatus, setCallStatus] = useState(isCaller ? 'calling' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const localStreamRef = useRef(null);
  const peerSocketIdRef = useRef(initialPeerSocketId);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    let isComponentMounted = true;

    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isComponentMounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && peerSocketIdRef.current) {
            socket.emit('webrtc:ice-candidate', {
              toSocketId: peerSocketIdRef.current,
              candidate: event.candidate
            });
          }
        };

        if (isCaller) {
          // Send call request using the user ID
          socket.emit('call:request', {
            toUserId: targetUserId,
            fromName: currentUser.name,
            studentName: targetName
          });
        } else {
          // Callee replies with accepted using socket ID
          socket.emit('call:accepted', { toSocketId: initialPeerSocketId });
        }
      } catch (err) {
        console.error('Error starting media:', err);
        alert('Could not access camera or microphone. Please ensure you have granted permissions and have a working camera/microphone connected.');
        onClose(); // Close the modal since we can't make the call
      }
    };

    initCall();

    const onCallAccepted = async ({ fromSocketId }) => {
      if (!isCaller) return;
      peerSocketIdRef.current = fromSocketId;
      setCallStatus('connected');

      const pc = peerConnectionRef.current;
      if (pc) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { toSocketId: fromSocketId, offer });
      }
    };

    const onWebrtcOffer = async ({ fromSocketId, offer }) => {
      if (isCaller) return; // Only callee handles offer
      peerSocketIdRef.current = fromSocketId;
      setCallStatus('connected');

      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { toSocketId: fromSocketId, answer });
      }
    };

    const onWebrtcAnswer = async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    };

    const onWebrtcIceCandidate = async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.addIceCandidate(candidate);
      }
    };

    const onCallDeclined = () => {
      setCallStatus('ended');
      setTimeout(endCallCleanly, 2000);
    };

    const onCallEnd = () => {
      setCallStatus('ended');
      setTimeout(endCallCleanly, 1000);
    };

    socket.on('call:accepted', onCallAccepted);
    socket.on('webrtc:offer', onWebrtcOffer);
    socket.on('webrtc:answer', onWebrtcAnswer);
    socket.on('webrtc:ice-candidate', onWebrtcIceCandidate);
    socket.on('call:declined', onCallDeclined);
    socket.on('call:end', onCallEnd);

    return () => {
      isComponentMounted = false;
      socket.off('call:accepted', onCallAccepted);
      socket.off('webrtc:offer', onWebrtcOffer);
      socket.off('webrtc:answer', onWebrtcAnswer);
      socket.off('webrtc:ice-candidate', onWebrtcIceCandidate);
      socket.off('call:declined', onCallDeclined);
      socket.off('call:end', onCallEnd);

      endCallCleanly();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaller, targetUserId, initialPeerSocketId]);

  const endCallCleanly = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    onClose();
  };

  const declineOrEndCall = () => {
    if (callStatus === 'calling' && isCaller) {
      if (peerSocketIdRef.current) socket.emit('call:end', { toSocketId: peerSocketIdRef.current });
      endCallCleanly();
    } else {
      if (peerSocketIdRef.current) socket.emit('call:end', { toSocketId: peerSocketIdRef.current });
      setCallStatus('ended');
      setTimeout(endCallCleanly, 1000);
    }
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="videocall-overlay">
      <div className="videocall-container">

        {/* Header */}
        <div className="vc-header">
          <span>📹 PTM Video Call</span>
          <span className={`vc-status ${callStatus}`}>
            {callStatus === 'calling' && '⏳ Calling...'}
            {callStatus === 'connecting' && '⏳ Connecting...'}
            {callStatus === 'connected' && '🟢 Connected'}
            {callStatus === 'ended' && '🔴 Call Ended'}
          </span>
        </div>

        {/* Videos */}
        <div className="vc-videos">
          {/* Remote video - big */}
          <div className="vc-remote">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <div className="remote-name">{targetName}</div>
          </div>

          {/* Local video - small pip */}
          <div className="vc-local">
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
            <div className="local-name">You</div>
          </div>
        </div>

        {/* Controls */}
        <div className="vc-controls">
          <button
            className={`vc-btn ${isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            title="Mute"
          >
            {isMuted ? '🔇' : '🎤'}
          </button>

          <button
            className="vc-btn end-call"
            onClick={declineOrEndCall}
            title="End Call"
          >
            📵
          </button>

          <button
            className={`vc-btn ${isCameraOff ? 'active' : ''}`}
            onClick={toggleCamera}
            title="Camera"
          >
            {isCameraOff ? '📷' : '📸'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VideoCall;