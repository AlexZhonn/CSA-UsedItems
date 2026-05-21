import { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, X } from "lucide-react-native";
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

export default function EditItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getToken } = useAuthContext();
  const { itemId } = params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const data = await api.getPostById(itemId, token);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPrice(String(data.price || ""));
        setCategory(data.category || "");
        setCondition(data.condition || "");
        setLocation(data.location || "");
        setExistingImages(Array.isArray(data.images) ? data.images : []);
      } catch {
        Alert.alert("Error", "Could not load listing.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (itemId) fetchItem();
  }, [itemId]);

  const pickImages = async () => {
    const total = existingImages.length + newImages.length;
    if (total >= 5) {
      Alert.alert("Limit reached", "You can have up to 5 images total.");
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
      selectionLimit: 5 - total,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris].slice(0, 5 - existingImages.length));
    }
  };

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!price || isNaN(Number(price)) || Number(price) < 0) e.price = "Enter a valid price.";
    if (!category) e.category = "Select a category.";
    if (!condition) e.condition = "Select a condition.";
    if (!location) e.location = "Select a location.";
    if (existingImages.length + newImages.length === 0) e.images = "At least one image is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("location", location);

      // Existing images as JSON so backend can keep them
      formData.append("existingImages", JSON.stringify(existingImages));

      for (let i = 0; i < newImages.length; i++) {
        const uri = newImages[i];
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("images", { uri, name: filename, type });
      }

      await api.updatePostImagesAndDetails(token, itemId, formData);
      Alert.alert("Success!", "Listing updated.", [
        { text: "OK", onPress: () => router.push("/(tabs)/market") },
      ]);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Could not update listing.");
    } finally {
      setSaving(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <Text className="text-red-500 text-xs mt-1">{errors[field]}</Text>
    ) : null;

  const SectionLabel = ({ children }) => (
    <Text className="text-sm font-semibold text-gray-700 mb-2">{children}</Text>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#0021A5" />
        <Text className="mt-3 text-gray-400">Loading listing...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-black">Edit Listing</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-[#0021A5] rounded-xl px-4 py-2"
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-sm">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Images */}
          <View className="mb-5">
            <SectionLabel>Photos ({existingImages.length + newImages.length}/5)</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {existingImages.length + newImages.length < 5 && (
                <TouchableOpacity
                  onPress={pickImages}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center mr-3 bg-gray-50"
                >
                  <Camera size={24} color="#9ca3af" />
                  <Text className="text-xs text-gray-400 mt-1">Add Photo</Text>
                </TouchableOpacity>
              )}
              {existingImages.map((uri, idx) => (
                <View key={`existing-${idx}`} className="mr-3 relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 96, height: 96, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 bg-[#0021A5] rounded-full p-0.5"
                  >
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {newImages.map((uri, idx) => (
                <View key={`new-${idx}`} className="mr-3 relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 96, height: 96, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <View className="absolute top-0 left-0 bg-orange-500 rounded-tl-xl rounded-br-xl px-1.5 py-0.5">
                    <Text className="text-white text-xs font-bold">New</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-[#0021A5] rounded-full p-0.5"
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
              placeholder="Item title"
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
              placeholder="Describe your item..."
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
                    category === cat ? "bg-[#0021A5] border-[#0021A5]" : "bg-white border-gray-200"
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
                    condition === cond ? "bg-[#0021A5] border-[#0021A5]" : "bg-white border-gray-200"
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
          <View className="mb-8">
            <SectionLabel>Location</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setLocation(loc)}
                  className={`px-4 py-2 rounded-full border ${
                    location === loc ? "bg-[#0021A5] border-[#0021A5]" : "bg-white border-gray-200"
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

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-[#0021A5] rounded-2xl py-4 items-center"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
