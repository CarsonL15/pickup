import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function GameChat({ user, game_id, onClose }) {

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [myUserId, setMyUserId] = useState(null);

  // FETCH APP USER ID ONCE
  useEffect(() => {
    supabase
      .from("app_user")
      .select("user_id")
      .eq("auth_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setMyUserId(data.user_id);
      });
  }, [user.id]);

  // FETCH OLD MESSAGES
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('game_chat')
      .select('*')
      .eq("game_id", game_id)
      .order('sent_at', { ascending: true });

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
      .channel('public:game_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_chat' },
        (payload) => {
          const incoming = payload.new;
          if (incoming.game_id === game_id) {
            setMessages((prev) => [...prev, incoming]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game_id]);

  // SEND MESSAGE
  const sending = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { data: dbUser, error: userError } = await supabase
      .from("app_user")
      .select("user_id, username")
      .eq("auth_id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return;
    }

    const { error } = await supabase
      .from("game_chat")
      .insert({
        game_id: game_id,
        user_id: dbUser.user_id,
        content: newMessage,
        username: dbUser.username,
      });

    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    setNewMessage("");
  };

  return (
    <div className="screen">
      <div className="chat-screen">

        <div className="messages">
          {messages.map((msg) => {
            const isMe = msg.user_id === myUserId;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Bubble */}
                <div className={isMe ? "user-message" : "friend-message"}>
                  <p>{msg.content}</p>
                </div>

                {/* Username + time BELOW bubble */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {!isMe && (
                    <span className="message-sender">@{msg.username}</span>
                  )}
                  <span className="message-time">
                    {new Date(msg.sent_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={sending} className="chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>

        <button onClick={onClose}>Close</button>

      </div>
    </div>
  );
}