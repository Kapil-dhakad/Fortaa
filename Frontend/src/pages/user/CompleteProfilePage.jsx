import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import { uploadDocument } from '../../services/upload.service';
import './CompleteProfilePage.css';

const POPULAR_BRANDS = [
  'Forever Living Products (FLP)',
  'Amway',
  'Vestige Marketing',
  'Herbalife Nutrition',
  'Modicare',
  'Oriflame',
  'Mi Lifestyle Marketing',
  'Safe Shop',
  'IMC (International Marketing Corp)',
  'Atomy India',
  'Tupperware',
  'RCM',
  'Asclepius Wellness (AWPL)',
  'Other',
];

const BUSINESS_CATEGORIES = [
  'Health & Wellness',
  'Beauty & Personal Care',
  'Nutritional Supplements',
  'FMCG & Groceries',
  'E-Commerce & Digital',
  'Home Care & Lifestyle',
  'Financial Services & Fintech',
  'Apparel & Fashion',
  'Other',
];

const DESIGNATIONS = [
  'Independent Distributor',
  'Business Leader',
  'Team Leader',
  'Silver Leader',
  'Gold Leader',
  'Platinum Leader',
  'Diamond Leader',
  'Senior Executive Leader',
  'Direct Seller / Associate',
];

const EXPERIENCES = [
  'Beginner (< 1 Year)',
  '1 - 2 Years',
  '3 - 5 Years',
  '5 - 10 Years',
  '10+ Years (Veteran)',
];

