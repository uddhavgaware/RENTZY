import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api_service.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({Key? key}) : super(key: key);
  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  bool _isLoading = true;
  List<dynamic> _conversations = [];

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiService.client.get('/chat/conversations');
      setState(() {
        _conversations = res.data is List ? res.data : [];
      });
    } catch (_) {
      setState(() => _conversations = []);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Messages', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _conversations.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 16),
                      Text('No conversations yet', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                      const SizedBox(height: 8),
                      Text('Start chatting with property owners or roommates', 
                        style: TextStyle(color: Colors.grey[400], fontSize: 13),
                        textAlign: TextAlign.center),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchConversations,
                  child: ListView.builder(
                    itemCount: _conversations.length,
                    itemBuilder: (ctx, i) {
                      final conv = _conversations[i];
                      final other = conv['otherUser'] ?? conv['participant'] ?? {};
                      final name = other['name'] ?? 'User';
                      final photo = other['profilePhoto'];
                      final lastMsg = conv['lastMessage'] ?? conv['lastMessageText'] ?? '';
                      final unread = conv['unreadCount'] ?? 0;
                      final chatId = conv['id']?.toString() ?? '';
                      return ListTile(
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => ChatScreen(chatId: chatId, otherName: name, otherPhoto: photo),
                          ));
                        },
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: Stack(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundImage: photo != null ? NetworkImage(photo) : null,
                              backgroundColor: const Color(0xFF4F46E5),
                              child: photo == null ? Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)) : null,
                            ),
                            if (unread > 0)
                              Positioned(
                                right: 0, top: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                  child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ),
                          ],
                        ),
                        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.grey[600])),
                        trailing: unread > 0
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: const Color(0xFF4F46E5), borderRadius: BorderRadius.circular(12)),
                                child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 12)),
                              )
                            : null,
                      );
                    },
                  ),
                ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  final String chatId;
  final String otherName;
  final String? otherPhoto;
  const ChatScreen({Key? key, required this.chatId, required this.otherName, this.otherPhoto}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  bool _isLoading = true;
  List<dynamic> _messages = [];
  String? _myId;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    try {
      final res = await apiService.client.get('/chat/conversations/${widget.chatId}/messages');
      setState(() {
        _messages = res.data is List ? res.data : [];
      });
      _scrollToBottom();
    } catch (_) {
      setState(() => _messages = []);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, 
          duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();
    setState(() {
      _messages.add({'content': text, 'isOwn': true, 'createdAt': DateTime.now().toIso8601String()});
    });
    _scrollToBottom();
    try {
      await apiService.client.post('/chat/conversations/${widget.chatId}/messages', data: {'content': text});
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: widget.otherPhoto != null ? NetworkImage(widget.otherPhoto!) : null,
              backgroundColor: const Color(0xFF4F46E5),
              child: widget.otherPhoto == null 
                ? Text(widget.otherName[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 14)) 
                : null,
            ),
            const SizedBox(width: 10),
            Text(widget.otherName, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadMessages),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(child: Text('No messages yet. Say hello! 👋'))
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final msg = _messages[i];
                          final isMe = msg['isOwn'] == true || msg['isMine'] == true;
                          final content = msg['content'] ?? msg['text'] ?? '';
                          return Align(
                            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                              decoration: BoxDecoration(
                                color: isMe ? const Color(0xFF4F46E5) : Colors.white,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(16),
                                  topRight: const Radius.circular(16),
                                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                                  bottomRight: Radius.circular(isMe ? 4 : 16),
                                ),
                                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
                              ),
                              child: Text(content, style: TextStyle(color: isMe ? Colors.white : Colors.black87, fontSize: 15)),
                            ),
                          );
                        },
                      ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, -2))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    onSubmitted: (_) => _sendMessage(),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(color: Color(0xFF4F46E5), shape: BoxShape.circle),
                    child: const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
