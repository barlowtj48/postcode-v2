import * as React from "react";
import "./App.css";
import { responseUpdated } from "./features/response/responseSlice";
import { requestMethodUpdated } from "./features/requestMethod/requestMethodSlice";
import { requestUrlUpdated } from "./features/requestUrl/requestUrlSlice";
import { Postcode } from "./pages/Postcode";
import { useAppDispatch } from "./redux/hooks";
import vscode from "./vscode";

const App = () => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    // Send ready message to extension
    if (vscode) {
      vscode.postMessage({ type: "webview-ready" });
    }

    window.addEventListener("message", (event) => {
      if (event.data.type === "response") {
        dispatch(responseUpdated(event.data));
      } else if (event.data.type === "load-request") {
        // Load a saved request into the current state
        const request = event.data.request;
        // Update method
        dispatch(requestMethodUpdated(request.method));
        // Update URL
        dispatch(requestUrlUpdated(request.url));
        // TODO: Add more request loading logic for headers, body, auth, etc.
        // For now, we'll load the basic method and URL
      }
    });
  }, [dispatch]);

  return (
    <div className="App">
      <Postcode />
    </div>
  );
};

export default App;
