import { useState, useEffect } from 'react';
import { AntDesign, Feather } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';

import { colors } from '@/theme/colors';

const fetchInstagramUsers = async (query: string): Promise<string[]> => {
  if (!query || query.length < 3) return [];
  const q = query.replace('@', '').toLowerCase();
  
  // Your RapidAPI Key from the screenshot
  const RAPIDAPI_KEY = '23760859c8msh6584e02c13968d2p1e15fajsne8fd1b0c01cf';

  try {
    // Note: We are using the "Search" endpoint for this API.
    const response = await fetch(`https://instagram-statistics-api.p.rapidapi.com/search?q=${q}&perPage=5`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Instagram API error:', response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('API Response:', data); // Logging this so we can see the exact structure
    
    // Extract usernames from the RapidAPI response structure
    if (data && Array.isArray(data.data)) {
      return data.data.map((item: any) => `@${item.screenName || item.username}`);
    } else if (data && data.data && data.data.items) {
      return data.data.items.map((item: any) => `@${item.screenName || item.username}`);
    } else if (data && data.items) {
      return data.items.map((item: any) => `@${item.screenName || item.username}`);
    } else if (Array.isArray(data)) {
      return data.map((item: any) => `@${item.screenName || item.username || item.user?.username}`);
    }
    return [];
  } catch (error) {
    console.warn('Failed to fetch Instagram users:', error);
    return [];
  }
};

export function NameInputScreen({
  role,
  onBack,
  onNext,
}: {
  role: 'Brand' | 'Influencer';
  onBack?: () => void;
  onNext?: (name: string, instagramId?: string) => void;
}) {
  const [name, setName] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    if (hasSelected || !instagramId || instagramId.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      const results = await fetchInstagramUsers(instagramId);
      setSearchResults(results);
      setIsSearching(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [instagramId, hasSelected]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Pressable onPress={onBack} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color={colors.text} />
        </Pressable>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            What's your{'\n'}
            {role === 'Brand' ? 'Brand Name' : 'Name'}
          </Text>
          <Text style={styles.subtitle}>
            This is what is going to appear on your profile
          </Text>
        </View>

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter"
            placeholderTextColor="#555555"
            value={name}
            onChangeText={setName}
            selectionColor={colors.primary}
            autoCapitalize="words"
            autoCorrect={false}
            onSubmitEditing={() => {
              if (name.trim() !== '') {
                onNext?.(name, instagramId);
              }
            }}
          />
        </View>

        {role === 'Influencer' && (
          <View style={{ marginTop: 24, zIndex: 10 }}>
            <Text style={[styles.subtitle, { paddingRight: 0, marginBottom: 12 }]}>
              Connect Instagram (Optional)
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="@username"
                placeholderTextColor="#555555"
                value={instagramId}
                onChangeText={(text) => {
                  setInstagramId(text);
                  setHasSelected(false);
                }}
                selectionColor={colors.primary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isSearching && (
                <View style={{ position: 'absolute', right: 20, top: 32 }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>

            {/* Dropdown Results */}
            {searchResults.length > 0 && !hasSelected && (
              <View style={styles.dropdownContainer}>
                {searchResults.map((item, index) => (
                  <Pressable
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setInstagramId(item);
                      setHasSelected(true);
                      setSearchResults([]);
                    }}
                  >
                    <Feather name="instagram" size={16} color="#8A8A8A" />
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.nextButton,
              name.trim() === '' && styles.nextButtonDisabled,
            ]}
            disabled={name.trim() === ''}
            onPress={() => {
              if (name.trim() !== '') {
                onNext?.(name, instagramId);
              }
            }}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 24,
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    marginBottom: 8,
  },
  subtitle: {
    color: '#8A8A8A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    paddingRight: 20,
  },
  inputContainer: {
    width: '100%',
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
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
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  dropdownContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    gap: 12,
  },
  dropdownItemText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
