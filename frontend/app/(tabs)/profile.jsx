import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Settings, Star, Package, ShoppingBag, Heart, Edit2, ChevronRight } from "lucide-react-native";
import api from "../../service/api";

const TABS = [
  { key: "active", label: "Active", icon: Package },
  { key: "sold", label: "Sold", icon: ShoppingBag },
  { key: "favorites", label: "Favorites", icon: Heart },
];

const ListingCard = ({ item, activeTab, router }) => {
  const imageUri = item?.images?.[0] || null;
  const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: "/item", params: { itemId: item._id } })}
      className="flex-row bg-white border border-gray-100 rounded-2xl p-3 mb-3 items-center"
      activeOpacity={0.8}
    >
      <View
        style={{ width: 70, height: 70, borderRadius: 12, overflow: "hidden", backgroundColor: "#f3f4f6" }}
        className="items-center justify-center mr-3"
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: 70, height: 70 }} resizeMode="cover" />
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
      {activeTab === "active" && (
        <View className="flex-row gap-2 ml-2">
          <TouchableOpacity
            onPress={() => router.push(`/edit-item/${item._id}`)}
            className="bg-gray-100 rounded-lg p-2"
          >
            <Edit2 size={14} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/mark-sold/${item._id}`)}
            className="bg-green-100 rounded-lg p-2"
          >
            <ShoppingBag size={14} color="#15803d" />
          </TouchableOpacity>
        </View>
      )}
      <ChevronRight size={16} color="#d1d5db" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [listings, setListings] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await api.getCurrentUserProfile(token);
      setProfile(data);
    } catch {
      // silently fail
    }
  }, []);

  const fetchTabData = useCallback(
    async (tab) => {
      setTabLoading(true);
      try {
        const token = await getToken();
        if (tab === "active") {
          const data = await api.getUserActiveListings(token);
          setListings(Array.isArray(data) ? data : []);
        } else if (tab === "sold") {
          const data = await api.getUserSoldListings(token);
          setSoldItems(Array.isArray(data) ? data : []);
        } else if (tab === "favorites") {
          const data = await api.getUserFavorites(token);
          setFavorites(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently fail
      } finally {
        setTabLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchTabData("active")]);
      setLoading(false);
    };
    init();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchTabData(activeTab)]);
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const getTabItems = () => {
    if (activeTab === "active") return listings;
    if (activeTab === "sold") return soldItems;
    if (activeTab === "favorites") return favorites;
    return [];
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#FA4616" />
        <Text className="mt-3 text-gray-400">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const tabItems = getTabItems();

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
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <Text className="text-2xl font-black text-black">Profile</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/profile-edit")}
              className="bg-gray-100 rounded-full p-2"
            >
              <Edit2 size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} className="bg-gray-100 rounded-full p-2">
              <Settings size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Card */}
        <View className="mx-5 mt-3 mb-5 bg-gray-50 rounded-2xl p-5">
          <View className="flex-row items-center">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={{ width: 72, height: 72, borderRadius: 36 }}
              />
            ) : (
              <View
                className="items-center justify-center bg-orange-100 rounded-full"
                style={{ width: 72, height: 72 }}
              >
                <Text className="text-3xl font-bold text-orange-500">
                  {(user?.firstName?.[0] || "?").toUpperCase()}
                </Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-black">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text className="text-gray-500 text-sm" numberOfLines={1}>
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
              {profile?.rating != null && (
                <View className="flex-row items-center mt-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-sm text-gray-700 ml-1 font-medium">
                    {Number(profile.rating).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {profile?.bio ? (
            <Text className="text-gray-600 text-sm mt-3">{profile.bio}</Text>
          ) : null}
          {profile?.phone ? (
            <Text className="text-gray-400 text-xs mt-1">📞 {profile.phone}</Text>
          ) : null}
        </View>

        {/* Stats Row */}
        <View className="flex-row mx-5 mb-5 bg-white border border-gray-100 rounded-2xl divide-x divide-gray-100 overflow-hidden">
          {[
            { label: "Active", count: listings.length },
            { label: "Sold", count: soldItems.length },
            { label: "Favorites", count: favorites.length },
          ].map((stat, idx) => (
            <View key={idx} className="flex-1 items-center py-4">
              <Text className="text-xl font-bold text-black">{stat.count}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View className="flex-row mx-5 mb-4 bg-gray-100 rounded-2xl p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabChange(tab.key)}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                  isActive ? "bg-white shadow-sm" : ""
                }`}
              >
                <Icon size={14} color={isActive ? "#FA4616" : "#9ca3af"} />
                <Text
                  className={`ml-1.5 text-sm font-semibold ${
                    isActive ? "text-black" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        <View className="px-5 pb-6">
          {tabLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#FA4616" />
            </View>
          ) : tabItems.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-4xl mb-3">
                {activeTab === "active" ? "📦" : activeTab === "sold" ? "🛍️" : "❤️"}
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                {activeTab === "active"
                  ? "No active listings yet."
                  : activeTab === "sold"
                  ? "No sold items yet."
                  : "No favorites yet."}
              </Text>
              {activeTab === "active" && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/post")}
                  className="mt-4 bg-black rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-semibold">Post Something</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            tabItems.map((item) => <ListingCard key={item._id} item={item} activeTab={activeTab} router={router} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
