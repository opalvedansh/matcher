import { SwipeScreen } from '@/screens/main/influencer/SwipeScreen';
import { useRouter } from 'expo-router';

export default function MatchRoute() {
  const router = useRouter();

  return (
    <SwipeScreen 
      onViewProfile={(id) => {
        // This is tricky. In the old setup, this set `viewingProfileId` to render the profile overlay.
        // We will need to either create a modal route, or just push a profile route.
        // For now, let's just use router.push if we had a dedicated profile viewer route, 
        // or just log it to be built later.
        console.log('View profile requested for id:', id);
        // router.push(`/profile/${id}`);
      }} 
      onNavigateToMessages={() => {
        router.replace('/(influencer-tabs)/messages');
      }}
    />
  );
}
