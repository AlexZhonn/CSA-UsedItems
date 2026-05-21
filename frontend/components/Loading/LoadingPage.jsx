import { View, Text, ActivityIndicator } from "react-native";

export default function LoadingPage() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0021A5" />
      <Text className="mt-4 text-gray-500 text-base font-medium">Loading...</Text>
    </View>
  );
}
