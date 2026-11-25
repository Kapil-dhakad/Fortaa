import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { uploadSingleImage, uploadSingleVideo } from '../../services/upload.service';
import { createStory } from '../../services/story.service';
import './CreateStoryModal.css';

const GRADIENT_PRESETS = [
  { id: 'purple', name: 'Purple Dream', value: 'linear-gradient(135deg, #6366F1, #9333EA)' },
  { id: 'sunset', name: 'Sunset Glow', value: 'linear-gradient(135deg, #F59E0B, #EC4899)' },
  { id: 'midnight', name: 'Neon Night', value: 'linear-gradient(135deg, #1E1B4B, #4C1D95)' },
  { id: 'ocean', name: 'Ocean Blue', value: 'linear-gradient(135deg, #0EA5E9, #2563EB)' },
  { id: 'emerald', name: 'Emerald', value: 'linear-gradient(135deg, #059669, #10B981)' },
  { id: 'velvet', name: 'Velvet Dark', value: 'linear-gradient(135deg, #18181B, #27272A)' },
];

export default function CreateStoryModal({
  isOpen,
  onClose,
  currentUser,
  onStoryCreated,
}) {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | 'video' | 'text' | 'poll'

  // Photo / Video file & preview
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption] = useState('');

  // Text Story
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].value);
  const [fontSize, setFontSize] = useState(22); // px

  // Poll Story
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('Yes 🔥');
  const [pollOption2, setPollOption2] = useState('No ❄️');

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Pause all background feed videos when create story modal is open
  useEffect(() => {
    if (isOpen) {
      const allVids = document.querySelectorAll('video');
      allVids.forEach((v) => {
        try {
          if (!v.paused) v.pause();
        } catch (_) {}
      });
      window.dispatchEvent(new CustomEvent('fortaa:modal_video_active', { detail: { active: true } }));
      return () => {
        window.dispatchEvent(new CustomEvent('fortaa:modal_video_active', { detail: { active: false } }));
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Photo / Video selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg =
      (file.type && file.type.startsWith('image/')) ||
      /\.(jpe?g|png|webp|gif|svg|heic|heif|avif|bmp)$/i.test(file.name || '');
    const isVid =
      (file.type && file.type.startsWith('video/')) ||
      /\.(mp4|webm|mov|mkv|avi|3gp)$/i.test(file.name || '');

    if (activeTab === 'photo' && !isImg) {
      toast.error('Please select an image file');
      e.target.value = '';
      return;
    }
    if (activeTab === 'video' && !isVid) {
      toast.error('Please select a video file');
      e.target.value = '';
      return;
    }

    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    e.target.value = '';
  };

  // Reset modal state
  const resetForm = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setCaption('');
    setTextContent('');
    setPollQuestion('');
    setPollOption1('Yes 🔥');
    setPollOption2('No ❄️');
    setSelectedGradient(GRADIENT_PRESETS[0].value);
    setUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // Publish Story
  const handlePublish = async () => {
    const userId = Number(currentUser?.id || 13);
    if (!userId) {
      toast.error('Please sign in to post a story');
      return;
    }

    // Validation
    if (activeTab === 'photo' || activeTab === 'video') {
      if (!mediaFile && !mediaPreview) {
        toast.error(`Please select a ${activeTab} to publish`);
        return;
      }
    } else if (activeTab === 'text') {
      if (!textContent.trim()) {
        toast.error('Please write something for your text story');
        return;
      }
    } else if (activeTab === 'poll') {
      if (!pollQuestion.trim()) {
        toast.error('Please enter a question for your poll story');
        return;
      }
      if (!pollOption1.trim() || !pollOption2.trim()) {
        toast.error('Please provide both poll options');
        return;
      }
    }

    setUploading(true);

    try {
      let uploadedUrl = null;

      if (activeTab === 'photo' && mediaFile) {
        uploadedUrl = await uploadSingleImage(mediaFile, 'stories');
        if (!uploadedUrl) {
          toast.error('Image upload failed. Please try again.');
          setUploading(false);
          return;
        }
      } else if (activeTab === 'video' && mediaFile) {
        uploadedUrl = await uploadSingleVideo(mediaFile, 'stories');
        if (!uploadedUrl) {
          toast.error('Video upload failed. Please try again.');
          setUploading(false);
          return;
        }
      }

      let payload = {
        userId,
        mediaType: activeTab,
        backgroundStyle: selectedGradient,
      };

      if (activeTab === 'photo' || activeTab === 'video') {
        payload.mediaUrl = uploadedUrl;
        payload.textContent = caption.trim() || null;
      } else if (activeTab === 'text') {
        payload.textContent = textContent.trim();
      } else if (activeTab === 'poll') {
        payload.textContent = pollQuestion.trim();
        payload.pollData = {
          question: pollQuestion.trim(),
          options: [
            { id: 1, text: pollOption1.trim() },
            { id: 2, text: pollOption2.trim() },
          ],
        };
      }

      const res = await createStory(payload);
      if (res?.success) {
        toast.success('Your story was published!');
        onStoryCreated?.(res.story);
        handleClose();
      } else {
        toast.error(res?.message || 'Failed to post story');
      }
    } catch (err) {
      console.error('Publish story error:', err);
      toast.error('Error publishing story. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="csm-backdrop" onClick={handleClose}>
      <div className="csm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="csm-header">
          <div className="csm-header-title">
            <span className="csm-header-badge">✨ Create Story</span>
            <h3>Add to Your Story</h3>
          </div>
          <button type="button" className="csm-close-btn" onClick={handleClose} title="Cancel">
            ✕
          </button>
        </div>

        {/* Story Mode Selector */}
        <div className="csm-tabs">
          <button
            type="button"
            className={`csm-tab-btn ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('photo');
              setMediaFile(null);
              setMediaPreview(null);
            }}
          >
            <span>📷</span>
            <span>Photo</span>
          </button>

          <button
            type="button"
            className={`csm-tab-btn ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('video');
              setMediaFile(null);
              setMediaPreview(null);
            }}
          >
            <span>🎥</span>
            <span>Video</span>
          </button>

          <button
            type="button"
            className={`csm-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('text');
              setMediaFile(null);
              setMediaPreview(null);
            }}
          >
            <span>✍️</span>
            <span>Text</span>
          </button>

          <button
            type="button"
            className={`csm-tab-btn ${activeTab === 'poll' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('poll');
              setMediaFile(null);
              setMediaPreview(null);
            }}
          >
            <span>📊</span>
            <span>Poll</span>
          </button>
        </div>

        {/* Modal Body: Left Canvas Preview + Right Form Controls */}
        <div className="csm-body">
          {/* 9:16 Mobile Canvas Preview */}
          <div className="csm-canvas-col">
            <div
              className="csm-canvas-card"
              style={{
                background:
                  activeTab === 'photo' || activeTab === 'video'
                    ? mediaPreview
                      ? '#000'
                      : '#1E1B4B'
                    : selectedGradient,
              }}
            >
              {/* Photo Mode Preview */}
              {activeTab === 'photo' && (
                <>
                  {mediaPreview ? (
                    <img src={mediaPreview} alt="Story Preview" className="csm-canvas-img" />
                  ) : (
                    <div className="csm-canvas-placeholder" onClick={() => fileInputRef.current?.click()}>
                      <span className="csm-canvas-placeholder-icon">📷</span>
                      <p>Tap to choose a photo</p>
                    </div>
                  )}
                </>
              )}

              {/* Video Mode Preview */}
              {activeTab === 'video' && (
                <>
                  {mediaPreview ? (
                    <video src={mediaPreview} controls playsInline className="csm-canvas-video" />
                  ) : (
                    <div className="csm-canvas-placeholder" onClick={() => fileInputRef.current?.click()}>
                      <span className="csm-canvas-placeholder-icon">🎥</span>
                      <p>Tap to choose a video clip</p>
                    </div>
                  )}
                </>
              )}

              {/* Text Mode Preview */}
              {activeTab === 'text' && (
                <div className="csm-canvas-text-wrap">
                  <p
                    className="csm-canvas-text"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {textContent.trim() || 'Type your story message...'}
                  </p>
                </div>
              )}

              {/* Poll Mode Preview */}
              {activeTab === 'poll' && (
                <div className="csm-canvas-poll-wrap">
                  <div className="csm-canvas-poll-sticker">
                    <h4 className="csm-canvas-poll-q">
                      {pollQuestion.trim() || 'Ask a question...'}
                    </h4>
                    <div className="csm-canvas-poll-options">
                      <div className="csm-canvas-poll-opt">{pollOption1 || 'Yes 🔥'}</div>
                      <div className="csm-canvas-poll-opt">{pollOption2 || 'No ❄️'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Story 24h Expiry indicator */}
              <div className="csm-canvas-badge">24h Story</div>
            </div>
          </div>

          {/* Controls Column */}
          <div className="csm-controls-col">
            {/* Hidden file input for Photo/Video */}
            {(activeTab === 'photo' || activeTab === 'video') && (
              <input
                ref={fileInputRef}
                type="file"
                accept={activeTab === 'photo' ? 'image/*' : 'video/*'}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            )}

            {/* Photo / Video Controls */}
            {(activeTab === 'photo' || activeTab === 'video') && (
              <div className="csm-section">
                <button
                  type="button"
                  className="csm-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>{mediaFile ? '🔄 Change File' : `📁 Choose ${activeTab === 'photo' ? 'Photo' : 'Video'}`}</span>
                </button>
                {mediaFile && (
                  <span className="csm-file-name">Selected: {mediaFile.name}</span>
                )}
              </div>
            )}

            {/* Text Controls */}
            {activeTab === 'text' && (
              <div className="csm-section">
                <label className="csm-label">Story Message</label>
                <textarea
                  className="csm-input csm-textarea"
                  rows={4}
                  placeholder="Share what's happening or write an update..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  maxLength={300}
                />

                <label className="csm-label">Text Size: {fontSize}px</label>
                <input
                  type="range"
                  min="16"
                  max="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="csm-range-slider"
                />

                <label className="csm-label">Background Style</label>
                <div className="csm-preset-grid">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`csm-preset-circle ${selectedGradient === p.value ? 'active' : ''}`}
                      style={{ background: p.value }}
                      onClick={() => setSelectedGradient(p.value)}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Poll Controls */}
            {activeTab === 'poll' && (
              <div className="csm-section">
                <label className="csm-label">Poll Question</label>
                <input
                  type="text"
                  className="csm-input"
                  placeholder="e.g. Which opportunity are you exploring?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  maxLength={120}
                />

                <label className="csm-label">Option 1</label>
                <input
                  type="text"
                  className="csm-input"
                  placeholder="Option 1 (e.g. Crypto 🔥)"
                  value={pollOption1}
                  onChange={(e) => setPollOption1(e.target.value)}
                  maxLength={40}
                />

                <label className="csm-label">Option 2</label>
                <input
                  type="text"
                  className="csm-input"
                  placeholder="Option 2 (e.g. Forex 📈)"
                  value={pollOption2}
                  onChange={(e) => setPollOption2(e.target.value)}
                  maxLength={40}
                />

                <label className="csm-label">Background Style</label>
                <div className="csm-preset-grid">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`csm-preset-circle ${selectedGradient === p.value ? 'active' : ''}`}
                      style={{ background: p.value }}
                      onClick={() => setSelectedGradient(p.value)}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="csm-footer">
          <button type="button" className="csm-btn-cancel" onClick={handleClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="csm-btn-submit"
            onClick={handlePublish}
            disabled={uploading}
          >
            {uploading ? 'Publishing Story...' : 'Share to Story'}
          </button>
        </div>
      </div>
    </div>
  );
}
