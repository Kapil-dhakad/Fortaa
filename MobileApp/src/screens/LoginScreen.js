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
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { loginApi, googleLoginApi } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '620993789654-2q0r7h7hpddu1vd8lvrghftsj4pl3sss.apps.googleusercontent.com';

export default function LoginScreen({ onNavigateToSignUp, onLoginSuccess }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamically load Google Identity Services (GIS) on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('google-gsi-client')) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, []);

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
      if (onLoginSuccess) {
        onLoginSuccess(data.user || data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performGoogleAuth = async (googleEmail, customName = null, picture = null) => {
    try {
      setLoading(true);
      const name = customName || googleEmail.split('@')[0];
      const data = await googleLoginApi({
        email: googleEmail.trim().toLowerCase(),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        picture: picture || null,
      });
      if (onLoginSuccess) {
        onLoginSuccess(data.user || data);
      }
    } catch (err) {
      Alert.alert('Google Sign-In Failed', err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In with user's own device/browser accounts
  const handleGoogleSignIn = async () => {
    // 1. If user already typed their email in the input box, use it directly
    const trimmed = emailOrPhone.trim();
    if (trimmed && trimmed.includes('@')) {
      performGoogleAuth(trimmed);
      return;
    }

    // 2. Web browser: Open Google Identity Services account chooser
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const gUser = await userinfoRes.json();
                if (gUser?.email) {
                  await performGoogleAuth(gUser.email, gUser.name, gUser.picture);
                } else {
                  setLoading(false);
                }
              } catch (e) {
                setLoading(false);
                Alert.alert('Google Sign-In Error', e.message);
              }
            } else {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        setLoading(false);
        console.warn('Google web OAuth error:', err);
      }
    }

    // 3. Mobile Native: Open system browser with Google OAuth 2.0 select_account
    try {
      setLoading(true);
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mobileapp' });
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&prompt=select_account`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type === 'success' && result.url) {
        const match = result.url.match(/access_token=([^&]+)/);
        if (match && match[1]) {
          const accessToken = match[1];
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const gUser = await userinfoRes.json();
          if (gUser?.email) {
            await performGoogleAuth(gUser.email, gUser.name, gUser.picture);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Native Google Auth session error:', err);
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

        {/* Hero Section: "Join the Fortaa Community" (Exact Web Mobile Match) */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Join the Fortaa Community</Text>
          <Text style={styles.heroSubtitle}>
            Create your account and start your journey in the direct selling and network marketing ecosystem.
          </Text>
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

          {/* Social Buttons Stack: Google + LinkedIn (Exact Match to Screenshot) */}
          <View style={styles.socialStack}>
            {/* Google Button: Vibrant Blue BG, White Text, White circle with G icon */}
            <TouchableOpacity
              style={styles.btnGoogle}
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
            >
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={13} color="#EA4335" />
              </View>
              <Text style={styles.btnGoogleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* LinkedIn Button: White BG, Sky Blue Border, 'in' badge, Dark Text */}
            <TouchableOpacity
              style={styles.btnLinkedIn}
              activeOpacity={0.85}
              onPress={() => Alert.alert('LinkedIn Sign-In', 'LinkedIn authentication is available on Fortaa Web Portal.')}
            >
              <View style={styles.linkedInIconBox}>
                <Ionicons name="logo-linkedin" size={13} color="#FFFFFF" />
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

          {/* Primary Gradient Next Button (Matching Web Mobile #BC45F8 to #6220FE) */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.nextBtnTouchable}
          >
            <LinearGradient
              colors={['#BC45F8', '#6220FE']}
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

          {/* Footer Switch Prompt: Don't have an account? Create one */}
          <View style={styles.footerPrompt}>
            <Text style={styles.footerPromptText}>Don’t have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp} activeOpacity={0.7}>
              <Text style={styles.footerLoginLink}>Create one</Text>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 26,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
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
  heroSection: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#232356',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(35, 35, 86, 0.75)',
    fontWeight: '400',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    fontSize: 24,
    fontWeight: '700',
    color: '#232356',
    letterSpacing: 0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
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
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECDCA',
    maxWidth: 420,
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
    maxWidth: 420,
    alignSelf: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 10,
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
    alignSelf: 'flex-start',
    marginBottom: 14,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 13.5,
    color: '#BC45F8',
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
    backgroundColor: '#1A73E8',
    paddingHorizontal: 16,
    gap: 10,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGoogleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnLinkedIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    gap: 10,
  },
  linkedInIconBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLinkedInText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#232356',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  btnSignUpEmail: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#7C3AED',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  btnSignUpEmailText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#7C3AED',
  },
  nextBtnTouchable: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#BC45F8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnGrad: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  footerPromptText: {
    fontSize: 13.5,
    color: 'rgba(35, 35, 86, 0.7)',
  },
  footerLoginLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6220FE',
  },
});
