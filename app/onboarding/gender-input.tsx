import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { GenderSelectionScreen } from '@/screens/onboarding/influencer/GenderSelectionScreen';

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
    <GenderSelectionScreen
      onBack={() => goToStep('dob-input')}
      onNext={(gender) => goToStep('social-platforms', { gender })}
    />
  );
}
