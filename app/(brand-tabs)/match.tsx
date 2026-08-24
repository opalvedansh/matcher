import { BrandSwipeScreen } from '@/screens/main/brand/BrandSwipeScreen';
import { useRouter } from 'expo-router';

export default function MatchRoute() {
  const router = useRouter();

  return (
    <BrandSwipeScreen 
      onViewProfile={(id) => {
        console.log('View influencer profile requested for id:', id);
        // We will build profile viewing routes later
      }}
      onNavigateToMessages={() => {
        router.replace('/(brand-tabs)/messages');
      }}
    />
  );
}
