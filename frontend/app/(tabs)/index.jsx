import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../service/api";

const workSteps = [
  { num: "01", title: "Connect", desc: "Sign in and join the CSA community." },
  { num: "02", title: "Discover", desc: "Browse listings from CSA members." },
  { num: "03", title: "Exchange", desc: "Meet up safely and trade with ease." },
];

const categories = [
  { icon: "📚", title: "Academic", desc: "Textbooks & Notes" },
  { icon: "🪑", title: "Living", desc: "Furniture & Decor" },
  { icon: "💻", title: "Tech", desc: "Devices & Hardware" },
  { icon: "👕", title: "Style", desc: "Clothing & Merch" },
  { icon: "🚴", title: "Move", desc: "Transport & Gear" },
  { icon: "🎮", title: "Play", desc: "Games & Hobbies" },
];

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, posts: 0, dones: 0 });

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k+`;
    if (num >= 100) return `${Math.floor(num / 100) * 100}+`;
    return num.toString();
  };

  useEffect(() => {
    api.getFeatureStats().then((data) => {
      if (data) setStats({ users: data.users || 0, posts: data.posts || 0, dones: data.dones || 0 });
    }).catch(console.error);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <ScrollView className="flex-1" style={{ flex: 1 }}>
        {/* Hero */}
        <View className="px-6 pt-12 pb-10 items-center bg-white">
          <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 mb-6">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              CSA Member Marketplace
            </Text>
          </View>

          <Text className="text-5xl font-black text-black tracking-tight text-center">
            CSA{"\n"}
            <Text className="text-neutral-400">MARKET</Text>
          </Text>

          <Text className="text-gray-600 text-center mt-4 mb-8 text-base leading-relaxed max-w-xs">
            The trusted marketplace for the Chinese Student Association. Buy and sell within your community — sustainably and locally.
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/market")}
              className="bg-black rounded-full px-6 py-3"
            >
              <Text className="text-white font-semibold text-base">Browse Market</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/post")}
              className="border-2 border-gray-200 rounded-full px-6 py-3"
            >
              <Text className="text-black font-semibold text-base">Sell Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="border-t border-b border-gray-100 px-6 py-8">
          <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Live Data</Text>
          <View className="flex-row justify-around">
            {[
              { label: "Users", val: formatNumber(stats.users) },
              { label: "Listings", val: formatNumber(stats.posts) },
              { label: "Trades", val: formatNumber(stats.dones) },
            ].map((s, i) => (
              <View key={i} className="items-center">
                <Text className="text-3xl font-bold text-black">{s.val}</Text>
                <Text className="text-xs text-gray-500 uppercase mt-1">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View className="px-6 py-10 bg-gray-50">
          <Text className="text-2xl font-bold text-black mb-1 text-center">How It Works</Text>
          <Text className="text-gray-500 text-center mb-6">Simple interactions, secure results.</Text>
          {workSteps.map((step, idx) => (
            <View key={idx} className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 shadow-sm">
              <Text className="text-5xl font-black text-gray-100 absolute top-4 right-6">{step.num}</Text>
              <Text className="text-xl font-bold text-black mb-1">{step.title}</Text>
              <Text className="text-gray-600 text-sm">{step.desc}</Text>
            </View>
          ))}
        </View>

        {/* Categories */}
        <View className="px-6 py-10">
          <Text className="text-3xl font-bold text-black mb-6">Essentials</Text>
          <View className="flex-row flex-wrap gap-3">
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push("/(tabs)/market")}
                className="border border-gray-100 rounded-xl p-5 bg-white"
                style={{ width: "47%" }}
              >
                <Text className="text-3xl mb-2">{cat.icon}</Text>
                <Text className="text-lg font-bold text-black">{cat.title}</Text>
                <Text className="text-gray-400 text-sm">{cat.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 bg-gray-50 border-t border-gray-100">
          <Text className="text-center text-gray-500 text-sm">
            © 2025 CSA Market · 钟主恩
          </Text>
          <View className="flex-row justify-center gap-4 mt-3">
            <TouchableOpacity onPress={() => router.push("/about")}>
              <Text className="text-gray-500 text-sm">About</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/privacy")}>
              <Text className="text-gray-500 text-sm">Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/terms")}>
              <Text className="text-gray-500 text-sm">Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
