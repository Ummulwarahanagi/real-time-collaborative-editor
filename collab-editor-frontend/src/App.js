import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function App() {
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("Connecting...");

  const clientRef = useRef(null);
  const isRemote = useRef(false);
  const saveTimeout = useRef(null);
  const sendTimeout = useRef(null); // ✅ NEW

  const userId = useRef("User_" + Math.floor(Math.random() * 1000));

  const loadDocument = () => {
    fetch("http://localhost:8080/document/MAIN_DOC")
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent(data.content);
      })
      .catch(() => {
        setStatus("⚠️ Cannot load document");
      });
  };

  useEffect(() => {

    const handleOffline = () => {
      setStatus("🔴 No Internet Connection");
    };

    const handleOnline = () => {
      setStatus("🟡 Internet Restored. Reconnecting...");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 3000,

      onConnect: () => {
        setStatus("🟢 Connected");

        loadDocument();
        isRemote.current = false;
        client.publish({
          destination: "/app/join",
          body: JSON.stringify({
            userId: userId.current,
          }),
        });

        client.subscribe("/topic/document", (msg) => {
          const data = JSON.parse(msg.body);

          isRemote.current = true;
          setContent(data.content);
        });

        client.subscribe("/topic/users", (msg) => {
          setUsers(JSON.parse(msg.body));
        });
      },

      onDisconnect: () => {
        setStatus("🔴 Disconnected. Reconnecting...");
      },

      onStompError: () => {
        setStatus("⚠️ Server error. Reconnecting...");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };

  }, []);

  const handleChange = (value) => {

    setContent(value);

    if (isRemote.current) {
      isRemote.current = false;
      return;
    }

    // ✅ THROTTLED REAL-TIME SYNC (NEW)
    if (sendTimeout.current) {
      clearTimeout(sendTimeout.current);
    }

    sendTimeout.current = setTimeout(() => {
      clientRef.current.publish({
        destination: "/app/edit",
        body: JSON.stringify({
          content: value,
        }),
      });
    }, 200);

    // 🔥 DEBOUNCED SAVE (UNCHANGED)
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      fetch("http://localhost:8080/document/MAIN_DOC", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "MAIN_DOC",
          content: value,
        }),
      });
    }, 1000);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 3, padding: "20px" }}>
        <h2>📝 Collaborative Editor</h2>
        <p>Logged in as: {userId.current}</p>

        <p>{status}</p>

        <ReactQuill value={content} onChange={handleChange} />
      </div>

      <div style={{ flex: 1, borderLeft: "1px solid #ccc", padding: "20px" }}>
        <h3>👥 Active Users</h3>

        {users.map((user, index) => (
          <div
            key={index}
            style={{
              backgroundColor: user.color,
              color: "white",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "5px",
            }}
          >
            {user.userId}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;