import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import { colors } from '@/theme/colors';

const CATEGORIES = [
  'Lifestyle', 'Fashion', 'Beauty', 'Fitness',
  'Food', 'Travel', 'Tech', 'Gaming',
  'Finance', 'Business', 'Education', 'Comedy',
  'Photography', 'Music', 'Automotive', 'Luxury',
  'Pets', 'Sustainability', 'Reviews', 'UGC',
  'Art', 'Spirituality', 'Vlogs', 'Events',
];

export function CategorySelectionScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (categories: string[]) => void;
}) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      if (newSelected.size >= 10) {
        return;
      }
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Pressable onPress={onBack} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color={colors.text} />
        </Pressable>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Choose your{'\n'}category</Text>
          <Text style={styles.subtitle}>
            Choose the content categories that best describe your work.{'\n'}You can select 10 maximum
          </Text>
        </View>

        {/* Grid Options */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.gridContainer}>
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategories.has(category);
              return (
                <Pressable
                  key={category}
                  style={[styles.pillItem, isSelected && styles.pillItemSelected]}
                  onPress={() => toggleCategory(category)}
                >
                  {isSelected && (
                    <AntDesign name="check" size={12} color={colors.primary} style={styles.pillIcon} />
                  )}
                  <Text 
                    style={[styles.pillItemText, isSelected && styles.pillItemTextSelected]}
                  >
                    {category}
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
              selectedCategories.size === 0 && styles.nextButtonDisabled,
            ]}
            disabled={selectedCategories.size === 0}
            onPress={() => onNext?.(Array.from(selectedCategories))}
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
  textContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#262626',
    backgroundColor: '#0A0A0A',
  },
  pillItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 90, 31, 0.05)',
  },
  pillIcon: {
    marginRight: 6,
  },
  pillItemText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
  },
  pillItemTextSelected: {
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
