import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // To generate unique IDs

const VisitorMonitoring = () => {
  const visitorKey = "visitorId"; // Key for storing the visitor ID in localStorage

  useEffect(() => {
    // Check if a visitor ID already exists in localStorage
    let visitorId = localStorage.getItem(visitorKey);

    if (!visitorId) {
      // Generate a new visitor ID if it doesn't exist
      visitorId = uuidv4();
      localStorage.setItem(visitorKey, visitorId);
      console.log("New Visitor ID Generated:", visitorId);
    } else {
      console.log("Existing Visitor ID:", visitorId);
    }

    // Function to handle when the tab is closed
    const handleTabClose = () => {
      // Only remove visitorId if the sessionStorage flag indicates tab is fully closed
      if (!sessionStorage.getItem("isReloading")) {
        localStorage.removeItem(visitorKey); // Remove visitor ID from localStorage
        console.log("Visitor ID removed on tab close");
      }
    };

    // Handle page reload
    const handleBeforeUnload = () => {
      sessionStorage.setItem("isReloading", "true");
    };

    // Handle page load (clear sessionStorage)
    const handleLoad = () => {
      sessionStorage.removeItem("isReloading");
    };

    // Attach the beforeunload event to detect when the page is reloading
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Attach the unload event to detect when the tab is fully closed
    window.addEventListener("unload", handleTabClose);

    // Attach load event to clear sessionStorage after a page reload
    window.addEventListener("load", handleLoad);

    // Cleanup the event listeners when the component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleTabClose);
      window.removeEventListener("load", handleLoad);
    };
  }, [visitorKey]);

  return (
    <div>
      <h1>Monitoring User Visits</h1>
      <p>Your visit is being tracked with a unique Visitor ID.</p>
    </div>
  );
};

export default VisitorMonitoring;
