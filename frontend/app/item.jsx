import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, Tag, Star, MessageCircle, Flag, ChevronLeft, ChevronRight } from "lucide-react-native";
import api from "../service/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ItemDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getToken, isSignedIn } = useAuthContext();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactingLoading, setContactingLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (params.itemId) {
          const token = await getToken();
          const data = await api.getPostById(params.itemId, token);
          setItem(data);
        }
      } catch {
        Alert.alert("Error", "Could not load this listing.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.itemId]);

  const handleContactSeller = async () => {
    if (!isSignedIn) {
      Alert.alert("Sign in required", "Please sign in to contact sellers.");
      return;
    }
    setContactingLoading(true);
    try {
      const token = await getToken();
      await api.startConversation(token, { postId: item._id });
      router.push("/(tabs)/messages");
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not start conversation.";
      Alert.alert("Error", msg);
    } finally {
      setContactingLoading(false);
    }
  };

  const handleReport = () => {
    router.push({ pathname: "/report", params: { itemId: item._id } });
  };

  const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#0021A5" />
        <Text className="mt-3 text-gray-400">Loading listing...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" style={{ flex: 1 }}>
        <Text className="text-5xl mb-4">😕</Text>
        <Text className="text-lg font-bold text-black mb-2">Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary rounded-xl px-6 py-3">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : [];

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={{ height: 300, backgroundColor: "#f3f4f6" }}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(idx);
              }}
            >
              {images.map((uri, idx) =>
                imgErrors[idx] ? (
                  <View key={idx} style={{ width: SCREEN_WIDTH, height: 300, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 48 }}>📦</Text>
                  </View>
                ) : (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={{ width: SCREEN_WIDTH, height: 300 }}
                    resizeMode="cover"
                    onError={() => setImgErrors((prev) => ({ ...prev, [idx]: true }))}
                  />
                )
              )}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-6xl">📦</Text>
            </View>
          )}

          {/* Back button overlay */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md"
          >
            <ArrowLeft size={20} color="#111" />
          </TouchableOpacity>

          {/* Image indicators */}
          {images.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
              {images.map((_, idx) => (
                <View
                  key={idx}
                  className={`rounded-full ${
                    idx === currentImageIndex ? "bg-white w-5 h-1.5" : "bg-white/50 w-1.5 h-1.5"
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-5 pt-5">
          {/* Title + Price */}
          <View className="flex-row items-start justify-between mb-3">
            <Text className="text-2xl font-black text-black flex-1 mr-3" numberOfLines={3}>
              {item.title}
            </Text>
            <Text className="text-2xl font-black text-secondary">
              {formatPrice(item.price)}
            </Text>
          </View>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {item.condition && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-gray-700 text-xs font-medium">{item.condition}</Text>
              </View>
            )}
            {item.category && (
              <View className="bg-orange-50 border border-orange-100 rounded-full px-3 py-1">
                <Text className="text-secondary text-xs font-medium">{item.category}</Text>
              </View>
            )}
          </View>

          {/* Location + Date */}
          <View className="flex-row items-center gap-4 mb-5">
            {item.location && (
              <View className="flex-row items-center">
                <MapPin size={14} color="#9ca3af" />
                <Text className="text-gray-500 text-sm ml-1">{item.location}</Text>
              </View>
            )}
            {item.createdAt && (
              <Text className="text-gray-400 text-xs">{formatDate(item.createdAt)}</Text>
            )}
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-base font-bold text-black mb-2">Description</Text>
            <Text className="text-gray-600 text-sm leading-relaxed">
              {item.description || "No description provided."}
            </Text>
          </View>

          {/* Seller Info */}
          {item.seller && (
            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <Text className="text-sm font-bold text-black mb-3">Seller</Text>
              <View className="flex-row items-center">
                {item.seller.avatar ? (
                  <Image
                    source={{ uri: item.seller.avatar }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                ) : (
                  <View className="w-11 h-11 rounded-full bg-orange-100 items-center justify-center">
                    <Text className="text-secondary font-bold text-base">
                      {(item.seller.firstName?.[0] || "?").toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-black text-sm">
                    {item.seller.firstName} {item.seller.lastName}
                  </Text>
                  {item.seller.rating != null && (
                    <View className="flex-row items-center mt-0.5">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {Number(item.seller.rating).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                {item.seller._id && (
                  <TouchableOpacity
                    onPress={() => router.push(`/profile/${item.seller._id}`)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-black text-xs font-semibold">View Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="px-5 py-4 border-t border-gray-100 flex-row gap-3">
        <TouchableOpacity
          onPress={handleReport}
          className="border border-gray-200 rounded-xl p-3 items-center justify-center"
        >
          <Flag size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContactSeller}
          disabled={contactingLoading}
          className="flex-1 bg-primary rounded-xl py-4 flex-row items-center justify-center"
        >
          {contactingLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MessageCircle size={18} color="white" />
              <Text className="text-white font-bold ml-2">Contact Seller</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
