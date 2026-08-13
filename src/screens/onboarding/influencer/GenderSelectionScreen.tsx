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

type Gender = 'Male' | 'Female' | 'Other' | null;

export function GenderSelectionScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (gender: Gender) => void;
}) {
  const [selectedGender, setSelectedGender] = useState<Gender>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Pressable onPress={onBack} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color={colors.text} />
        </Pressable>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>What's your{'\n'}gender</Text>
            <Text style={styles.subtitle}>
              Select that describe you that will help us to show your profile to the right person
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <Pressable
              style={[
                styles.optionCard,
                selectedGender === 'Male' && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedGender('Male')}
            >
              <Text style={[styles.optionText, selectedGender === 'Male' && styles.optionTextSelected]}>Male</Text>
              <View style={[styles.checkbox, selectedGender === 'Male' && styles.checkboxSelected]}>
                {selectedGender === 'Male' && <AntDesign name="check" size={14} color="#000000" />}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.optionCard,
                selectedGender === 'Female' && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedGender('Female')}
            >
              <Text style={[styles.optionText, selectedGender === 'Female' && styles.optionTextSelected]}>Female</Text>
              <View style={[styles.checkbox, selectedGender === 'Female' && styles.checkboxSelected]}>
                {selectedGender === 'Female' && <AntDesign name="check" size={14} color="#000000" />}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.optionCard,
                selectedGender === 'Other' && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedGender('Other')}
            >
              <Text style={[styles.optionText, selectedGender === 'Other' && styles.optionTextSelected]}>Other</Text>
              <View style={[styles.checkbox, selectedGender === 'Other' && styles.checkboxSelected]}>
                {selectedGender === 'Other' && <AntDesign name="check" size={14} color="#000000" />}
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              !selectedGender && styles.nextButtonDisabled,
            ]}
            disabled={!selectedGender}
            onPress={() => onNext?.(selectedGender)}
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
    marginBottom: 40,
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
    paddingRight: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    width: '100%',
    minHeight: 86,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#262626',
    backgroundColor: '#0A0A0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 90, 31, 0.05)',
  },
  optionText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
