import { createContext, useContext } from "react";
import { useSocket } from "../hooks/useSocket";


const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { socket, connected } = useSocket();

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  return useContext(SocketContext);
};