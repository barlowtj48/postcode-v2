import * as React from "react";
import { Url } from "postman-collection";
import { FaSave } from "react-icons/fa";
import vscode from "../../vscode";
import { RequestMethodSelector } from "../../features/requestMethod/RequestMethodSelector";
import { RequestUrl } from "../../features/requestUrl/RequestUrl";
import { responseLoadingStarted } from "../../features/response/responseSlice";
import { selectRequestAuth } from "../../features/requestAuth/requestAuthSlice";
import { selectRequestBody } from "../../features/requestBody/requestBodySlice";
import { selectRequestHeaders } from "../../features/requestHeader/requestHeaderSlice";
import { selectRequestUrl } from "../../features/requestUrl/requestUrlSlice";
import { selectRequestMethod } from "../../features/requestMethod/requestMethodSlice";
import { selectRequestOptions } from "../../features/requestOptions/requestOptionsSlice";
import { selectRequestQueryParams } from "../../features/requestUrl/requestUrlSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

import "./styles.css";

export const RequestBar = () => {
  const dispatch = useAppDispatch();

  const requestMethod = useAppSelector(selectRequestMethod);
  const requestHeaders = useAppSelector(selectRequestHeaders);
  const requestBody = useAppSelector(selectRequestBody);
  const requestUrl = useAppSelector(selectRequestUrl);
  const requestAuth = useAppSelector(selectRequestAuth);
  const requestOptions = useAppSelector(selectRequestOptions);
  const requestQueryParams = useAppSelector(selectRequestQueryParams);

  // Create current request object for saving
  const currentRequest = React.useMemo(
    () => ({
      name: "", // Will be set when saving
      method: requestMethod,
      url: requestUrl,
      headers: requestHeaders,
      body: requestBody,
      auth: requestAuth,
      queryParams: requestQueryParams,
    }),
    [
      requestMethod,
      requestUrl,
      requestHeaders,
      requestBody,
      requestAuth,
      requestQueryParams,
    ]
  );

  const handleSaveRequest = () => {
    // Send save request message to VS Code extension
    vscode.postMessage({
      type: "save-request",
      requestData: currentRequest,
    });
  };

  return (
    <>
      <form
        className="request-bar"
        onSubmit={(e) => {
          dispatch(responseLoadingStarted());
          const { protocol } = Url.parse(requestUrl);
          vscode.postMessage({
            method: requestMethod,
            auth: requestAuth,
            body: requestBody,
            headers: requestHeaders,
            url: protocol ? requestUrl : `http://${requestUrl}`,
            options: requestOptions,
          });
          e.preventDefault();
        }}
      >
        <RequestMethodSelector />
        <RequestUrl />
        <button
          type="button"
          className="button-save"
          onClick={handleSaveRequest}
          title="Save Request"
        >
          <FaSave />
        </button>
        <button
          name="request-send"
          id="request-send"
          type="submit"
          className="button-request-send"
        >
          Send
        </button>
      </form>
    </>
  );
};
