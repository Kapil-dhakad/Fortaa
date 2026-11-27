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
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { createPostApi, uploadMediaApi } from '../services/api';
import FeedVideoPlayer from './FeedVideoPlayer';

const { height } = Dimensions.get('window');

const showAlert = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function CreatePostModal({
  visible,
  onClose,
  user,
  onPostCreated,
  initialMediaUri = null,
  initialMediaType = null,
  initialPollOpen = false,
}) {
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
      // Sync any direct-trigger initial state (e.g., from Photo / Video / Poll pill click)
      if (initialMediaUri) {
        setMediaUri(initialMediaUri);
        setMediaType(initialMediaType || 'image');
        setIsPollOpen(false);
      } else if (initialPollOpen) {
        setIsPollOpen(true);
        setMediaUri(null);
        setMediaType(null);
      }

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
  }, [visible, initialMediaUri, initialMediaType, initialPollOpen]);

  // Pick Image from Gallery
  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showAlert('Permission Denied', 'Please allow gallery access to select photos.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS !== 'web',
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
        setMediaType('image');
        setIsPollOpen(false);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showAlert('Error', 'Failed to pick image.');
    }
  };

  // Pick Video from Gallery
  const handlePickVideo = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showAlert('Permission Denied', 'Please allow gallery access to select videos.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: Platform.OS !== 'web',
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
        setMediaType('video');
        setIsPollOpen(false);
      }
    } catch (err) {
      console.warn('Video picker error:', err);
      showAlert('Error', 'Failed to pick video.');
    }
  };

  // Toggle Poll builder
  const handleTogglePoll = () => {
    setIsPollOpen((prev) => {
      const next = !prev;
      if (next) {
        setMediaUri(null);
        setMediaType(null);
      }
      return next;
    });
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    } else {
      showAlert('Limit Reached', 'Maximum 4 options allowed in a poll.');
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
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
      showAlert('Empty Post', 'Please write something or attach media/poll.');
      return;
    }

    // Validate Poll if open
    let pollPayload = null;
    if (isPollOpen) {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        showAlert('Incomplete Poll', 'Please provide at least 2 poll options.');
        return;
      }
      pollPayload = {
        question: pollQuestion.trim() || postText.trim() || 'Poll Question',
        options: validOptions.map((opt, idx) => ({ id: idx + 1, text: opt.trim(), votes: 0 })),
        totalVotes: 0,
      };
    }

    try {
      setIsPosting(true);

      let uploadedUrl = null;
      if (mediaUri) {
        uploadedUrl = await uploadMediaApi(mediaUri, mediaType === 'video');
        if (mediaType === 'video' && (!uploadedUrl || uploadedUrl.startsWith('file:///'))) {
          showAlert(
            'Video Upload Error',
            'Could not upload video to the server. Please check internet connection and try again.'
          );
          return;
        }
      }

      const payload = {
        userId: user?.id || null,
        authorName: user?.name || 'Fortaa Leader',
        authorRole: user?.designation || user?.accountType || 'Leader',
        authorAvatar: user?.avatar_url || user?.avatarUrl || null,
        content:
          postText.trim() ||
          (isPollOpen ? pollQuestion.trim() : mediaType === 'video' ? 'Shared a video' : 'Shared a photo'),
        tags: tags.trim() || null,
        imageUrl: mediaType === 'image' ? uploadedUrl || mediaUri : null,
        videoUrl: mediaType === 'video' ? uploadedUrl : null,
        mediaType: mediaType || (pollPayload ? 'poll' : 'text'),
        pollData: pollPayload,
      };

      const createdPost = await createPostApi(payload);

      handleReset();
      onPostCreated && onPostCreated(createdPost || payload);
      onClose();
    } catch (err) {
      console.warn('Post creation error:', err);
      showAlert('Failed to Post', err.message || 'Server error. Please try again.');
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
  const userRole = user?.designation || user?.accountType || 'Leader';
  const userAvatar = user?.avatar_url || user?.avatarUrl;
  const userInitial = (userName[0] || 'U').toUpperCase();
  const canSubmit = Boolean(
    postText.trim() || mediaUri || (isPollOpen && (pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length >= 2))
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalCenterOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modalCard,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header (Matching Web ud-cpm-header) */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create a Post</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            keyboardShouldPersistTaps="handled"
          >
            {/* Author Meta Row (Matching Web ud-cpm-author-row) */}
            <View style={styles.userRow}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </LinearGradient>
              )}

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <View style={styles.pillsRow}>
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{userRole}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.visibilityPill}
                    onPress={() => {
                      const opts = ['Anyone', 'Network', 'Team Only'];
                      const next = opts[(opts.indexOf(visibility) + 1) % opts.length];
                      setVisibility(next);
                    }}
                  >
                    <Text style={styles.visibilityText}>🌐 {visibility}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Main Text Input (Matching Web ud-cpm-textarea) */}
            <TextInput
              style={styles.postInput}
              placeholder="What do you want to talk about? Share an update, business opportunity or insight..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={postText}
              onChangeText={setPostText}
              textAlignVertical="top"
              autoFocus={!mediaUri && !isPollOpen}
            />

            {/* Photo / Video Preview Box */}
            {mediaUri && (
              <View style={styles.previewBox}>
                {mediaType === 'video' ? (
                  <FeedVideoPlayer
                    videoUrl={mediaUri}
                    isActive={true}
                    style={{ height: 200, borderRadius: 12 }}
                  />
                ) : (
                  <Image source={{ uri: mediaUri }} style={styles.previewMedia} resizeMode="cover" />
                )}
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => {
                    setMediaUri(null);
                    setMediaType(null);
                  }}
                >
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Poll Builder Box (Matching Web ud-cp-poll-box) */}
            {isPollOpen && (
              <View style={styles.pollBuilder}>
                <View style={styles.pollHeaderRow}>
                  <Text style={styles.pollBuilderTitle}>📊 Create a Poll</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsPollOpen(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                    }}
                    style={styles.pollCloseBtn}
                  >
                    <Feather name="x" size={15} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.pollQuestionInput}
                  placeholder="Ask a question..."
                  placeholderTextColor="#94A3B8"
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                  autoFocus
                />

                {pollOptions.map((opt, idx) => (
                  <View key={idx} style={styles.pollOptionRow}>
                    <Text style={styles.pollOptionNum}>{idx + 1}.</Text>
                    <TextInput
                      style={styles.pollOptionInput}
                      placeholder={`Option ${idx + 1}`}
                      placeholderTextColor="#94A3B8"
                      value={opt}
                      onChangeText={(txt) => handleUpdatePollOption(txt, idx)}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity
                        style={styles.pollDelOptBtn}
                        onPress={() => handleRemovePollOption(idx)}
                      >
                        <Feather name="x" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {pollOptions.length < 4 && (
                  <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddPollOption}>
                    <Text style={styles.addOptionText}>+ Add Option</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tags Input */}
            {showTagsInput && (
              <View style={styles.tagsContainer}>
                <Feather name="hash" size={14} color="#5A2CE4" />
                <TextInput
                  style={styles.tagsInput}
                  placeholder="Add tags e.g. #marketing #business #growth"
                  placeholderTextColor="#94A3B8"
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            )}

            {/* Add Media Toolbar Row (Matching Web ud-cpm-tools-row) */}
            <View style={styles.toolsRow}>
              <Text style={styles.toolsLabel}>Add to your post:</Text>
              <View style={styles.toolsBtns}>
                <TouchableOpacity
                  style={[styles.toolBtn, mediaType === 'image' && styles.toolBtnActive]}
                  onPress={handlePickImage}
                >
                  <Feather name="image" size={14} color={mediaType === 'image' ? '#8B17F8' : '#334155'} />
                  <Text style={[styles.toolBtnText, mediaType === 'image' && styles.toolBtnTextActive]}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolBtn, mediaType === 'video' && styles.toolBtnActive]}
                  onPress={handlePickVideo}
                >
                  <Feather name="video" size={14} color={mediaType === 'video' ? '#8B17F8' : '#334155'} />
                  <Text style={[styles.toolBtnText, mediaType === 'video' && styles.toolBtnTextActive]}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolBtn, isPollOpen && styles.toolBtnActive]}
                  onPress={handleTogglePoll}
                >
                  <Feather name="bar-chart-2" size={14} color={isPollOpen ? '#8B17F8' : '#334155'} />
                  <Text style={[styles.toolBtnText, isPollOpen && styles.toolBtnTextActive]}>Poll</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolBtn, showTagsInput && styles.toolBtnActive]}
                  onPress={() => setShowTagsInput((p) => !p)}
                >
                  <Feather name="hash" size={13} color={showTagsInput ? '#8B17F8' : '#334155'} />
                  <Text style={[styles.toolBtnText, showTagsInput && styles.toolBtnTextActive]}>Tags</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions (Matching Web ud-cpm-footer) */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.postBtn, (!canSubmit || isPosting) && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={isPosting || !canSubmit}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canSubmit ? ['#9F21FE', '#4F24FF'] : ['#CBD5E1', '#94A3B8']}
                style={styles.postBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isPosting ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.postBtnText}>Publishing...</Text>
                  </>
                ) : (
                  <Text style={styles.postBtnText}>Post</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalCenterOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: height * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F1735',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    paddingHorizontal: 18,
    maxHeight: height * 0.62,
  },

  // Author Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#5A2CE4',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5A2CE4',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F1735',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B21A8',
  },
  visibilityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  visibilityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Input
  postInput: {
    minHeight: 110,
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    paddingVertical: 8,
  },

  // Preview Box
  previewBox: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  previewMedia: {
    width: '100%',
    height: 200,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Poll Builder
  pollBuilder: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  pollHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollBuilderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A2CE4',
  },
  pollCloseBtn: {
    padding: 2,
  },
  pollQuestionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pollOptionNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A2CE4',
    width: 16,
  },
  pollOptionInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pollDelOptBtn: {
    padding: 4,
  },
  addOptionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F3E8FF',
  },
  addOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B21A8',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 6,
  },
  tagsInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1E293B',
  },

  // Toolbar Row
  toolsRow: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
    gap: 8,
  },
  toolsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  toolsBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toolBtnActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B17F8',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  toolBtnTextActive: {
    color: '#8B17F8',
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  postBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  postBtnDisabled: {
    opacity: 0.65,
  },
  postBtnGradient: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  postBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
