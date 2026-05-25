import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Plus, X, Camera } from "lucide-react-native";
import api from "../../service/api";

const CATEGORIES = [
  "Textbooks",
  "Furniture",
  "Electronics",
  "Clothing",
  "Sports & Outdoors",
  "Gaming",
  "Other",
];

const CONDITIONS = ["Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];

const LOCATIONS = [
  "Campus",
  "Midtown",
  "Sorority Row",
  "Student Housing",
  "Stadium Area",
  "Off Campus",
  "Downtown",
];

const MEETING_PREFS = [
  { value: "campus", label: "On Campus" },
  { value: "public", label: "Public Place" },
  { value: "flexible", label: "Flexible" },
];

export default function PostScreen() {
  const { getToken } = useAuthContext();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [meetingPref, setMeetingPref] = useState("flexible");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can upload up to 5 images.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled) {
      const newImages = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!price || isNaN(Number(price)) || Number(price) < 0)
      e.price = "Enter a valid price.";
    if (!category) e.category = "Select a category.";
    if (!condition) e.condition = "Select a condition.";
    if (!location) e.location = "Select a location.";
    if (images.length === 0) e.images = "Add at least one image.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("location", location);
      formData.append("meetingPreference", meetingPref);

      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("images", { uri, name: filename, type });
      }

      await api.createUserPost(token, formData);
      Alert.alert("Success!", "Your listing has been posted.", [
        { text: "OK", onPress: () => router.push("/(tabs)/market") },
      ]);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to post listing.");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <Text className="text-red-500 text-xs mt-1">{errors[field]}</Text>
    ) : null;

  const SectionLabel = ({ children }) => (
    <Text className="text-sm font-semibold text-gray-700 mb-2">{children}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-black text-black mb-6">Post a Listing</Text>

          {/* Images */}
          <View className="mb-5">
            <SectionLabel>Photos (up to 5)</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={pickImages}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center mr-3 bg-gray-50"
              >
                <Camera size={24} color="#9ca3af" />
                <Text className="text-xs text-gray-400 mt-1">Add Photo</Text>
              </TouchableOpacity>
              {images.map((uri, idx) => (
                <View key={idx} className="mr-3 relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 96, height: 96, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-primary rounded-full p-0.5"
                  >
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <FieldError field="images" />
          </View>

          {/* Title */}
          <View className="mb-4">
            <SectionLabel>Title</SectionLabel>
            <TextInput
              className={`border rounded-xl px-4 py-3 text-black bg-gray-50 ${
                errors.title ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="e.g. Calculus Textbook 10th Edition"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
            <FieldError field="title" />
          </View>

          {/* Description */}
          <View className="mb-4">
            <SectionLabel>Description</SectionLabel>
            <TextInput
              className={`border rounded-xl px-4 py-3 text-black bg-gray-50 ${
                errors.description ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="Describe your item, include any important details..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 96 }}
            />
            <FieldError field="description" />
          </View>

          {/* Price */}
          <View className="mb-4">
            <SectionLabel>Price ($)</SectionLabel>
            <TextInput
              className={`border rounded-xl px-4 py-3 text-black bg-gray-50 ${
                errors.price ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
            <FieldError field="price" />
          </View>

          {/* Category */}
          <View className="mb-4">
            <SectionLabel>Category</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full border ${
                    category === cat
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      category === cat ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FieldError field="category" />
          </View>

          {/* Condition */}
          <View className="mb-4">
            <SectionLabel>Condition</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  onPress={() => setCondition(cond)}
                  className={`px-4 py-2 rounded-full border ${
                    condition === cond
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      condition === cond ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FieldError field="condition" />
          </View>

          {/* Location */}
          <View className="mb-4">
            <SectionLabel>Preferred Meeting Location</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setLocation(loc)}
                  className={`px-4 py-2 rounded-full border ${
                    location === loc
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      location === loc ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FieldError field="location" />
          </View>

          {/* Meeting Preference */}
          <View className="mb-6">
            <SectionLabel>Meeting Preference</SectionLabel>
            <View className="flex-row gap-3">
              {MEETING_PREFS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMeetingPref(opt.value)}
                  className={`flex-1 py-3 rounded-xl border items-center ${
                    meetingPref === opt.value
                      ? "bg-secondary border-secondary"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      meetingPref === opt.value ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Post Listing</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
