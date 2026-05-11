import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Star, Package, ChevronRight } from "lucide-react-native";
import api from "../../service/api";

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getToken } = useAuth();
  const { clerkId } = params;

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [profileData, listingsData] = await Promise.all([
        api.getUserProfileByClerkId(token, clerkId),
        api.getUserActiveListings(token, clerkId),
      ]);
      setProfile(profileData);
      setListings(Array.isArray(listingsData) ? listingsData : []);
    } catch {
      Alert.alert("Error", "Could not load this user's profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clerkId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#FA4616" />
        <Text className="mt-3 text-gray-400">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" style={{ flex: 1 }}>
        <Text className="text-5xl mb-4">😕</Text>
        <Text className="text-lg font-bold text-black mb-2">User not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-black rounded-xl px-6 py-3">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FA4616" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-black">Profile</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-5 mt-3 mb-5 bg-gray-50 rounded-2xl p-5">
          <View className="flex-row items-center">
            {profile.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={{ width: 72, height: 72, borderRadius: 36 }}
              />
            ) : (
              <View
                className="items-center justify-center bg-orange-100 rounded-full"
                style={{ width: 72, height: 72 }}
              >
                <Text className="text-3xl font-bold text-orange-500">
                  {(profile.firstName?.[0] || "?").toUpperCase()}
                </Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-black">
                {profile.firstName} {profile.lastName}
              </Text>
              {profile.email && (
                <Text className="text-gray-500 text-sm" numberOfLines={1}>
                  {profile.email}
                </Text>
              )}
              {profile.rating != null && (
                <View className="flex-row items-center mt-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-sm text-gray-700 ml-1 font-medium">
                    {Number(profile.rating).toFixed(1)}
                  </Text>
                  {profile.reviewCount != null && (
                    <Text className="text-xs text-gray-400 ml-1">
                      ({profile.reviewCount} reviews)
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          {profile.bio ? (
            <Text className="text-gray-600 text-sm mt-3">{profile.bio}</Text>
          ) : null}

          {/* Member Since */}
          {profile.createdAt && (
            <Text className="text-gray-400 text-xs mt-2">
              Member since{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row mx-5 mb-5 bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <View className="flex-1 items-center py-4 border-r border-gray-100">
            <Text className="text-xl font-bold text-black">{listings.length}</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Active Listings</Text>
          </View>
          {profile.soldCount != null && (
            <View className="flex-1 items-center py-4">
              <Text className="text-xl font-bold text-black">{profile.soldCount}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Items Sold</Text>
            </View>
          )}
        </View>

        {/* Active Listings */}
        <View className="px-5 pb-8">
          <View className="flex-row items-center mb-3">
            <Package size={18} color="#111" />
            <Text className="text-base font-bold text-black ml-2">
              Active Listings ({listings.length})
            </Text>
          </View>

          {listings.length === 0 ? (
            <View className="py-8 items-center bg-gray-50 rounded-2xl">
              <Text className="text-4xl mb-3">📦</Text>
              <Text className="text-gray-500 text-sm">No active listings.</Text>
            </View>
          ) : (
            listings.map((item) => {
              const imageUri = item?.images?.[0] || null;
              return (
                <TouchableOpacity
                  key={item._id}
                  onPress={() =>
                    router.push({ pathname: "/item", params: { itemId: item._id } })
                  }
                  className="flex-row bg-white border border-gray-100 rounded-2xl p-3 mb-3 items-center"
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#f3f4f6",
                    }}
                    className="items-center justify-center mr-3"
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={{ width: 70, height: 70 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-2xl">📦</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-black font-semibold text-sm" numberOfLines={2}>
                      {item?.title || "Untitled"}
                    </Text>
                    <Text className="text-orange-500 font-bold text-base mt-0.5">
                      {formatPrice(item?.price)}
                    </Text>
                    {item?.condition && (
                      <Text className="text-gray-400 text-xs mt-0.5">{item.condition}</Text>
                    )}
                  </View>
                  <ChevronRight size={16} color="#d1d5db" />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
