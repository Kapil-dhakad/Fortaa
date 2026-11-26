import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loginApi, googleLoginApi } from '../services/api';

export default function LoginScreen({ onNavigateToSignUp, onLoginSuccess }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const data = await loginApi({ identifier: emailOrPhone, password });
      Alert.alert('Success', 'Welcome to FORTAA!');
      if (onLoginSuccess) {
        onLoginSuccess(data.user || data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performGoogleAuth = async (googleEmail) => {
    try {
      setLoading(true);
      const name = googleEmail.split('@')[0];
      const data = await googleLoginApi({
        email: googleEmail,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        picture: null,
      });
      Alert.alert('Google Sign-In Successful 🎉', `Welcome, ${data.user?.name || name}!`);
      if (onLoginSuccess) {
        onLoginSuccess(data.user || data);
      }
    } catch (err) {
      Alert.alert('Google Sign-In', err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert(
        'Google Sign-In',
        'Please enter your Google Email address in the box above, then tap "Continue with Google".'
      );
      return;
    }
    performGoogleAuth(trimmed);
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

          {/* Language Selector Pill (Figma: EN v) */}
          <View style={styles.langPill}>
            <Text style={styles.langPillText}>EN</Text>
            <Feather name="chevron-down" size={12} color="#232356" />
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.authTitle}>Welcome Back</Text>
          <Text style={styles.authSubtitle}>Sign in to your account</Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color="#F04438" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Inputs Container */}
        <View style={styles.formContainer}>
          {/* Email or Phone Input (Figma Frame 61) */}
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color="#232356" style={styles.inputIconLeft} />
            <TextInput
              style={styles.formInput}
              placeholder="Email or Mobile Number"
              placeholderTextColor="rgba(35, 35, 86, 0.65)"
              value={emailOrPhone}
              onChangeText={(text) => {
                setEmailOrPhone(text);
                setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input (Figma Frame 62) */}
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color="#232356" style={styles.inputIconLeft} />
            <TextInput
              style={styles.formInput}
              placeholder="Password"
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

          {/* Forget Password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => Alert.alert('Forget Password', 'Please use Web Portal to reset password.')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forget Password?</Text>
          </TouchableOpacity>

          {/* Social Buttons Stack: Google + LinkedIn (Figma Specs) */}
          <View style={styles.socialStack}>
            {/* Google Button */}
            <TouchableOpacity
              style={styles.btnGoogle}
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
            >
              <View style={styles.socialIconBox}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.btnGoogleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* LinkedIn Button */}
            <TouchableOpacity
              style={styles.btnLinkedIn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('LinkedIn Sign-In', 'LinkedIn Authentication')}
            >
              <View style={styles.socialIconBox}>
                <Text style={styles.linkedInIconText}>in</Text>
              </View>
              <Text style={styles.btnLinkedInText}>Continue with LinkedIn</Text>
            </TouchableOpacity>
          </View>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up with Email Button (Figma Frame 60) */}
          <TouchableOpacity
            style={styles.btnSignUpEmail}
            onPress={onNavigateToSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSignUpEmailText}>Sign Up with Email</Text>
          </TouchableOpacity>

          {/* Primary Gradient Next Button (Figma #DC3AEE to #5321E8) */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.nextBtnTouchable}
          >
            <LinearGradient
              colors={['#DC3AEE', '#5321E8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Next</Text>
                  <Feather name="arrow-right" size={22} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Switch Prompt */}
          <View style={styles.footerPrompt}>
            <Text style={styles.footerPromptText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp} activeOpacity={0.7}>
              <Text style={styles.footerLoginLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoTextWrap: {
    flexDirection: 'column',
  },
  logoWord: {
    width: 82,
    height: 18,
  },
  logoTagline: {
    fontSize: 9,
    color: '#6326AE',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
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
    fontWeight: '700',
    color: '#232356',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  authTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    fontSize: 28,
    fontWeight: '700',
    color: '#232356',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#232356',
    textAlign: 'center',
    opacity: 0.85,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECDCA',
    maxWidth: 340,
    alignSelf: 'center',
    width: '100%',
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#232356',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    fontSize: 15,
    color: '#232356',
    fontWeight: '400',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 14,
    color: '#232356',
    fontWeight: '500',
  },
  socialStack: {
    gap: 10,
    marginBottom: 14,
  },
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4285F4',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285F4',
  },
  btnGoogleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#232356',
  },
  btnLinkedIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#29B6EB',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  socialIconBox: {
    width: 20,
    alignItems: 'center',
  },
  linkedInIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A66C2',
  },
  btnLinkedInText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#232356',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#000000',
    opacity: 0.8,
  },
  dividerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#232356',
  },
  btnSignUpEmail: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#53029E',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  btnSignUpEmailText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#53029E',
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
});
