import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator, StatusBar, Keyboard
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from "socket.io-client";

const SOCKET_URL = "https://mason-chat-server.onrender.com";

export default function ChatScreen({ navigation, route }) {
  const { sellerId, sellerName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  
  const socket = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    setupChat();
    
    // CLEANUP: This stops the "Double Message" bug
    return () => {
      if (socket.current) {
        socket.current.off("receive_message"); // Stop listening
        socket.current.emit("user_offline", currentUserId); 
        socket.current.disconnect();
      }
    };
  }, [currentUserId]);

  // Function to clear unread counts on the server
  const markAsRead = async (userId, roomId) => {
    try {
      await fetch(`${SOCKET_URL}/api/messages/read/${roomId}/${userId}`, {
        method: 'PUT',
      });
    } catch (e) {
      console.log("Error marking as read:", e);
    }
  };

  const setupChat = async () => {
    try {
      const myId = await AsyncStorage.getItem('user_id');
      if (!myId) return;
      setCurrentUserId(myId);
      
      const roomId = [myId, sellerId].sort().join("_");

      // 1. Mark existing messages as read immediately upon opening
      markAsRead(myId, roomId);

      // 2. FETCH HISTORY 
      try {
        const response = await fetch(`${SOCKET_URL}/api/messages/${roomId}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (e) {
        console.log("History fetch failed:", e);
      } finally {
        setLoading(false);
      }

      // 3. CONNECT SOCKET
      socket.current = io(SOCKET_URL, {
        transports: ['websocket'],
        forceNew: true,
      });
      
      socket.current.on("connect", () => {
        socket.current.emit("join_room", roomId);
        socket.current.emit("user_online", myId);
      });

      socket.current.on("status_update", (data) => {
        if (data.userId === sellerId) {
          setIsOnline(data.status === "online");
        }
      });

      // 4. RECEIVE MESSAGE (With Duplicate Check)
   socket.current.on("receive_message", (incomingMsg) => {
  // --- ADD THIS CHECK ---
  // If the message is from me, skip it (because handleSend already added it)
  if (incomingMsg.senderId === myId) return; 

  markAsRead(myId, roomId);

  setMessages((prev) => {
    const isDuplicate = prev.some(m => 
      (m._id && m._id === incomingMsg._id) || 
      (m.tempId && m.tempId === incomingMsg.tempId)
    );
    if (isDuplicate) return prev;
    return [...prev, incomingMsg];
  });
  
  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
});

      checkSellerStatus();
    } catch (err) {
      setLoading(false);
    }
  };

  const checkSellerStatus = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/status/${sellerId}`);
      if (res.ok) {
        const data = await res.json();
        setIsOnline(data.status === "online");
      }
    } catch (e) {}
  };

  const handleSend = () => {
    if (inputText.trim() && currentUserId) {
      const roomId = [currentUserId, sellerId].sort().join("_");
      
      const msgData = {
        roomId,
        senderId: currentUserId,
        text: inputText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tempId: Date.now().toString(),
        read: false 
      };

      socket.current.emit("send_message", msgData);
      
      // Optimistic UI: Add the message to the list immediately
      setMessages(prev => [...prev, msgData]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{sellerName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' }]} />
            <Text style={[styles.headerStatus, { color: isOnline ? '#4CAF50' : '#888' }]}>
              {isOnline ? 'Active Now' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Message List Section */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || item.tempId || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserId;
            return (
              <View style={[styles.msgWrapper, isMe ? styles.myWrapper : styles.otherWrapper]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                  <Text style={[styles.msgText, { color: isMe ? '#FFF' : '#222' }]}>{item.text}</Text>
                  <Text style={[styles.timeText, { color: isMe ? '#D1E8FF' : '#999' }]}>{item.time}</Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            value={inputText} 
            onChangeText={setInputText} 
            placeholder="Type a message..." 
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? '#007AFF' : '#B0C4DE' }]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name="send" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    paddingVertical: 10, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    elevation: 4, 
  },
  backBtn: { padding: 5 },
  headerInfo: { flex: 1, marginLeft: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerStatus: { fontSize: 12, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 15, paddingHorizontal: 10 },
  msgWrapper: { marginVertical: 3, width: '100%' },
  myWrapper: { alignItems: 'flex-end' },
  otherWrapper: { alignItems: 'flex-start' },
  bubble: { 
    maxWidth: '80%', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 15,
    elevation: 1,
  },
  myBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 16, lineHeight: 22 },
  timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4, fontWeight: '500' },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    backgroundColor: '#F6F6F6', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    fontSize: 16, 
    maxHeight: 100,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E8E8E8'
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }
});