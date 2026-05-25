import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Save, Camera, CheckCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../service/api";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { getToken, user, isLoaded } = useAuthContext();

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const token = await getToken();
        const data = await api.getCurrentUserProfile(token);
        setProfileData({
          firstName: data.firstName || user.firstName || "",
          lastName: data.lastName || user.lastName || "",
          email: data.email || user.email || "",
          phone: data.PhoneNumber || "",
          bio: data.description || "",
        });
        setAvatarPreview(data.avatar || user.avatar || null);
      } catch {
        setProfileData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: "",
          bio: "",
        });
        setAvatarPreview(user.avatar || null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setAvatarPreview(result.assets[0].uri);
    }
  };

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!profileData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!profileData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (profileData.bio.length > 500) newErrors.bio = "Bio must be under 500 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const token = await getToken();
      await api.updateCurrentUserProfile(token, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        phone: profileData.phone,
        avatar: avatarPreview || user.avatar,
      });
      setSaveStatus("success");
      setTimeout(() => router.back(), 1500);
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#0021A5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-black flex-1">Edit Account</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-primary rounded-xl px-4 py-2 flex-row items-center"
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Save size={14} color="white" />
                <Text className="text-white font-semibold ml-1.5 text-sm">Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {saveStatus === "success" && (
            <View className="mx-5 mt-4 flex-row items-center bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle size={16} color="#16a34a" />
              <Text className="text-green-700 text-sm font-medium ml-2">Changes saved!</Text>
            </View>
          )}

          {/* Avatar */}
          <View className="items-center pt-6 pb-4">
            <TouchableOpacity onPress={pickAvatar} className="relative">
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-3xl font-bold text-primary">
                    {(profileData.firstName?.[0] || "?").toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-primary rounded-full w-8 h-8 items-center justify-center">
                <Camera size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-gray-400 text-xs mt-2">Tap to change photo</Text>
          </View>

          <View className="px-5 pb-10">
            {/* Name */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  First Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-black bg-gray-50 ${errors.firstName ? "border-red-400" : "border-gray-200"}`}
                  value={profileData.firstName}
                  onChangeText={(v) => handleChange("firstName", v)}
                  placeholder="Alex"
                />
                {errors.firstName && <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Last Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-black bg-gray-50 ${errors.lastName ? "border-red-400" : "border-gray-200"}`}
                  value={profileData.lastName}
                  onChangeText={(v) => handleChange("lastName", v)}
                  placeholder="Zhong"
                />
                {errors.lastName && <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>}
              </View>
            </View>

            {/* Email read-only */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email Address</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-400 bg-gray-100"
                value={profileData.email}
                editable={false}
              />
              <Text className="text-gray-400 text-xs mt-1">Email cannot be changed.</Text>
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-black bg-gray-50"
                value={profileData.phone}
                onChangeText={(v) => handleChange("phone", v)}
                placeholder="+1 (352) 000-0000"
                keyboardType="phone-pad"
              />
            </View>

            {/* Bio */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">Bio</Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 text-black bg-gray-50 ${errors.bio ? "border-red-400" : "border-gray-200"}`}
                value={profileData.bio}
                onChangeText={(v) => handleChange("bio", v)}
                placeholder="Tell other CSA members about yourself..."
                multiline
                numberOfLines={4}
                maxLength={500}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
              <Text className="text-gray-400 text-xs mt-1 text-right">{profileData.bio.length}/500</Text>
              {errors.bio && <Text className="text-red-500 text-xs mt-1">{errors.bio}</Text>}
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-primary rounded-2xl py-4 items-center">
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
