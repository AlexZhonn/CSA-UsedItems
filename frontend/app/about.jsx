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
    title: "Student Marketplace",
    desc: "Buy and sell textbooks, furniture, electronics, and more with fellow UF students.",
  },
  {
    icon: Users,
    title: "UF Community",
    desc: "Exclusively for the University of Florida community — verified and trusted.",
  },
  {
    icon: Shield,
    title: "Safe Exchanges",
    desc: "Meet on campus or in public places. We promote safe, in-person transactions.",
  },
  {
    icon: MapPin,
    title: "Local First",
    desc: "All listings are from Gainesville — no shipping hassles, just local deals.",
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
          <Text className="text-5xl mb-3">🐊</Text>
          <Text className="text-3xl font-black text-black text-center">
            GATOR EXCHANGE
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-base">
            Gainesville's Student Marketplace
          </Text>
          <View className="mt-4 flex-row items-center bg-green-100 rounded-full px-4 py-2">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-green-700 text-sm font-semibold">
              Built for the University of Florida
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View className="px-6 py-8">
          <Text className="text-xl font-black text-black mb-3">Our Mission</Text>
          <Text className="text-gray-600 text-base leading-relaxed">
            Gator Exchange was created to solve a simple problem: UF students needed a
            trusted, local marketplace just for them. We make it easy to buy and sell
            within the Gator community — sustainably, safely, and affordably.
          </Text>
          <Text className="text-gray-600 text-base leading-relaxed mt-3">
            Whether you're moving into the dorms and need furniture, looking to sell your
            old textbooks, or hunting for a great deal on electronics — Gator Exchange
            connects you with the people right around the corner.
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
                  <View className="bg-orange-100 rounded-xl p-2.5 mr-4">
                    <Icon size={20} color="#FA4616" />
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
        <View className="mx-6 mb-8 bg-black rounded-2xl p-6">
          <Text className="text-white font-black text-lg mb-4 text-center">
            Gator Exchange by the Numbers
          </Text>
          <View className="flex-row justify-around">
            {[
              { val: "1,000+", label: "Students" },
              { val: "5,000+", label: "Listings" },
              { val: "100%", label: "UF Local" },
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
            <Text className="text-black font-semibold text-sm">support@gatorexchange.com</Text>
            <Text className="text-gray-500 text-xs mt-2">
              University of Florida · Gainesville, FL 32611
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-6">
          <Text className="text-gray-400 text-xs">
            © 2025 Gator Exchange · Made with ❤️ in Gainesville
          </Text>
          <Text className="text-gray-300 text-xs mt-1">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
