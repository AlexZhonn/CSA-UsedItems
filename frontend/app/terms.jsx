import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const Section = ({ title, children }) => (
  <View className="mb-6">
    <Text className="text-base font-black text-black mb-2">{title}</Text>
    <Text className="text-gray-600 text-sm leading-relaxed">{children}</Text>
  </View>
);

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-black">Terms of Service</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-400 text-xs mb-6">Last updated: January 1, 2025</Text>

        <Text className="text-gray-600 text-sm leading-relaxed mb-6">
          Welcome to CSA Market. By using our app, you agree to these Terms of
          Service. Please read them carefully. If you do not agree, do not use the
          service.
        </Text>

        <Section title="1. Eligibility">
          CSA Market is a marketplace primarily for Chinese Student Association members
          and the broader student community. You must be at least 18 years old (or the
          legal age of majority in your jurisdiction) to use this service. By creating an
          account, you represent that you meet these requirements. We reserve the right
          to terminate accounts that do not meet eligibility requirements.
        </Section>

        <Section title="2. User Accounts">
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activities that occur under your account. You agree to
          notify us immediately of any unauthorized use of your account. You may not
          create multiple accounts or impersonate another person. We reserve the right to
          suspend or terminate accounts that violate these terms.
        </Section>

        <Section title="3. Listings and Content">
          You are solely responsible for the content of your listings. By posting a
          listing, you represent that:{"\n\n"}
          • You own the item or have the right to sell it{"\n"}
          • The item description and photos accurately represent the item{"\n"}
          • The item is legal to sell in your jurisdiction{"\n"}
          • You will honor the listed price and terms{"\n\n"}
          We reserve the right to remove listings that violate these terms or our
          community guidelines without notice.
        </Section>

        <Section title="4. Prohibited Items">
          The following items are strictly prohibited on CSA Market:{"\n\n"}
          • Illegal items or substances of any kind{"\n"}
          • Weapons, firearms, or ammunition{"\n"}
          • Alcohol or tobacco products{"\n"}
          • Prescription medications or controlled substances{"\n"}
          • Counterfeit or stolen goods{"\n"}
          • Adult content or services{"\n"}
          • Live animals{"\n"}
          • Hazardous materials{"\n"}
          • Digital goods, accounts, or intangible items{"\n\n"}
          Violation may result in immediate account termination and may be reported to
          law enforcement.
        </Section>

        <Section title="5. Transactions and Payments">
          CSA Market is a platform for connecting buyers and sellers. We do not
          process payments or guarantee transactions. All payments and exchanges occur
          directly between users. We strongly recommend:{"\n\n"}
          • Meeting in safe, public locations on or near campus{"\n"}
          • Inspecting items before payment{"\n"}
          • Using cash or peer-to-peer payment apps{"\n"}
          • Bringing a friend for high-value exchanges{"\n\n"}
          CSA Market is not responsible for disputes, fraud, or failed transactions
          between users.
        </Section>

        <Section title="6. User Conduct">
          You agree not to:{"\n\n"}
          • Harass, threaten, or abuse other users{"\n"}
          • Post false, misleading, or deceptive listings{"\n"}
          • Spam or send unsolicited messages{"\n"}
          • Attempt to circumvent our platform to avoid fees or safety features{"\n"}
          • Use the platform for commercial business purposes{"\n"}
          • Scrape or collect data from the platform without permission{"\n"}
          • Attempt to hack or disrupt the service
        </Section>

        <Section title="7. Intellectual Property">
          By uploading photos or creating listings, you grant CSA Market a
          non-exclusive, royalty-free license to display and use that content to operate
          the service. You retain ownership of your content. CSA Market's name, logo,
          and design are our intellectual property and may not be used without permission.
        </Section>

        <Section title="8. Disclaimers">
          CSA Market is provided "as is" without warranties of any kind. We do not
          verify the accuracy of listings, the identity of users beyond email verification,
          or the quality of items sold. We are not responsible for any loss, damage, or
          harm resulting from transactions made through our platform.
        </Section>

        <Section title="9. Limitation of Liability">
          To the fullest extent permitted by law, CSA Market and its operators shall
          not be liable for any indirect, incidental, special, or consequential damages
          arising from your use of the service, including but not limited to lost profits,
          data loss, or personal injury related to transactions facilitated through the
          platform.
        </Section>

        <Section title="10. Modifications">
          We may modify these Terms of Service at any time. Continued use of the app
          after changes constitutes acceptance. We will make reasonable efforts to notify
          users of significant changes through the app.
        </Section>

        <Section title="11. Governing Law">
          These Terms are governed by applicable law. Any disputes shall be resolved
          through good-faith negotiation or, if necessary, in the courts of competent
          jurisdiction.
        </Section>

        <Section title="12. Contact">
          For questions about these terms:{"\n\n"}
          Email: support@csamarket.app{"\n"}
          Chinese Student Association · CSA Market
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