const TODAY_STR = new Date().toISOString().split('T')[0];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    sameAsMobile: true,
    dob: '',
    gender: 'Male',
    companyBrand: 'Forever Living Products (FLP)',
    customCompany: '',
    businessCategory: 'Health & Wellness',
    designation: 'Independent Distributor',
    businessName: '',
    experience: '1 - 2 Years',
    referralId: '',
    govtIdUrl: '',
    govtIdFileName: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load logged in user from localStorage
    const savedUserStr = localStorage.getItem('fortaa_user');
    const token = localStorage.getItem('fortaa_token');

    if (!savedUserStr && !token) {
      toast.error('Please log in with Google first.');
      navigate('/login');
      return;
    }

    try {
      const user = savedUserStr ? JSON.parse(savedUserStr) : {};
      setCurrentUser(user);

      // Pre-fill fields from Google OAuth data
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || user.mobile_number || '',
        whatsappNumber: user.whatsappNumber || user.whatsapp_number || user.mobileNumber || user.mobile_number || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
        gender: user.gender || 'Male',
        companyBrand: user.companyBrand || user.company || 'Forever Living Products (FLP)',
        businessCategory: user.businessCategory || user.business_category || 'Health & Wellness',
        designation: user.designation || 'Independent Distributor',
        businessName: user.businessName || user.business_name || '',
        experience: user.experience || '1 - 2 Years',
        referralId: user.referralId || user.referral_id || '',
        govtIdUrl: user.govtIdUrl || user.govt_id_url || '',
      }));
    } catch (err) {
      console.error('Error reading user:', err);
    }
  }, [navigate]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'mobileNumber' && prev.sameAsMobile) {
        updated.whatsappNumber = value;
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCheckboxToggle = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      sameAsMobile: checked,
      whatsappNumber: checked ? prev.mobileNumber : prev.whatsappNumber,
    }));
  };

  const handleGovtIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setUploadingDoc(true);
    try {
      const url = await uploadDocument(file, 'kyc');
      if (url) {
        setFormData((prev) => ({
          ...prev,
          govtIdUrl: url,
          govtIdFileName: file.name,
        }));
        toast.success('Document uploaded successfully!');
      }
    } catch (error) {
      console.error('KYC upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim().replace(/\D/g, '').slice(-10))) {
      newErrors.mobileNumber = 'Enter a valid 10-digit Indian mobile number';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (formData.companyBrand === 'Other' && !formData.customCompany.trim()) {
      newErrors.customCompany = 'Please enter your company or brand name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const resolvedBrand =
      formData.companyBrand === 'Other' ? formData.customCompany.trim() : formData.companyBrand;

    const cleanMobile = formData.mobileNumber.trim().replace(/\D/g, '').slice(-10);
    const cleanWhatsapp = formData.sameAsMobile
      ? cleanMobile
      : (formData.whatsappNumber.trim().replace(/\D/g, '').slice(-10) || cleanMobile);

    const payload = {
      name: formData.name.trim(),
      mobileNumber: cleanMobile,
      whatsappNumber: cleanWhatsapp,
      dob: formData.dob,
      gender: formData.gender,
      companyBrand: resolvedBrand,
      businessName: formData.businessName.trim() || `${formData.name.trim()}'s Business`,
      businessCategory: formData.businessCategory,
      designation: formData.designation,
      experience: formData.experience,
      referralId: formData.referralId.trim() || null,
      govtIdUrl: formData.govtIdUrl || null,
      avatarUrl: currentUser?.avatarUrl || currentUser?.picture || null,
    };

    try {
      const userId = currentUser?.id || currentUser?._id;
      const res = await fetch(`/api/users/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('fortaa_token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local storage with complete info
      const updatedUser = {
        ...currentUser,
        ...payload,
        isProfileCompleted: true,
      };
      localStorage.setItem('fortaa_user', JSON.stringify(updatedUser));

      toast.success(`Profile complete! Welcome to Fortaa, ${payload.name}! 🚀`);
      navigate('/dashboard');
    } catch (err) {
      console.error('[CompleteProfile Error]:', err);
      // Fallback update in localStorage to prevent blocking user
      const updatedUser = {
        ...currentUser,
        ...payload,
        isProfileCompleted: true,
      };
      localStorage.setItem('fortaa_user', JSON.stringify(updatedUser));
      toast.success('Profile details saved! Redirecting to Dashboard...');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast('You can complete your business details anytime from your Profile page.', {
      icon: 'ℹ️',
    });
    navigate('/dashboard');
  };

  return (
    <div className="complete-profile-page">
      <div className="complete-profile-container">
        {/* Top Header Card */}
        <div className="cp-brand-bar">
          <Link to="/" className="cp-brand-logo">
            <img src={logoIconImg} alt="Fortaa" className="cp-logo-icon" />
            <div className="cp-logo-text-wrap">
              <img src={logoTextImg} alt="FORTAA" className="cp-logo-word" />
              <span className="cp-logo-tagline">Discover, easy and Grow</span>
            </div>
          </Link>

          <button type="button" className="cp-skip-btn" onClick={handleSkip}>
            Skip for now →
          </button>
        </div>

        {/* User Google Welcome Banner */}
        <div className="cp-welcome-card">
          <div className="cp-user-info-row">
            {currentUser?.picture || currentUser?.avatarUrl ? (
              <img
                src={currentUser?.picture || currentUser?.avatarUrl}
                alt={currentUser?.name}
                className="cp-user-avatar"
              />
            ) : (
              <div className="cp-user-avatar-fallback">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="cp-user-details">
              <div className="cp-badge-google">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google Verified Account
              </div>
              <h2 className="cp-welcome-title">Welcome, {currentUser?.name || 'Partner'}!</h2>
              <p className="cp-welcome-sub">
                Complete your direct selling profile to unlock verified leader access, networking tools, and your dashboard feed.
              </p>
            </div>
          </div>
        </div>

        {/* Complete Form Card */}
        <form className="cp-form-card" onSubmit={handleSubmit}>
          {/* Section 1: Contact & Personal Details */}
          <div className="cp-section">
            <div className="cp-section-header">
              <div className="cp-section-icon">📱</div>
              <div>
                <h3 className="cp-section-title">Step 1: Contact & Personal Details</h3>
                <p className="cp-section-sub">Required to connect with team members and network leaders</p>
              </div>
            </div>

            <div className="cp-grid-2">
              {/* Name (pre-filled) */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Full Name <span className="cp-required">*</span>
                </label>
                <input
                  type="text"
                  className={`cp-input ${errors.name ? 'cp-has-error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your full name"
                />
                {errors.name && <span className="cp-error-text">{errors.name}</span>}
              </div>

              {/* Email (Google Verified, Read-only) */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Email Address
                  <span className="cp-badge-verified">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                </label>
                <div className="cp-input-locked-wrap">
                  <input
                    type="email"
                    className="cp-input cp-input-locked"
                    value={formData.email}
                    readOnly
                    title="Verified with Google account"
                  />
                  <span className="cp-lock-icon">🔒</span>
                </div>
              </div>

              {/* Mobile Number */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Mobile Number <span className="cp-required">*</span>
                </label>
                <div className="cp-phone-wrap">
                  <span className="cp-phone-prefix">+91</span>
                  <input
                    type="tel"
                    className={`cp-input cp-phone-input ${errors.mobileNumber ? 'cp-has-error' : ''}`}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.mobileNumber}
                    onChange={(e) => handleChange('mobileNumber', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                {errors.mobileNumber && <span className="cp-error-text">{errors.mobileNumber}</span>}
              </div>

              {/* WhatsApp Number */}
              <div className="cp-form-group">
                <div className="cp-label-with-action">
                  <label className="cp-label">WhatsApp Number</label>
                  <label className="cp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sameAsMobile}
                      onChange={handleCheckboxToggle}
                    />
                    <span>Same as Mobile</span>
                  </label>
                </div>
                <div className="cp-phone-wrap">
                  <span className="cp-phone-prefix">+91</span>
                  <input
                    type="tel"
                    className="cp-input cp-phone-input"
                    placeholder="WhatsApp number"
                    maxLength={10}
                    disabled={formData.sameAsMobile}
                    value={formData.sameAsMobile ? formData.mobileNumber : formData.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Date of Birth <span className="cp-required">*</span>
                </label>
                <input
                  type="date"
                  className={`cp-input ${errors.dob ? 'cp-has-error' : ''}`}
                  value={formData.dob}
                  max={TODAY_STR}
                  onChange={(e) => handleChange('dob', e.target.value)}
                />
                {errors.dob && <span className="cp-error-text">{errors.dob}</span>}
              </div>

              {/* Gender */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Gender <span className="cp-required">*</span>
                </label>
                <div className="cp-gender-row">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <label
                      key={g}
                      className={`cp-gender-btn ${formData.gender === g ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={(e) => handleChange('gender', e.target.value)}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Business & Direct Selling Details */}
          <div className="cp-section">
            <div className="cp-section-header">
              <div className="cp-section-icon">💼</div>
              <div>
                <h3 className="cp-section-title">Step 2: Business & Direct Selling Info</h3>
                <p className="cp-section-sub">Showcases your credentials on leaderboards and user search</p>
              </div>
            </div>

            <div className="cp-grid-2">
              {/* Direct Selling Brand / Company */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Direct Selling Brand / Company <span className="cp-required">*</span>
                </label>
                <select
                  className="cp-select"
                  value={formData.companyBrand}
                  onChange={(e) => handleChange('companyBrand', e.target.value)}
                >
                  {POPULAR_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>

                {formData.companyBrand === 'Other' && (
                  <input
                    type="text"
                    className={`cp-input cp-mt-sm ${errors.customCompany ? 'cp-has-error' : ''}`}
                    placeholder="Enter your Company or Brand name"
                    value={formData.customCompany}
                    onChange={(e) => handleChange('customCompany', e.target.value)}
                  />
                )}
                {errors.customCompany && (
                  <span className="cp-error-text">{errors.customCompany}</span>
                )}
              </div>

              {/* Business Category */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Industry / Business Category <span className="cp-required">*</span>
                </label>
                <select
                  className="cp-select"
                  value={formData.businessCategory}
                  onChange={(e) => handleChange('businessCategory', e.target.value)}
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation / Rank */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Designation / Rank in Team <span className="cp-required">*</span>
                </label>
                <select
                  className="cp-select"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                >
                  {DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business / Hub Name */}
              <div className="cp-form-group">
                <label className="cp-label">Business / Team Hub Name</label>
                <input
                  type="text"
                  className="cp-input"
                  placeholder="e.g. Apex Dream Team / My Network Hub"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                />
              </div>

              {/* Experience */}
              <div className="cp-form-group">
                <label className="cp-label">Experience in Direct Selling</label>
                <select
                  className="cp-select"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                >
                  {EXPERIENCES.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Referral / Sponsor ID */}
              <div className="cp-form-group">
                <label className="cp-label">
                  Referral / Sponsor ID <span className="cp-optional">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="cp-input"
                  placeholder="e.g. NS102456"
                  value={formData.referralId}
                  onChange={(e) => handleChange('referralId', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Identity & Trust Verification (Optional) */}
          <div className="cp-section">
            <div className="cp-section-header">
              <div className="cp-section-icon">🛡️</div>
              <div>
                <h3 className="cp-section-title">Step 3: Verification (Optional)</h3>
                <p className="cp-section-sub">Upload your Govt ID for a trusted partner badge on your profile</p>
              </div>
            </div>

            <div className="cp-upload-box">
              <div className="cp-upload-left">
                <div className="cp-upload-icon">📄</div>
                <div>
                  <h4 className="cp-upload-title">Government ID Proof (Aadhaar / PAN / Passport)</h4>
                  <p className="cp-upload-desc">
                    {formData.govtIdFileName || (formData.govtIdUrl ? 'Document uploaded ✓' : 'Supports PDF, JPG, PNG up to 10MB')}
                  </p>
                </div>
              </div>

              <label className="cp-btn-upload">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleGovtIdUpload}
                  disabled={uploadingDoc}
                />
                {uploadingDoc ? 'Uploading...' : formData.govtIdUrl ? 'Replace File' : 'Upload File'}
              </label>
            </div>
          </div>

          {/* Form Submit Row */}
          <div className="cp-submit-row">
            <button
              type="submit"
              className="cp-btn-submit"
              disabled={loading || uploadingDoc}
            >
              {loading ? 'Saving Profile...' : 'Complete & Go to Dashboard →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
