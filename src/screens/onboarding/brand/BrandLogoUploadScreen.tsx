import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';

import { colors } from '@/theme/colors';

export function BrandLogoUploadScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (logo: string) => void;
}) {
  const [logo, setLogo] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const removeLogo = () => {
    setLogo(null);
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
          <Text style={styles.title}>Upload your{'\n'}logo</Text>
          <Text style={styles.subtitle}>
            Add high-quality logo of your brand
          </Text>
        </View>

        {/* Upload Container */}
        <View style={styles.uploadContainer}>
          <Pressable 
            style={styles.uploadBox}
            onPress={pickImage}
          >
            {logo ? (
              <>
                <Image source={{ uri: logo }} style={styles.image} />
                <Pressable 
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    removeLogo();
                  }}
                >
                  <AntDesign name="close" size={16} color="#FFF" />
                </Pressable>
              </>
            ) : (
              <AntDesign name="plus" size={32} color="#444444" />
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              !logo && styles.nextButtonDisabled,
            ]}
            disabled={!logo}
            onPress={() => {
              if (logo) {
                onNext?.(logo);
              }
            }}
          >
            <Text style={[
              styles.nextButtonText,
              !logo && styles.nextButtonTextDisabled
            ]}>Next</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 24,
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
    paddingRight: 20,
  },
  uploadContainer: {
    width: '100%',
    alignItems: 'center',
  },
  uploadBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLogoText: {
    color: '#8A8A8A',
    fontWeight: '600',
    fontSize: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
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
    backgroundColor: '#333333',
  },
  nextButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: '#8A8A8A',
  },
});
