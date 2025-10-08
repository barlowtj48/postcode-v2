import * as React from "react";
import "./styles.css";
import * as propTypes from "prop-types";
import { responseOptions } from "../../../constants/response-options";
import {
  responseViews,
  htmlResponseViews,
  xmlResponseViews,
} from "../../../constants/response-views";
import { supportedLangs } from "../../../constants/supported-langs";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  selectResponse,
  selectResponseViewMode,
  viewModeUpdated,
} from "../responseSlice";

const ResponseInfo = ({ responseTitle, info }) => {
  return (
    <>
      <div>{responseTitle}</div>
      <div className="text-response-info">{info}</div>
    </>
  );
};

export const ResponseTab = (props) => {
  const { selected, setSelected, language, setLanguage } = props;
  const response = useAppSelector(selectResponse);
  const viewMode = useAppSelector(selectResponseViewMode);
  const dispatch = useAppDispatch();

  // Check if the response is JSON
  const isJsonResponse = () => {
    if (language === "json") return true;
    if (!response.headers) return false;

    const contentTypeHeader = response.headers.find(
      (header) => header.key.toLowerCase() === "content-type"
    );

    return contentTypeHeader?.value.toLowerCase().includes("application/json");
  };

  // Check if the response is HTML
  const isHtmlResponse = () => {
    if (language === "html") return true;
    if (!response.headers) return false;

    const contentTypeHeader = response.headers.find(
      (header) => header.key.toLowerCase() === "content-type"
    );

    return contentTypeHeader?.value.toLowerCase().includes("text/html");
  };

  // Check if the response is XML
  const isXmlResponse = () => {
    if (language === "xml") return true;
    if (!response.headers) return false;

    const contentTypeHeader = response.headers.find(
      (header) => header.key.toLowerCase() === "content-type"
    );

    const contentType = contentTypeHeader?.value.toLowerCase() || "";
    return (
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      contentType.includes("+xml")
    );
  };

  // Check if the data looks like JSON
  const looksLikeJson = (data: string) => {
    if (!data || data.trim().length === 0) return false;
    const trimmed = data.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  };

  const isJsonContent = isJsonResponse() || looksLikeJson(response.data || "");
  const isHtmlContent = isHtmlResponse();
  const isXmlContent = isXmlResponse();

  // Explicitly exclude text language from view mode options
  const showViewModeToggle =
    selected === "body" &&
    language !== "text" &&
    (isJsonContent || isHtmlContent || isXmlContent);

  // Get the appropriate view options based on content type
  const getViewOptions = () => {
    if (isHtmlContent) {
      return htmlResponseViews;
    }
    if (isXmlContent) {
      return xmlResponseViews;
    }
    return responseViews;
  };

  return (
    <div className="response-options-tab-wrapper">
      <div className="response-options">
        {responseOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={
              selected === option.value
                ? "response-option response-option-selected"
                : "response-option"
            }
          >
            {option.name}
          </button>
        ))}
        {selected === "body" ? (
          <select
            onChange={(e) => setLanguage(e.target.value)}
            className="select-res-lang"
            value={language}
          >
            {supportedLangs.map((type) => (
              <option key={type.value} value={type.value}>
                {type.name}
              </option>
            ))}
          </select>
        ) : null}
        {showViewModeToggle ? (
          <select
            onChange={(e) => dispatch(viewModeUpdated(e.target.value))}
            className="select-res-lang"
            value={viewMode}
          >
            {getViewOptions().map((view) => (
              <option key={view.value} value={view.value}>
                {view.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="response-status">
        <ResponseInfo
          responseTitle="Status:"
          info={`${response.status} ${response.statusText}`}
        />
        <ResponseInfo
          responseTitle="Duration:"
          info={`${response.duration} ms`}
        />
      </div>
    </div>
  );
};

ResponseInfo.propTypes = {
  responseTitle: propTypes.string.isRequired,
  info: propTypes.string.isRequired,
};

ResponseTab.propTypes = {
  selected: propTypes.string.isRequired,
  setSelected: propTypes.func.isRequired,
  language: propTypes.string.isRequired,
  setLanguage: propTypes.func.isRequired,
};
