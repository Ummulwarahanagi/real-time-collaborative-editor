Real-Time Collaborative Editor

 Overview

This project is a Real-Time Collaborative Editing application that allows multiple users to edit the same document simultaneously, similar to Google Docs.

It uses WebSockets for real-time communication between clients and the server.

---

 Features

* Real-time collaborative editing
* Active users display with unique colors
* Automatic reconnection handling
* Document persistence using database
* Smooth editing with throttled updates

---

Tech Stack

Frontend

* ReactJS
* React Quill Editor
* SockJS & STOMP

Backend

* Spring Boot
* WebSocket (STOMP)

Database

* MongoDB

---

How to Run the Project

1. Start MongoDB(Database)

```bash
mongod
```

 2. Run Backend

```bash
run the EditorApplication.java
```

3. Run Frontend

```bash
cd frontend
npm install
npm start
```

---

WebSocket Setup Instructions

Backend

* WebSocket endpoint: `/ws`
* Users send messages to:

  * `/app/join` → when a user joins
  * `/app/edit` → when content is updated
* Server broadcasts updates to:

  * `/topic/document` → for real-time document updates
  * `/topic/users` → for active users list

---
Frontend

* Connection is established using SockJS and STOMP:

```javascript
const client = new Client({
  webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
});
```

* Sending updates:

```javascript
client.publish({
  destination: "/app/edit",
  body: JSON.stringify({ content: value }),
});
```

* Receiving updates:

```javascript
client.subscribe("/topic/document", callback);
client.subscribe("/topic/users", callback);
```

---

Working

1. User opens the editor and connects to WebSocket
2. User joins using `/app/join`
3. When user types, content is sent to `/app/edit`
4. Server broadcasts updated content to all users
5. All users see changes instantly

Performance Optimizations

* Throttling applied to reduce network load
* Reduced database writes for better efficiency

---

Architecture

The system follows a client-server architecture:

Frontend (React):
Handles UI and user interactions.
WebSocket Layer:
Maintains real-time communication using STOMP protocol.
Backend (Spring Boot):
Processes incoming edits and broadcasts updates.
Database (MongoDB):
Stores the latest document state.
Flow:

Client → WebSocket → Server → Broadcast → All Clients
---

Conclusion

This project demonstrates real-time communication using WebSockets and provides a collaborative editing environment.
