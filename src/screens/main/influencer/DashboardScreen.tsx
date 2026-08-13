import { AntDesign, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';

import { useSocketStatus } from '@/hooks/useSocketStatus';

import { colors } from '@/theme/colors';
import { NavHomeIcon, NavProfileIcon, NavHeartIcon, NavMatchIcon, NavMessageIcon } from '@/components/BottomNavIcons';
import { SwipeScreen } from '@/screens/main/influencer/SwipeScreen';
import { ChatScreen } from '@/screens/main/shared/ChatScreen';
import { LikesScreen } from '@/screens/main/shared/LikesScreen';
import { InfluencerProfileScreen } from '@/screens/main/influencer/InfluencerProfileScreen';
import { BrandProfileScreen } from '@/screens/main/brand/BrandProfileScreen';
import { useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getFeedStories, uploadStory } from '@/api';
import { StoryViewer } from '@/components/StoryViewer';

const POSTS = [
  {
    id: '1',
    brandName: 'mama.earth',
    brandLogo: 'https://picsum.photos/id/102/50/50',
    category: 'Lifestyle',
    postImage: 'https://picsum.photos/id/1012/600/800',
    likes: '1,139',
    shares: '128',
    isVerified: true,
  },
  {
    id: '2',
    brandName: 'ER404.studio',
    brandLogo: 'https://picsum.photos/id/103/50/50',
    category: 'Fashion & Lifestyle',
    postImage: 'https://picsum.photos/id/1014/600/800',
    likes: '8,432',
    shares: '421',
    isVerified: true,
  },
];

export function DashboardScreen() {
  const [stories, setStories] = useState<any[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const fetchStories = async () => {
    try {
      const res = await getFeedStories() as any;
      setStories(res.data || res);
    } catch (e) {
      console.log('Failed to fetch stories', e);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleAddStory = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        await uploadStory(newUri);
        fetchStories();
      } catch (err) {
        console.error('Failed to upload story', err);
      }
    }
  };

  const renderStory = ({ item, index }: { item: any; index: number }) => {
    return (
      <Pressable style={styles.storyContainer} onPress={() => {
        if (item.isMe && (!item.items || item.items.length === 0)) {
          handleAddStory();
        } else {
          setSelectedGroupIndex(index);
          setViewerVisible(true);
        }
      }}>
        <LinearGradient
          colors={item.isMe ? ['#00FF00', '#009900'] : ['#FF4500', '#FF8C00']}
          style={styles.storyRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.storyAvatarContainer}>
            <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
          </View>
        </LinearGradient>
        {item.isMe && (
          <Pressable style={styles.addStoryButton} onPress={handleAddStory}>
            <AntDesign name="plus" size={14} color="#FFF" />
          </Pressable>
        )}
        <Text style={styles.storyName} numberOfLines={1}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const renderPost = ({ item }: { item: typeof POSTS[0] }) => {
    return (
      <View style={styles.postContainer}>
        <Image source={{ uri: item.postImage }} style={styles.postImage} />
        
        {/* Black shadow gradient at the top of the card */}
        <LinearGradient
          colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.28)', 'transparent']}
          style={styles.postHeaderShadow}
        />

        {/* Post Header Overlay */}
        <View style={styles.postHeader}>
          <Image source={{ uri: item.brandLogo }} style={styles.postBrandLogo} />
          <View style={styles.postBrandInfo}>
            <View style={styles.postBrandNameRow}>
              <Text style={styles.postBrandName}>{item.brandName}</Text>
              {item.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color="#1DA1F2" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.postCategory}>{item.category}</Text>
          </View>
        </View>

        {/* Glass blend container — blur/tint fades in gradually from top */}
        <View style={styles.glassContainer}>
          <BlurView 
            intensity={40} 
            tint="dark" 
            style={StyleSheet.absoluteFill} 
          />
          {/* Frosted tint gradient */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.05)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Stats row pinned to the bottom of the glass zone */}
          <View style={styles.statsContent}>
            <View style={styles.postStat}>
              <AntDesign name="heart" size={22} color="#FF3B30" />
              <Text style={styles.postStatText}>{item.likes}</Text>
            </View>
            <View style={styles.postStat}>
              <Ionicons name="paper-plane-outline" size={24} color="#FFF" />
              <Text style={styles.postStatText}>{item.shares}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <FlatList
        data={stories}
        renderItem={(props) => renderStory({ ...props, index: props.index })}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}
      />
    </View>
  );

  const [activeTab, setActiveTab] = useState<'match' | 'home' | 'likes' | 'messages' | 'profile'>('match');
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const { isConnected } = useSocketStatus();

  return (
    <View style={styles.container}>
      {viewingProfileId ? (
        <BrandProfileScreen 
          publicUserId={viewingProfileId} 
          onBack={() => setViewingProfileId(null)} 
        />
      ) : activeTab === 'home' ? (
        <SafeAreaView style={{ flex: 1 }}>
          <FlatList
            data={POSTS}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      ) : activeTab === 'match' ? (
        <SwipeScreen onViewProfile={(id) => setViewingProfileId(id)} onNavigateToMessages={() => setActiveTab('messages')} />
      ) : activeTab === 'likes' ? (
        <LikesScreen />
      ) : activeTab === 'messages' ? (
        <ChatScreen onConversationStateChange={setIsConversationOpen} />
      ) : activeTab === 'profile' ? (
        <InfluencerProfileScreen />
      ) : (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFF' }}>Coming Soon</Text>
        </SafeAreaView>
      )}

      {/* Fix 4: Real-time connection status banner */}
      {!isConnected && (
        <View style={styles.reconnectingBanner}>
          <Ionicons name="wifi-outline" size={14} color="#1a1a1a" style={{ marginRight: 6 }} />
          <Text style={styles.reconnectingText}>Reconnecting...</Text>
        </View>
      )}

      {/* Custom Bottom Navigation Bar */}
      {!isConversationOpen && (
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => setActiveTab('match')}>
            <NavMatchIcon size={24} color={activeTab === 'match' ? '#FF6B2B' : '#555'} />
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => setActiveTab('home')}>
            <NavHomeIcon size={24} color={activeTab === 'home' ? '#FF6B2B' : '#555'} />
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => setActiveTab('likes')}>
            <NavHeartIcon size={26} color={activeTab === 'likes' ? '#FF6B2B' : '#555'} />
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => setActiveTab('messages')}>
            <NavMessageIcon size={24} color={activeTab === 'messages' ? '#FF6B2B' : '#555'} />
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => setActiveTab('profile')}>
            <NavProfileIcon size={24} color={activeTab === 'profile' ? '#FF6B2B' : '#555'} />
          </Pressable>
        </View>
      )}

      <StoryViewer
        visible={viewerVisible}
        stories={stories}
        initialGroupIndex={selectedGroupIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background exactly like design
  },
  header: {
    paddingVertical: 16,
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyContainer: {
    alignItems: 'center',
    width: 76,
  },
  storyRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3, // Ring thickness
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#121212',
    borderRadius: 35,
    padding: 3, // Gap between ring and avatar
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 22,
    right: 0,
    backgroundColor: '#000',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '400',
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  postContainer: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: '#222',
    borderRadius: 32,
    marginBottom: 24,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  // Black shadow behind the header so text reads clearly over any image
  postHeaderShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  postBrandLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  postBrandInfo: {
    marginLeft: 12,
  },
  postBrandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postBrandName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  postCategory: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  postFooterFade: {
    // kept for legacy reference — removed from JSX
    position: 'absolute', bottom: 60, left: 0, right: 0, height: 0,
  },
  // Tall glass container — blur/tint blend gradually
  glassContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,            // taller = longer blend zone
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        // backdropFilter covers the full 110px zone;
        // maskImage makes it gradually appear from transparent at top
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 35%, black 65%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 35%, black 65%)',
      } as any,
      default: {},
    }),
  },
  // Stats row at the bottom of the glass container
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    paddingBottom: 18,
    paddingTop: 10,
    borderTopWidth: 0,      // no hard border — tint gradient handles the edge
  },
  // Legacy
  glassBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0 },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postStatText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 58,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
  },
  reconnectingBanner: {
    position: 'absolute',
    bottom: 58,  // sits just above the bottom nav bar
    left: 0,
    right: 0,
    backgroundColor: '#F5C518',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 100,
  },
  reconnectingText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
