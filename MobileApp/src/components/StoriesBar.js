import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchStoriesApi,
  createStoryApi,
  recordStoryViewApi,
  toggleStoryLikeApi,
  uploadMediaApi,
} from '../services/api';

const { width, height } = Dimensions.get('window');
const STORY_SIZE = 68;

const GRADIENT_PRESETS = [
  ['#DC3AEE', '#5321E8'],
  ['#FF512F', '#DD2476'],
  ['#8E2DE2', '#4A00E0'],
  ['#11998E', '#38EF7D'],
  ['#F7971E', '#FFD200'],
  ['#00C9FF', '#92FE9D'],
];

export default function StoriesBar({ user }) {
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Story Viewer State
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Add Story Modal State
  const [addStoryModalVisible, setAddStoryModalVisible] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [pickedMedia, setPickedMedia] = useState(null);
  const [pickedMediaType, setPickedMediaType] = useState('photo'); // 'photo' | 'video'
  const [selectedGradientIndex, setSelectedGradientIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load real stories from backend
  const loadStories = async () => {
    try {
      setLoading(true);
      const groups = await fetchStoriesApi(user?.id || 0);
      setStoryGroups(groups);
    } catch (err) {
      console.warn('Load stories error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [user]);

  // Handle Opening a Story Group
  const handleOpenGroup = (index) => {
    setActiveGroupIndex(index);
    setActiveStoryIndex(0);
    startStoryProgress(index, 0);
  };

  const startStoryProgress = (grpIdx, stIdx) => {
    progressAnim.setValue(0);
    const grp = storyGroups[grpIdx];
    const currentStory = grp?.stories[stIdx];

    if (currentStory && user?.id) {
      recordStoryViewApi(currentStory.id, user.id);
      setIsLiked(!!currentStory.is_liked);
    }

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNextStory(grpIdx, stIdx);
      }
    });
  };

  const handleNextStory = (grpIdx = activeGroupIndex, stIdx = activeStoryIndex) => {
    progressAnim.stopAnimation();
    const grp = storyGroups[grpIdx];
    if (stIdx + 1 < (grp?.stories?.length || 0)) {
      setActiveStoryIndex(stIdx + 1);
      startStoryProgress(grpIdx, stIdx + 1);
    } else if (grpIdx + 1 < storyGroups.length) {
      setActiveGroupIndex(grpIdx + 1);
      setActiveStoryIndex(0);
      startStoryProgress(grpIdx + 1, 0);
    } else {
      handleCloseViewer();
    }
  };

  const handlePrevStory = () => {
    progressAnim.stopAnimation();
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      startStoryProgress(activeGroupIndex, activeStoryIndex - 1);
    } else if (activeGroupIndex > 0) {
      const prevGrp = storyGroups[activeGroupIndex - 1];
      const lastIdx = (prevGrp?.stories?.length || 1) - 1;
      setActiveGroupIndex(activeGroupIndex - 1);
      setActiveStoryIndex(lastIdx);
      startStoryProgress(activeGroupIndex - 1, lastIdx);
    } else {
      startStoryProgress(activeGroupIndex, 0);
    }
  };

  const handleCloseViewer = () => {
    progressAnim.stopAnimation();
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
  };

  const handleToggleLike = async () => {
    const grp = storyGroups[activeGroupIndex];
    const currentStory = grp?.stories[activeStoryIndex];
    if (!currentStory) return;

    setIsLiked(!isLiked);
    if (user?.id) {
      await toggleStoryLikeApi(currentStory.id, user.id);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    Alert.alert('Reply Sent 💬', `Your reply "${replyText}" has been sent.`);
    setReplyText('');
  };

  // Add Story - Pick photo or video from phone
  const handlePickMediaForStory = async (type) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload stories.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ['videos'] : ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedMedia(result.assets[0].uri);
        setPickedMediaType(type);
      }
    } catch (err) {
      console.warn('Picker error:', err);
    }
  };

  // Publish Story to Backend
  const handlePublishStory = async () => {
    if (!storyText.trim() && !pickedMedia) {
      Alert.alert('Empty Story', 'Please type something or pick a photo/video.');
      return;
    }

    try {
      setIsPublishing(true);

      let mediaUrl = null;
      if (pickedMedia) {
        mediaUrl = await uploadMediaApi(pickedMedia, pickedMediaType === 'video');
      }

      const grad = GRADIENT_PRESETS[selectedGradientIndex];
      const backgroundStyle = `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`;

      await createStoryApi({
        userId: user?.id || null,
        mediaType: pickedMedia ? pickedMediaType : 'text',
        mediaUrl: mediaUrl || pickedMedia || null,
        textContent: storyText.trim() || null,
        backgroundStyle,
      });

      Alert.alert('Story Published! ✨', 'Your story is live for 24 hours.');
      setAddStoryModalVisible(false);
      setStoryText('');
      setPickedMedia(null);
      loadStories();
    } catch (err) {
      console.warn('Publish story error:', err);
      Alert.alert('Failed to publish story', err.message || 'Server error');
    } finally {
      setIsPublishing(false);
    }
  };

  const userInitial = (user?.name || 'Y')[0].toUpperCase();

  // Active Story Group and current story item
  const currentGroup = activeGroupIndex !== null ? storyGroups[activeGroupIndex] : null;
  const currentStory = currentGroup?.stories[activeStoryIndex];

  return (
    <>
      <FlatList
        horizontal
        data={[{ isAdd: true, id: 'add_btn' }, ...storyGroups]}
        keyExtractor={(item, index) => item.id || String(index)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        style={styles.storiesList}
        renderItem={({ item, index }) => {
          if (item.isAdd) {
            return (
              <TouchableOpacity
                style={styles.storyItem}
                onPress={() => setAddStoryModalVisible(true)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#F3F0FF', '#EDE9FE']} style={styles.addStoryRing}>
                  <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.storyCircle}>
                    <Text style={styles.addStoryInitial}>{userInitial}</Text>
                  </LinearGradient>
                </LinearGradient>
                <View style={styles.plusBadge}>
                  <Feather name="plus" size={10} color="#fff" />
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>Add Story</Text>
              </TouchableOpacity>
            );
          }

          const hasUnviewed = item.hasUnviewed;
          const grad = GRADIENT_PRESETS[(index - 1) % GRADIENT_PRESETS.length];

          return (
            <TouchableOpacity
              style={styles.storyItem}
              onPress={() => handleOpenGroup(index - 1)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={hasUnviewed ? grad : ['#D1D5DB', '#9CA3AF']}
                style={styles.storyRing}
              >
                <View style={styles.storyInnerRing}>
                  {item.userAvatar ? (
                    <Image source={{ uri: item.userAvatar }} style={styles.storyAvatarImg} />
                  ) : (
                    <LinearGradient
                      colors={[grad[0] + '33', grad[1] + '55']}
                      style={styles.storyCircle}
                    >
                      <Text style={styles.storyInitial}>
                        {(item.userName || 'U')[0].toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
              <Text style={styles.storyLabel} numberOfLines={1}>
                {item.userName ? item.userName.split(' ')[0] : 'Leader'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── INSTAGRAM-LIKE STORY VIEWER MODAL ─── */}
      <Modal
        visible={activeGroupIndex !== null}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseViewer}
      >
        {currentGroup && currentStory && (
          <View style={styles.viewerContainer}>
            {/* Story Background / Media */}
            {currentStory.media_url ? (
              <Image
                source={{ uri: currentStory.media_url }}
                style={styles.viewerMediaBg}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={GRADIENT_PRESETS[activeGroupIndex % GRADIENT_PRESETS.length]}
                style={styles.viewerMediaBg}
              >
                {currentStory.text_content && (
                  <View style={styles.viewerTextCenter}>
                    <Text style={styles.viewerBigText}>{currentStory.text_content}</Text>
                  </View>
                )}
              </LinearGradient>
            )}

            {/* Dark gradient overlay on top for contrast */}
            <LinearGradient
              colors={['rgba(0,0,0,0.65)', 'transparent']}
              style={styles.topVignette}
            />

            {/* Tap areas for Prev / Next */}
            <TouchableOpacity
              style={styles.tapAreaLeft}
              onPress={handlePrevStory}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.tapAreaRight}
              onPress={() => handleNextStory()}
              activeOpacity={1}
            />

            {/* Top Progress Bars (1 per story in group) */}
            <View style={styles.progressRow}>
              {currentGroup.stories.map((st, i) => {
                let fillStyle = {};
                if (i < activeStoryIndex) fillStyle = { width: '100%' };
                else if (i === activeStoryIndex) {
                  fillStyle = {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  };
                } else fillStyle = { width: '0%' };

                return (
                  <View key={st.id || i} style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, fillStyle]} />
                  </View>
                );
              })}
            </View>

            {/* Author Header */}
            <View style={styles.viewerHeader}>
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorInitial}>
                    {(currentGroup.userName || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{currentGroup.userName}</Text>
                  <Text style={styles.authorTime}>
                    {currentStory.created_at ? new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleCloseViewer} style={styles.viewerCloseBtn}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* If story has overlay text on top of media */}
            {currentStory.media_url && currentStory.text_content && (
              <View style={styles.captionBox}>
                <Text style={styles.captionText}>{currentStory.text_content}</Text>
              </View>
            )}

            {/* Bottom Instagram Action Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.replyInputWrap}>
                <TextInput
                  style={styles.replyInput}
                  placeholder={`Reply to ${currentGroup.userName.split(' ')[0]}...`}
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={replyText}
                  onChangeText={setReplyText}
                  onSubmitEditing={handleSendReply}
                />
                {replyText.trim().length > 0 && (
                  <TouchableOpacity onPress={handleSendReply}>
                    <Feather name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.heartBtn}
                onPress={handleToggleLike}
                activeOpacity={0.8}
              >
                <Feather
                  name="heart"
                  size={24}
                  color={isLiked ? '#EF4444' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ─── ADD STORY CREATOR MODAL ─── */}
      <Modal
        visible={addStoryModalVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAddStoryModalVisible(false)}
      >
        <LinearGradient
          colors={GRADIENT_PRESETS[selectedGradientIndex]}
          style={styles.addStoryModalContainer}
        >
          {/* Header */}
          <View style={styles.addStoryHeader}>
            <TouchableOpacity onPress={() => setAddStoryModalVisible(false)}>
              <Feather name="x" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.addStoryHeaderTitle}>Add to Story</Text>
            <TouchableOpacity
              onPress={handlePublishStory}
              disabled={isPublishing}
              style={styles.shareStoryPill}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#5321E8" />
              ) : (
                <Text style={styles.shareStoryPillText}>Share →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Media Preview or Text Editor */}
          <View style={styles.addStoryCanvas}>
            {pickedMedia ? (
              <View style={styles.storyMediaWrapper}>
                <Image source={{ uri: pickedMedia }} style={styles.storyMediaCanvas} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.clearMediaBtn}
                  onPress={() => setPickedMedia(null)}
                >
                  <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={styles.storyTextInput}
                placeholder="Type your story update, leadership quote, or announcement..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                multiline
                value={storyText}
                onChangeText={setStoryText}
                textAlignVertical="center"
              />
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.addStoryBottomControls}>
            {/* Color Palette Selector */}
            {!pickedMedia && (
              <View style={styles.paletteRow}>
                {GRADIENT_PRESETS.map((grad, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedGradientIndex(idx)}
                    style={[
                      styles.paletteDot,
                      selectedGradientIndex === idx && styles.paletteDotActive,
                    ]}
                  >
                    <LinearGradient colors={grad} style={styles.paletteDotInner} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Media Pickers: Photo, Video */}
            <View style={styles.addStoryActionsRow}>
              <TouchableOpacity
                style={styles.storyMediaBtn}
                onPress={() => handlePickMediaForStory('photo')}
              >
                <Feather name="image" size={20} color="#fff" />
                <Text style={styles.storyMediaBtnText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storyMediaBtn}
                onPress={() => handlePickMediaForStory('video')}
              >
                <Feather name="video" size={20} color="#fff" />
                <Text style={styles.storyMediaBtnText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  storiesList: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE9FF' },
  storiesContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 12, flexDirection: 'row' },
  storyItem: { alignItems: 'center', width: STORY_SIZE },

  // Add Story Button
  addStoryRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCircle: {
    width: STORY_SIZE - 6,
    height: STORY_SIZE - 6,
    borderRadius: (STORY_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryInitial: { fontSize: 22, fontWeight: '800', color: '#fff' },
  plusBadge: {
    position: 'absolute',
    bottom: 16,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Real Story Ring
  storyRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInnerRing: {
    width: STORY_SIZE - 7,
    height: STORY_SIZE - 7,
    borderRadius: (STORY_SIZE - 7) / 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarImg: { width: '100%', height: '100%' },
  storyInitial: { fontSize: 20, fontWeight: '800', color: '#5321E8' },
  storyLabel: { fontSize: 10, color: '#374151', marginTop: 4, fontWeight: '500', textAlign: 'center' },

  // ─── INSTAGRAM STORY VIEWER ───
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerMediaBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width, height },
  viewerTextCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  viewerBigText: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 36 },
  topVignette: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },

  tapAreaLeft: { position: 'absolute', top: 100, bottom: 90, left: 0, width: width * 0.35, zIndex: 10 },
  tapAreaRight: { position: 'absolute', top: 100, bottom: 90, right: 0, width: width * 0.65, zIndex: 10 },

  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 50,
    zIndex: 20,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: { height: 3, backgroundColor: '#fff', borderRadius: 2 },

  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: { fontSize: 16, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  authorTime: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  viewerCloseBtn: { padding: 4 },

  captionBox: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 10,
    zIndex: 15,
  },
  captionText: { fontSize: 14, color: '#fff', fontWeight: '500' },

  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
  },
  replyInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  replyInput: { flex: 1, color: '#fff', fontSize: 13 },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── ADD STORY CREATOR ───
  addStoryModalContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 16 },
  addStoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addStoryHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  shareStoryPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  shareStoryPillText: { fontSize: 13, fontWeight: '800', color: '#5321E8' },

  addStoryCanvas: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyTextInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 20,
  },
  storyMediaWrapper: { width: '100%', height: '80%', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  storyMediaCanvas: { width: '100%', height: '100%' },
  clearMediaBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addStoryBottomControls: { paddingBottom: 30, gap: 14 },
  paletteRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  paletteDot: { width: 28, height: 28, borderRadius: 14, padding: 2 },
  paletteDotActive: { borderWidth: 2, borderColor: '#fff' },
  paletteDotInner: { width: '100%', height: '100%', borderRadius: 12 },

  addStoryActionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  storyMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  storyMediaBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
