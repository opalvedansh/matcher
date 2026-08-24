import { useAuth } from '@/contexts/AuthContext';
import { BrandProfileScreen } from '@/screens/main/brand/BrandProfileScreen';
import { InfluencerProfileScreen } from '@/screens/main/influencer/InfluencerProfileScreen';

export default function ProfileRoute() {
  const { onboardingData } = useAuth();
  const role = onboardingData?.role;

  // Safety guard: if an influencer somehow ends up on the brand profile tab,
  // render their correct profile instead.
  if (role === 'Influencer') {
    return <InfluencerProfileScreen />;
  }

  return <BrandProfileScreen />;
}
