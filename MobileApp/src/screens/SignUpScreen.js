import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAccountTypes, registerApi } from '../services/api';

export default function SignUpScreen({ onNavigateToLogin, onRegisterSuccess }) {
  const [step, setStep] = useState(1);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Form State
  const [selectedAccountType, setSelectedAccountType] = useState('Individual / Professional');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Male');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch dynamic account types from backend
  useEffect(() => {
    let isMounted = true;
    getAccountTypes().then((types) => {
      if (isMounted && types && types.length > 0) {
        setAccountTypes(types);
        setSelectedAccountType(types[0].title);
      } else if (isMounted) {
        // Fallback default types matching Figma
        const fallbackTypes = [
          {
            id: '1',
            title: 'Individual / Professional',
            description: 'Doctors, Engineers, Advocates, Artists, Consultants, Freelancers',
            icon: 'user',
          },
          {
            id: '2',
            title: 'Proprietorship / MSME',
            description: 'Single-owner businesses, traders, manufacturers, small enterprises',
            icon: 'briefcase',
          },
          {
            id: '3',
            title: 'Partnership / LLP',
            description: 'Firms with two or more partners, registered partnerships, LLPs',
            icon: 'users',
          },
          {
            id: '4',
            title: 'Private Limited / Public Ltd',
            description: 'Registered corporations, large manufacturers, tech startups',
            icon: 'building',
          },
        ];
        setAccountTypes(fallbackTypes);
        setSelectedAccountType(fallbackTypes[0].title);
      }
      setLoadingTypes(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const getIconName = (key) => {
    switch ((key || '').toLowerCase()) {
      case 'building':
      case 'company':
      case 'business':
        return 'briefcase';
      case 'briefcase':
      case 'distributor':
      case 'partner':
        return 'award';
      case 'users':
      case 'team':
      case 'leader':
        return 'users';
      case 'star':
        return 'star';
      case 'growth':
      case 'trending':
        return 'trending-up';
      default:
        return 'user';
    }
  };

  const handleNextStep = () => {
    if (!selectedAccountType) {
      Alert.alert('Required', 'Please select an account type to proceed.');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const payload = {
      accountType: selectedAccountType,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: whatsappNumber.trim() || mobileNumber.trim(),
      password,
      gender,
      agreeTerms: true,
    };

    try {
      const data = await registerApi(payload);
      Alert.alert('Success 🎉', 'Account created successfully! You are now logged in.');
      if (onRegisterSuccess) {
        onRegisterSuccess(data.user || data);
      } else {
        onNavigateToLogin();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FAF7FF', '#F3ECFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Decorative Brand Ambient Glows */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header / Brand Logo (Exact Figma Style) */}
        <View style={styles.topHeader}>
          {/* Back button if Step 2, or back to login */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (step === 2 ? setStep(1) : onNavigateToLogin())}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color="#232356" />
          </TouchableOpacity>

          <View style={styles.brandLogoRow}>
            <Image
              source={require('../../assets/figma/logo_icon_img.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <View style={styles.logoTextWrap}>
              <Image
                source={require('../../assets/figma/logo_text_img.png')}
                style={styles.logoWord}
                resizeMode="contain"
              />
              <Text style={styles.logoTagline}>Discover, easy and Grow</Text>
            </View>
          </View>

          {/* Language Selector Pill */}
          <View style={styles.langPill}>
            <Text style={styles.langPillText}>EN</Text>
            <Feather name="chevron-down" size={12} color="#232356" />
          </View>
        </View>

        {/* Stepper Card (Figma: width 392px, height 69px, background #FFFFFF, radius 10px) */}
        <View style={styles.stepperCard}>
          <TouchableOpacity
            style={styles.stepperNode}
            onPress={() => setStep(1)}
            activeOpacity={0.7}
          >
            <View style={[styles.stepperNumBox, step === 1 && styles.stepperNumBoxActive]}>
              <Text style={[styles.stepperNumText, step === 1 && styles.stepperNumTextActive]}>1</Text>
            </View>
            <Text style={[styles.stepperLabel, step === 1 && styles.stepperLabelActive]}>
              Account Type
            </Text>
          </TouchableOpacity>

          <View style={styles.stepperLine} />

          <View style={styles.stepperNode}>
            <View style={[styles.stepperNumBox, step === 2 && styles.stepperNumBoxActive]}>
              <Text style={[styles.stepperNumText, step === 2 && styles.stepperNumTextActive]}>2</Text>
            </View>
            <Text style={[styles.stepperLabel, step === 2 && styles.stepperLabelActive]}>
              Personal Details
            </Text>
          </View>

          <View style={styles.stepperLine} />

          <View style={styles.stepperNode}>
            <View style={styles.stepperNumBox}>
              <Text style={styles.stepperNumText}>3</Text>
            </View>
            <Text style={styles.stepperLabel}>Business</Text>
          </View>

          <View style={styles.stepperLine} />

          <View style={styles.stepperNode}>
            <View style={styles.stepperNumBox}>
              <Text style={styles.stepperNumText}>4</Text>
            </View>
            <Text style={styles.stepperLabel}>Verify</Text>
          </View>
        </View>

        {/* STEP 1: ACCOUNT TYPE SELECTION */}
        {step === 1 && (
          <View style={styles.stepContent}>
            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.stepTitle}>Create your Account</Text>
              <Text style={styles.stepSubtitle}>
                Choose your account type to get started with FORTAA.
              </Text>
            </View>

            {loadingTypes ? (
              <ActivityIndicator size="large" color="#6226EA" style={{ marginVertical: 40 }} />
            ) : (
              /* 2x2 Grid of Account Types */
              <View style={styles.gridContainer}>
                {accountTypes.map((item) => {
                  const isSelected = selectedAccountType === item.title;

                  if (isSelected) {
                    return (
                      <TouchableOpacity
                        key={item.id || item.title}
                        style={styles.cardWrapper}
                        onPress={() => setSelectedAccountType(item.title)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={['#CF62F5', '#6226EA']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.cardGradient}
                        >
                          {/* Card Top Row */}
                          <View style={styles.cardTopRow}>
                            <LinearGradient
                              colors={['#BE84FC', '#6420D6']}
                              start={{ x: 1, y: 0 }}
                              end={{ x: 0, y: 0 }}
                              style={styles.cardIconBox}
                            >
                              <Feather name={getIconName(item.icon)} size={22} color="#FFFFFF" />
                            </LinearGradient>

                            <View style={styles.cardTopArrowBtn}>
                              <Feather name="arrow-right" size={18} color="#6226EA" />
                            </View>
                          </View>

                          {/* Card Content */}
                          <Text style={styles.cardTitleSelected}>{item.title}</Text>
                          <Text style={styles.cardDescSelected} numberOfLines={4}>
                            {item.description || item.desc}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={item.id || item.title}
                      style={[styles.cardWrapper, styles.cardUnselected]}
                      onPress={() => setSelectedAccountType(item.title)}
                      activeOpacity={0.8}
                    >
                      {/* Card Top Row */}
                      <View style={styles.cardTopRow}>
                        <LinearGradient
                          colors={['#BE84FC', '#6420D6']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 0 }}
                          style={styles.cardIconBox}
                        >
                          <Feather name={getIconName(item.icon)} size={22} color="#FFFFFF" />
                        </LinearGradient>

                        <View style={styles.cardTopArrowBtn}>
                          <Feather name="arrow-right" size={18} color="#232356" />
                        </View>
                      </View>

                      {/* Card Content */}
                      <Text style={styles.cardTitleUnselected}>{item.title}</Text>
                      <Text style={styles.cardDescUnselected} numberOfLines={4}>
                        {item.description || item.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Mobile Action Stack */}
            <View style={styles.actionStack}>
              <TouchableOpacity
                style={styles.nextBtnTouchable}
                onPress={handleNextStep}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#DC3AEE', '#5321E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextBtnGrad}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                  <Feather name="arrow-right" size={22} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerPrompt}>
                <Text style={styles.footerPromptText}>Always have an account? </Text>
                <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                  <Text style={styles.footerLoginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: PERSONAL DETAILS */}
        {step === 2 && (
          <View style={styles.stepContent}>
            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.stepTitle}>Personal Details</Text>
              <Text style={styles.stepSubtitle}>
                Please provide your personal information to continue:
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#F04438" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={18} color="#232356" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(35, 35, 86, 0.65)"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Email Address <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={18} color="#232356" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter your email address"
                    placeholderTextColor="rgba(35, 35, 86, 0.65)"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrorMessage('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Mobile Number with Country Code */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Mobile Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.phoneGroupRow}>
                  <View style={styles.countryCodePill}>
                    <Text style={styles.countryCodeText}>+91</Text>
                    <Feather name="chevron-down" size={12} color="#232356" />
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <Feather name="phone" size={16} color="#232356" style={styles.inputIconLeft} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="10-digit number"
                      placeholderTextColor="rgba(35, 35, 86, 0.65)"
                      value={mobileNumber}
                      onChangeText={(text) => {
                        setMobileNumber(text);
                        setErrorMessage('');
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
              </View>

              {/* WhatsApp Number (Optional) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>WhatsApp Number</Text>
                <View style={styles.phoneGroupRow}>
                  <View style={styles.countryCodePill}>
                    <Text style={styles.countryCodeText}>+91</Text>
                    <Feather name="chevron-down" size={12} color="#232356" />
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <Feather name="message-circle" size={16} color="#232356" style={styles.inputIconLeft} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="WhatsApp number"
                      placeholderTextColor="rgba(35, 35, 86, 0.65)"
                      value={whatsappNumber}
                      onChangeText={(text) => {
                        setWhatsappNumber(text);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
              </View>

              {/* Gender Selection */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Gender <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => {
                    const isActive = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderPill, isActive && styles.genderPillActive]}
                        onPress={() => setGender(g)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.genderPillText, isActive && styles.genderPillTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Password <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} color="#232356" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Min 6 characters"
                    placeholderTextColor="rgba(35, 35, 86, 0.65)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrorMessage('');
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={18}
                      color="#BC45F8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Confirm Password <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} color="#232356" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Re-enter password"
                    placeholderTextColor="rgba(35, 35, 86, 0.65)"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setErrorMessage('');
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={18}
                      color="#BC45F8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.nextBtnTouchable, { marginTop: 12 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#DC3AEE', '#5321E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextBtnGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>Create Account</Text>
                      <Feather name="arrow-right" size={22} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Back to Step 1 */}
              <TouchableOpacity
                style={styles.btnBackOutline}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={16} color="#53029E" />
                <Text style={styles.btnBackOutlineText}>Back to Account Types</Text>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footerPrompt}>
                <Text style={styles.footerPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                  <Text style={styles.footerLoginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    position: 'relative',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(207, 98, 245, 0.12)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(98, 38, 234, 0.09)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40),
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
    position: 'relative',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 38,
    height: 38,
  },
  logoTextWrap: {
    justifyContent: 'center',
  },
  logoWord: {
    width: 90,
    height: 22,
  },
  logoTagline: {
    fontSize: 9.5,
    color: '#34285B',
    letterSpacing: 0.2,
    fontWeight: '500',
    marginTop: -2,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#232356',
  },

  /* Stepper Card */
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F1F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stepperNode: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  stepperNumBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNumBoxActive: {
    backgroundColor: '#6114D6',
  },
  stepperNumText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C1F7A',
  },
  stepperNumTextActive: {
    color: '#FFFFFF',
  },
  stepperLabel: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#34285B',
    textAlign: 'center',
  },
  stepperLabelActive: {
    fontWeight: '700',
    color: '#6114D6',
  },
  stepperLine: {
    width: 14,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },

  /* Step Content */
  stepContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  titleSection: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#232356',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 12.5,
    color: '#232356',
    lineHeight: 17,
  },

  /* Grid 2x2 */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  cardWrapper: {
    width: '48.5%',
    minHeight: 205,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardUnselected: {
    backgroundColor: '#D9D9D9',
    padding: 12,
    justifyContent: 'flex-start',
  },
  cardGradient: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    justifyContent: 'flex-start',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleSelected: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  cardTitleUnselected: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#232356',
    marginBottom: 6,
    lineHeight: 18,
  },
  cardDescSelected: {
    fontSize: 11.5,
    color: '#FFFFFF',
    lineHeight: 15,
  },
  cardDescUnselected: {
    fontSize: 11.5,
    color: '#34285B',
    lineHeight: 15,
  },

  /* Actions */
  actionStack: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  nextBtnTouchable: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#DC3AEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnGrad: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerPromptText: {
    fontSize: 14,
    color: 'rgba(83, 2, 158, 0.55)',
  },
  footerLoginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5321E8',
  },

  /* Form Container (Step 2) */
  formContainer: {
    width: '100%',
    gap: 12,
  },
  fieldBlock: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#232356',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232356',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 12,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    height: 46,
    fontSize: 14.5,
    color: '#232356',
    padding: 0,
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodePill: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#232356',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232356',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderPill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillActive: {
    borderColor: '#6114D6',
    backgroundColor: '#6114D6',
  },
  genderPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34285B',
  },
  genderPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnBackOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#53029E',
    gap: 6,
    marginTop: 6,
  },
  btnBackOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#53029E',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
