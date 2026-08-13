import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMatches, getLikesReceived } from '@/api';
import type { MatchRecord } from '@/api/types';
import { useAuth } from '@/contexts/AuthContext';

const GRID_SPACING = 16;

type MixedRecord = {
  id: string;
  type: 'match' | 'like';
  name?: string;
  avatar?: string;
  verified?: boolean;
  location?: string;
};

export function LikesScreen() {
  const { width } = useWindowDimensions();
  const { onboardingData } = useAuth();
  const role = onboardingData?.role?.toLowerCase() as 'brand' | 'influencer' | undefined;

  const [items, setItems] = useState<MixedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ITEM_WIDTH = (width - 24 * 2 - GRID_SPACING) / 2;
  const isPremium = false; // Mock premium check

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [matchesRes, likesRes] = await Promise.all([
          getMatches().catch(() => ({ data: [] })),
          getLikesReceived().catch(() => ({ data: [] }))
        ]) as any[];

        const matchesData = matchesRes?.data || matchesRes || [];
        const likesData = likesRes?.data || likesRes || [];

        const formattedMatches: MixedRecord[] = matchesData.map((m: any) => ({
          id: m.match_id,
          type: 'match',
          ...(role === 'brand' 
            ? { name: m.influencer_name, avatar: m.influencer_avatar, verified: m.influencer_verified, location: m.influencer_location }
            : { name: m.brand_name, avatar: m.brand_logo, verified: m.brand_verified, location: m.brand_location })
        }));

        const formattedLikes: MixedRecord[] = likesData.map((l: any) => ({
          id: l.swipe_id,
          type: 'like',
          ...(role === 'brand'
            ? { name: l.influencer_name, avatar: l.influencer_avatar, verified: l.influencer_verified, location: l.influencer_location }
            : { name: l.brand_name, avatar: l.brand_logo, verified: l.brand_verified, location: l.brand_location })
        }));

        if (!cancelled) setItems([...formattedMatches, ...formattedLikes]);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load likes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Likes</Text>
          <Pressable>
            <Ionicons name="notifications" size={24} color="#FFF" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FF6B2B" />
            <Text style={styles.loadingTxt}>Loading your likes...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyTitle, { color: '#FF3B30' }]}>⚠️ {error}</Text>
          </View>
        ) : (
          <>
            {/* Premium Banner */}
            <View style={styles.premiumBanner}>
              <View style={styles.heartCircle}>
                <Ionicons name="heart" size={24} color="#FF6B2B" />
              </View>
              <Text style={styles.premiumTitle}>View your likes</Text>
              <Text style={styles.premiumSubtitle}>
                Activate Matcherc Premium and see the people whose likes you already have.
              </Text>
              <Pressable style={styles.premiumBtn}>
                <Text style={styles.premiumBtnText}>Activate Premium</Text>
              </Pressable>
            </View>

            {/* Grid */}
            <View style={styles.gridContainer}>
              {(items.length > 0 ? items : [1, 2, 3, 4]).map((item, idx) => {
                const isDummy = typeof item === 'number';
                const record = isDummy ? null : (item as MixedRecord);
                const imageUrl = record?.avatar || `https://picsum.photos/seed/${idx + 10}/400/600`;
                
                // Blur if dummy, OR if it's a 'like' and user doesn't have premium
                const shouldBlur = isDummy || (!isPremium && record?.type === 'like');

                return (
                  <View
                    key={isDummy ? `dummy-${item}` : record!.id}
                    style={[styles.gridItem, { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.35 }]}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.matchImage}
                      blurRadius={shouldBlur ? 20 : 0} 
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginTop: 20, marginBottom: 16,
  },
  headerTitle: { fontSize: 34, fontWeight: 'bold', color: '#FFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  loadingTxt: { color: '#888', marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 21 },
  countLabel: { color: '#888', fontSize: 13, paddingHorizontal: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  premiumBanner: { alignItems: 'center', paddingHorizontal: 32, marginTop: 10, marginBottom: 30 },
  heartCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  premiumTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  premiumSubtitle: { color: '#FFF', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  premiumBtn: { backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  premiumBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 24, gap: GRID_SPACING, justifyContent: 'space-between',
  },
  gridItem: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#222' },
  matchImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarPlaceholder: { backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 40, fontWeight: '700', color: '#FF6B2B' },
});
