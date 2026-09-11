import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';

export default function Index() {
  const { user, loading, onboardingData, onboardingComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // A simple delay to avoid layout warning during mount routing
    const timeout = setTimeout(() => {
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      if (user.is_admin === true) {
        router.replace('/(admin-tabs)/users');
        return;
      }

      if (!onboardingComplete) {
        // If onboarding is incomplete, redirect to the current step
        const currentStep = onboardingData?.currentStep || 'role_selection';
        
        // Convert step names like 'role_selection' to valid routes like 'role-selection'
        const routeName = currentStep.replace(/_/g, '-');
        router.replace(`/onboarding/${routeName}`);
        return;
      }

      // Authenticated and onboarding complete
      const role = onboardingData?.role;
      if (role === 'Brand') {
        router.replace('/(brand-tabs)/home');
      } else {
        router.replace('/(influencer-tabs)/home');
      }
    }, 1);

    return () => clearTimeout(timeout);
  }, [user, loading, onboardingComplete, onboardingData, segments, router]);

  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={loadingStyles.text}>Loading Matchr...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#8A8A8A',
    fontSize: 16,
    marginTop: 16,
  },
});
