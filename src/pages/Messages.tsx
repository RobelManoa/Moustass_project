import { useEffect, useState } from "react";
import { api } from "../api/api";
import VideoPlayer from "../components/VideoPlayer";

export default function Messages() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    api.get("/messages").then((res) => {
      setMessages(res.data);
    });
  }, []);

  return (
    <div>
      <h2>Mes messages</h2>

      {messages.map((msg) => (
        <div key={msg.id}>
          <p>ID: {msg.id}</p>
          <VideoPlayer url={msg.mediaUrl} />
        </div>
      ))}
    </div>
  );
}