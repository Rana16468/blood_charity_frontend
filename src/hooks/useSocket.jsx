import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { getFromLocalStorage } from "../utils/LocalStore/LocalStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;



export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!SOCKET_URL) return;

    const token = getFromLocalStorage(import.meta.env.VITE_TOKEN_NAME);

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      query: {
        token: token || "",
      },
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);


    socketInstance.on("connect", () => {
      setConnected(true);
      
    });

    // ❌ disconnect
    socketInstance.on("disconnect", () => {
      setConnected(false);
      
    });

    // 📩 backend response
    socketInstance.on("connected", (data) => {
      console.log("📨", data);

      if (data.type === "authenticated") {
        console.log("🟢 Logged in user:", data.userId);
      } else {
        console.log("👤 Guest mode");
      }
    });

    // 🟢 user online
    socketInstance.on("user-online", (data) => {
      console.log("🟢 User online:", data.userId);
    });

    // 🔴 user offline
    socketInstance.on("user-offline", (data) => {
      console.log("🔴 User offline:", data.userId);
    });

    // ⚠️ error
    socketInstance.on("error", (err) => {
      console.log("❌ Socket error:", err?.message);
    });

    // cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, []); // ❗ run only once

  return {
    socket,
    connected,
  };
};