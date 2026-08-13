import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/theme/colors';

type Role = 'Brand' | 'Influencer' | null;

export function RoleSelectionScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (role: Role) => void;
}) {
  const { width } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

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
            <Text style={styles.title}>What are{'\n'}you</Text>
            <Text style={styles.subtitle}>
              Select that describe you that will help us to show your profile to the right person
            </Text>
          </View>

          {/* Role Options */}
          <View style={styles.optionsContainer}>
            <Pressable
              style={[
                styles.optionCard,
                selectedRole === 'Brand' && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedRole('Brand')}
            >
              <Text style={[styles.optionText, selectedRole === 'Brand' && styles.optionTextSelected]}>Brand</Text>
              <View style={[styles.checkbox, selectedRole === 'Brand' && styles.checkboxSelected]}>
                {selectedRole === 'Brand' && <AntDesign name="check" size={14} color="#000000" />}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.optionCard,
                selectedRole === 'Influencer' && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedRole('Influencer')}
            >
              <Text style={[styles.optionText, selectedRole === 'Influencer' && styles.optionTextSelected]}>Influencer</Text>
              <View style={[styles.checkbox, selectedRole === 'Influencer' && styles.checkboxSelected]}>
                {selectedRole === 'Influencer' && <AntDesign name="check" size={14} color="#000000" />}
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              !selectedRole && styles.nextButtonDisabled,
            ]}
            disabled={!selectedRole}
            onPress={() => onNext?.(selectedRole)}
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
