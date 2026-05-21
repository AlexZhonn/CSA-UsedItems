import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShoppingBag, Users, Shield, MapPin } from "lucide-react-native";

const features = [
  {
    icon: ShoppingBag,
    title: "Member Marketplace",
    desc: "Buy and sell textbooks, furniture, electronics, and more with fellow CSA members.",
  },
  {
    icon: Users,
    title: "CSA Community",
    desc: "Built for the Chinese Student Association — a trusted space for members to connect and trade.",
  },
  {
    icon: Shield,
    title: "Safe Exchanges",
    desc: "Meet in public places. We promote safe, in-person transactions between community members.",
  },
  {
    icon: MapPin,
    title: "Local First",
    desc: "All listings are local — no shipping hassles, just convenient deals within your community.",
  },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-black">About</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="items-center px-6 pt-10 pb-8 bg-gray-50 border-b border-gray-100">
          <Text className="text-5xl mb-3">🏮</Text>
          <Text className="text-3xl font-black text-black text-center">
            CSA MARKET
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-base">
            The Chinese Student Association Marketplace
          </Text>
          <View className="mt-4 flex-row items-center bg-green-100 rounded-full px-4 py-2">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-green-700 text-sm font-semibold">
              Built for CSA Members
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View className="px-6 py-8">
          <Text className="text-xl font-black text-black mb-3">Our Mission</Text>
          <Text className="text-gray-600 text-base leading-relaxed">
            CSA Market was created to solve a simple problem: Chinese Student Association
            members needed a trusted, local marketplace just for their community. We make
            it easy to buy and sell within the CSA — sustainably, safely, and affordably.
          </Text>
          <Text className="text-gray-600 text-base leading-relaxed mt-3">
            Whether you're looking for furniture, selling old textbooks, or hunting for a
            great deal on electronics — CSA Market connects you with members right in
            your community.
          </Text>
        </View>

        {/* Features */}
        <View className="px-6 pb-8">
          <Text className="text-xl font-black text-black mb-4">What We Offer</Text>
          <View className="gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <View
                  key={idx}
                  className="flex-row bg-gray-50 rounded-2xl p-4 items-start"
                >
                  <View className="bg-blue-100 rounded-xl p-2.5 mr-4">
                    <Icon size={20} color="#0021A5" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-black text-sm mb-1">{feat.title}</Text>
                    <Text className="text-gray-500 text-sm leading-relaxed">{feat.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats */}
        <View className="mx-6 mb-8 bg-[#0021A5] rounded-2xl p-6">
          <Text className="text-white font-black text-lg mb-4 text-center">
            CSA Market by the Numbers
          </Text>
          <View className="flex-row justify-around">
            {[
              { val: "500+", label: "Members" },
              { val: "2,000+", label: "Listings" },
              { val: "100%", label: "CSA Local" },
            ].map((stat, idx) => (
              <View key={idx} className="items-center">
                <Text className="text-orange-400 text-2xl font-black">{stat.val}</Text>
                <Text className="text-gray-400 text-xs mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View className="px-6 pb-4">
          <Text className="text-xl font-black text-black mb-3">Contact Us</Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-gray-600 text-sm mb-1">
              Have a question or feedback? Reach out to us:
            </Text>
            <Text className="text-black font-semibold text-sm">support@csamarket.app</Text>
            <Text className="text-gray-500 text-xs mt-2">
              Chinese Student Association · CSA Market
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-6">
          <Text className="text-gray-400 text-xs">
            © 2025 CSA Market · Made with ❤️ by Alex Zhong
          </Text>
          <Text className="text-gray-300 text-xs mt-1">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
