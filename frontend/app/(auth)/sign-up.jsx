import { useAuthContext } from "../../context/AuthContext";
import { useRouter, Link } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

export default function SignUpPage() {
  const { register, verifyEmail } = useAuthContext();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await register(firstName, lastName, email.trim(), password);
      setPendingVerification(true);
    } catch (err) {
      Alert.alert("Sign Up Failed", err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyEmail(email.trim(), code.trim());
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Verification Failed", err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View className="flex-1 justify-center px-8 bg-white">
          <Text className="text-3xl font-black text-black mb-2">Check your email</Text>
          <Text className="text-gray-500 mb-8">We sent a verification code to {email}</Text>

          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-black bg-gray-50 mb-4 text-center text-2xl tracking-widest"
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity onPress={handleVerify} disabled={loading} className="bg-primary rounded-xl py-4 items-center">
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-lg">Verify Email</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
        <View className="flex-1 justify-center px-8 py-16">
          <View className="mb-10 items-center">
            <Text className="text-4xl font-black text-black mb-2">🏮</Text>
            <Text className="text-3xl font-black text-black">Join CSA Market</Text>
            <Text className="text-gray-500 mt-2">Create your account</Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">First Name</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-black bg-gray-50"
                  placeholder="Alex"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-black bg-gray-50"
                  placeholder="Zhong"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View className="mt-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-black bg-gray-50"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="mt-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-black bg-gray-50"
                placeholder="Create a password (min 8 chars)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity onPress={handleSignUp} disabled={loading} className="mt-6 bg-primary rounded-xl py-4 items-center">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-lg">Create Account</Text>}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/sign-in">
                <Text className="text-primary font-semibold">Sign In</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
