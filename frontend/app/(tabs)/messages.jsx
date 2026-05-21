import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthContext } from "../../context/AuthContext";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { ArrowLeft, Send, MessageSquare } from "lucide-react-native";
import api from "../../service/api";

export default function MessagesScreen() {
  const { getToken, user } = useAuthContext();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await api.getUserConversations(token);
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  const openConversation = async (conv) => {
    setSelectedConversation(conv);
    setChatOpen(true);
    setMessages([]);
    setMessagesLoading(true);
    try {
      const token = await getToken();
      const data = await api.getConversationMessages(token, conv._id);
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {
      Alert.alert("Error", "Could not load messages.");
    } finally {
      setMessagesLoading(false);
    }
  };

  const closeChat = () => {
    setChatOpen(false);
    setSelectedConversation(null);
    setMessages([]);
    setMessageText("");
  };

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content || !selectedConversation) return;
    setSending(true);
    setMessageText("");
    try {
      const token = await getToken();
      const sent = await api.sendConversationMessage(token, selectedConversation._id, {
        content,
      });
      setMessages((prev) => [...prev, sent]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      Alert.alert("Error", "Failed to send message.");
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getOtherParticipant = (conv) => {
    const myId = user?.userId;
    if (!conv?.participants) return null;
    return conv.participants.find((p) => p._id !== myId) || conv.participants[0];
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  const isMyMessage = (msg) => {
    return msg?.sender?._id === user?.userId || msg?.sender === user?.userId;
  };

  const renderConversation = ({ item: conv }) => {
    const other = getOtherParticipant(conv);
    const lastMsg = conv.lastMessage;
    const postImage = conv.post?.images?.[0] || null;

    return (
      <TouchableOpacity
        onPress={() => openConversation(conv)}
        className="flex-row items-center px-5 py-4 border-b border-gray-50"
        activeOpacity={0.7}
      >
        {/* Post Image or Avatar */}
        <View
          style={{ width: 52, height: 52, borderRadius: 26, overflow: "hidden", backgroundColor: "#f3f4f6" }}
          className="items-center justify-center mr-3"
        >
          {postImage ? (
            <Image source={{ uri: postImage }} style={{ width: 52, height: 52 }} resizeMode="cover" />
          ) : (
            <Text className="text-xl">📦</Text>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-black font-semibold text-sm" numberOfLines={1}>
              {other?.firstName || other?.name || "Unknown User"}
            </Text>
            <Text className="text-gray-400 text-xs">{formatTime(conv.updatedAt)}</Text>
          </View>
          {conv.post?.title ? (
            <Text className="text-orange-500 text-xs mb-0.5" numberOfLines={1}>
              {conv.post.title}
            </Text>
          ) : null}
          {lastMsg ? (
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              {lastMsg.content || "..."}
            </Text>
          ) : (
            <Text className="text-gray-400 text-xs italic">No messages yet</Text>
          )}
        </View>

        {conv.unreadCount > 0 && (
          <View className="ml-2 bg-orange-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">{conv.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item: msg }) => {
    const mine = isMyMessage(msg);
    return (
      <View
        className={`flex-row mb-3 ${mine ? "justify-end" : "justify-start"}`}
        style={{ paddingHorizontal: 16 }}
      >
        <View
          className={`rounded-2xl px-4 py-2.5 ${
            mine ? "bg-[#0021A5]" : "bg-gray-100"
          }`}
          style={{ maxWidth: "75%" }}
        >
          <Text className={`text-sm ${mine ? "text-white" : "text-black"}`}>
            {msg.content}
          </Text>
          <Text className={`text-xs mt-1 ${mine ? "text-gray-300" : "text-gray-400"}`}>
            {formatTime(msg.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-gray-100">
        <Text className="text-2xl font-black text-black">Messages</Text>
      </View>

      {/* Conversation List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0021A5" />
          <Text className="mt-3 text-gray-400">Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MessageSquare size={56} color="#e5e7eb" />
          <Text className="text-lg font-bold text-black mt-4 mb-2">No conversations yet</Text>
          <Text className="text-gray-500 text-sm text-center">
            Start a conversation by messaging a seller on a listing.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0021A5"
            />
          }
        />
      )}

      {/* Chat Modal */}
      <Modal visible={chatOpen} animationType="slide" onRequestClose={closeChat}>
        <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Chat Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              <TouchableOpacity onPress={closeChat} className="mr-3 p-1">
                <ArrowLeft size={22} color="#111" />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-base font-bold text-black" numberOfLines={1}>
                  {getOtherParticipant(selectedConversation)?.firstName ||
                    getOtherParticipant(selectedConversation)?.name ||
                    "User"}
                </Text>
                {selectedConversation?.post?.title ? (
                  <Text className="text-orange-500 text-xs" numberOfLines={1}>
                    {selectedConversation.post.title}
                  </Text>
                ) : null}
              </View>
              {selectedConversation?.post?.images?.[0] ? (
                <Image
                  source={{ uri: selectedConversation.post.images[0] }}
                  style={{ width: 40, height: 40, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            {/* Messages */}
            {messagesLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#0021A5" />
              </View>
            ) : messages.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-gray-400 text-sm text-center">
                  No messages yet. Say hello!
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, idx) => item._id || String(idx)}
                renderItem={renderMessage}
                contentContainerStyle={{ paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: false })
                }
              />
            )}

            {/* Input */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              <TextInput
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-black text-sm mr-3"
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={sending || !messageText.trim()}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  messageText.trim() && !sending ? "bg-[#0021A5]" : "bg-gray-200"
                }`}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send size={16} color={messageText.trim() ? "white" : "#9ca3af"} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
