import { useState } from 'react';
import { AntDesign, FontAwesome6 } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook' },
  { id: 'x', label: 'X', icon: 'x-twitter' },
  { id: 'youtube', label: 'Youtube', icon: 'youtube' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { id: 'snapchat', label: 'Snapchat', icon: 'snapchat' },
  { id: 'threads', label: 'Thread', icon: 'threads' },
  { id: 'pinterest', label: 'Pinterest', icon: 'pinterest' },
  { id: 'spotify', label: 'Spotify', icon: 'spotify' },
  { id: 'twitch', label: 'Twitch', icon: 'twitch' },
  { id: 'reddit', label: 'Reddit', icon: 'reddit-alien' },
  { id: 'discord', label: 'Discord', icon: 'discord' },
  { id: 'behance', label: 'Behance', icon: 'behance' },
  { id: 'dribbble', label: 'Dribble', icon: 'dribbble' },
] as const;

export function BrandPlatformSelectionScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (platforms: string[]) => void;
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());

  const togglePlatform = (id: string) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 3) {
        return; // Max 3 platforms
      }
      newSelected.add(id);
    }
    setSelectedPlatforms(newSelected);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Pressable onPress={onBack} style={styles.backButton}>
          <AntDesign name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Where do you{'\n'}upload content?</Text>
            <Text style={styles.subtitle}>
              Select all the platforms where you're active it help influencer discover you by selecting your active social channels
            </Text>
          </View>

          {/* Grid Options */}
          <View style={styles.gridContainer}>
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.has(platform.id);
              return (
                <Pressable
                  key={platform.id}
                  style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                  onPress={() => togglePlatform(platform.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <AntDesign name="check" size={10} color="#000" />}
                  </View>
                  <FontAwesome6
                    name={platform.icon}
                    size={28}
                    color={isSelected ? colors.primary : colors.text}
                    style={styles.icon}
                  />
                  <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>
                    {platform.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              selectedPlatforms.size === 0 && styles.nextButtonDisabled,
            ]}
            disabled={selectedPlatforms.size === 0}
            onPress={() => onNext?.(Array.from(selectedPlatforms))}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  textContainer: {
    marginBottom: 32,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    color: '#8A8A8A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    paddingRight: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%', // 4 columns
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#262626',
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  gridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 90, 31, 0.05)',
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  icon: {
    marginBottom: 6,
    marginTop: 8,
  },
  gridItemText: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '600',
  },
  gridItemTextSelected: {
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  nextButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
