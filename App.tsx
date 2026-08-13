import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RoleSelectionScreen } from '@/screens/onboarding/shared/RoleSelectionScreen';
import { NameInputScreen } from '@/screens/onboarding/shared/NameInputScreen';
import { DateOfBirthScreen } from '@/screens/onboarding/influencer/DateOfBirthScreen';
import { GenderSelectionScreen } from '@/screens/onboarding/influencer/GenderSelectionScreen';
import { SocialPlatformSelectionScreen } from '@/screens/onboarding/influencer/SocialPlatformSelectionScreen';
import { CategorySelectionScreen } from '@/screens/onboarding/influencer/CategorySelectionScreen';
import { LocationEntryScreen } from '@/screens/onboarding/influencer/LocationEntryScreen';
import { BioInputScreen } from '@/screens/onboarding/influencer/BioInputScreen';
import { PhotoUploadScreen } from '@/screens/onboarding/influencer/PhotoUploadScreen';
import { PricePackagesScreen } from '@/screens/onboarding/influencer/PricePackagesScreen';
import { BrandPlatformSelectionScreen } from '@/screens/onboarding/brand/BrandPlatformSelectionScreen';
import { BrandLocationScreen } from '@/screens/onboarding/brand/BrandLocationScreen';
import { BrandBioInputScreen } from '@/screens/onboarding/brand/BrandBioInputScreen';
import { BrandLogoUploadScreen } from '@/screens/onboarding/brand/BrandLogoUploadScreen';
import { BrandCampaignUploadScreen } from '@/screens/onboarding/brand/BrandCampaignUploadScreen';
import { BrandCategorySelectionScreen } from '@/screens/onboarding/brand/BrandCategorySelectionScreen';
import { DashboardScreen } from '@/screens/main/influencer/DashboardScreen';
import { BrandDashboardScreen } from '@/screens/main/brand/BrandDashboardScreen';
import { colors } from '@/theme/colors';

type Step =
  | 'role_selection'
  | 'name_input'
  | 'dob_input'
  | 'gender_input'
  | 'social_platforms'
  | 'categories'
  | 'location'
  | 'bio_input'
  | 'photos'
  | 'price_packages'
  | 'brand_platforms'
  | 'brand_location'
  | 'brand_bio_input'
  | 'brand_logo_upload'
  | 'brand_campaign_upload'
  | 'brand_categories';

type Role = 'Brand' | 'Influencer' | null;

function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={loadingStyles.text}>Loading...</Text>
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

function AppContent() {
  const { user, loading, onboardingData, onboardingComplete, updateOnboarding, completeOnboarding, signOut } = useAuth();

  // Derive step and role from onboarding data
  const [step, setStep] = useState<Step>('role_selection');
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  // Sync step from Firestore onboarding data on load
  useEffect(() => {
    if (onboardingData) {
      if (onboardingData.currentStep) {
        setStep(onboardingData.currentStep as Step);
      }
      if (onboardingData.role) {
        setSelectedRole(onboardingData.role);
      }
    }
  }, [onboardingData?.currentStep, onboardingData?.role]);

  // Helper to save step + data to Firestore
  const goToStep = async (nextStep: Step, data?: Record<string, any>) => {
    setStep(nextStep);
    await updateOnboarding({ currentStep: nextStep, ...data });
  };

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated — show login
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated & onboarding complete — route by role
  if (onboardingComplete) {
    return onboardingData?.role === 'Brand'
      ? <BrandDashboardScreen />
      : <DashboardScreen />;
  }

  // Authenticated but onboarding in progress — show onboarding flow
  return (
    <>
      {step === 'brand_categories' ? (
        <BrandCategorySelectionScreen
          onBack={() => goToStep('brand_campaign_upload')}
          onNext={async (categories) => {
            await updateOnboarding({ categories, currentStep: 'brand_categories' });
            await completeOnboarding();
          }}
        />
      ) : step === 'brand_campaign_upload' ? (
        <BrandCampaignUploadScreen
          onBack={() => goToStep('brand_logo_upload')}
          onNext={(campaignPhotos) => goToStep('brand_categories', { 
            photos: [...(onboardingData?.photos || []), ...campaignPhotos] 
          })}
        />
      ) : step === 'brand_logo_upload' ? (
        <BrandLogoUploadScreen
          onBack={() => goToStep('brand_bio_input')}
          onNext={(logo) => goToStep('brand_campaign_upload', { logo })}
        />
      ) : step === 'brand_bio_input' ? (
        <BrandBioInputScreen
          onBack={() => goToStep('brand_location')}
          onNext={(bio) => goToStep('brand_logo_upload', { bio })}
        />
      ) : step === 'brand_location' ? (
        <BrandLocationScreen
          onBack={() => goToStep('brand_platforms')}
          onAllow={(location) => goToStep('brand_bio_input', { location })}
        />
      ) : step === 'brand_platforms' ? (
        <BrandPlatformSelectionScreen
          onBack={() => goToStep('name_input')}
          onNext={(platforms) => goToStep('brand_location', { platforms })}
        />
      ) : step === 'price_packages' ? (
        <PricePackagesScreen
          onBack={() => goToStep('photos')}
          onStart={async (packages) => {
            await updateOnboarding({ packages, currentStep: 'price_packages' });
            await completeOnboarding();
          }}
        />
      ) : step === 'photos' ? (
        <PhotoUploadScreen
          onBack={() => goToStep('bio_input')}
          onNext={(photos) => goToStep('price_packages', { photos })}
        />
      ) : step === 'bio_input' ? (
        <BioInputScreen
          onBack={() => goToStep('location')}
          onNext={(bio) => goToStep('photos', { bio })}
        />
      ) : step === 'location' ? (
        <LocationEntryScreen
          onBack={() => goToStep('categories')}
          onAllow={(location) => goToStep('bio_input', { location })}
        />
      ) : step === 'categories' ? (
        <CategorySelectionScreen
          onBack={() => goToStep('social_platforms')}
          onNext={(categories) => goToStep('location', { categories })}
        />
      ) : step === 'social_platforms' ? (
        <SocialPlatformSelectionScreen
          onBack={() => goToStep('gender_input')}
          onNext={(platforms) => goToStep('categories', { platforms })}
        />
      ) : step === 'gender_input' ? (
        <GenderSelectionScreen
          onBack={() => goToStep('dob_input')}
          onNext={(gender) => goToStep('social_platforms', { gender })}
        />
      ) : step === 'dob_input' ? (
        <DateOfBirthScreen
          onBack={() => goToStep('name_input')}
          onNext={(dob) => goToStep('gender_input', { dob })}
        />
      ) : step === 'name_input' ? (
        <NameInputScreen
          role={selectedRole || 'Influencer'}
          onBack={() => goToStep('role_selection')}
          onNext={(name, instagramUsername) => {
            if (selectedRole === 'Influencer' || selectedRole === null) {
              goToStep('dob_input', { name, instagramUsername });
            } else {
              goToStep('brand_platforms', { name, instagramUsername });
            }
          }}
        />
      ) : (
        <RoleSelectionScreen
          onBack={async () => {
            // Sign out and go back to login
            await signOut();
          }}
          onNext={(role) => {
            setSelectedRole(role);
            goToStep('name_input', { role });
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppContent />
    </AuthProvider>
  );
}
