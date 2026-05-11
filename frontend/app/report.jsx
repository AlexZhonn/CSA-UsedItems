import { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle } from "lucide-react-native";
import api from "../service/api";

const REASONS = [
  "Prohibited item",
  "Scam/fraud",
  "Wrong category",
  "Offensive content",
  "Already sold",
  "Other",
];

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getToken } = useAuth();

  const itemId = params.itemId;

  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!selectedReason) e.reason = "Please select a reason.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = await getToken();
      await api.reportPost(token, itemId, {
        reason: selectedReason,
        description: description.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" style={{ flex: 1 }}>
        <CheckCircle size={64} color="#22c55e" />
        <Text className="text-2xl font-black text-black mt-5 mb-2 text-center">
          Report Submitted
        </Text>
        <Text className="text-gray-500 text-center text-sm mb-8">
          Thank you for helping keep Gator Exchange safe. We'll review your report shortly.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black rounded-xl px-8 py-4"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-black">Report Listing</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-gray-600 text-sm mb-6">
            Help us keep the marketplace safe and trustworthy. Please select a reason for your report.
          </Text>

          {/* Reason Selection */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">Reason *</Text>
          <View className="gap-2 mb-2">
            {REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                className={`flex-row items-center px-4 py-3.5 rounded-xl border ${
                  selectedReason === reason
                    ? "border-black bg-gray-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    selectedReason === reason ? "border-black" : "border-gray-300"
                  }`}
                >
                  {selectedReason === reason && (
                    <View className="w-2.5 h-2.5 rounded-full bg-black" />
                  )}
                </View>
                <Text
                  className={`text-sm font-medium ${
                    selectedReason === reason ? "text-black" : "text-gray-600"
                  }`}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.reason && (
            <Text className="text-red-500 text-xs mt-1 mb-3">{errors.reason}</Text>
          )}

          {/* Description */}
          <View className="mt-5 mb-8">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Additional Details (optional)
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-black bg-gray-50"
              placeholder="Provide any additional context that may help us review this report..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{ minHeight: 110 }}
              maxLength={1000}
            />
            <Text className="text-gray-400 text-xs mt-1 text-right">
              {description.length}/1000
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-black rounded-2xl py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
