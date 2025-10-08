import * as React from "react";
import "./styles.css";
import { useAppSelector } from "../../../redux/hooks";
import { selectResponse, selectResponseViewMode } from "../responseSlice";
import * as propTypes from "prop-types";
import { JsonObjectBrowser } from "../JsonObjectBrowser";
import { HtmlPreview } from "../HtmlPreview";
import { XmlObjectBrowser } from "../XmlObjectBrowser";

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

  // Function to check if content type indicates HTML
  const isHtmlContentType = () => {
    if (!response.headers) return false;

    const contentTypeHeader = response.headers.find(
      (header) => header.key.toLowerCase() === "content-type"
    );

    return contentTypeHeader?.value.toLowerCase().includes("text/html");
  };

  // Function to check if content type indicates XML
  const isXmlContentType = () => {
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

  // Function to check if the data looks like JSON
  const looksLikeJson = (data: string) => {
    if (!data || data.trim().length === 0) return false;
    const trimmed = data.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  };

  // Function to format XML string
  const formatXml = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        return xmlString; // Return original if parsing fails
      }
      // Simple XML formatting function
      const formatXmlNode = (node: Node, indent = 0): string => {
        const indentStr = "  ".repeat(indent);
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() || "";
          return text ? text : "";
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName;
          let result = `${indentStr}<${tagName}`;
          // Add attributes
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            result += ` ${attr.name}="${attr.value}"`;
          }
          const children = Array.from(element.childNodes);
          const hasElementChildren = children.some(
            (child) => child.nodeType === Node.ELEMENT_NODE
          );
          const textContent = children
            .filter((child) => child.nodeType === Node.TEXT_NODE)
            .map((child) => child.textContent?.trim())
            .filter((text) => text)
            .join("");
          if (children.length === 0) {
            result += " />";
          } else if (!hasElementChildren && textContent) {
            result += `>${textContent}</${tagName}>`;
          } else {
            result += ">\n";
            children.forEach((child) => {
              const childFormatted = formatXmlNode(child, indent + 1);
              if (childFormatted.trim()) {
                result += childFormatted + "\n";
              }
            });
            result += `${indentStr}</${tagName}>`;
          }
          return result;
        }
        return "";
      };
      return formatXmlNode(xmlDoc.documentElement);
    } catch (error) {
      return xmlString; // Return original on any error
    }
  };

  // Function to get data based on view mode
  const getDisplayData = () => {
    const rawData = response.data || "";

    // If raw view mode, always return unformatted data
    if (viewMode === "raw") {
      return rawData;
    }

    // For pretty view mode, check content type and format accordingly
    if (language === "json" || isJsonContentType() || looksLikeJson(rawData)) {
      try {
        // Try to parse the JSON and format it
        const parsed = JSON.parse(rawData);
        return JSON.stringify(parsed, null, 2);
      } catch (error) {
        // If parsing fails, return the original data
        return rawData;
      }
    }
    // For XML content, format it
    if (language === "xml" || isXmlContentType()) {
      return formatXml(rawData);
    }

    // For non-JSON/XML content, return as-is
    return rawData;
  };

  // Check if we should show the object browser
  const showObjectBrowser =
    viewMode === "object" &&
    (language === "json" ||
      isJsonContentType() ||
      looksLikeJson(response.data || ""));

  // Check if we should show the HTML preview
  const showHtmlPreview =
    viewMode === "preview" && (language === "html" || isHtmlContentType());

  // Check if we should show the XML object browser
  const showXmlObjectBrowser =
    viewMode === "object" && (language === "xml" || isXmlContentType());

  return (
    <div className="response-window">
      {showObjectBrowser ? (
        <JsonObjectBrowser data={response.data || ""} />
      ) : showHtmlPreview ? (
        <HtmlPreview data={response.data || ""} />
      ) : showXmlObjectBrowser ? (
        <XmlObjectBrowser data={response.data || ""} />
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
