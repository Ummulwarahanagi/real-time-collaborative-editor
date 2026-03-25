import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;

export const connectWebSocket = (onMessage) => {
  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 2000,
    onConnect: () => {
      console.log("Connected to WebSocket");

      client.subscribe("/topic/document", (message) => {
        const data = JSON.parse(message.body);
        onMessage(data);
      });
    },
  });

  client.activate();
};

export const sendMessage = (message) => {
  if (client && client.connected) {
    client.publish({
      destination: "/app/edit",
      body: JSON.stringify(message),
    });
  }
};