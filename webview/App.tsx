import * as React from "react";
import "./App.css";
import { responseUpdated } from "./features/response/responseSlice";
import { requestMethodUpdated } from "./features/requestMethod/requestMethodSlice";
import { requestUrlStateLoaded } from "./features/requestUrl/requestUrlSlice";
import { requestBodyStateLoaded } from "./features/requestBody/requestBodySlice";
import { requestAuthStateLoaded } from "./features/requestAuth/requestAuthSlice";
import { requestHeaderStateLoaded } from "./features/requestHeader/requestHeaderSlice";
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
        // Update URL and query params
        dispatch(
          requestUrlStateLoaded({
            url: request.url,
            queryParams: request.queryParams || [],
          })
        );
        // Update headers
        if (request.headers) {
          dispatch(requestHeaderStateLoaded(request.headers));
        }
        // Update body
        if (request.body) {
          dispatch(requestBodyStateLoaded(request.body));
        }
        // Update auth
        if (request.auth) {
          dispatch(requestAuthStateLoaded(request.auth));
        }
      } else if (event.data.type === "load-credentials") {
        // Load credentials from secure storage
        const credentials = event.data.credentials;
        if (credentials) {
          dispatch(requestAuthStateLoaded(credentials));
        }
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
