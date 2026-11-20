import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiHeadphones, FiX, FiSend, FiUser, FiMail, FiPhone, FiTag, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import { submitSupportQuery } from '../../services/support.service';
import './SupportModal.css';

const CATEGORIES = [
  'General Query',
  'Account & Profile',
  'Business & Companies',
  'Products & Orders',
  'Network & Leaders',
  'Payments & Verification',
  'Technical Issue / Bug',
];

export default function SupportModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Query',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Autofill user details if logged in
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
        setFormData({
          name: stored.name || '',
          email: stored.email || '',
          phone: stored.mobile_number || stored.phone || '',
          subject: 'General Query',
          message: '',
        });
      } catch {
        // ignore
      }
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please write your query or message');
      return;
    }

    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('fortaa_user') || '{}');
      const payload = {
        ...formData,
        userId: stored.id || null,
      };

      const res = await submitSupportQuery(payload);
      if (res.success) {
        setSubmitted(true);
        toast.success('Support query submitted successfully! 🚀');
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        toast.error(res.message || 'Failed to submit query. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sp-modal-header">
          <div className="sp-modal-header-left">
            <div className="sp-modal-icon-badge">
              <FiHeadphones size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 className="sp-modal-title">Help & Support Desk</h3>
              <p className="sp-modal-subtitle">Submit your query directly to our support team</p>
            </div>
          </div>
          <button
            type="button"
            className="sp-modal-close-btn"
            onClick={onClose}
            aria-label="Close Support Modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="sp-modal-success-state">
            <FiCheckCircle size={56} color="#10B981" />
            <h4 className="sp-success-title">Query Received!</h4>
            <p className="sp-success-desc">
              Thank you! Your query has been delivered to the Admin Support Desk.
              We will review it and get back to you shortly.
            </p>
          </div>
        ) : (
          <form className="sp-modal-form" onSubmit={handleSubmit}>
            <div className="sp-form-row">
              <div className="sp-form-group">
                <label className="sp-form-label">
                  <FiUser size={13} className="sp-label-icon" /> Your Name *
                </label>
                <input
                  type="text"
                  className="sp-form-input"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">
                  <FiMail size={13} className="sp-label-icon" /> Email Address *
                </label>
                <input
                  type="email"
                  className="sp-form-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="sp-form-row">
              <div className="sp-form-group">
                <label className="sp-form-label">
                  <FiPhone size={13} className="sp-label-icon" /> Mobile / WhatsApp
                </label>
                <input
                  type="tel"
                  className="sp-form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">
                  <FiTag size={13} className="sp-label-icon" /> Query Category
                </label>
                <select
                  className="sp-form-select"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sp-form-group">
              <label className="sp-form-label">
                <FiMessageSquare size={13} className="sp-label-icon" /> Message / Describe Your Issue *
              </label>
              <textarea
                className="sp-form-textarea"
                rows={4}
                placeholder="Type your message, issue, or question here in detail..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <div className="sp-modal-notice">
              🔒 Queries are securely transmitted directly to Fortaa Administration & Support.
            </div>

            {/* Modal Actions */}
            <div className="sp-modal-footer">
              <button
                type="button"
                className="sp-btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sp-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <FiSend size={15} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
