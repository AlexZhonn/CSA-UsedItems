import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle, MessageSquare, DollarSign, Calendar } from "lucide-react-native";
import api from "../../service/api";

const PAYMENT_METHODS = ["cash", "venmo", "zelle", "other"];

export default function MarkSoldScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getToken, user } = useAuthContext();
  const { itemId } = params;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [soldPrice, setSoldPrice] = useState("");
  const [soldDate, setSoldDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [transactionMethod, setTransactionMethod] = useState("cash");
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [marking, setMarking] = useState(false);
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const [itemData, convData] = await Promise.all([
          api.getPostById(itemId, token),
          api.getUserConversations(token, { postId: itemId }),
        ]);
        if (itemData.userId !== user?.userId) {
          router.replace("/(tabs)/market");
          return;
        }
        setItem(itemData);
        setSoldPrice(String(itemData.price || ""));
        setConversations(Array.isArray(convData) ? convData : []);
      } catch {
        router.replace("/(tabs)/market");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemId]);

  const handleMarkSold = async () => {
    if (!soldPrice || parseFloat(soldPrice) <= 0) {
      setPriceError("Enter a valid sale price");
      return;
    }
    Alert.alert("Mark as Sold?", "This will hide the listing from the marketplace.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Sold",
        onPress: async () => {
          setMarking(true);
          try {
            const token = await getToken();
            await api.markPostSoldDetailed(token, itemId, {
              soldPrice: parseFloat(soldPrice),
              soldDate,
              meetingLocation: meetingLocation.trim() || undefined,
              transactionMethod,
              buyerClerkId: selectedBuyer || null,
            });
            Alert.alert("Sold!", "Your listing has been marked as sold.", [
              { text: "OK", onPress: () => router.replace("/(tabs)/profile") },
            ]);
          } catch (err) {
            Alert.alert("Error", err?.response?.data?.message || "Could not mark as sold.");
          } finally {
            setMarking(false);
          }
        },
      },
    ]);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#0021A5" />
      </SafeAreaView>
    );
  }

  const images = Array.isArray(item?.images) ? item.images : [item?.images].filter(Boolean);

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-black">Mark as Sold</Text>
            <Text className="text-gray-500 text-xs">Record your sale details</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Item Summary */}
          <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-6 items-center">
            {images[0] ? (
              <Image source={{ uri: images[0] }} style={{ width: 72, height: 72, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View className="w-18 h-18 bg-gray-200 rounded-xl items-center justify-center">
                <Text className="text-2xl">📦</Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="font-bold text-black" numberOfLines={2}>{item?.title}</Text>
              <Text className="text-orange-500 font-bold text-lg">${item?.price}</Text>
              <Text className="text-gray-400 text-xs">{item?.condition} · {item?.category}</Text>
            </View>
          </View>

          {/* Who Bought It */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Who bought this? <Text className="text-gray-400 font-normal">(Optional)</Text></Text>
            <TouchableOpacity
              onPress={() => setSelectedBuyer(null)}
              className={`flex-row items-center p-3 rounded-xl border mb-2 ${!selectedBuyer ? "border-[#0021A5] bg-gray-50" : "border-gray-200"}`}
            >
              <View className={`w-4 h-4 rounded-full border-2 mr-2 ${!selectedBuyer ? "border-[#0021A5] bg-[#0021A5]" : "border-gray-300"}`} />
              <Text className="text-black text-sm">Sold Outside Platform</Text>
            </TouchableOpacity>
            {conversations.length === 0 ? (
              <View className="bg-gray-50 rounded-xl p-3 items-center">
                <MessageSquare size={20} color="#d1d5db" />
                <Text className="text-gray-400 text-xs mt-1">No conversations for this listing</Text>
              </View>
            ) : (
              conversations.map((conv) => {
                const other = conv.participants?.find((p) => p._id !== user?.userId) || conv.participants?.[0];
                const isSelected = selectedBuyer === other?._id;
                return (
                  <TouchableOpacity
                    key={conv._id}
                    onPress={() => setSelectedBuyer(other?._id)}
                    className={`flex-row items-center p-3 rounded-xl border mb-2 ${isSelected ? "border-[#0021A5] bg-gray-50" : "border-gray-200"}`}
                  >
                    <View className={`w-4 h-4 rounded-full border-2 mr-2 ${isSelected ? "border-[#0021A5] bg-[#0021A5]" : "border-gray-300"}`} />
                    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                      <Text className="text-[#0021A5] font-bold text-xs">{(other?.firstName?.[0] || "?").toUpperCase()}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-black text-sm font-medium">{other?.firstName || "User"} {other?.lastName || ""}</Text>
                      <Text className="text-gray-400 text-xs">{formatTime(conv.updatedAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Sold Price */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Final Sale Price <Text className="text-red-500">*</Text></Text>
            <View className={`flex-row items-center border rounded-xl bg-gray-50 px-4 ${priceError ? "border-red-400" : "border-gray-200"}`}>
              <DollarSign size={16} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 text-black ml-1"
                placeholder="0.00"
                value={soldPrice}
                onChangeText={(v) => { setSoldPrice(v); setPriceError(""); }}
                keyboardType="decimal-pad"
              />
            </View>
            {priceError ? <Text className="text-red-500 text-xs mt-1">{priceError}</Text> : null}
            {soldPrice && item?.price && parseFloat(soldPrice) !== item.price && (
              <Text className={`text-xs mt-1 ${parseFloat(soldPrice) < item.price ? "text-orange-500" : "text-green-600"}`}>
                {parseFloat(soldPrice) < item.price ? `Sold for less than asking ($${item.price})` : `Sold for more than asking ($${item.price}) 🎉`}
              </Text>
            )}
          </View>

          {/* Meeting Location */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Where did you meet? <Text className="text-gray-400 font-normal">(Optional)</Text></Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-black bg-gray-50"
              placeholder="e.g., Reitz Union, Library West"
              value={meetingLocation}
              onChangeText={setMeetingLocation}
            />
          </View>

          {/* Payment Method */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Payment Method</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setTransactionMethod(method)}
                  className={`px-4 py-2 rounded-xl border ${transactionMethod === method ? "bg-[#0021A5] border-[#0021A5]" : "border-gray-200 bg-gray-50"}`}
                >
                  <Text className={`text-sm font-medium capitalize ${transactionMethod === method ? "text-white" : "text-black"}`}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mark Sold Button */}
          <TouchableOpacity onPress={handleMarkSold} disabled={marking} className="bg-green-600 rounded-2xl py-4 items-center mb-3">
            {marking ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <CheckCircle size={18} color="white" />
                <Text className="text-white font-bold text-base ml-2">Mark as Sold</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="py-4 items-center">
            <Text className="text-gray-500 font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
