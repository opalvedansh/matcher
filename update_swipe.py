import re

with open('/Users/vedansh/Desktop/matcherc.app/src/screens/main/influencer/SwipeScreen.tsx', 'r') as f:
    content = f.read()

# 1. Update Imports
content = re.sub(
    r"import \{.*?\} from 'react-native';",
    """import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';""",
    content,
    flags=re.DOTALL
)

# 2. Update Shared Values
content = re.sub(
    r"const position = useRef\(new Animated\.ValueXY\(\)\)\.current;",
    """const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);""",
    content
)

# 3. Update handleSwipe resetting
content = re.sub(
    r"position\.setValue\(\{ x: 0, y: 0 \}\);",
    """translateX.value = 0;
    translateY.value = 0;""",
    content
)

# 4. Remove PanResponder and Old Interpolations, replace with Reanimated logic
old_logic_pattern = r"const panResponder = useRef\(.*?\}\);\s*\n\s*const rotate = position\.x\.interpolate.*?\}\);\s*\n\s*const forceSwipe"

new_logic = """const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const SWIPE_VELOCITY = 500;
      const SWIPE_THRESHOLD = width * 0.3;

      if (event.translationX > SWIPE_THRESHOLD || event.velocityX > SWIPE_VELOCITY) {
        translateX.value = withTiming(width + 200, { duration: 250 }, () => {
          runOnJS(handleSwipe)('right');
        });
        translateY.value = withTiming(event.translationY + (event.velocityY * 0.2), { duration: 250 });
      } else if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -SWIPE_VELOCITY) {
        translateX.value = withTiming(-width - 200, { duration: 250 }, () => {
          runOnJS(handleSwipe)('left');
        });
        translateY.value = withTiming(event.translationY + (event.velocityY * 0.2), { duration: 250 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translateX.value, [20, 100], [0, 1], Extrapolation.CLAMP),
    };
  });

  const nopeOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translateX.value, [-100, -20], [1, 0], Extrapolation.CLAMP),
    };
  });

  const forceSwipe"""
content = re.sub(old_logic_pattern, new_logic, content, flags=re.DOTALL)

# 5. Update forceSwipe
old_forceswipe = r"const forceSwipe = \(dir: 'left' \| 'right'\) => \{.*?\}\);"
new_forceswipe = """const forceSwipe = (dir: 'left' | 'right') => {
    const x = dir === 'right' ? width + 200 : -width - 200;
    translateX.value = withTiming(x, { duration: 250 }, () => {
      runOnJS(handleSwipe)(dir);
    });
    translateY.value = withTiming(0, { duration: 250 });
  };"""
content = re.sub(old_forceswipe, new_forceswipe, content, flags=re.DOTALL)

# 6. Update rendering
old_render = r"<Animated\.View\s+key=\{profile\.user_id\}\s+style=\{\[\s+ss\.cardWrapper,\s+isTop\s+\?\s+\{\s+transform: \[.*?rotate \}\],\s+zIndex: 10\s+\}\s+:\s+\{\s+zIndex: 1,\s+transform: \[\{\s+scale: 0\.97\s+\}\],\s+top: 6\s+\},\s+\]\}\s+\{\.\.\.\(isTop \? panResponder\.panHandlers : \{\}\)\}\s+>\s+<Pressable style=\{\{ flex: 1 \}\} onPress=\{.*?\}\s+>\s+<CardContent item=\{item\} />\s+\{isTop && \(\s+<>\s+<Animated\.View style=\{\[ss\.stamp, ss\.likeStamp, \{ opacity: likeOpacity \}\]\}>\s+<Text style=\{ss\.likeStampTxt\}>LIKE</Text>\s+</Animated\.View>\s+<Animated\.View style=\{\[ss\.stamp, ss\.nopeStamp, \{ opacity: nopeOpacity \}\]\}>\s+<Text style=\{ss\.nopeStampTxt\}>NOPE</Text>\s+</Animated\.View>\s+</>\s+\)\}\s+</Pressable>\s+</Animated\.View>"
new_render = """<GestureDetector key={profile.user_id} gesture={isTop ? panGesture : Gesture.Pan().enabled(false)}>
            <Animated.View
              style={[
                ss.cardWrapper,
                isTop
                  ? [animatedCardStyle, { zIndex: 10 }]
                  : { zIndex: 1, transform: [{ scale: 0.97 }], top: 6 },
              ]}
            >
              <Pressable style={{ flex: 1 }} onPress={() => isTop && onViewProfile && onViewProfile(profile.user_id)}>
                <CardContent item={item} />
                {isTop && (
                  <>
                    <Animated.View style={[ss.stamp, ss.likeStamp, likeOpacityStyle]}>
                      <Text style={ss.likeStampTxt}>LIKE</Text>
                    </Animated.View>
                    <Animated.View style={[ss.stamp, ss.nopeStamp, nopeOpacityStyle]}>
                      <Text style={ss.nopeStampTxt}>NOPE</Text>
                    </Animated.View>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </GestureDetector>"""

content = re.sub(old_render, new_render, content, flags=re.DOTALL)

with open('/Users/vedansh/Desktop/matcherc.app/src/screens/main/influencer/SwipeScreen.tsx', 'w') as f:
    f.write(content)

print("Migration applied!")
