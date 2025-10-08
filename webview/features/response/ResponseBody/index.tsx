import * as React from "react";
import "./styles.css";
import { useAppSelector } from "../../../redux/hooks";
import { selectResponse } from "../responseSlice";
import * as propTypes from "prop-types";

const Editor = React.lazy(() => import("../../../shared/Editor"));

export const ResponseBody = (props) => {
  const { language } = props;
  const response = useAppSelector(selectResponse);

  // Function to check if content type indicates JSON
  const isJsonContentType = () => {
    if (!response.headers) return false;
    
    const contentTypeHeader = response.headers.find(
      header => header.key.toLowerCase() === 'content-type'
    );
    
    return contentTypeHeader?.value.toLowerCase().includes('application/json');
  };

  // Function to check if the data looks like JSON
  const looksLikeJson = (data: string) => {
    if (!data || data.trim().length === 0) return false;
    const trimmed = data.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  };

  // Function to prettify JSON data
  const getPrettifiedData = () => {
    const rawData = response.data || "";
    
    // Check if language is JSON, content type is JSON, or data looks like JSON
    if (language === 'json' || isJsonContentType() || looksLikeJson(rawData)) {
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

  return (
    <div className="response-window">
      <React.Suspense fallback={<div>loading</div>}>
        <Editor
          className="response-editor"
          value={getPrettifiedData()}
          language={language}
          readOnly
          copyButton
          format={false}
        />
      </React.Suspense>
    </div>
  );
};

ResponseBody.propTypes = {
  language: propTypes.string.isRequired,
};
