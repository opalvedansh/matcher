import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Keyboard, Pressable, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '@/api/client';
import { colors } from '@/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

type Weights = {
  CATEGORY_OVERLAP: number;
  BUDGET_FIT: number;
  LOCATION_MATCH: number;
  COMPLETENESS: number;
};

export default function AdminAlgorithmScreen() {
  const [weights, setWeights] = useState<Weights | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWeights = async () => {
    try {
      setLoading(true);
      const data = await api.get<Weights>('/api/admin/algorithm');
      setWeights(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fetch algorithm weights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const handleSave = async () => {
    if (!weights) return;
    
    const total = Number(weights.CATEGORY_OVERLAP) + Number(weights.BUDGET_FIT) + Number(weights.LOCATION_MATCH) + Number(weights.COMPLETENESS);
    if (total !== 100) {
      Alert.alert('Notice', `Weights sum up to ${total}, not 100. This might skew maximum scores, but is allowed.`);
    }

    try {
      setSaving(true);
      const parsedWeights = {
        CATEGORY_OVERLAP: Number(weights.CATEGORY_OVERLAP),
        BUDGET_FIT: Number(weights.BUDGET_FIT),
        LOCATION_MATCH: Number(weights.LOCATION_MATCH),
        COMPLETENESS: Number(weights.COMPLETENESS),
      };
      
      const res = await api.put<Weights>('/api/admin/algorithm', parsedWeights);
      setWeights(res);
      Alert.alert('Success', 'Algorithm weights updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update algorithm weights');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof Weights, value: string) => {
    if (weights) {
      setWeights({ ...weights, [key]: value.replace(/[^0-9]/g, '') });
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0F0F13', '#000000']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderInput = (label: string, key: keyof Weights, icon: any) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={String(weights?.[key] || 0)}
          onChangeText={(t) => handleChange(key, t)}
          keyboardType="numeric"
          placeholderTextColor="rgba(255,255,255,0.2)"
          selectionColor={colors.primary}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <Text style={styles.inputSuffix}>pts</Text>
      </View>
    </View>
  );

  const totalWeights = weights ? Number(weights.CATEGORY_OVERLAP) + Number(weights.BUDGET_FIT) + Number(weights.LOCATION_MATCH) + Number(weights.COMPLETENESS) : 0;
  const isPerfectTotal = totalWeights === 100;

  return (
    <LinearGradient colors={['#0F0F13', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.container}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerSubtitle}>MATCHMAKING ENGINE</Text>
            <Text style={styles.headerTitle}>Algorithm</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            
            <View style={styles.totalBadgeContainer}>
              <View style={[styles.totalBadge, isPerfectTotal ? styles.totalBadgePerfect : styles.totalBadgeWarning]}>
                <Text style={styles.totalBadgeText}>
                  Total: {totalWeights} / 100
                </Text>
              </View>
            </View>

            <View style={styles.cardContainer}>
              <BlurView intensity={30} tint="dark" style={styles.blurCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']}
                  style={styles.cardGradient}
                >
                  {renderInput('Category Overlap', 'CATEGORY_OVERLAP', 'apps')}
                  {renderInput('Budget & Price Fit', 'BUDGET_FIT', 'cash')}
                  {renderInput('Location Match', 'LOCATION_MATCH', 'location')}
                  {renderInput('Profile Completeness', 'COMPLETENESS', 'checkmark-circle')}

                  <Pressable 
                    style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} 
                    onPress={() => { Keyboard.dismiss(); handleSave(); }}
                    disabled={saving}
                  >
                    <LinearGradient
                      colors={[colors.primary, '#E3FF00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      {saving ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <>
                          <Ionicons name="hardware-chip" size={20} color="#000" style={{ marginRight: 8 }} />
                          <Text style={styles.btnText}>Update Algorithm</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </BlurView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  totalBadgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  totalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  totalBadgePerfect: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  totalBadgeWarning: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  totalBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  blurCard: {
    flex: 1,
  },
  cardGradient: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    opacity: 0.9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    height: 56,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  inputSuffix: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: '600',
    paddingRight: 16,
  },
  btn: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});
