import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./router/router";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./components/redux/store";

import { SocketProvider } from "./router/SocketProvider";
import BloodRequestNotifications from "./components/Location/notification/BloodRequestNotifications";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          
          <BloodRequestNotifications />

          <RouterProvider router={router} />

          <Toaster position="top-center" toastOptions={{ duration: 1500 }} />

        </SocketProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;