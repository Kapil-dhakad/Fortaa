import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { sharePostApi } from '../../services/dashboard.service';
import {
  FaWhatsapp,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaLink,
  FaCheck,
  FaTimes,
  FaRetweet,
} from 'react-icons/fa';
import './ShareModal.css';

export default function ShareModal({
  isOpen,
  onClose,
  post,
  currentUser,
  onShareSuccess,
}) {
  const [copied, setCopied] = useState(false);
  const [quote, setQuote] = useState('');
  const [sharing, setSharing] = useState(false);

  if (!isOpen || !post) return null;

  const postUrl = `${window.location.origin}/all-posts#post-${post.id}`;
  const shareText = `Check out this post by ${post.author_name} on FORTAA: "${post.content ? post.content.substring(0, 100) : ''}..."`;

  // 1. Copy Link
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Post link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
      handleTrackShare('copy_link');
    } else {
      toast.success('Link copied!');
    }
  };

  // 2. Track & invoke API
  const handleTrackShare = async (target, repostToFeed = false) => {
    try {
      const res = await sharePostApi(post.id, {
        userId: currentUser?.id,
        quote: quote.trim(),
        repostToFeed,
      });
      if (res && res.success && onShareSuccess) {
        onShareSuccess(res.shares_count || (post.shares_count || 0) + 1);
      }
    } catch (err) {
      console.error('Error tracking share:', err);
    }
  };

  // 3. Social Shares
  const handleSocialShare = (platform) => {
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + postUrl)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    } else if (platform === 'linkedin') {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
      handleTrackShare(platform);
      toast.success(`Sharing to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
      onClose();
    }
  };

  // 4. Repost to feed
  const handleRepostToFeed = async () => {
    setSharing(true);
    try {
      await handleTrackShare('feed', true);
      toast.success('Post shared to your network feed!');
      onClose();
    } catch (err) {
      console.error('Repost error:', err);
      toast.error('Failed to repost');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sm-header">
          <h3 className="sm-title">Share Post</h3>
          <button type="button" className="sm-close-btn" onClick={onClose} title="Close">
            <FaTimes size={15} />
          </button>
        </div>

        {/* Post Preview Snippet */}
        <div className="sm-post-preview">
          {post.image_url && (
            <img src={post.image_url} alt="Post preview" className="sm-preview-thumb" />
          )}
          <div className="sm-preview-info">
            <span className="sm-preview-author">{post.author_name}</span>
            <p className="sm-preview-content">
              {post.content ? post.content.substring(0, 120) : ''}
              {post.content && post.content.length > 120 ? '...' : ''}
            </p>
          </div>
        </div>

        {/* Quick Social Share Icons */}
        <div className="sm-section-label">Share to social media</div>
        <div className="sm-social-row">
          <button
            type="button"
            className="sm-social-btn whatsapp"
            onClick={() => handleSocialShare('whatsapp')}
            title="Share on WhatsApp"
          >
            <div className="sm-social-icon-box">
              <FaWhatsapp size={18} />
            </div>
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="sm-social-btn facebook"
            onClick={() => handleSocialShare('facebook')}
            title="Share on Facebook"
          >
            <div className="sm-social-icon-box">
              <FaFacebookF size={16} />
            </div>
            <span>Facebook</span>
          </button>

          <button
            type="button"
            className="sm-social-btn twitter"
            onClick={() => handleSocialShare('twitter')}
            title="Share on X (Twitter)"
          >
            <div className="sm-social-icon-box">
              <FaTwitter size={16} />
            </div>
            <span>X (Twitter)</span>
          </button>

          <button
            type="button"
            className="sm-social-btn linkedin"
            onClick={() => handleSocialShare('linkedin')}
            title="Share on LinkedIn"
          >
            <div className="sm-social-icon-box">
              <FaLinkedinIn size={16} />
            </div>
            <span>LinkedIn</span>
          </button>
        </div>

        {/* Copy Link Row */}
        <div className="sm-copy-box">
          <input
            type="text"
            className="sm-copy-input"
            value={postUrl}
            readOnly
          />
          <button
            type="button"
            className={`sm-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <FaCheck size={12} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FaLink size={12} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Repost to Feed section */}
        <div className="sm-repost-box">
          <div className="sm-repost-title-row">
            <FaRetweet size={14} color="#6B11D7" />
            <span className="sm-repost-title">Repost with your thoughts</span>
          </div>
          <input
            type="text"
            className="sm-repost-input"
            placeholder="Add your thoughts or quote (optional)..."
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
          <button
            type="button"
            className="sm-repost-btn"
            onClick={handleRepostToFeed}
            disabled={sharing}
          >
            {sharing ? 'Sharing...' : 'Repost to My Network'}
          </button>
        </div>
      </div>
    </div>
  );
}
