import { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ItemCard({ item, isFavorite, onToggleFavorite }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const imageUri =
    !imgError && item?.images && item.images.length > 0
      ? item.images[0]
      : null;

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "$0";
    return `$${Number(price).toFixed(2)}`;
  };

  const handlePress = () => {
    router.push({ pathname: "/item", params: { itemId: item._id } });
  };

  const handleFavorite = (e) => {
    if (onToggleFavorite) onToggleFavorite(item._id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4"
      style={{ flex: 1, margin: 6 }}
      activeOpacity={0.85}
    >
      <View style={{ height: 180, backgroundColor: "#f3f4f6" }}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: 180 }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">📦</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleFavorite}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-sm"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={18}
            color={isFavorite ? "#FA4616" : "#9ca3af"}
            fill={isFavorite ? "#FA4616" : "none"}
          />
        </TouchableOpacity>
      </View>

      <View className="p-3">
        <Text className="text-black font-semibold text-sm" numberOfLines={2}>
          {item?.title || "Untitled"}
        </Text>
        <Text className="text-orange-500 font-bold text-base mt-1">
          {formatPrice(item?.price)}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          {item?.condition ? (
            <View className="bg-gray-100 rounded-full px-2 py-0.5">
              <Text className="text-gray-600 text-xs">{item.condition}</Text>
            </View>
          ) : null}
          {item?.location ? (
            <Text className="text-gray-400 text-xs" numberOfLines={1}>
              📍 {item.location}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
