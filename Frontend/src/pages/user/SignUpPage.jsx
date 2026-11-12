import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uploadSingleImage, uploadDocument } from '../../services/upload.service';
import logoIconImg from '../../assets/figma/logo_icon_img.png';
import logoTextImg from '../../assets/figma/logo_text_img.png';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import './SignUpPage.css';

export default function SignUpPage() {
  const navigate = useNavigate();

  // Step state: 1: 'account-type', 2: 'personal-details', 3: 'business-details', 4: 'verification'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email OTP state
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // WhatsApp / Mobile OTP state
  const [showMobileOtpInput, setShowMobileOtpInput] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);
  const [mobileResendTimer, setMobileResendTimer] = useState(0);

  // Resend Countdown Timer (Email)
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Resend Countdown Timer (WhatsApp)
  useEffect(() => {
    let interval = null;
    if (mobileResendTimer > 0) {
      interval = setInterval(() => {
        setMobileResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mobileResendTimer]);

  // Field-level error messages
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
  });

  // Track whether user has blurred out of field or clicked submit
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    mobileNumber: false,
    whatsappNumber: false,
    password: false,
    confirmPassword: false,
    dob: false,
    gender: false,
  });

  // Form Data
  const [formData, setFormData] = useState({
    accountType: 'Individual / Professional',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    whatsappNumber: '',
    dob: '',
    gender: 'Male',
    referralId: '',
    agreeTerms: true,
    businessName: '',
    companyBrand: '',
    businessCategory: '',
    designation: '',
    experience: '',
    websiteSocial: '',
    mobileVerified: false,
    emailVerified: false,
    businessDocUrl: '',
    businessDocName: '',
    catalogUrl: '',
    catalogName: '',
    govtIdUrl: '',
    govtIdName: '',
  });

  const businessDocInputRef = useRef(null);
  const catalogInputRef = useRef(null);
  const govtIdInputRef = useRef(null);
  const dateInputRef = useRef(null);

  const [uploadingField, setUploadingField] = useState(null);

  const handleFileUpload = async (e, type, folder = 'documents') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File exceeds 20MB limit. Please choose a smaller file.');
      return;
    }

    setUploadingField(type);
    try {
      const isImage = file.type.startsWith('image/');
      const uploadedUrl = isImage
        ? await uploadSingleImage(file, folder)
        : await uploadDocument(file, folder);

      if (uploadedUrl) {
        if (type === 'businessDoc') {
          setFormData((prev) => ({
            ...prev,
            businessDocUrl: uploadedUrl,
            businessDocName: file.name,
          }));
        } else if (type === 'catalog') {
          setFormData((prev) => ({
            ...prev,
            catalogUrl: uploadedUrl,
            catalogName: file.name,
          }));
        } else if (type === 'govtId') {
          setFormData((prev) => ({
            ...prev,
            govtIdUrl: uploadedUrl,
            govtIdName: file.name,
          }));
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('File upload failed. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    if (!formData.email) {
      toast.error('Please enter an email address in Personal Details.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch('/api/users/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      setShowEmailOtpInput(true);
      setResendTimer(30);
      toast.success(data.message || 'Verification code sent to your email!');
    } catch (err) {
      toast.error(err.message || 'Error sending OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim() || emailOtp.trim().length < 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/users/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: emailOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid code');
      }
      handleChange('emailVerified', true);
      setShowEmailOtpInput(false);
      setEmailOtp('');
      toast.success('Email verified successfully! ✓');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Send WhatsApp / Mobile OTP
  const handleSendMobileOtp = async () => {
    const phone = formData.whatsappNumber || formData.mobileNumber;
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number in Personal Details.');
      return;
    }
    setSendingMobileOtp(true);
    try {
      const res = await fetch('/api/users/send-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send WhatsApp OTP');
      }
      setShowMobileOtpInput(true);
      setMobileResendTimer(30);
      toast.success(data.message || 'Verification code sent to your WhatsApp!');
    } catch (err) {
      toast.error(err.message || 'Error sending WhatsApp OTP');
    } finally {
      setSendingMobileOtp(false);
    }
  };

  // Verify WhatsApp / Mobile OTP
  const handleVerifyMobileOtp = async () => {
    const phone = formData.whatsappNumber || formData.mobileNumber;
    if (!mobileOtp.trim() || mobileOtp.trim().length < 6) {
      toast.error('Please enter the complete 6-digit WhatsApp code');
      return;
    }
    setVerifyingMobileOtp(true);
    try {
      const res = await fetch('/api/users/verify-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phone, otp: mobileOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid code');
      }
      handleChange('mobileVerified', true);
      setShowMobileOtpInput(false);
      setMobileOtp('');
      toast.success('Mobile verified successfully via WhatsApp! ✓');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
  const NAME_REGEX = /^[a-zA-Z\s]{3,50}$/;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Real-time password criteria
  const passwordCriteria = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(formData.password),
  };

  // Field validation function
  const validateField = (field, value, isSubmit = false) => {
    let error = '';
    const val = String(value || '').trim();

    // If empty and not submit, don't show error on blur (caught by browser required tooltip on button click)
    if (!val) {
      if (isSubmit && field !== 'whatsappNumber' && field !== 'referralId') {
        if (field === 'dob') return 'Date of birth is required.';
        if (field === 'gender') return 'Please select your gender.';
        return 'This field is required.';
      }
      return '';
    }

    switch (field) {
      case 'name':
        if (val.length < 3) {
          error = 'Full name must be at least 3 characters long.';
        } else if (!NAME_REGEX.test(val)) {
          error = 'Full name must contain only letters and spaces.';
        }
        break;

      case 'email':
        if (!EMAIL_REGEX.test(val.toLowerCase())) {
          error = 'Please enter a valid email address (e.g. name@domain.com).';
        }
        break;

      case 'mobileNumber':
        if (!INDIAN_PHONE_REGEX.test(val)) {
          if (val.length !== 10) {
            error = 'Mobile number must be a valid 10-digit number.';
          } else if (!/^[6-9]/.test(val)) {
            error = 'Indian mobile number must start with 6, 7, 8, or 9.';
          } else {
            error = 'Please enter a valid 10-digit mobile number.';
          }
        }
        break;

      case 'whatsappNumber':
        if (val && !INDIAN_PHONE_REGEX.test(val)) {
          error = 'WhatsApp number must be a valid 10-digit number (starting with 6-9).';
        }
        break;

      case 'password':
        if (value.length < 8) {
          error = 'Password must be at least 8 characters long.';
        } else if (!/[A-Z]/.test(value)) {
          error = 'Password must include at least one uppercase letter (A-Z).';
        } else if (!/[a-z]/.test(value)) {
          error = 'Password must include at least one lowercase letter (a-z).';
        } else if (!/\d/.test(value)) {
          error = 'Password must include at least one number (0-9).';
        } else if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(value)) {
          error = 'Password must include at least one special character (!@#$%^&* etc.).';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          if (isSubmit) error = 'Please confirm your password.';
        } else if (value !== formData.password) {
          error = 'Passwords do not match.';
        }
        break;

      case 'dob':
        if (!value) {
          error = 'Date of birth is required.';
        }
        break;

      case 'gender':
        if (!value) {
          error = 'Please select your gender.';
        }
        break;

      default:
        break;
    }
    return error;
  };

  // Strip non-digits and limit to 10 digits for Indian phone numbers
  const handlePhoneInput = (field, rawValue) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 10);
    handleChange(field, digitsOnly);

    // If an error was showing and user resolved it, clear it
    if (fieldErrors[field]) {
      const err = validateField(field, digitsOnly);
      if (!err) {
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleFieldChange = (field, value) => {
    handleChange(field, value);

    // If password changed, re-validate confirmPassword if already touched
    if (field === 'password' && touched.confirmPassword && formData.confirmPassword) {
      if (formData.confirmPassword !== value) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }

    if (field === 'confirmPassword') {
      if (value !== formData.password) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }

    // If an error was showing and user resolved it, clear it
    if (fieldErrors[field]) {
      const err = validateField(field, value);
      if (!err) {
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }
  };

  // Called when cursor leaves the input field (onBlur)
  const handleBlur = async (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));

    // Async uniqueness check for mobileNumber on blur
    if (!err && field === 'mobileNumber' && formData.mobileNumber && formData.mobileNumber.length === 10) {
      try {
        const mobRes = await fetch(`/api/users/check-mobile?mobile=${encodeURIComponent(formData.mobileNumber.trim())}`);
        const mobData = await mobRes.json();
        if (mobData.exists) {
          setFieldErrors((prev) => ({
            ...prev,
            mobileNumber: 'This mobile number is already registered. Please log in or use another number.',
          }));
        }
      } catch (e) {
        // silent check failure
      }
    }
  };

  // Step 1: Select Account Type
  const accountTypes = [
    {
      title: 'Individual / Professional',
      desc: 'I want to explore opportunities, connect with leaders and grow my network.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: 'Business / Company',
      desc: 'I represent a company, brand or direct selling business.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="22.01" />
          <line x1="15" y1="22" x2="15" y2="22.01" />
          <line x1="9" y1="6" x2="9" y2="6.01" />
          <line x1="15" y1="6" x2="15" y2="6.01" />
          <line x1="9" y1="10" x2="9" y2="10.01" />
          <line x1="15" y1="10" x2="15" y2="10.01" />
          <line x1="9" y1="14" x2="9" y2="14.01" />
          <line x1="15" y1="14" x2="15" y2="14.01" />
        </svg>
      ),
    },
    {
      title: 'Distributor / Partner',
      desc: 'I want to become a distributor of partner with a company.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
    },
    {
      title: 'Team Leader',
      desc: 'i manage a team and work to build and grow my organiation.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  // Step 2 Submission Validation
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Mark all fields as touched so any errors become visible on submit
    setTouched({
      name: true,
      email: true,
      mobileNumber: true,
      whatsappNumber: true,
      dob: true,
      gender: true,
      password: true,
      confirmPassword: true,
    });

    const errors = {
      name: validateField('name', formData.name, true),
      email: validateField('email', formData.email, true),
      mobileNumber: validateField('mobileNumber', formData.mobileNumber, true),
      whatsappNumber: validateField('whatsappNumber', formData.whatsappNumber, true),
      dob: validateField('dob', formData.dob, true),
      gender: validateField('gender', formData.gender, true),
      password: validateField('password', formData.password, true),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, true),
    };

    setFieldErrors(errors);

    const firstError = Object.values(errors).find((err) => Boolean(err));
    if (firstError) {
      setErrorMessage(firstError);
      toast.error(firstError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      setErrorMessage('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy.');
      toast.error('Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if email already exists in Database
      const emailResponse = await fetch(`/api/users/check-email?email=${encodeURIComponent(formData.email.trim())}`);
      const emailData = await emailResponse.json();

      if (emailData.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'An account with this email address already exists. Please log in.',
        }));
        setErrorMessage('An account with this email address already exists. Please log in.');
        toast.error('An account with this email address already exists. Please log in.');
        return;
      }

      // 2. Check if mobile number already exists in Database
      if (formData.mobileNumber) {
        const mobResponse = await fetch(`/api/users/check-mobile?mobile=${encodeURIComponent(formData.mobileNumber.trim())}`);
        const mobData = await mobResponse.json();

        if (mobData.exists) {
          setFieldErrors((prev) => ({
            ...prev,
            mobileNumber: 'This mobile number is already registered. Please log in or use another number.',
          }));
          setErrorMessage('This mobile number is already registered. Please log in or use another number.');
          toast.error('This mobile number is already registered. Please log in or use another number.');
          return;
        }
      }

      setStep(3);
    } catch (err) {
      console.warn('Check email/mobile error:', err);
      // Fallback: allow to proceed if check fails
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submission
  const handleStep3Submit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStep(4);
  };

  // Step 4: Final Complete Registration API Call
  const handleCompleteRegistration = async () => {
    // 1. Enforce Mobile Verification
    if (!formData.mobileVerified) {
      toast.error('Please verify your mobile number to complete registration.');
      return;
    }

    // 2. Enforce Email Verification
    if (!formData.emailVerified) {
      toast.error('Please verify your email address to complete registration.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountType: formData.accountType,
          name: formData.name,
          email: formData.email,
          password: formData.password || 'Fortaa@123',
          mobileNumber: formData.mobileNumber,
          whatsappNumber: formData.whatsappNumber,
          dob: formData.dob,
          gender: formData.gender,
          referralId: formData.referralId,
          businessName: formData.businessName,
          companyBrand: formData.companyBrand,
          businessCategory: formData.businessCategory,
          designation: formData.designation,
          experience: formData.experience,
          websiteSocial: formData.websiteSocial,
          mobileVerified: formData.mobileVerified,
          emailVerified: formData.emailVerified,
          businessDocUrl: formData.businessDocUrl,
          catalogUrl: formData.catalogUrl,
          govtIdUrl: formData.govtIdUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token and user info
      if (data.token) {
        localStorage.setItem('fortaa_token', data.token);
      }
      localStorage.setItem('fortaa_user', JSON.stringify(data.user));

      toast.success('Registration completed successfully! Welcome to Fortaa.');
      // Direct navigation to Dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration API error:', err);
      const errMsg = err.message || 'Registration failed. Please check your details.';
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`onboarding-page ${step === 5 ? 'step-success' : ''}`}>
      <div className={`onboarding-container ${step === 5 ? 'step-success' : ''}`}>
        {/* Card Container (Figma: Logo & Form all inside the card) */}
        <div className={`onboarding-card ${step === 5 ? 'step-success' : ''}`}>
          {/* Card Top Brand Header (Matching Figma 248x42 Logo at top: 25px, left: 48px) */}
          <div className="card-brand-header">
            <button
              type="button"
              className="auth-mobile-back-btn"
              onClick={() => (step > 1 ? setStep(step - 1) : navigate('/login'))}
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#232356" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <Link to="/" className="figma-logo" title="Back to Home">
              <img src={logoIconImg} alt="Fortaa F" className="figma-logo-icon" />
              <div className="figma-logo-text-wrap">
                <img src={logoTextImg} alt="FORTAA" className="figma-logo-word" />
                <span className="figma-logo-tagline">Discover, easy and Grow</span>
              </div>
            </Link>
            {step <= 4 && (
              <div className="card-login-prompt">
                Already have an account?{' '}
                <Link to="/login" className="card-login-link">
                  Log In
                </Link>
              </div>
            )}
          </div>

          {/* Stepper (Only on Steps 1 to 4) */}
          {step <= 4 && (
            <div className="onboarding-stepper">
              <div
                className={`stepper-node ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}
                onClick={() => setStep(1)}
              >
                <div className="stepper-num">{step > 1 ? '✓' : '1'}</div>
                <span className="stepper-text">Account Type</span>
              </div>

              <div className={`stepper-bar ${step >= 2 ? 'active' : ''}`} />

              <div
                className={`stepper-node ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}
                onClick={() => formData.accountType && setStep(2)}
              >
                <div className="stepper-num">{step > 2 ? '✓' : '2'}</div>
                <span className="stepper-text">Personal Details</span>
              </div>

              <div className={`stepper-bar ${step >= 3 ? 'active' : ''}`} />

              <div
                className={`stepper-node ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}
                onClick={() => formData.name && setStep(3)}
              >
                <div className="stepper-num">{step > 3 ? '✓' : '3'}</div>
                <span className="stepper-text">Business Details</span>
              </div>

              <div className={`stepper-bar ${step >= 4 ? 'active' : ''}`} />

              <div
                className={`stepper-node ${step === 4 ? 'active' : ''}`}
                onClick={() => formData.name && setStep(4)}
              >
                <div className="stepper-num">4</div>
                <span className="stepper-text">Verification</span>
              </div>
            </div>
          )}

          {/* STEP 1: ACCOUNT TYPE */}
          {step === 1 && (
            <div>
              <h2 className="step-heading">
                <span className="desk-step-heading">What type of account would you like to create?</span>
                <span className="mob-step-heading">Create your Account</span>
              </h2>
              <p className="step-subheading">
                <span className="desk-step-subheading">Select the option that best describes you.</span>
                <span className="mob-step-subheading">Choose your account type to get started with FORTAA.</span>
              </p>

              <div className="account-type-grid">
                {accountTypes.map((item) => {
                  const isSelected = formData.accountType === item.title;
                  return (
                    <div
                      key={item.title}
                      className={`account-type-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleChange('accountType', item.title)}
                    >
                      <div className="card-top-row">
                        <div className="card-icon-box">{item.icon}</div>
                        <h3 className="card-title desktop-card-title">{item.title}</h3>
                        <div className="card-top-arrow-btn">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#6226EA" : "#232356"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="card-content">
                        <h3 className="card-title mobile-card-title">{item.title}</h3>
                        <p className="card-desc">{item.desc}</p>
                      </div>
                      <div className="card-arrow mobile-card-arrow">→</div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Action Bar (Figma Frame 71 & Frame 28) */}
              <div className="account-type-bottom-bar desktop-only-bar">
                <button
                  type="button"
                  className="btn-desk-next"
                  onClick={() => setStep(2)}
                >
                  <span>Next</span>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Mobile Action Stack */}
              <div className="step1-action-stack mobile-only-stack">
                <button
                  type="button"
                  className="btn-auth-next-grad"
                  onClick={() => setStep(2)}
                >
                  <span>Next</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="auth-footer-prompt">
                  <span>Always have an account? </span>
                  <Link to="/login" className="auth-footer-login-link">
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL DETAILS */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <h2 className="step-heading">Personal Details</h2>
              <p className="step-subheading">Please provide your personal information to continue:</p>

              <div className="form-grid-2">
                {/* Row 1: Full Name & Email Address */}
                {/* Full Name */}
                <div className="form-field">
                  <label className="form-label">
                    Full Name<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className={`field-input ${touched.name && fieldErrors.name ? 'has-error' : ''}`}
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      required
                    />
                  </div>
                  {touched.name && fieldErrors.name && <span className="field-error-text">⚠️ {fieldErrors.name}</span>}
                </div>

                {/* Email Address */}
                <div className="form-field">
                  <label className="form-label">
                    Email Address<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className={`field-input ${touched.email && fieldErrors.email ? 'has-error' : ''}`}
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      required
                    />
                  </div>
                  {touched.email && fieldErrors.email && <span className="field-error-text">⚠️ {fieldErrors.email}</span>}
                </div>

                {/* Row 2: Mobile Number & WhatsApp Number */}
                {/* Mobile Number */}
                <div className="form-field">
                  <label className="form-label">
                    Mobile Number<span className="required">*</span>
                  </label>
                  <div className="phone-input-group">
                    <div className="country-code-pill">
                      <span>+91</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <div className="field-input-box" style={{ flex: 1 }}>
                      <input
                        type="tel"
                        className={`field-input no-icon ${touched.mobileNumber && fieldErrors.mobileNumber ? 'has-error' : ''}`}
                        placeholder="Enter your mobile number"
                        value={formData.mobileNumber}
                        onChange={(e) => handlePhoneInput('mobileNumber', e.target.value)}
                        onBlur={() => handleBlur('mobileNumber')}
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  {touched.mobileNumber && fieldErrors.mobileNumber && <span className="field-error-text">⚠️ {fieldErrors.mobileNumber}</span>}
                </div>

                {/* WhatsApp Number (Preserved) */}
                <div className="form-field">
                  <label className="form-label">
                    WhatsApp Number (Optional)
                  </label>
                  <div className="phone-input-group">
                    <div className="country-code-pill">
                      <span>+91</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <div className="field-input-box" style={{ flex: 1 }}>
                      <input
                        type="tel"
                        className={`field-input no-icon ${touched.whatsappNumber && fieldErrors.whatsappNumber ? 'has-error' : ''}`}
                        placeholder="Enter your WhatsApp number"
                        value={formData.whatsappNumber}
                        onChange={(e) => handlePhoneInput('whatsappNumber', e.target.value)}
                        onBlur={() => handleBlur('whatsappNumber')}
                        maxLength={10}
                      />
                    </div>
                  </div>
                  {touched.whatsappNumber && fieldErrors.whatsappNumber && <span className="field-error-text">⚠️ {fieldErrors.whatsappNumber}</span>}
                </div>

                {/* Row 3: Date of Birth & Gender */}
                {/* Date of Birth */}
                <div className="form-field">
                  <label className="form-label">
                    Date of Birth<span className="required">*</span>
                  </label>
                  <div
                    className="field-input-box"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (dateInputRef.current) {
                        try {
                          dateInputRef.current.showPicker();
                        } catch {
                          dateInputRef.current.focus();
                        }
                      }
                    }}
                  >
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <input
                      ref={dateInputRef}
                      type="date"
                      className={`field-input custom-date-input ${touched.dob && fieldErrors.dob ? 'has-error' : ''}`}
                      placeholder="DD/MM/YYYY"
                      value={formData.dob}
                      onChange={(e) => handleFieldChange('dob', e.target.value)}
                      onClick={(e) => {
                        try {
                          e.target.showPicker();
                        } catch {
                          // fallback
                        }
                      }}
                      onBlur={() => handleBlur('dob')}
                      style={{ cursor: 'pointer' }}
                      required
                    />
                  </div>
                  {touched.dob && fieldErrors.dob && <span className="field-error-text">⚠️ {fieldErrors.dob}</span>}
                </div>

                {/* Gender */}
                <div className="form-field">
                  <label className="form-label">
                    Gender<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <select
                      className={`field-select no-icon ${touched.gender && fieldErrors.gender ? 'has-error' : ''}`}
                      value={formData.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      onBlur={() => handleBlur('gender')}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="select-chevron">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                  {touched.gender && fieldErrors.gender && <span className="field-error-text">⚠️ {fieldErrors.gender}</span>}
                </div>

                {/* Row 4: Password field */}
                <div className="form-field">
                  <label className="form-label">
                    Password<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`field-input ${touched.password && fieldErrors.password ? 'has-error' : ''}`}
                      placeholder="Enter strong password (min 8 chars)"
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="3" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && <span className="field-error-text">⚠️ {fieldErrors.password}</span>}
                </div>

                {/* Row 4: Confirm Password field */}
                <div className="form-field">
                  <label className="form-label">
                    Confirm Password<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`field-input ${touched.confirmPassword && fieldErrors.confirmPassword ? 'has-error' : ''}`}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="3" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword && <span className="field-error-text">⚠️ {fieldErrors.confirmPassword}</span>}
                </div>

                {/* Password Criteria Checklist (Spans nicely under password) */}
                <div className="form-group-full">
                  <div className="password-requirements-card">
                    <div className="password-req-header">Password must contain:</div>
                    <div className="password-req-list">
                      <span className={`password-req-item ${passwordCriteria.minLength ? 'met' : ''}`}>
                        <span className="password-req-icon">{passwordCriteria.minLength ? '✓' : '○'}</span>
                        At least 8 characters
                      </span>
                      <span className={`password-req-item ${passwordCriteria.hasUpper ? 'met' : ''}`}>
                        <span className="password-req-icon">{passwordCriteria.hasUpper ? '✓' : '○'}</span>
                        1 uppercase letter (A-Z)
                      </span>
                      <span className={`password-req-item ${passwordCriteria.hasLower ? 'met' : ''}`}>
                        <span className="password-req-icon">{passwordCriteria.hasLower ? '✓' : '○'}</span>
                        1 lowercase letter (a-z)
                      </span>
                      <span className={`password-req-item ${passwordCriteria.hasNumber ? 'met' : ''}`}>
                        <span className="password-req-icon">{passwordCriteria.hasNumber ? '✓' : '○'}</span>
                        1 number (0-9)
                      </span>
                      <span
                        className={`password-req-item ${passwordCriteria.hasSpecial ? 'met' : ''}`}
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <span className="password-req-icon">{passwordCriteria.hasSpecial ? '✓' : '○'}</span>
                        1 special character (!@#$%^&* etc.)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Checkbox (Matching Figma Image 1) */}
                <div className="form-group-full" style={{ marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '13.5px', color: '#1A1A3A' }}>
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#5A2CE4' }}
                      required
                    />
                    <span>I agree to the Terms &amp; Conditions and Privacy Policy of Fortaa.</span>
                  </label>
                </div>
              </div>

              {/* Centered Next Button (Matching Figma Frame 28) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn-step-next"
                  style={{ width: '100%', maxWidth: '433px', height: '46px', background: '#5A2CE4', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Next →'}
                </button>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#5A2CE4', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '4px 8px' }}
                  onClick={() => setStep(1)}
                >
                  ← Back to Account Type
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: BUSINESS DETAILS */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit}>
              <h2 className="step-heading">Business Details</h2>
              <p className="step-subheading">Tell us more about your business and professional background.</p>

              <div className="form-grid-2">
                {/* Business Name */}
                <div className="form-field">
                  <label className="form-label">
                    Business Name<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Enter your business name"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Company / Brand */}
                <div className="form-field">
                  <label className="form-label">
                    Company/Brand<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="9" y1="22" x2="9" y2="22.01" />
                        <line x1="15" y1="22" x2="15" y2="22.01" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Enter your company/brand (e.g. Forever Living, Amway)"
                      value={formData.companyBrand}
                      onChange={(e) => handleChange('companyBrand', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Business Category */}
                <div className="form-field">
                  <label className="form-label">
                    Business Category<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <select
                      className="field-select no-icon"
                      value={formData.businessCategory}
                      onChange={(e) => handleChange('businessCategory', e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Health & Wellness">Health &amp; Wellness</option>
                      <option value="Beauty & Personal Care">Beauty &amp; Personal Care</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Nutrition">Nutrition</option>
                      <option value="FMCG">FMCG</option>
                      <option value="Technology">Technology</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="select-chevron">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Designation */}
                <div className="form-field">
                  <label className="form-label">
                    Designation<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Enter your designation (e.g. Senior Leader, Distributor)"
                      value={formData.designation}
                      onChange={(e) => handleChange('designation', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Experience in Direct Selling */}
                <div className="form-field">
                  <label className="form-label">
                    Experience in Direct Selling<span className="required">*</span>
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Enter your experience (e.g. 3 Years, 5+ Years)"
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Website / Social Media */}
                <div className="form-field">
                  <label className="form-label">Website / Social Media</label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Enter website or social media profile"
                      value={formData.websiteSocial}
                      onChange={(e) => handleChange('websiteSocial', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="step-actions-row">
                <button type="button" className="btn-step-back" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button type="submit" className="btn-step-next">
                  Next step →
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: VERIFICATION */}
          {step === 4 && (
            <div>
              <h2 className="step-heading">Verification</h2>
              <p className="step-subheading">Verify your identity to complete the registration process.</p>

              <div className="verification-list">
                {/* Mobile / WhatsApp Verification */}
                <div className={`verify-item-card ${formData.mobileVerified ? 'verified-card' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16, flexWrap: 'wrap' }}>
                    <div className="verify-left">
                      <div className="verify-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                      </div>
                      <div className="verify-info">
                        <h4>Mobile Verification (WhatsApp)</h4>
                        <p>{formData.mobileVerified ? 'Your mobile number is verified ✓' : 'We will send a 6-digit verification code to your WhatsApp'}</p>
                        <div className="verify-val">+91 {formData.whatsappNumber || formData.mobileNumber || '9876543210'}</div>
                      </div>
                    </div>
                    
                    {!formData.mobileVerified ? (
                      !showMobileOtpInput && (
                        <button
                          type="button"
                          className="btn-verify-action"
                          onClick={handleSendMobileOtp}
                          disabled={sendingMobileOtp}
                        >
                          {sendingMobileOtp ? 'Sending...' : 'Verify'}
                        </button>
                      )
                    ) : (
                      <button type="button" className="btn-verify-action verified">
                        Verified ✓
                      </button>
                    )}
                  </div>

                  {/* Inline WhatsApp OTP Input Box */}
                  {showMobileOtpInput && !formData.mobileVerified && (
                    <div className="email-otp-drawer">
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>
                        Enter the 6-digit code sent to WhatsApp <span style={{ color: '#059669' }}>+91 {formData.whatsappNumber || formData.mobileNumber}</span>:
                      </div>
                      <div className="email-otp-row">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="••••••"
                          className="email-otp-input"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn-otp-submit"
                          onClick={handleVerifyMobileOtp}
                          disabled={verifyingMobileOtp || mobileOtp.length !== 6}
                        >
                          {verifyingMobileOtp ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button
                          type="button"
                          className="btn-otp-resend"
                          onClick={handleSendMobileOtp}
                          disabled={mobileResendTimer > 0 || sendingMobileOtp}
                          title={mobileResendTimer > 0 ? `Please wait ${mobileResendTimer}s before requesting a new code` : 'Resend WhatsApp code'}
                        >
                          {mobileResendTimer > 0 ? `Resend (${mobileResendTimer}s)` : 'Resend'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Verification */}
                <div className={`verify-item-card ${formData.emailVerified ? 'verified-card' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16, flexWrap: 'wrap' }}>
                    <div className="verify-left">
                      <div className="verify-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <div className="verify-info">
                        <h4>Email Verification</h4>
                        <p>{formData.emailVerified ? 'Your email address is verified ✓' : 'We will send a 6-digit verification code to your email'}</p>
                        <div className="verify-val">{formData.email || 'example@gmail.com'}</div>
                      </div>
                    </div>
                    
                    {!formData.emailVerified ? (
                      !showEmailOtpInput && (
                        <button
                          type="button"
                          className="btn-verify-action"
                          onClick={handleSendEmailOtp}
                          disabled={sendingOtp}
                        >
                          {sendingOtp ? 'Sending...' : 'Verify'}
                        </button>
                      )
                    ) : (
                      <button type="button" className="btn-verify-action verified">
                        Verified ✓
                      </button>
                    )}
                  </div>

                  {/* Inline OTP Input Box */}
                  {showEmailOtpInput && !formData.emailVerified && (
                    <div className="email-otp-drawer">
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>
                        Enter the 6-digit code sent to <span style={{ color: '#5B21B6' }}>{formData.email}</span>:
                      </div>
                      <div className="email-otp-row">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="••••••"
                          className="email-otp-input"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn-otp-submit"
                          onClick={handleVerifyEmailOtp}
                          disabled={verifyingOtp || emailOtp.length !== 6}
                        >
                          {verifyingOtp ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button
                          type="button"
                          className="btn-otp-resend"
                          onClick={handleSendEmailOtp}
                          disabled={resendTimer > 0 || sendingOtp}
                          title={resendTimer > 0 ? `Please wait ${resendTimer}s before requesting a new code` : 'Resend verification code'}
                        >
                          {sendingOtp ? (
                            <span>Sending...</span>
                          ) : resendTimer > 0 ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>Resend in {resendTimer}s</span>
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                              </svg>
                              <span>Resend Code</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn-otp-cancel"
                          onClick={() => setShowEmailOtpInput(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="step-actions-row">
                <button type="button" className="btn-step-back" onClick={() => setStep(3)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn-step-next"
                  onClick={handleCompleteRegistration}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
}
