import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, RefreshControl, StatusBar 
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://mason-chat-server.onrender.com";

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myId, setMyId] = useState(null);

  // Load only once when the screen opens for the first time
  useEffect(() => {
    loadConversations(true);
  }, []);

  const loadConversations = async (shouldShowSpinner = true) => {
    try {
      if (shouldShowSpinner) setLoading(true);
      
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        setLoading(false);
        return;
      }
      setMyId(userId);
      
      // Fetches the object format: [{ roomId, unreadCount }]
      const response = await fetch(`${API_URL}/api/conversations/${userId}`);
      const contentType = response.headers.get("content-type");
      
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations(false); // Reload data manually
  };

  const renderItem = ({ item }) => {
    // Handle both old string format and new object format safely
    const roomId = item.roomId || item; 
    if (typeof roomId !== 'string') return null;

    const participants = roomId.split('_');
    const otherUser = participants.find(id => id !== myId);
    const count = item.unreadCount || 0;

    return (
      <TouchableOpacity 
        style={styles.chatCard}
        onPress={() => navigation.navigate('ChatPage', { 
          sellerId: otherUser, 
          sellerName: `User: ${otherUser}` 
        })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherUser?.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        
        <View style={styles.chatInfo}>
          <Text style={styles.userName}>{otherUser || "Unknown User"}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {count > 0 ? `${count} new messages` : 'Tap to view messages'}
          </Text>
        </View>

        {/* Unread Message Badge */}
        {count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}

        <MaterialIcons name="chevron-right" size={24} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => (item.roomId || item).toString() + index}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#007AFF']} 
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="chat-bubble-outline" size={50} color="#CCC" />
              <Text style={styles.emptyText}>No conversations yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  chatCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F9F9F9' 
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  chatInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 17, fontWeight: '700' },
  lastMsg: { fontSize: 14, color: '#888', marginTop: 3 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: 8
  },
  unreadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  }
});