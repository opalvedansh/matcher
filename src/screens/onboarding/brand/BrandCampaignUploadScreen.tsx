import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';

import { colors } from '@/theme/colors';

export function BrandCampaignUploadScreen({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext?: (photos: string[]) => void;
}) {
  const [photos, setPhotos] = useState<string[]>([]);

  const pickImage = async (index: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const renderPhotoSlots = () => {
    const slots = [];
    for (let i = 0; i < 6; i++) {
      const uri = photos[i];
      slots.push(
        <Pressable 
          key={i} 
          style={styles.photoSlot} 
          onPress={() => pickImage(i)}
        >
          {uri ? (
            <>
              <Image source={{ uri }} style={styles.image} />
              <Pressable 
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  removePhoto(i);
                }}
              >
                <AntDesign name="close" size={12} color="#FFF" />
              </Pressable>
            </>
          ) : (
            <AntDesign name="plus" size={24} color="#444444" />
          )}
        </Pressable>
      );
    }
    return slots;
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Upload your{'\n'}brand campaign</Text>
            <Text style={styles.subtitle}>
              Add high-quality posts about your brand that describes about your organization
            </Text>
          </View>

          {/* Photo Grid */}
          <View style={styles.gridContainer}>
            {renderPhotoSlots()}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              photos.length === 0 && styles.nextButtonDisabled
            ]}
            onPress={() => {
              const validPhotos = photos.filter(Boolean);
              if (validPhotos.length > 0) {
                onNext?.(validPhotos);
              }
            }}
            disabled={photos.length === 0}
          >
            <Text style={[
              styles.nextButtonText,
              photos.length === 0 && styles.nextButtonTextDisabled
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
  photoSlot: {
    width: '31%', // 3 per row with a bit of space
    aspectRatio: 0.65, // Taller than wide
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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
