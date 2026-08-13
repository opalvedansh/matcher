import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  Dimensions,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type StoryItem = {
  id: string;
  media_url: string;
};

type StoryGroup = {
  id: string;
  name: string;
  avatar: string;
  items: StoryItem[];
};

interface StoryViewerProps {
  visible: boolean;
  stories: StoryGroup[];
  initialGroupIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function StoryViewer({ visible, stories, initialGroupIndex = 0, onClose }: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isPaused = useRef(false);

  useEffect(() => {
    if (visible) {
      setCurrentGroupIndex(initialGroupIndex);
      setCurrentItemIndex(0);
    }
  }, [visible, initialGroupIndex]);

  useEffect(() => {
    if (visible && stories.length > 0) {
      startAnimation();
    } else {
      progressAnim.setValue(0);
    }
    return () => {
      progressAnim.stopAnimation();
    };
  }, [currentGroupIndex, currentItemIndex, visible]);

  const startAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused.current) {
        goToNext();
      }
    });
  };

  const goToNext = () => {
    const currentGroup = stories[currentGroupIndex];
    if (!currentGroup) return;

    if (currentItemIndex < currentGroup.items.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      if (currentGroupIndex < stories.length - 1) {
        setCurrentGroupIndex(prev => prev + 1);
        setCurrentItemIndex(0);
      } else {
        onClose();
      }
    }
  };

  const goToPrev = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    } else {
      if (currentGroupIndex > 0) {
        const prevGroup = stories[currentGroupIndex - 1];
        setCurrentGroupIndex(prevGroupIndex => prevGroupIndex - 1);
        setCurrentItemIndex(prevGroup.items.length - 1);
      } else {
        // At the very beginning, just restart current
        progressAnim.setValue(0);
        startAnimation();
      }
    }
  };

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 2) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  const handleLongPress = () => {
    isPaused.current = true;
    progressAnim.stopAnimation();
  };

  const handlePressOut = () => {
    if (isPaused.current) {
      isPaused.current = false;
      // Resume animation from current value
      // To simplify, we just restart the duration from 0. Or we could calculate remaining.
      // Restarting is standard for simple viewers.
      startAnimation();
    }
  };

  if (!visible || stories.length === 0) return null;

  const currentGroup = stories[currentGroupIndex];
  if (!currentGroup || currentGroup.items.length === 0) return null;
  const currentItem = currentGroup.items[currentItemIndex];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={200}
        >
          <Image
            source={{ uri: currentItem.media_url }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>

        <SafeAreaView style={styles.overlay}>
          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            {currentGroup.items.map((item, index) => {
              return (
                <View key={item.id} style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFg,
                      {
                        width: index === currentItemIndex
                          ? progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            })
                          : index < currentItemIndex
                          ? '100%'
                          : '0%',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={{ uri: currentGroup.avatar }} style={styles.avatar} />
              <Text style={styles.username}>{currentGroup.name}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  username: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeBtn: {
    padding: 4,
  }
});
