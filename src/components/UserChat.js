import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function UserChat({ user, friendId }) {

  // STATE
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);


  // FETCH OLD MESSAGES
  const fetchMessages = async () => {

    const { data, error } = await supabase
      .from('message')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
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

          const newMessage = payload.new;

          const isCurrent =
            (
              newMessage.sender_id === user.id &&
              newMessage.receiver_id === friendId
            )
            ||
            (
              newMessage.sender_id === friendId &&
              newMessage.receiver_id === user.id
            );

          if (isCurrent) {
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

  }, [friendId]);

  // SEND MESSAGE
  const sending = async (e) => {
  e.preventDefault();


  const { data, error } = await supabase
    .from('message')
    .insert({
      sender_id: user.id,
      receiver_id: friendId,
      content: newMessage
    });

    if (!error) {
      setNewMessage("");
    }

};

  return (

    <div className="screen">

      <button onClick={() => setIsOpen(true)}>
        ChatBox
      </button>

      {isOpen && (
        <div className="chat-screen">

         
         <div className="messages">

  {messages.map((msg) => {

    const isMe = msg.sender_id === user.id;
    console.log({
  sender: msg.sender_id,
  currentUser: user.id,
  receiver: msg.receiver_id,
  isMe: String(msg.sender_id) === String(user.id)
});


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
          {new Date(msg.created_at).toLocaleTimeString([], {
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


