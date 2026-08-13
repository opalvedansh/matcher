import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';
import { PeopleIcon } from '@/components/PeopleIcon';
import { ReelsIcon } from '@/components/ReelsIcon';
import { getMyProfile } from '@/api';
import type { InfluencerProfile } from '@/api/types';

// ──────────────────────── Line Chart ────────────────────────
const CHART_DATA = [100, 98, 85, 60, 40, 25, 8, 2, 1, 0];
const CHART_H = 160;
const MAX_Y = 120;
const Y_LABEL_W = 32;  // reserved width for y-axis labels
const DOT_R = 5;       // dot radius

function LineChart({ width }: { width: number }) {
  const PLOT_W = width - 48 - Y_LABEL_W - 12;
  const pts = CHART_DATA.map((v, i) => ({
    x: Y_LABEL_W + (i / (CHART_DATA.length - 1)) * PLOT_W,
    y: CHART_H - (v / MAX_Y) * CHART_H,
  }));
  const gridLines = [0, 30, 60, 90, 120];

  return (
    <View style={{ width: width - 48, height: CHART_H + 28, position: 'relative' }}>
      {gridLines.map((val) => {
        const y = CHART_H - (val / MAX_Y) * CHART_H;
        return (
          <View key={val} style={{ position: 'absolute', top: y, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={chartSt.yLabel}>{val}</Text>
            <View style={chartSt.gridLine} />
          </View>
        );
      })}
      {pts.slice(0, -1).map((p, i) => {
        const next = pts[i + 1];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: length,
              height: 2,
              backgroundColor: '#FF6B2B',
              transformOrigin: '0 50%',
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
      {pts.map((p, i) => (
        <View key={`dot-${i}`} style={[chartSt.dot, { left: p.x - DOT_R, top: p.y - DOT_R }]} />
      ))}
      {pts.map((p, i) => (
        <Text
          key={`xlabel-${i}`}
          style={[chartSt.xLabel, {
            position: 'absolute',
            top: CHART_H + 8,
            left: p.x - 8,
            width: 18,
            textAlign: 'center',
          }]}
        >
          {i + 1}
        </Text>
      ))}
    </View>
  );
}

const chartSt = StyleSheet.create({
  yLabel: { color: '#666', fontSize: 10, width: 28, textAlign: 'right' },
  gridLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 4 },
  dot: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FF6B2B', borderWidth: 2, borderColor: '#121212',
  },
  xLabel: { color: '#666', fontSize: 10 },
});

// ──────────────────────── Main Screen ────────────────────────
type Tab = 'overview' | 'engagement' | 'audience';

export function InfluencerProfileScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getMyProfile();
        const data = (res as any).data || res;
        if (!cancelled) setProfile(data as InfluencerProfile);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B2B" />
      </SafeAreaView>
    );
  }

  // If there's an error loading profile data, use empty defaults so the screen
  // still renders instead of blocking the user with a crash screen.
  const fallbackProfile: InfluencerProfile = {
    user_id: '', name: '', bio: '', categories: [],
    location: '', lat: 0, lng: 0, platforms: [],
    followers: 0, engagement_rate: 0, avg_views: 0,
    price_min: 0, price_max: 0, verified: false,
    avatar_url: null, cover_url: null, age: null,
    gender: null, updated_at: '', email: '', role: 'influencer', member_since: '',
  } as any;

  const activeProfile = profile ?? fallbackProfile;

  const isValidUrl = (url?: string | null) => {
    if (!url) return false;
    // On web, blob URIs expire on reload. On native, local file URIs might not persist across sessions if in cache.
    if (url.startsWith('blob:') || url.startsWith('file://')) return false;
    return true;
  };

  const coverImage = isValidUrl(activeProfile.cover_url) ? activeProfile.cover_url : 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80';
  const avatarImage = isValidUrl(activeProfile.avatar_url) ? activeProfile.avatar_url : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';
  const name = activeProfile.name || 'Your Profile';
  const niche = (activeProfile.categories || []).join(' · ') || 'Creator';
  const location = activeProfile.location || 'Location not set';
  const bio = activeProfile.bio || 'Add a bio to let brands know about you...';

  const followersStr = activeProfile.followers >= 1_000_000 
    ? `${(activeProfile.followers / 1_000_000).toFixed(1)}M` 
    : activeProfile.followers >= 1000 ? `${(activeProfile.followers / 1000).toFixed(0)}k` : String(activeProfile.followers || 0);
  
  const viewsStr = activeProfile.avg_views >= 1_000_000 
    ? `${(activeProfile.avg_views / 1_000_000).toFixed(1)}M` 
    : activeProfile.avg_views >= 1000 ? `${(activeProfile.avg_views / 1000).toFixed(0)}k` : String(activeProfile.avg_views || 0);

  const engagementStr = activeProfile.engagement_rate ? `${activeProfile.engagement_rate}%` : '0%';

  const activePlatforms = activeProfile.platforms || ['Instagram'];

  const PLATFORMS_DB: Record<string, { bg: string, icon: React.ReactNode }> = {
    'Instagram': { bg: '#E1306C', icon: <FontAwesome name="instagram" size={16} color="#FFF" /> },
    'YouTube': { bg: '#FF0000', icon: <FontAwesome name="youtube-play" size={16} color="#FFF" /> },
    'TikTok': { bg: '#000000', icon: <FontAwesome name="music" size={16} color="#FFF" /> },
    'Twitter': { bg: '#1DA1F2', icon: <FontAwesome name="twitter" size={16} color="#FFF" /> },
    'Reddit': { bg: '#FF4500', icon: <FontAwesome name="reddit-alien" size={16} color="#FFF" /> },
    'Pinterest': { bg: '#E60023', icon: <FontAwesome name="pinterest-p" size={16} color="#FFF" /> },
    'Facebook': { bg: '#1877F2', icon: <FontAwesome name="facebook-f" size={16} color="#FFF" /> },
  };

  // Overriding platforms to match design screenshot
  const demoPlatforms = ['Reddit', 'Pinterest', 'YouTube', 'Facebook', 'Instagram'];
  const platformsList = demoPlatforms.map(p => ({
    name: p,
    ...(PLATFORMS_DB[p] || { bg: '#FF6B2B', icon: <FontAwesome name="star" size={16} color="#FFF" /> })
  }));

  const packages = [
    { icon: <MaterialCommunityIcons name="plus-box" size={24} color="#FFF" />, name: 'Story Package', desc: '1 Instagram Story - 24hr visibility', price: '1000' },
    { icon: <MaterialCommunityIcons name="movie-open-play" size={24} color="#FFF" />, name: 'Reel Package', desc: '1 Reel (30-60 sec) - Edited & tagged', price: '8000' },
    { icon: <MaterialCommunityIcons name="cards-outline" size={24} color="#FFF" />, name: 'UGC Package', desc: '1 UGC Video - Raw + Edited', price: '12000' },
    { icon: <MaterialCommunityIcons name="account-group-outline" size={24} color="#FFF" />, name: 'Brand Patnership', desc: 'As per your demand + collaboration', price: '20000' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Cover Photo ── */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: coverImage || undefined }}
            style={styles.coverPhoto}
          />
          <LinearGradient
            colors={['transparent', 'rgba(18,18,18,0.7)', '#121212']}
            style={styles.coverGradient}
          />
        </View>

        <View style={styles.mainContentContainer}>
          {/* ── Avatar ── */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarImage || undefined }}
              style={styles.avatar}
            />
          </View>

          {/* ── Name / Niche / Location / Bio / Stats ── */}
          <View style={styles.infoSection}>
            <Text style={styles.name}>{name}{activeProfile.age ? `, ${activeProfile.age}` : ''}</Text>
            <Text style={styles.niche}>{niche}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#aaa" />
              <Text style={styles.locationText}>{location}</Text>
            </View>

            <Text style={styles.bio}>{bio}</Text>

            {/* ── Stats glass card ── */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{followersStr}</Text>
                <Text style={styles.statLbl}>followers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{engagementStr}</Text>
                <Text style={styles.statLbl}>Engagement</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{viewsStr}</Text>
                <Text style={styles.statLbl}>Avg Views</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.smallSubtitle}>Worked With</Text>
            <View style={styles.platformRow}>
              {['nike.com', 'adidas.com', 'myntra.com', 'meta.com', 'google.com'].map((domain, i) => (
                <View key={domain} style={[styles.platformCircle, { backgroundColor: '#FFF' }]}>
                  <Image source={{ uri: `https://logo.clearbit.com/${domain}` }} style={{ width: 24, height: 24, borderRadius: 12, resizeMode: 'contain' }} />
                </View>
              ))}
            </View>
          </View>

          {/* ── Available On ── */}
          {platformsList.length > 0 && (
            <View style={[styles.section, { marginTop: 8 }]}>
              <Text style={styles.smallSubtitle}>Available on</Text>
              <View style={styles.platformRow}>
                {platformsList.map((p) => (
                  <View key={p.name} style={[styles.platformCircle, { backgroundColor: p.bg }]}>
                    {p.icon}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Top Reels ── */}
          <View style={styles.section}>
            <View style={styles.topReelsHeader}>
              <Text style={styles.topReelsTitle}>Top Reels</Text>
              <Text style={styles.seeMoreText}>see more</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelsScroll}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.reelCard}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80' }} style={styles.reelImage} />
                  <View style={styles.reelOverlay}>
                    <Feather name="play" size={10} color="#FFF" />
                    <Text style={styles.reelViews}>1.2M</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabRow}>
            {(['overview', 'engagement', 'audience'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.tabPill, activeTab === t && styles.tabPillActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabPillText, activeTab === t && styles.tabPillTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Tab Content ── */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <Text style={styles.bigSectionTitle}>Summary</Text>
              <View style={styles.summaryGrid}>
                {[
                  [{ label: 'Views', value: '3,476' }, { label: 'Accounts Reached', value: '3,476' }],
                  [{ label: 'Average Watch Time', value: '4h 15m' }, { label: 'Follows', value: '500' }],
                ].map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.summaryRow}>
                    {row.map((item) => (
                      <View key={item.label} style={styles.summaryCard}>
                        <Text style={styles.summaryCardLabel}>{item.label}</Text>
                        <Text style={styles.summaryCardValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <View style={{ marginTop: 24, marginBottom: 24 }}>
                <Text style={styles.bigSectionTitle}>What affecting their views</Text>
                <Text style={styles.sectionSubtitle}>Rates are listed in order of importance to reach</Text>
                <View style={styles.ratesList}>
                  {[
                    { label: 'Skip Rate', val: '58.7%', icon: 'clock', type: 'feather' },
                    { label: 'Share Rate', val: '1.0%', icon: 'send', type: 'feather' },
                    { label: 'Like Rate', val: '1.7%', icon: 'heart', type: 'feather' },
                    { label: 'Save Rate', val: '0.8%', icon: 'bookmark', type: 'feather' },
                    { label: 'Repost Rate', val: '0.2%', icon: 'repeat', type: 'feather' },
                    { label: 'Comment Rate', val: '0.3%', icon: 'message-circle', type: 'feather' },
                  ].map((rate, idx) => (
                    <View key={idx} style={styles.rateRow}>
                      <View style={styles.rateIconBox}>
                        <Feather name={rate.icon as any} size={16} color="#aaa" />
                      </View>
                      <Text style={styles.rateLabel}>{rate.label}</Text>
                      <Text style={styles.rateValue}>{rate.val}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <Text style={[styles.bigSectionTitle, { textAlign: 'center', width: 200, marginBottom: 40 }]}>How long people have watched their reel</Text>
                <View style={{ alignSelf: 'stretch', alignItems: 'center', paddingRight: 20 }}>
                  <LineChart width={width - 24} />
                </View>
              </View>
            </View>
          )}

          {activeTab === 'engagement' && (
            <View style={styles.tabContent}>
              
              <Text style={[styles.bigSectionTitle, { marginBottom: 20 }]}>Actions after viewing</Text>
              
              <View style={{ marginBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Profile Visits</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>5</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Follows</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>8</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Bio link taps</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>4</Text>
                </View>
              </View>

              <Text style={[styles.bigSectionTitle, { marginBottom: 20 }]}>Interactions</Text>
              
              <View style={{ marginBottom: 20 }}>
                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Likes and Reactions</Text>
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>47</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '500' }}>Instagram</Text>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '600' }}>23</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '500' }}>Facebook</Text>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '600' }}>24</Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Comments</Text>
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>8</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '500' }}>Instagram</Text>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '600' }}>5</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '500' }}>Facebook</Text>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: '600' }}>3</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Reposts</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>5</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Shares</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>28</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 15 }}>Saves</Text>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>23</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 40 }}>
                <Text style={[styles.bigSectionTitle, { textAlign: 'center', marginBottom: 40 }]}>When people liked their reel</Text>
                <View style={{ alignSelf: 'stretch', alignItems: 'center', paddingRight: 20 }}>
                  <LineChart width={width - 24} />
                </View>
              </View>

            </View>
          )}

          {activeTab === 'audience' && (
            <View style={styles.tabContent}>
              
              {/* Demographics Filters (Pills) */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40, marginTop: 10 }}>
                <View style={{ backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20 }}>
                  <Text style={{ color: '#000', fontSize: 13, fontWeight: '600' }}>Age</Text>
                </View>
                <View style={{ backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 13, fontWeight: '500' }}>Country</Text>
                </View>
                <View style={{ backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}>
                  <Text style={{ color: '#E0E0E0', fontSize: 13, fontWeight: '500' }}>Gender</Text>
                </View>
              </View>

              {/* Age Progress Bars */}
              <View style={{ gap: 24, paddingHorizontal: 10 }}>
                {[
                  { range: '13-17', pct: 50 },
                  { range: '18-27', pct: 20 },
                  { range: '28-37', pct: 10 },
                  { range: '38-47', pct: 10 },
                  { range: '48-67', pct: 5 },
                  { range: '68+', pct: 5 },
                ].map((ageItem, i) => (
                  <View key={i}>
                    <Text style={{ color: '#FFF', fontSize: 14, marginBottom: 6 }}>{ageItem.range}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#777', overflow: 'hidden' }}>
                        <View style={{ width: `${ageItem.pct}%`, height: '100%', backgroundColor: '#FF6B2B' }} />
                      </View>
                      <Text style={{ color: '#FFF', fontSize: 15, width: 40, textAlign: 'right' }}>{ageItem.pct}%</Text>
                    </View>
                  </View>
                ))}
              </View>

            </View>
          )}

          <View style={{ paddingHorizontal: 20 }}>
            {/* ── Packages ── */}
            <View style={[styles.section, { paddingHorizontal: 0, marginTop: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={styles.packagesTitle}>Packages</Text>
                <View style={styles.inrBadge}><Text style={styles.inrText}>INR</Text></View>
              </View>

              {packages.map((pkg, idx) => (
                <View key={pkg.name} style={styles.packageCard}>
                  <View style={styles.packageIconBox}>{pkg.icon}</View>
                  <View style={styles.packageDetails}>
                    <Text style={styles.packageName} numberOfLines={1}>{pkg.name}</Text>
                    <Text style={styles.packageDesc} numberOfLines={1}>{pkg.desc}</Text>
                  </View>
                  <View style={styles.packagePriceBox}>
                    <Text style={styles.packagePrice}>{pkg.price}</Text>
                  </View>
                </View>
              ))}

              {/* Custom Package */}
              <View style={styles.customPackageCard}>
                <View style={styles.customIconCircle}>
                  <Feather name="plus" size={16} color="#FF6B2B" />
                </View>
                <View style={styles.packageDetails}>
                  <Text style={styles.customPackageName} numberOfLines={1}>Custom package</Text>
                  <Text style={styles.customPackageDesc} numberOfLines={1}>Have something else in mind?</Text>
                </View>
                <Pressable style={styles.requestBtn}>
                  <Text style={styles.requestBtnText}>Request Quote</Text>
                </Pressable>
              </View>
            </View>
            
            {/* ── Testimonial ── */}
            <View style={styles.testimonialCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#0A66C2', fontSize: 16, fontWeight: '700', letterSpacing: -0.5 }}>Linked</Text>
                <View style={{ backgroundColor: '#0A66C2', paddingHorizontal: 2, borderRadius: 2, marginLeft: 2, marginTop: 1 }}>
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>in</Text>
                </View>
              </View>
              <Text style={styles.testimonialText}>
                It works really wonders in the hybrid culture. No echo and seamless integration with the current workflow. Love this application.
              </Text>
              <View style={styles.testimonialAuthorRow}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' }} style={styles.testimonialAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.testimonialName}>Beth Wilson</Text>
                  <Text style={styles.testimonialTitle}>Product Manager at LinkedIn</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4].map(star => <FontAwesome key={star} name="star" size={12} color="#FF6B2B" />)}
                  <FontAwesome name="star" size={12} color="#ccc" />
                </View>
              </View>
            </View>

            {/* ── Chat Button ── */}
            <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 40 }}>
              <Pressable style={styles.chatButton}>
                <Text style={styles.chatButtonText}>Chat</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 130 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  scroll: { backgroundColor: '#121212' },
  coverContainer: { width: '100%', height: 350, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },
  mainContentContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingBottom: 20,
  },
  avatarWrapper: { marginTop: -54, alignItems: 'center', zIndex: 2 },
  avatar: { width: 108, height: 108, borderRadius: 54 },
  infoSection: { paddingHorizontal: 20, marginTop: 14, alignItems: 'center' },
  name: { color: '#FFF', fontSize: 26, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  niche: { color: '#bbb', fontSize: 14, marginTop: 4, textAlign: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'center' },
  locationText: { color: '#aaa', fontSize: 12 },
  bio: { color: '#aaa', fontSize: 11, lineHeight: 16, marginTop: 14, marginBottom: 20, textAlign: 'center', alignSelf: 'stretch', paddingHorizontal: 10 },
  
  statsRow: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 24, justifyContent: 'center' },
  statBox: { flex: 1, maxWidth: 110, alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statVal: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  statLbl: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 },
  
  smallSubtitle: { color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  platformRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  platformCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  
  topReelsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  topReelsTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  seeMoreText: { color: '#FF6B2B', fontSize: 11, fontWeight: '600' },
  reelsScroll: { gap: 10, paddingRight: 24 },
  reelCard: { width: 90, height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  reelImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  reelOverlay: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  reelViews: { color: '#FFF', fontSize: 9, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 24
  },
  tabPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  tabPillActive: { borderColor: '#777' },
  tabPillText: { color: '#888', fontSize: 12, fontWeight: '500' },
  tabPillTextActive: { color: '#FFF' },

  tabContent: { paddingHorizontal: 24 },
  bigSectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  sectionSubtitle: { color: '#777', fontSize: 11, marginTop: -12, marginBottom: 20 },
  summaryGrid: { flexDirection: 'column', gap: 8 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16 },
  summaryCardLabel: { color: '#777', fontSize: 11, marginBottom: 8 },
  summaryCardValue: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  ratesList: { flexDirection: 'column' },
  rateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rateIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rateLabel: { color: '#ccc', fontSize: 14, flex: 1 },
  rateValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  packagesTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  inrBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  inrText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  packageCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#050505',
    borderRadius: 16, borderWidth: 1, borderColor: '#333',
    paddingVertical: 18, paddingHorizontal: 20, marginBottom: 16, gap: 14, overflow: 'hidden',
  },
  packageIconBox: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  packageDetails: { flex: 1, flexShrink: 1 },
  packageName: { color: '#FFF', fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
  packageDesc: { color: '#666', fontSize: 9, marginTop: 4 },
  packagePriceBox: { justifyContent: 'center' },
  packagePrice: { color: '#FF6B2B', fontSize: 13, fontWeight: '700' },
  customPackageCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#050505',
    borderRadius: 16, borderWidth: 1, borderColor: '#333',
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: 12, gap: 14,
  },
  customIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#666' },
  customPackageName: { color: '#FFF', fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
  customPackageDesc: { color: '#666', fontSize: 9, marginTop: 4 },
  requestBtn: { backgroundColor: '#FF6B2B', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  requestBtnText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  
  testimonialCard: { backgroundColor: '#050505', borderRadius: 16, borderWidth: 1, borderColor: '#333', padding: 20, marginTop: 16 },
  testimonialText: { color: '#FFF', fontSize: 11, lineHeight: 16, marginBottom: 16 },
  testimonialAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testimonialAvatar: { width: 32, height: 32, borderRadius: 16 },
  testimonialName: { color: '#FF6B2B', fontSize: 12, fontWeight: '700' },
  testimonialTitle: { color: '#aaa', fontSize: 9, marginTop: 2 },
  
  chatButton: { backgroundColor: '#FF6B2B', borderRadius: 8, paddingVertical: 14, width: 200, alignItems: 'center' },
  chatButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
