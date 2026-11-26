import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

// Ignore background video pause AbortError on web browsers
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AbortError') {
      event.preventDefault();
    }
  });
}

export default function FeedVideoPlayer({
  videoUrl,
  isActive = true,
  onDoubleTap,
  style,
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lastTapRef = useRef(0);
  const muteTimeoutRef = useRef(null);

  // Validate video source
  const validUrl = typeof videoUrl === 'string' && videoUrl.trim().length > 0 ? videoUrl.trim() : null;

  // Initialize expo-video player
  let player = null;
  try {
    player = useVideoPlayer(validUrl, (p) => {
      if (p) {
        p.loop = true;
        p.muted = isMuted;
        if (isActive) {
          try {
            const playPromise = p.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {});
            }
          } catch (e) {}
        } else {
          try {
            p.pause();
          } catch (e) {}
        }
      }
    });
  } catch (err) {
    console.warn('[FeedVideoPlayer] useVideoPlayer init error:', err);
  }

  // Sync active view / auto-play state
  useEffect(() => {
    if (!player) return;
    try {
      if (isActive && isPlaying) {
        const playPromise = player.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      } else {
        player.pause();
      }
    } catch (e) {}
  }, [isActive, isPlaying, player]);

  // Sync mute state
  useEffect(() => {
    if (!player) return;
    try {
      player.muted = isMuted;
    } catch (e) {}
  }, [isMuted, player]);

  // Handle tap / double-tap
  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      // Double tap detected: trigger Instagram like animation!
      if (onDoubleTap) {
        onDoubleTap();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap: toggle mute like Instagram feed
      setTimeout(() => {
        if (lastTapRef.current === now) {
          setIsMuted((prev) => !prev);
          setShowMuteIndicator(true);
          if (muteTimeoutRef.current) clearTimeout(muteTimeoutRef.current);
          muteTimeoutRef.current = setTimeout(() => {
            setShowMuteIndicator(false);
          }, 1200);
        }
      }, DOUBLE_PRESS_DELAY);
    }
  };

  const handleTogglePlayPause = () => {
    if (!player) return;
    setIsPlaying((prev) => {
      const next = !prev;
      try {
        if (next) player.play();
        else player.pause();
      } catch (e) {}
      return next;
    });
  };

  if (!validUrl || hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Feather name="video-off" size={32} color="#94A3B8" />
        <Text style={styles.fallbackText}>Video unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.98}
        onPress={handlePress}
        style={styles.touchArea}
      >
        {player ? (
          <VideoView
            player={player}
            style={styles.videoView}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
        ) : (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#5321E8" />
          </View>
        )}

        {/* Play/Pause Overlay Icon if user paused */}
        {!isPlaying && (
          <View style={styles.pausedOverlay}>
            <TouchableOpacity
              style={styles.pausedIconCircle}
              onPress={handleTogglePlayPause}
              activeOpacity={0.8}
            >
              <Feather name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Center Flash Mute Indicator (Instagram style) */}
        {showMuteIndicator && (
          <View style={styles.centerMuteBadge}>
            <Feather
              name={isMuted ? 'volume-x' : 'volume-2'}
              size={24}
              color="#FFFFFF"
            />
          </View>
        )}

        {/* Bottom Right Sound Badge */}
        <TouchableOpacity
          style={styles.cornerSoundBadge}
          onPress={() => setIsMuted((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Feather
            name={isMuted ? 'volume-x' : 'volume-2'}
            size={14}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  touchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    gap: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerMuteBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerSoundBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
