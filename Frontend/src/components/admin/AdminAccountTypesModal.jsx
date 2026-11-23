import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiX,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiLayers,
  FiAlertCircle,
} from 'react-icons/fi';
import {
  fetchAllAccountTypesAdmin,
  createAccountTypeAdmin,
  updateAccountTypeAdmin,
  deleteAccountTypeAdmin,
} from '../../services/accountType.service';
import AccountTypeIcon from '../common/AccountTypeIcon';
import { AVAILABLE_ACCOUNT_ICONS } from '../../constants/accountIcons';
import './AdminAccountTypesModal.css';

export default function AdminAccountTypesModal({ isOpen, onClose, onUpdated }) {
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'user',
    is_active: true,
    display_order: 1,
  });
  const [saving, setSaving] = useState(false);

  const loadAccountTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllAccountTypesAdmin();
      setAccountTypes(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load account types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAccountTypes();
      setIsEditing(false);
      setEditingId(null);
    }
  }, [isOpen, loadAccountTypes]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'user',
      is_active: true,
      display_order: accountTypes.length + 1,
    });
    setEditingId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'user',
      is_active: item.is_active !== false,
      display_order: item.display_order || 1,
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update
        const res = await updateAccountTypeAdmin(editingId, formData);
        if (res.success) {
          toast.success('Account type updated successfully! ✨');
          setIsEditing(false);
          setEditingId(null);
          loadAccountTypes();
          onUpdated?.();
        } else {
          toast.error(res.message || 'Failed to update');
        }
      } else {
        // Create
        const res = await createAccountTypeAdmin(formData);
        if (res.success) {
          toast.success('New account type created! 🚀');
          setIsEditing(false);
          loadAccountTypes();
          onUpdated?.();
        } else {
          toast.error(res.message || 'Failed to create');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const res = await updateAccountTypeAdmin(item.id, {
        ...item,
        is_active: !item.is_active,
      });
      if (res.success) {
        toast.success(
          item.is_active
            ? `"${item.title}" is now hidden from signup`
            : `"${item.title}" is now active in signup`
        );
        loadAccountTypes();
        onUpdated?.();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    try {
      const res = await deleteAccountTypeAdmin(item.id);
      if (res.success) {
        toast.success(`"${item.title}" deleted.`);
        loadAccountTypes();
        onUpdated?.();
      } else {
        toast.error(res.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting account type');
    }
  };

  const activeCount = accountTypes.filter((a) => a.is_active).length;

  return (
    <div className="aat-overlay" onClick={onClose}>
      <div className="aat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="aat-header">
          <div className="aat-header-title-wrap">
            <div className="aat-icon-badge">
              <FiLayers size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 className="aat-title">Account Types Manager</h3>
              <p className="aat-subtitle">
                Manage the registration options presented to new users in Step 1 of Signup
              </p>
            </div>
          </div>
          <div className="aat-header-actions">
            <button
              type="button"
              className="aat-refresh-btn"
              onClick={loadAccountTypes}
              disabled={loading}
              title="Refresh List"
            >
              <FiRefreshCw size={15} className={loading ? 'aat-spin' : ''} />
            </button>
            <button
              type="button"
              className="aat-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="aat-body">
          {/* Top Bar with Add Button */}
          <div className="aat-sub-bar">
            <div className="aat-stats-pill">
              <span className="aat-active-dot" />
              <span>{activeCount} of {accountTypes.length} Active in Signup</span>
            </div>

            {!isEditing && (
              <button
                type="button"
                className="aat-btn-primary"
                onClick={handleOpenCreate}
              >
                <FiPlus size={16} />
                <span>Add New Account Type</span>
              </button>
            )}
          </div>

          {/* Form when Add / Edit mode is active */}
          {isEditing && (
            <div className="aat-form-card">
              <div className="aat-form-header">
                <h4 className="aat-form-title">
                  {editingId ? 'Edit Account Type' : 'Create New Account Type'}
                </h4>
                <button
                  type="button"
                  className="aat-form-close-sm"
                  onClick={handleCancelForm}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="aat-form">
                <div className="aat-form-row">
                  <div className="aat-form-group aat-flex-2">
                    <label className="aat-form-label">Title / Role Name *</label>
                    <input
                      type="text"
                      className="aat-form-input"
                      placeholder="e.g. Team Leader / Franchise Partner"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="aat-form-group aat-flex-1">
                    <label className="aat-form-label">Display Order</label>
                    <input
                      type="number"
                      className="aat-form-input"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })
                      }
                      min="1"
                      max="99"
                    />
                  </div>
                </div>

                <div className="aat-form-group">
                  <label className="aat-form-label">Description (Explains this account option to users) *</label>
                  <textarea
                    className="aat-form-textarea"
                    placeholder="e.g. I want to build a team and explore direct selling business opportunities..."
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* React Icon Selector */}
                <div className="aat-form-group">
                  <label className="aat-form-label">Choose React Icon</label>
                  <div className="aat-icon-picker-grid">
                    {AVAILABLE_ACCOUNT_ICONS.map((opt) => {
                      const isSelected = formData.icon === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`aat-icon-choice ${isSelected ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, icon: opt.key })}
                          title={opt.label}
                        >
                          <AccountTypeIcon
                            name={opt.key}
                            size={18}
                            color={isSelected ? '#FFFFFF' : '#6326AE'}
                          />
                          <span className="aat-icon-choice-label">{opt.label.split('/')[0].trim()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active in Signup Checkbox */}
                <div className="aat-form-checkbox-row">
                  <label className="aat-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Active (Show in Step 1 of Signup Page)</span>
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="aat-form-actions">
                  <button
                    type="button"
                    className="aat-btn-secondary"
                    onClick={handleCancelForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="aat-btn-primary"
                    disabled={saving}
                  >
                    <FiCheck size={16} />
                    <span>{saving ? 'Saving...' : editingId ? 'Update Account Type' : 'Create Account Type'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Cards List Grid */}
          <div className="aat-cards-grid">
            {loading && accountTypes.length === 0 ? (
              <div className="aat-empty-state">
                <FiRefreshCw size={24} className="aat-spin" />
                <p>Loading account types...</p>
              </div>
            ) : accountTypes.length === 0 ? (
              <div className="aat-empty-state">
                <FiAlertCircle size={36} color="#94A3B8" />
                <p>No account types found. Click "Add New Account Type" to create one.</p>
              </div>
            ) : (
              accountTypes.map((item) => (
                <div
                  key={item.id}
                  className={`aat-card ${!item.is_active ? 'is-inactive' : ''}`}
                >
                  <div className="aat-card-top">
                    <div className="aat-card-icon-wrap">
                      <AccountTypeIcon name={item.icon} size={22} color="#FFFFFF" />
                    </div>

                    <div className="aat-card-meta">
                      <div className="aat-card-title-row">
                        <h4 className="aat-card-title">{item.title}</h4>
                        <span className="aat-order-tag">Order #{item.display_order}</span>
                      </div>
                      <span
                        className={`aat-status-badge ${
                          item.is_active ? 'status-active' : 'status-hidden'
                        }`}
                      >
                        {item.is_active ? 'Active in Signup' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <p className="aat-card-desc">{item.description}</p>

                  <div className="aat-card-footer">
                    <button
                      type="button"
                      className="aat-card-btn-action"
                      onClick={() => handleToggleStatus(item)}
                      title={item.is_active ? 'Hide from Signup' : 'Make Active'}
                    >
                      {item.is_active ? (
                        <>
                          <FiEyeOff size={14} /> <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <FiEye size={14} /> <span>Show</span>
                        </>
                      )}
                    </button>

                    <div className="aat-card-actions-right">
                      <button
                        type="button"
                        className="aat-card-btn-edit"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Account Type"
                      >
                        <FiEdit2 size={14} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className="aat-card-btn-delete"
                        onClick={() => handleDelete(item)}
                        title="Delete Account Type"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
