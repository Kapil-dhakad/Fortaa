import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { createPostApi, uploadMediaApi } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function CreatePostModal({ visible, onClose, user, onPostCreated }) {
  const [postText, setPostText] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [tags, setTags] = useState('');
  const [showTagsInput, setShowTagsInput] = useState(false);
  const [visibility, setVisibility] = useState('Anyone');
  const [isPosting, setIsPosting] = useState(false);

  // Poll state
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Pick Image from Gallery
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
        setMediaType('image');
        setIsPollOpen(false);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  // Pick Video from Gallery
  const handlePickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to select videos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
        setMediaType('video');
        setIsPollOpen(false);
      }
    } catch (err) {
      console.warn('Video picker error:', err);
      Alert.alert('Error', 'Failed to pick video.');
    }
  };

  // Toggle Poll builder
  const handleTogglePoll = () => {
    setIsPollOpen((prev) => !prev);
    if (!isPollOpen) {
      setMediaUri(null);
      setMediaType(null);
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    } else {
      Alert.alert('Limit Reached', 'Maximum 4 options allowed in a poll.');
    }
  };

  const handleUpdatePollOption = (text, index) => {
    setPollOptions((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  // Submit Real Post to Backend
  const handlePost = async () => {
    if (!postText.trim() && !mediaUri && !pollQuestion.trim()) {
      Alert.alert('Empty Post', 'Please write something or attach media/poll.');
      return;
    }

    // Validate Poll if open
    let pollPayload = null;
    if (isPollOpen) {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        Alert.alert('Incomplete Poll', 'Please provide at least 2 poll options.');
        return;
      }
      pollPayload = {
        question: pollQuestion.trim() || postText.trim(),
        options: validOptions.map((opt, idx) => ({ id: idx + 1, text: opt.trim(), votes: 0 })),
        totalVotes: 0,
      };
    }

    try {
      setIsPosting(true);

      let uploadedUrl = null;
      if (mediaUri) {
        uploadedUrl = await uploadMediaApi(mediaUri, mediaType === 'video');
      }

      const payload = {
        userId: user?.id || null,
        authorName: user?.name || 'Fortaa Leader',
        authorRole: user?.designation || user?.accountType || 'Senior Leader',
        authorAvatar: user?.avatar_url || null,
        content: postText.trim() || (isPollOpen ? pollQuestion.trim() : 'New update shared'),
        tags: tags.trim() || null,
        imageUrl: mediaType === 'image' ? (uploadedUrl || mediaUri) : null,
        videoUrl: mediaType === 'video' ? (uploadedUrl || mediaUri) : null,
        mediaType: mediaType || (pollPayload ? 'poll' : 'text'),
        pollData: pollPayload,
      };

      const createdPost = await createPostApi(payload);

      Alert.alert('Post Published 🎉', 'Your post is now live in the network feed!');
      handleReset();
      onPostCreated && onPostCreated(createdPost || payload);
      onClose();
    } catch (err) {
      console.warn('Post creation error:', err);
      Alert.alert('Failed to Post', err.message || 'Server error. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReset = () => {
    setPostText('');
    setMediaUri(null);
    setMediaType(null);
    setTags('');
    setShowTagsInput(false);
    setIsPollOpen(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const userName = user?.name || 'You';
  const userRole = user?.designation || user?.accountType || 'Marketing';
  const userInitial = (userName[0] || 'U').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        style={[
          styles.modalCard,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.dragHandle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create a Post</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
          {/* User Row */}
          <View style={styles.userRow}>
            <LinearGradient
              colors={['#DC3AEE', '#5321E8']}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>{userInitial}</Text>
            </LinearGradient>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.pillsRow}>
                <LinearGradient
                  colors={['#DC3AEE', '#5321E8']}
                  style={styles.rolePill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.rolePillText}>{userRole}</Text>
                </LinearGradient>

                <TouchableOpacity
                  style={styles.visibilityPill}
                  onPress={() => {
                    const opts = ['Anyone', 'Network', 'Team Only'];
                    const next = opts[(opts.indexOf(visibility) + 1) % opts.length];
                    setVisibility(next);
                  }}
                >
                  <Feather name="globe" size={11} color="#2563EB" />
                  <Text style={styles.visibilityText}> {visibility}</Text>
                  <Feather name="chevron-down" size={11} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Main Text Input */}
          <TextInput
            style={styles.postInput}
            placeholder="Share your thoughts, success, opportunity or updates..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={postText}
            onChangeText={setPostText}
            textAlignVertical="top"
          />

          {/* Media Preview Box (Instagram style) */}
          {mediaUri && (
            <View style={styles.previewBox}>
              <Image
                source={{ uri: mediaUri }}
                style={styles.previewMedia}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeMediaBtn}
                onPress={() => {
                  setMediaUri(null);
                  setMediaType(null);
                }}
              >
                <Feather name="x" size={14} color="#fff" />
              </TouchableOpacity>
              <View style={styles.mediaTypeBadge}>
                <Feather
                  name={mediaType === 'video' ? 'video' : 'image'}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.mediaTypeBadgeText}>
                  {mediaType === 'video' ? ' Video' : ' Photo'}
                </Text>
              </View>
            </View>
          )}

          {/* Poll Builder Box */}
          {isPollOpen && (
            <View style={styles.pollBuilder}>
              <View style={styles.pollHeaderRow}>
                <Feather name="bar-chart-2" size={16} color="#5321E8" />
                <Text style={styles.pollBuilderTitle}>Create a Poll</Text>
                <TouchableOpacity onPress={() => setIsPollOpen(false)} style={{ marginLeft: 'auto' }}>
                  <Feather name="x" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.pollQuestionInput}
                placeholder="Ask a question (e.g. Which market to join?)..."
                placeholderTextColor="#9CA3AF"
                value={pollQuestion}
                onChangeText={setPollQuestion}
              />

              {pollOptions.map((opt, idx) => (
                <View key={idx} style={styles.pollOptionRow}>
                  <Text style={styles.pollOptionNum}>{idx + 1}.</Text>
                  <TextInput
                    style={styles.pollOptionInput}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor="#9CA3AF"
                    value={opt}
                    onChangeText={(txt) => handleUpdatePollOption(txt, idx)}
                  />
                </View>
              ))}

              {pollOptions.length < 4 && (
                <TouchableOpacity
                  style={styles.addOptionBtn}
                  onPress={handleAddPollOption}
                >
                  <Feather name="plus" size={14} color="#5321E8" />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tags Input */}
          {showTagsInput && (
            <View style={styles.tagsContainer}>
              <Feather name="tag" size={14} color="#5321E8" />
              <TextInput
                style={styles.tagsInput}
                placeholder="Add tags e.g. #marketing #business #growth"
                placeholderTextColor="#9CA3AF"
                value={tags}
                onChangeText={setTags}
              />
            </View>
          )}

          {/* Add Media Action Buttons */}
          <View style={styles.mediaSection}>
            <Text style={styles.mediaSectionLabel}>Add to your post:</Text>
            <View style={styles.mediaOptions}>
              <TouchableOpacity
                style={[styles.mediaBtn, mediaType === 'image' && styles.mediaBtnActive]}
                onPress={handlePickImage}
              >
                <Feather name="image" size={16} color={mediaType === 'image' ? '#5321E8' : '#374151'} />
                <Text style={[styles.mediaBtnText, mediaType === 'image' && styles.mediaBtnTextActive]}>
                  Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaBtn, mediaType === 'video' && styles.mediaBtnActive]}
                onPress={handlePickVideo}
              >
                <Feather name="video" size={16} color={mediaType === 'video' ? '#5321E8' : '#374151'} />
                <Text style={[styles.mediaBtnText, mediaType === 'video' && styles.mediaBtnTextActive]}>
                  Video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaBtn, isPollOpen && styles.mediaBtnActive]}
                onPress={handleTogglePoll}
              >
                <Feather name="bar-chart-2" size={16} color={isPollOpen ? '#5321E8' : '#374151'} />
                <Text style={[styles.mediaBtnText, isPollOpen && styles.mediaBtnTextActive]}>
                  Poll
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaBtn, showTagsInput && styles.mediaBtnActive]}
                onPress={() => setShowTagsInput((prev) => !prev)}
              >
                <Feather name="hash" size={16} color={showTagsInput ? '#5321E8' : '#374151'} />
                <Text style={[styles.mediaBtnText, showTagsInput && styles.mediaBtnTextActive]}>
                  Tags
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.postBtn, (!postText.trim() && !mediaUri && !pollQuestion.trim()) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={isPosting || (!postText.trim() && !mediaUri && !pollQuestion.trim())}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={postText.trim() || mediaUri || pollQuestion.trim() ? ['#DC3AEE', '#5321E8'] : ['#D1D5DB', '#9CA3AF']}
              style={styles.postBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="send" size={14} color="#fff" />
                  <Text style={styles.postBtnText}> Post</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.9,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E1B4B' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  scrollArea: { paddingHorizontal: 20, maxHeight: height * 0.65 },

  // User Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', marginBottom: 4 },
  pillsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 2.5, borderRadius: 12 },
  rolePillText: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
  visibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  visibilityText: { fontSize: 11, fontWeight: '600', color: '#2563EB' },

  // Text Input
  postInput: {
    minHeight: 90,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    paddingTop: 8,
  },

  // Preview Box
  previewBox: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#0F092A',
  },
  previewMedia: { width: '100%', height: '100%' },
  removeMediaBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mediaTypeBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Poll Builder
  pollBuilder: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    gap: 8,
  },
  pollHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pollBuilderTitle: { fontSize: 13, fontWeight: '700', color: '#5321E8' },
  pollQuestionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pollOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pollOptionNum: { fontSize: 12, fontWeight: '700', color: '#5321E8', width: 16 },
  pollOptionInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addOptionText: { fontSize: 12, fontWeight: '700', color: '#5321E8' },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 8,
    gap: 8,
  },
  tagsInput: { flex: 1, fontSize: 13, color: '#1F2937' },

  // Media
  mediaSection: { paddingVertical: 12 },
  mediaSectionLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  mediaOptions: { flexDirection: 'row', gap: 8 },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaBtnActive: { backgroundColor: '#F5F3FF', borderColor: '#5321E8' },
  mediaBtnText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  mediaBtnTextActive: { color: '#5321E8' },

  // Footer
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  postBtn: { flex: 1, borderRadius: 25, overflow: 'hidden' },
  postBtnDisabled: { opacity: 0.6 },
  postBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  postBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
