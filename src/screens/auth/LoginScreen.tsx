import { useState, type ReactNode } from 'react';

import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'email_login' | 'email_signup';

function AuthButton({
  label,
  variant,
  width,
  onPress,
  loading,
}: {
  label: string;
  variant: 'primary' | 'secondary';
  width: number;
  onPress?: () => void;
  loading?: boolean;
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        {
          width: '100%',
          minHeight: isPrimary ? 64 : 56,
        },
        loading && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.text : '#111111'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function SocialButton({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.socialButton} onPress={onPress}>
      {children}
    </Pressable>
  );
}

function FooterLink({
  lead,
  action,
  onPress,
}: {
  lead: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{lead} </Text>
      <Pressable onPress={onPress}>
        <Text style={styles.footerLink}>{action}</Text>
      </Pressable>
    </View>
  );
}

// Email/Password Auth Form
function EmailAuthForm({
  mode,
  onBack,
}: {
  mode: 'email_login' | 'email_signup';
  onBack: () => void;
}) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 28, 500);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'email_signup';

  const handleSubmit = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.emailContainer}>
          <View style={[styles.emailContent, { width: contentWidth }]}>
            {/* Back Button */}
            <Pressable onPress={onBack} style={styles.backButton}>
              <AntDesign name="arrow-left" size={24} color={colors.text} />
            </Pressable>

            <Text style={styles.emailTitle}>
              {isSignup ? 'Create\naccount' : 'Welcome\nback'}
            </Text>
            <Text style={styles.emailSubtitle}>
              {isSignup
                ? 'Enter your email and password to get started'
                : 'Sign in with your email and password'}
            </Text>

            {/* Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="your@email.com"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType={isSignup ? 'next' : 'done'}
                onSubmitEditing={isSignup ? undefined : Keyboard.dismiss}
              />
            </View>

            {/* Confirm Password (signup only) */}
            {isSignup ? (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#666666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={() => { Keyboard.dismiss(); handleSubmit(); }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignup ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main Auth Page (Google/Email selector)
function AuthPage({
  mode,
  onSwitchMode,
}: {
  mode: 'login' | 'signup';
  onSwitchMode: (mode: AuthMode) => void;
}) {
  const { signInWithGoogle, signInWithApple, signInWithLinkedIn } = useAuth();
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - 28, 500);
  const titleSize = 48;
  const subtitleSize = 18;
  const topSpacing = Math.max(height * 0.20, 140);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = mode === 'login';
  const title = isLogin ? 'Login' : 'Sign Up';
  const subtitle = isLogin ? "It's easier to login now" : "It's easier to sign up now";
  const footerLead = isLogin ? "Don't have an account?" : 'Already have an account?';
  const footerAction = isLogin ? 'SignUp' : 'Login';

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Apple sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithLinkedIn();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'LinkedIn sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { paddingTop: topSpacing }]}>
          <View style={[styles.content, { width: contentWidth }]}>
            <Text
              style={[
                styles.title,
                { fontSize: titleSize, lineHeight: titleSize * 0.98 },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { fontSize: subtitleSize, lineHeight: subtitleSize * 1.28 },
              ]}
            >
              {subtitle}
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.buttonStack}>
              <AuthButton
                label="Continue with google"
                variant="primary"
                width={contentWidth}
                onPress={handleGoogleSignIn}
                loading={loading}
              />
              <AuthButton
                label="I'll use email or phone instead"
                variant="secondary"
                width={contentWidth}
                onPress={() =>
                  onSwitchMode(isLogin ? 'email_login' : 'email_signup')
                }
              />
            </View>

            <Text style={styles.separator}>Or</Text>

            <View style={styles.socialRow}>
              <SocialButton onPress={handleLinkedInSignIn}>
                <FontAwesome
                  name="linkedin-square"
                  size={24}
                  color={colors.background}
                />
              </SocialButton>
              <SocialButton onPress={handleAppleSignIn}>
                <AntDesign
                  name="apple1"
                  size={24}
                  color={colors.background}
                />
              </SocialButton>
              <SocialButton>
                <FontAwesome name="facebook" size={22} color={colors.background} />
              </SocialButton>
            </View>

            <FooterLink
              lead={footerLead}
              action={footerAction}
              onPress={() =>
                onSwitchMode(isLogin ? 'signup' : 'login')
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'email_login' || mode === 'email_signup') {
    return (
      <EmailAuthForm
        mode={mode}
        onBack={() => setMode(mode === 'email_login' ? 'login' : 'signup')}
      />
    );
  }

  return <AuthPage mode={mode} onSwitchMode={setMode} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  content: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -2,
    textAlign: 'center',
  },
  subtitle: {
    color: '#F0F0F0',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 18,
  },
  buttonStack: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 48,
  },
  button: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    textAlign: 'center',
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '400',
  },
  separator: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 48,
  },
  footerText: {
    color: '#D4D4D4',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  // Email auth form styles
  emailContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 60,
    paddingBottom: 42,
    backgroundColor: colors.background,
  },
  emailContent: {
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    marginBottom: 32,
  },
  emailTitle: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    marginBottom: 12,
  },
  emailSubtitle: {
    color: '#8A8A8A',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#262626',
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
