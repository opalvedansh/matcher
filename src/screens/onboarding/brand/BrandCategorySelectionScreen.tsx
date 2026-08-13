import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

const CATEGORIES = [
  { id: 'retail', name: 'Retail & Consumer' },
  { id: 'food', name: 'Food & Beverage' },
  { id: 'tech', name: 'Technology' },
  { id: 'auto', name: 'Automotive' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'edu', name: 'Education' },
  { id: 'finance', name: 'Finance' },
  { id: 'travel', name: 'Travel' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'business', name: 'Business' },
  { id: 'lifestyle', name: 'Lifestyle' },
  { id: 'real_estate', name: 'Real Estate' },
  { id: 'other', name: 'Other' },
];

export function BrandCategorySelectionScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (categories: string[]) => void;
}) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 6) {
        return; // Max 6 categories
      }
      newSelected.add(id);
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

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Choose your{'\n'}category</Text>
            <Text style={styles.subtitle}>
              Choose the content categories that best describe your brand.
              You can select 6 maximum
            </Text>
          </View>

          {/* List Options */}
          <View style={styles.listContainer}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.has(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <AntDesign name="check" size={14} color="#000000" />}
                  </View>
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    paddingRight: 20,
  },
  listContainer: {
    gap: 16,
  },
  categoryCard: {
    height: 64,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#262626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
  },
  categoryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: colors.primary,
    textAlign: 'left',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  checkboxSelected: {
    opacity: 1,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
