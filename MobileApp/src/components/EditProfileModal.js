import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfileApi, uploadMediaApi } from '../services/api';

const { width, height } = Dimensions.get('window');

const TABS = [
  { id: 'personal', label: 'Personal', icon: 'user' },
  { id: 'contact', label: 'Contact', icon: 'phone' },
  { id: 'about', label: 'About', icon: 'file-text' },
  { id: 'social', label: 'Social', icon: 'link' },
];

export default function EditProfileModal({
  visible,
  onClose,
  user,
  onProfileUpdated,
}) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [designation, setDesignation] = useState('');
  const [company, setCompany] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');

  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [location, setLocation] = useState('');

  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState([]);

  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');

  const [avatarUri, setAvatarUri] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || (user.email ? user.email.split('@')[0] : ''));
      setDesignation(user.designation || user.accountType || '');
      setCompany(user.companyBrand || user.company_brand || user.businessName || '');
      setGender(user.gender || 'Male');
      setDob(user.dob || '');

      setEmail(user.email || '');
      setMobileNumber(user.mobileNumber || user.mobile_number || '');
      setAltMobile(user.altMobile || '');
      setWhatsappNumber(user.whatsappNumber || '');
      setLocation(user.location || user.city || '');

      setBio(user.bio || '');
      setExperience(user.experience || '');
      if (Array.isArray(user.skills)) {
        setSkillsList(user.skills);
      } else if (typeof user.skills === 'string') {
        setSkillsList(user.skills.split(',').map((s) => s.trim()).filter(Boolean));
      } else {
        setSkillsList(['Leadership', 'Direct Selling', 'Networking']);
      }

      setLinkedin(user.socialLinks?.linkedin || '');
      setInstagram(user.socialLinks?.instagram || '');
      setTwitter(user.socialLinks?.twitter || '');
      setWebsite(user.websiteSocial || user.website || '');

      setAvatarUri(user.avatarUrl || user.avatar_url || null);
    }
  }, [user, visible]);

  // Handle Photo Picker
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant photo gallery permission to change avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setAvatarUri(localUri);

        // Upload to server
        setIsUploadingPhoto(true);
        const cloudUrl = await uploadMediaApi(localUri, false);
        setIsUploadingPhoto(false);

        if (cloudUrl && cloudUrl.startsWith('http')) {
          setAvatarUri(cloudUrl);
        }
      }
    } catch (err) {
      setIsUploadingPhoto(false);
      console.warn('Pick avatar error:', err);
      Alert.alert('Upload Error', 'Failed to select or upload image.');
    }
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (skillsList.includes(skillInput.trim())) {
      Alert.alert('Duplicate', 'This skill is already added.');
      return;
    }
    setSkillsList((prev) => [...prev, skillInput.trim()]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        username: username.trim(),
        designation: designation.trim(),
        companyBrand: company.trim(),
        businessName: company.trim(),
        gender,
        dob,
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        altMobile: altMobile.trim(),
        whatsappNumber: whatsappNumber.trim(),
        location: location.trim(),
        city: location.trim(),
        bio: bio.trim(),
        experience: experience.trim(),
        skills: skillsList,
        avatarUrl: avatarUri,
        avatar_url: avatarUri,
        websiteSocial: website.trim(),
        socialLinks: {
          linkedin: linkedin.trim(),
          instagram: instagram.trim(),
          twitter: twitter.trim(),
        },
      };

      if (user?.id) {
        await updateUserProfileApi(user.id, payload);
      }

      const mergedUser = {
        ...user,
        ...payload,
      };

      Alert.alert('Profile Updated 🎉', 'Your profile details have been saved successfully.');
      if (onProfileUpdated) {
        onProfileUpdated(mergedUser);
      }
      onClose();
    } catch (err) {
      console.warn('Profile save error:', err);
      Alert.alert('Save Failed', err.message || 'Unable to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <Text style={styles.sheetSubtitle}>Update your personal & business information</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Sub Tabs */}
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#5321E8' : '#64748B'}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form Scroll Area */}
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ─── TAB 1: PERSONAL INFORMATION ─── */}
            {activeTab === 'personal' && (
              <View style={styles.tabContent}>
                {/* Avatar Photo Editor */}
                <View style={styles.avatarEditRow}>
                  <View style={styles.avatarRing}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                    ) : (
                      <LinearGradient colors={['#DC3AEE', '#5321E8']} style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>{(name[0] || 'U').toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                    {isUploadingPhoto && (
                      <View style={styles.avatarLoadingOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.avatarTextWrap}>
                    <TouchableOpacity
                      style={styles.btnChangePhoto}
                      onPress={handlePickAvatar}
                      activeOpacity={0.8}
                    >
                      <Feather name="camera" size={14} color="#5321E8" />
                      <Text style={styles.btnChangePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                    <Text style={styles.avatarHelpText}>Square JPG, PNG recommended</Text>
                  </View>
                </View>

                {/* Full Name */}
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChangeText={setName}
                />

                {/* Username */}
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. rahul_leader"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />

                {/* Designation / Role */}
                <Text style={styles.label}>Designation / Professional Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Senior Leader / Diamond Associate"
                  value={designation}
                  onChangeText={setDesignation}
                />

                {/* Company / Brand Name */}
                <Text style={styles.label}>Company / Brand Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Fortaa Technologies"
                  value={company}
                  onChangeText={setCompany}
                />

                {/* Gender Selector */}
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, gender === g && styles.genderBtnSelected]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextSelected]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date of Birth */}
                <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1995-08-15"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            )}

            {/* ─── TAB 2: CONTACT INFORMATION ─── */}
            {activeTab === 'contact' && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#F1F5F9' }]}
                  editable={false}
                  value={email}
                  placeholder="user@example.com"
                />

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />

                <Text style={styles.label}>Alternative Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Secondary contact number"
                  keyboardType="phone-pad"
                  value={altMobile}
                  onChangeText={setAltMobile}
                />

                <Text style={styles.label}>WhatsApp Business Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="WhatsApp contact"
                  keyboardType="phone-pad"
                  value={whatsappNumber}
                  onChangeText={setWhatsappNumber}
                />

                <Text style={styles.label}>Location / City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Indore, Madhya Pradesh"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            )}

            {/* ─── TAB 3: ABOUT ME & SKILLS ─── */}
            {activeTab === 'about' && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Bio / Leadership Quote</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder="Write a brief overview of your business journey..."
                  value={bio}
                  onChangeText={setBio}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5+ Years in Direct Marketing & Leadership"
                  value={experience}
                  onChangeText={setExperience}
                />

                {/* Skills */}
                <Text style={styles.label}>Skills & Expertise</Text>
                <View style={styles.addSkillRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Add skill (e.g. Team Building)"
                    value={skillInput}
                    onChangeText={setSkillInput}
                    onSubmitEditing={handleAddSkill}
                  />
                  <TouchableOpacity
                    style={styles.btnAddSkill}
                    onPress={handleAddSkill}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={16} color="#fff" />
                    <Text style={styles.btnAddSkillText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Skill Badges */}
                <View style={styles.skillsChipsWrap}>
                  {skillsList.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                      <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                        <Feather name="x" size={13} color="#5321E8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── TAB 4: SOCIAL LINKS ─── */}
            {activeTab === 'social' && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>LinkedIn Profile</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChangeText={setLinkedin}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Instagram Profile</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://instagram.com/username"
                  value={instagram}
                  onChangeText={setInstagram}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Twitter / X</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://x.com/username"
                  value={twitter}
                  onChangeText={setTwitter}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Website / Portfolio</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChangeText={setWebsite}
                  autoCapitalize="none"
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSave}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnSaveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.88,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B' },
  sheetSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAF5FF',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  tabBtnActive: {
    backgroundColor: '#5321E8',
    borderColor: '#5321E8',
  },
  tabText: { fontSize: 12.5, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  formScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabContent: { gap: 10 },

  avatarEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#5321E8',
    position: 'relative',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 24, fontWeight: '800', color: '#fff' },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextWrap: { flex: 1, gap: 4 },
  btnChangePhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  btnChangePhotoText: { fontSize: 12.5, fontWeight: '700', color: '#5321E8' },
  avatarHelpText: { fontSize: 11, color: '#94A3B8' },

  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  textArea: {
    minHeight: 80,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  genderBtnSelected: {
    backgroundColor: '#5321E8',
    borderColor: '#5321E8',
  },
  genderBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  genderBtnTextSelected: { color: '#FFFFFF', fontWeight: '700' },

  addSkillRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnAddSkill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#5321E8',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
  btnAddSkillText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  skillsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F0FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  skillChipText: { fontSize: 12.5, color: '#5321E8', fontWeight: '600' },

  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  btnCancelText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  btnSave: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#5321E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
