import * as React from "react";
import "./styles.css";
import { useAppSelector } from "../../../redux/hooks";
import { selectResponse, selectResponseViewMode } from "../responseSlice";
import * as propTypes from "prop-types";
import { JsonObjectBrowser } from "../JsonObjectBrowser";

const Editor = React.lazy(() => import("../../../shared/Editor"));

export const ResponseBody = (props) => {
  const { language } = props;
  const response = useAppSelector(selectResponse);
  const viewMode = useAppSelector(selectResponseViewMode);

  // Function to check if content type indicates JSON
  const isJsonContentType = () => {
    if (!response.headers) return false;

    const contentTypeHeader = response.headers.find(
      (header) => header.key.toLowerCase() === "content-type"
    );

    return contentTypeHeader?.value.toLowerCase().includes("application/json");
  };

  // Function to check if the data looks like JSON
  const looksLikeJson = (data: string) => {
    if (!data || data.trim().length === 0) return false;
    const trimmed = data.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  };

  // Function to get data based on view mode
  const getDisplayData = () => {
    const rawData = response.data || "";

    // If raw view mode, always return unformatted data
    if (viewMode === "raw") {
      return rawData;
    }

    // For pretty view mode, check if language is JSON, content type is JSON, or data looks like JSON
    if (language === "json" || isJsonContentType() || looksLikeJson(rawData)) {
      try {
        // Try to parse the JSON and format it
        const parsed = JSON.parse(rawData);
        return JSON.stringify(parsed, null, 2);
      } catch (error) {
        // If parsing fails, return the original data
        // This could happen if the data is not valid JSON
        return rawData;
      }
    }

    // For non-JSON content, return as-is
    return rawData;
  };

  // Check if we should show the object browser
  const showObjectBrowser =
    viewMode === "object" &&
    (language === "json" ||
      isJsonContentType() ||
      looksLikeJson(response.data || ""));

  return (
    <div className="response-window">
      {showObjectBrowser ? (
        <JsonObjectBrowser data={response.data || ""} />
      ) : (
        <React.Suspense fallback={<div>loading</div>}>
          <Editor
            className="response-editor"
            value={getDisplayData()}
            language={language}
            readOnly
            copyButton
            format={false}
          />
        </React.Suspense>
      )}
    </div>
  );
};

ResponseBody.propTypes = {
  language: propTypes.string.isRequired,
};
