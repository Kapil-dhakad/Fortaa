import React, { useEffect } from 'react';
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi';
import { startIncomingRingtone, stopIncomingRingtone } from '../../services/sound.service';
import './IncomingCallModal.css';

export default function IncomingCallModal({
  isOpen,
  callData, // { fromUserId, callType: 'video'|'audio', callerName, callerAvatar, callerRole }
  onAccept,
  onDecline,
}) {
  useEffect(() => {
    if (isOpen) {
      startIncomingRingtone();
      // Auto decline after 45 seconds if no answer
      const timer = setTimeout(() => {
        onDecline?.();
      }, 45000);

      return () => {
        clearTimeout(timer);
        stopIncomingRingtone();
      };
    } else {
      stopIncomingRingtone();
    }
  }, [isOpen, onDecline]);

  if (!isOpen || !callData) return null;

  const isVideo = callData.callType === 'video';

  const handleAcceptClick = () => {
    stopIncomingRingtone();
    onAccept?.(callData);
  };

  const handleDeclineClick = () => {
    stopIncomingRingtone();
    onDecline?.(callData);
  };

  return (
    <div className="inc-call-backdrop" role="dialog" aria-modal="true">
      <div className="inc-call-card">
        {/* Call Type Pill */}
        <div className="inc-call-badge">
          <span className="inc-call-live-dot" />
          <span>Incoming {isVideo ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* Pulsing Avatar */}
        <div className="inc-call-avatar-wrap">
          <div className="inc-call-pulse-ring" />
          <div className="inc-call-pulse-ring ring-2" />
          {callData.callerAvatar ? (
            <img
              src={callData.callerAvatar}
              alt={callData.callerName}
              className="inc-call-avatar-img"
            />
          ) : (
            <div className="inc-call-avatar-fallback">
              {(callData.callerName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Caller Info */}
        <h3 className="inc-caller-name">{callData.callerName || 'Fortaa Leader'}</h3>
        <p className="inc-caller-role">{callData.callerRole || 'Direct Seller'}</p>

        {/* Action Buttons: Decline & Accept */}
        <div className="inc-actions-row">
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="inc-btn-circle inc-btn-decline"
              onClick={handleDeclineClick}
              title="Decline Call"
            >
              <FiPhoneOff />
            </button>
            <span className="inc-btn-label">Decline</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="inc-btn-circle inc-btn-accept"
              onClick={handleAcceptClick}
              title="Accept Call"
            >
              {isVideo ? <FiVideo /> : <FiPhone />}
            </button>
            <span className="inc-btn-label">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
