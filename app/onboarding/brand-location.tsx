import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLocationScreen } from '@/screens/onboarding/brand/BrandLocationScreen';

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
    <BrandLocationScreen
      onBack={() => goToStep('brand-platforms')}
      onAllow={(location) => goToStep('brand-bio-input', { location })}
    />
  );
}
