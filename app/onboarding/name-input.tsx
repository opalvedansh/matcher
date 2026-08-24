import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { NameInputScreen } from '@/screens/onboarding/shared/NameInputScreen';

export default function Route() {
  const router = useRouter();
  const { updateOnboarding, completeOnboarding, onboardingData, signOut } = useAuth();

  const goToStep = async (nextRoute: string, data?: Record<string, any>) => {
    // Map dashed routes back to underscore step names for the database
    const stepName = nextRoute.replace(/-/g, '_');
    await updateOnboarding({ currentStep: stepName, ...data });
    router.push(`/onboarding/${nextRoute}`);
  };

  return (
    <NameInputScreen
      role={onboardingData?.role || 'Influencer'}
      onBack={() => goToStep('role-selection')}
      onNext={(name, instagramUsername) => {
        if (onboardingData?.role === 'Influencer' || !onboardingData?.role) {
          goToStep('dob-input', { name, instagramUsername });
        } else {
          goToStep('brand-platforms', { name, instagramUsername });
        }
      }}
    />
  );
}
