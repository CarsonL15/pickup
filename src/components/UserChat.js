import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function UserChat({ myUserId, friendId, onClose }) {

  // STATE
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");


  // FETCH OLD MESSAGES
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('message')
      .select('*')
      .or(
        `and(sender_id.eq.${myUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${myUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setMessages(data);
  };

  // REALTIME SUBSCRIPTION
  useEffect(() => {

    fetchMessages();

    const channel = supabase
      .channel('public:message')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message'
        },
        (payload) => {
          const incoming = payload.new;

          const isCurrent =
            (incoming.sender_id === myUserId && incoming.receiver_id === friendId) ||
            (incoming.sender_id === friendId && incoming.receiver_id === myUserId);

          if (isCurrent) {
            setMessages((prev) => [...prev, incoming]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [friendId, myUserId]);

  // SEND MESSAGE
  const sending = async (e) => {
  e.preventDefault();
  if (!newMessage.trim()) return;

  console.log('[UserChat] attempting send:', {
    sender_id: myUserId,
    receiver_id: friendId,
    content: newMessage,
  });

  const { data, error } = await supabase
    .from('message')
    .insert({
      sender_id: myUserId,
      receiver_id: friendId,
      content: newMessage,
    })
    .select(); 

  if (!error) {
    setNewMessage("");
  }
};

  return (
    <div className="chat-overlay friend-chat-overlay" onClick={onClose}>
      <div className="chat-screen friend-chat-screen" onClick={(e) => e.stopPropagation()}>
        <div className="friend-chat-header">
          <span>FRIEND CHAT</span>
          <button className="friend-chat-close" type="button" onClick={onClose} aria-label="Close chat">×</button>
        </div>

        <div className="messages friend-chat-messages">
          {messages.map((msg) => {
            const isMe = msg.sender_id === myUserId;

            return (
              <div
                key={msg.id}
                className={`friend-chat-row ${isMe ? "is-me" : "is-friend"}`}
              >
                <div className={isMe ? "user-message" : "friend-message"}>
                  <p>{msg.content}</p>
                </div>

                <div className="friend-chat-meta">
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={sending} className="chat-input-container friend-chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">SEND</button>
        </form>

      </div>
    </div>
  );
}

