import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../../context/AuthContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react-native";
import api from "../../service/api";
import ItemCard from "../../components/MarketPlace/ItemCard";

const CATEGORIES = [
  "all",
  "Textbooks",
  "Furniture",
  "Electronics",
  "Clothing",
  "Sports & Outdoors",
  "Gaming",
];

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "0-50", label: "Under $50" },
  { value: "50-100", label: "$50-$100" },
  { value: "100-200", label: "$100-$200" },
  { value: "200+", label: "$200+" },
];

const CONDITIONS = ["all", "Brand New", "Like New", "Excellent", "Good", "Fair", "For Parts"];

const LOCATIONS = [
  "all",
  "Campus",
  "Midtown",
  "Sorority Row",
  "Student Housing",
  "Stadium Area",
  "Off Campus",
  "Downtown",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "title-az", label: "Title: A-Z" },
];

const defaultMoreFilters = {
  condition: "all",
  location: "all",
  sortBy: "newest",
  minPrice: "",
  maxPrice: "",
  datePosted: "all",
};

export default function MarketScreen() {
  const { getToken } = useAuthContext();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [moreFilters, setMoreFilters] = useState(defaultMoreFilters);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(defaultMoreFilters);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchItems();
    fetchFavorites();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.getAllPosts();
      setAllItems(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = await getToken();
      const data = await api.getUserFavorites(token);
      const ids = Array.isArray(data) ? data.map((f) => f._id || f) : [];
      setFavorites(ids);
    } catch {
      // not signed in or no favorites
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
      const token = await getToken();
      const isFav = favorites.includes(postId);
      await api.updateUserFavorite(token, { postId, action: isFav ? "remove" : "add" });
      setFavorites((prev) =>
        isFav ? prev.filter((id) => id !== postId) : [...prev, postId]
      );
    } catch {
      Alert.alert("Error", "Could not update favorite.");
    }
  };

  const matchesPriceRange = (price, range) => {
    const p = Number(price);
    if (range === "all") return true;
    if (range === "0-50") return p >= 0 && p <= 50;
    if (range === "50-100") return p > 50 && p <= 100;
    if (range === "100-200") return p > 100 && p <= 200;
    if (range === "200+") return p > 200;
    return true;
  };

  const filteredItems = allItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));

    const matchesCat =
      selectedCategory === "all" || item.category === selectedCategory;

    const matchesPrice = matchesPriceRange(item.price, priceRange);

    const matchesCondition =
      moreFilters.condition === "all" || item.condition === moreFilters.condition;

    const matchesLocation =
      moreFilters.location === "all" || item.location === moreFilters.location;

    const matchesMinPrice =
      !moreFilters.minPrice || Number(item.price) >= Number(moreFilters.minPrice);

    const matchesMaxPrice =
      !moreFilters.maxPrice || Number(item.price) <= Number(moreFilters.maxPrice);

    return (
      matchesSearch &&
      matchesCat &&
      matchesPrice &&
      matchesCondition &&
      matchesLocation &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (moreFilters.sortBy) {
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "price-low":
        return Number(a.price) - Number(b.price);
      case "price-high":
        return Number(b.price) - Number(a.price);
      case "title-az":
        return (a.title || "").localeCompare(b.title || "");
      case "newest":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const applyMoreFilters = () => {
    setMoreFilters(pendingFilters);
    setShowMoreFilters(false);
  };

  const resetMoreFilters = () => {
    setPendingFilters(defaultMoreFilters);
    setMoreFilters(defaultMoreFilters);
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    priceRange !== "all" ||
    moreFilters.condition !== "all" ||
    moreFilters.location !== "all" ||
    moreFilters.minPrice !== "" ||
    moreFilters.maxPrice !== "" ||
    moreFilters.sortBy !== "newest";

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={{ flex: 1 }}>
        <ItemCard
          item={item}
          isFavorite={favorites.includes(item._id)}
          onToggleFavorite={handleToggleFavorite}
        />
      </View>
    ),
    [favorites]
  );

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-black text-black mb-3">Marketplace</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mb-3">
          <Search size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-black text-sm"
            placeholder="Search listings..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedCategory === cat
                  ? "bg-[#0021A5] border-[#0021A5]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === cat ? "text-white" : "text-gray-600"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price Range + More Filters Row */}
        <View className="flex-row items-center gap-2 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {PRICE_RANGES.map((pr) => (
              <TouchableOpacity
                key={pr.value}
                onPress={() => setPriceRange(pr.value)}
                className={`mr-2 px-3 py-1.5 rounded-full border ${
                  priceRange === pr.value
                    ? "bg-orange-500 border-orange-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    priceRange === pr.value ? "text-white" : "text-gray-600"
                  }`}
                >
                  {pr.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              setPendingFilters(moreFilters);
              setShowMoreFilters(true);
            }}
            className={`flex-row items-center px-3 py-1.5 rounded-full border ${
              hasActiveFilters ? "bg-[#0021A5] border-[#0021A5]" : "bg-white border-gray-200"
            }`}
          >
            <SlidersHorizontal
              size={14}
              color={hasActiveFilters ? "white" : "#6b7280"}
            />
            <Text
              className={`ml-1 text-xs font-semibold ${
                hasActiveFilters ? "text-white" : "text-gray-600"
              }`}
            >
              Filters
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results count */}
        <Text className="text-xs text-gray-400 mb-2">
          {sortedItems.length} listing{sortedItems.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Item Grid */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0021A5" />
          <Text className="mt-3 text-gray-400">Loading listings...</Text>
        </View>
      ) : sortedItems.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">🔍</Text>
          <Text className="text-lg font-bold text-black mb-2">No listings found</Text>
          <Text className="text-gray-500 text-center text-sm">
            Try adjusting your search or filters.
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory("all");
                setPriceRange("all");
                resetMoreFilters();
                setSearchQuery("");
              }}
              className="mt-4 bg-[#0021A5] rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 16 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* More Filters Modal */}
      <Modal visible={showMoreFilters} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: "85%" }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-black">More Filters</Text>
              <TouchableOpacity onPress={() => setShowMoreFilters(false)}>
                <X size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Sort By</Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() =>
                      setPendingFilters((prev) => ({ ...prev, sortBy: opt.value }))
                    }
                    className={`px-3 py-2 rounded-full border ${
                      pendingFilters.sortBy === opt.value
                        ? "bg-[#0021A5] border-[#0021A5]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        pendingFilters.sortBy === opt.value
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Condition */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Condition</Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {CONDITIONS.map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    onPress={() =>
                      setPendingFilters((prev) => ({ ...prev, condition: cond }))
                    }
                    className={`px-3 py-2 rounded-full border ${
                      pendingFilters.condition === cond
                        ? "bg-[#0021A5] border-[#0021A5]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        pendingFilters.condition === cond
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {cond === "all" ? "Any Condition" : cond}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Location</Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() =>
                      setPendingFilters((prev) => ({ ...prev, location: loc }))
                    }
                    className={`px-3 py-2 rounded-full border ${
                      pendingFilters.location === loc
                        ? "bg-[#0021A5] border-[#0021A5]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        pendingFilters.location === loc
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {loc === "all" ? "Any Location" : loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Price Range */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Custom Price Range
              </Text>
              <View className="flex-row gap-3 mb-8">
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 py-2 text-black bg-gray-50"
                    placeholder="Min $"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={pendingFilters.minPrice}
                    onChangeText={(v) =>
                      setPendingFilters((prev) => ({ ...prev, minPrice: v }))
                    }
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 py-2 text-black bg-gray-50"
                    placeholder="Max $"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={pendingFilters.maxPrice}
                    onChangeText={(v) =>
                      setPendingFilters((prev) => ({ ...prev, maxPrice: v }))
                    }
                  />
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                onPress={resetMoreFilters}
                className="flex-1 border border-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-semibold">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyMoreFilters}
                className="flex-1 bg-[#0021A5] rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
