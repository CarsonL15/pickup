import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function GameChat({ user, game_id}) {

  // STATE
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);


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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_chat'
        },
        (payload) => {

          const newMessage = payload.new;

          
          if (newMessage.game_id === game_id) {
            setMessages((prev) => [
              ...prev,
              newMessage
            ]);
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

  const { data: dbUser, error: userError } = await supabase
  .from("app_user")
  .select("user_id, username")
  .eq("auth_id", user.id)
  .single();

  const { data, error } = await supabase
    .from("game_chat")
    .insert({
      game_id: game_id,
      user_id: dbUser.user_id,
      content: newMessage,
      username: dbUser.username,
    });

  console.log("DATA:", data);
  console.log("ERROR:", error);


  if (error) {
    console.log("Error sending message:", error);
    return;
  }

  setNewMessage("");
};

  return (

    <div className="screen">

        <div className= "center-container"> 

      <button onClick={() => setIsOpen(true)}>
        GameChat
      </button>

      </div>

      {isOpen && (
        <div className="chat-screen">

         
         <div className="messages">

        {messages.map((msg) => {

          const isMe = String(msg.user_id) === String(user.id);


    return (
      <div
        key={msg.id}
        className={
          isMe
            ? "user-message"
            : "friend-message"
        }
      >

        <p>{msg.content}</p>

        <p className="message-time">
          {new Date(msg.sent_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  })}

</div>

           <form
        onSubmit={sending}
        className="chat-input-container"
      >

        <input
          type="text"
          value={newMessage}
          onChange={(e) =>
            setNewMessage(e.target.value)
          }
          placeholder="Type a message..."
        />

        <button type="submit">
          Send
        </button>

      </form>


          <button onClick={() => setIsOpen(false)}>
            Close
          </button>

        </div>
      )}

     </div>

   );
 }


