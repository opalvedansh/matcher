import { useState } from 'react';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import { colors } from '@/theme/colors';

export function BrandBioInputScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (bio: string) => void;
}) {
  const [bio, setBio] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const charCount = bio.length;
  const isOverLimit = charCount > 250;
  const isValid = charCount > 0 && !isOverLimit;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {Platform.OS === 'web' ? (
          <View style={styles.container}>
            
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={onBack} style={styles.backButton}>
                <AntDesign name="arrow-left" size={24} color={colors.text} />
              </Pressable>
              <View style={styles.progressPill}>
                <Text style={styles.progressText}>Step 2 of 4</Text>
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                Write about{'\n'}
                <Text style={styles.titleHighlight}>your brand</Text>.
              </Text>
              <Text style={styles.subtitle}>
                Tell us your story. A captivating bio helps creators understand your brand's unique vibe and mission.
              </Text>
            </View>

            {/* Input Card */}
            <View style={[styles.inputCard, isFocused && styles.inputCardFocused, isOverLimit && styles.inputCardError]}>
              <TextInput
                style={styles.input}
                placeholder="We believe that finding the right aesthetic should be as rewarding as..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                textAlignVertical="top"
                value={bio}
                onChangeText={setBio}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus
              />
              
              {/* Footer of Input Card */}
              <View style={styles.inputFooter}>
                <Ionicons 
                  name={isOverLimit ? "alert-circle" : "pencil"} 
                  size={16} 
                  color={isOverLimit ? '#FF3B30' : '#FF6B2B'} 
                />
                <Text style={[styles.wordCount, isOverLimit && styles.wordCountError]}>
                  {charCount} / 250 characters
                </Text>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable
                style={[
                  styles.nextButton,
                  !isValid && styles.nextButtonDisabled,
                ]}
                disabled={!isValid}
                onPress={() => onNext?.(bio)}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
                <AntDesign name="arrow-right" size={20} color={colors.text} />
              </Pressable>
            </View>

          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              
              {/* Header */}
              <View style={styles.header}>
                <Pressable onPress={onBack} style={styles.backButton}>
                  <AntDesign name="arrow-left" size={24} color={colors.text} />
                </Pressable>
                <View style={styles.progressPill}>
                  <Text style={styles.progressText}>Step 2 of 4</Text>
                </View>
              </View>

              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  Write about{'\n'}
                  <Text style={styles.titleHighlight}>your brand</Text>.
                </Text>
                <Text style={styles.subtitle}>
                  Tell us your story. A captivating bio helps creators understand your brand's unique vibe and mission.
                </Text>
              </View>

              {/* Input Card */}
              <View style={[styles.inputCard, isFocused && styles.inputCardFocused, isOverLimit && styles.inputCardError]}>
                <TextInput
                  style={styles.input}
                  placeholder="We believe that finding the right aesthetic should be as rewarding as..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  multiline
                  textAlignVertical="top"
                  value={bio}
                  onChangeText={setBio}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoFocus
                />
                
                {/* Footer of Input Card */}
                <View style={styles.inputFooter}>
                  <Ionicons 
                    name={isOverLimit ? "alert-circle" : "pencil"} 
                    size={16} 
                    color={isOverLimit ? '#FF3B30' : '#FF6B2B'} 
                  />
                  <Text style={[styles.wordCount, isOverLimit && styles.wordCountError]}>
                    {charCount} / 250 characters
                  </Text>
                </View>
              </View>

              {/* Spacer */}
              <View style={{ flex: 1 }} />

              {/* Footer */}
              <View style={styles.footer}>
                <Pressable
                  style={[
                    styles.nextButton,
                    !isValid && styles.nextButtonDisabled,
                  ]}
                  disabled={!isValid}
                  onPress={() => onNext?.(bio)}
                >
                  <Text style={styles.nextButtonText}>Continue</Text>
                  <AntDesign name="arrow-right" size={20} color={colors.text} />
                </Pressable>
              </View>

            </View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Deep premium black
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,43,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.2)',
  },
  progressText: {
    color: '#FF6B2B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textContainer: {
    marginBottom: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 12,
  },
  titleHighlight: {
    color: '#FF6B2B',
  },
  subtitle: {
    color: '#999',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    paddingRight: 20,
    letterSpacing: 0.2,
  },
  inputCard: {
    height: 240,
    backgroundColor: '#0F0F0F',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222',
    padding: 24,
    boxShadow: '0px 10px 20px rgba(0,0,0,0.3)',
    elevation: 10,
  },
  inputCardFocused: {
    borderColor: '#FF6B2B',
    backgroundColor: '#161616',
    boxShadow: '0px 8px 24px rgba(255,107,43,0.15)',
    elevation: 8,
  },
  inputCardError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 6,
  },
  wordCount: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  wordCountError: {
    color: '#FF3B30',
  },
  footer: {
    justifyContent: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B2B',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    boxShadow: '0px 8px 16px rgba(255,107,43,0.4)',
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.4,
    boxShadow: '0px 0px 0px rgba(0,0,0,0)',
    backgroundColor: '#333',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
