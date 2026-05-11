import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const Section = ({ title, children }) => (
  <View className="mb-6">
    <Text className="text-base font-black text-black mb-2">{title}</Text>
    <Text className="text-gray-600 text-sm leading-relaxed">{children}</Text>
  </View>
);

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-black">Privacy Policy</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-400 text-xs mb-6">Last updated: January 1, 2025</Text>

        <Text className="text-gray-600 text-sm leading-relaxed mb-6">
          Welcome to CSA Market. We are committed to protecting your privacy and
          ensuring a safe experience for all Chinese Student Association members. This Privacy
          Policy explains how we collect, use, and protect your information.
        </Text>

        <Section title="1. Information We Collect">
          We collect information you provide when creating an account, including your name,
          email address, profile photo, and phone number (optional). We also collect
          information about listings you create, messages you send, and your interactions
          with other users. When you use our app, we may automatically collect device
          information, usage data, and IP addresses for security and analytics purposes.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your information to operate and improve CSA Market, including to
          verify your CSA membership, display your profile and listings to other users,
          facilitate messaging between buyers and sellers, send you notifications about
          your account and listings, prevent fraud and ensure platform safety, and analyze
          usage patterns to improve the service.
        </Section>

        <Section title="3. Information Sharing">
          We do not sell your personal information to third parties. Your profile
          information (name, bio, listings) is visible to other CSA Market users.
          Your email address and phone number are not publicly displayed — they are only
          used for account verification and, if you choose, shared with users you message.
          We may share information with law enforcement when required by law.
        </Section>

        <Section title="4. Authentication">
          CSA Market uses Clerk for authentication. When you sign in, Clerk processes
          your login credentials securely. We receive a verified user token and basic
          profile information. We do not store your password. Please review Clerk's privacy
          policy at clerk.com for more details on how they handle authentication data.
        </Section>

        <Section title="5. Data Storage and Security">
          Your data is stored on secure servers. We use industry-standard encryption for
          data in transit (HTTPS/TLS) and implement security measures to protect your
          information. However, no method of transmission over the internet is 100%
          secure. Listing images are stored on secure cloud storage and are publicly
          accessible via direct URL once uploaded.
        </Section>

        <Section title="6. Membership Verification">
          CSA Market is designed for Chinese Student Association members. Non-members
          can browse the marketplace but have limited ability to post listings or send
          messages. We verify accounts but do not independently verify current membership
          status.
        </Section>

        <Section title="7. Your Rights">
          You have the right to access, correct, or delete your personal information.
          You can update your profile at any time through the app. To request deletion of
          your account and associated data, contact us at support@csamarket.app. Note
          that some information may be retained for legal or fraud-prevention purposes.
        </Section>

        <Section title="8. Cookies and Tracking">
          Our mobile app does not use browser cookies. We may use analytics tools to
          understand how users interact with the app. This data is aggregated and
          anonymized where possible.
        </Section>

        <Section title="9. Children's Privacy">
          CSA Market is intended for university students and is not directed at
          children under 13. We do not knowingly collect personal information from
          children under 13. If you believe a child has provided us with personal
          information, please contact us immediately.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of
          significant changes through the app or via email. Your continued use of Gator
          Exchange after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="11. Contact Us">
          If you have questions about this Privacy Policy or how we handle your data,
          please contact us at:{"\n\n"}
          Email: support@csamarket.app{"\n"}
          Chinese Student Association · CSA Market
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
