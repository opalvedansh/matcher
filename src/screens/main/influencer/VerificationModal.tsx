import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme/colors';
import { verifyFace } from '@/api';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function VerificationModal({ visible, onClose, onVerified }: VerificationModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (visible) {
      setScanningStatus('idle');
      setErrorMsg(null);
      scanLineAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (scanningStatus === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.stopAnimation();
    }
  }, [scanningStatus]);

  useEffect(() => {
    if (scanningStatus === 'success') {
      const timer = setTimeout(() => {
        onVerified();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [scanningStatus, onVerified]);

  const handleStartScan = async () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    
    setScanningStatus('scanning');
    setErrorMsg(null);
    
    try {
      if (cameraRef.current) {
        // Capture photo with lower quality to avoid 10MB Express limit
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
        
        if (photo?.base64) {
          // Send to backend for AWS Rekognition
          const response = await verifyFace(photo.base64);
          
          if (response.success) {
            setScanningStatus('success');
          } else {
            setScanningStatus('error');
            setErrorMsg('Face is not matching the uploaded image by the user.');
          }
        } else {
          setScanningStatus('error');
          setErrorMsg('Failed to capture image data.');
        }
      }
    } catch (error: any) {
      setScanningStatus('error');
      setErrorMsg(error.message || 'Face is not matching the uploaded image by the user.');
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {!permission.granted ? (
          <SafeAreaView style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#FFF" style={styles.permissionIcon} />
            <Text style={styles.title}>Camera Access Required</Text>
            <Text style={styles.subtitle}>
              We need access to your camera to verify your identity using facial recognition.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing="front" ref={cameraRef} />
            <SafeAreaView style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.faceOutlineContainer}>
                  <View style={[styles.faceOval, scanningStatus === 'success' && styles.faceOvalSuccess]}>
                    {scanningStatus === 'scanning' && (
                      <Animated.View
                        style={[
                          styles.scanLine,
                          {
                            transform: [
                              {
                                translateY: scanLineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-150, 150],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.footer}>
                  {scanningStatus === 'idle' ? (
                    <BlurView intensity={80} tint="dark" style={styles.instructionCard}>
                      <Text style={styles.instructionTitle}>Position Your Face</Text>
                      <Text style={styles.instructionText}>
                        Align your face within the oval outline to begin verification.
                      </Text>
                      <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
                        <Text style={styles.scanButtonText}>Start Verification</Text>
                      </TouchableOpacity>
                    </BlurView>
                  ) : scanningStatus === 'scanning' ? (
                    <BlurView intensity={80} tint="dark" style={styles.instructionCard}>
                      <Text style={styles.instructionTitle}>Scanning...</Text>
                      <Text style={styles.instructionText}>
                        Please hold still while we verify your identity.
                      </Text>
                    </BlurView>
                  ) : scanningStatus === 'error' ? (
                    <BlurView intensity={80} tint="dark" style={[styles.instructionCard, styles.errorCard]}>
                      <Ionicons name="warning" size={48} color="#FF3B30" />
                      <Text style={styles.errorTitle}>Verification Failed</Text>
                      <Text style={styles.errorText}>
                        {errorMsg || 'Face is not matching the uploaded image by the user.'}
                      </Text>
                      <TouchableOpacity style={styles.retryButton} onPress={handleStartScan}>
                        <Text style={styles.scanButtonText}>Try Again</Text>
                      </TouchableOpacity>
                    </BlurView>
                  ) : (
                    <BlurView intensity={80} tint="dark" style={[styles.instructionCard, styles.successCard]}>
                      <Ionicons name="checkmark-circle" size={48} color="#4CD964" />
                      <Text style={styles.successTitle}>Verified!</Text>
                      <Text style={styles.instructionText}>
                        Your profile has been successfully verified.
                      </Text>
                    </BlurView>
                  )}
                </View>
            </SafeAreaView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 260,
    height: 350,
    borderRadius: 150,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  faceOvalSuccess: {
    borderColor: '#4CD964',
    borderStyle: 'solid',
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  instructionCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  successCard: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CD964',
    marginTop: 12,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255,59,48,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
