import * as React from "react";
import * as propTypes from "prop-types";
import "./styles.css";

// Convert XML DOM to JavaScript object (moved outside component to prevent re-creation)
const xmlToObject = (element) => {
  const obj = {};
  // Add attributes
  if (element.attributes && element.attributes.length > 0) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      obj[`@${attr.name}`] = attr.value;
    }
  }
  // Process child nodes
  const children = Array.from(element.childNodes);
  const textNodes = children.filter(
    (node) => (node as Node).nodeType === Node.TEXT_NODE
  ) as Text[];
  const elementNodes = children.filter(
    (node) => (node as Node).nodeType === Node.ELEMENT_NODE
  ) as Element[];
  // Handle text content
  const textContent = textNodes
    .map((node) => (node.textContent || "").trim())
    .filter((text) => text)
    .join(" ");
  if (textContent && elementNodes.length === 0) {
    obj["#text"] = textContent;
  }
  // Handle child elements
  elementNodes.forEach((child) => {
    const childName = child.tagName;
    const childObj = xmlToObject(child);
    if (obj[childName]) {
      // Convert to array if multiple elements with same name
      if (!Array.isArray(obj[childName])) {
        obj[childName] = [obj[childName]];
      }
      obj[childName].push(childObj);
    } else {
      obj[childName] = childObj;
    }
  });
  // If object only has text content and no attributes, return the text directly
  if (Object.keys(obj).length === 1 && obj["#text"] !== undefined) {
    return obj["#text"];
  }
  return obj;
};

// Component for rendering collapsible XML objects
const XmlObjectNode = ({ node, level = 0 }) => {
  const entries = Object.entries(node);
  const [isCollapsed, setIsCollapsed] = React.useState(level > 2);

  return (
    <div className="xml-object" style={{ marginLeft: `${level * 20}px` }}>
      <div
        className="xml-object-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span
          className={`xml-collapse-icon ${
            isCollapsed ? "collapsed" : "expanded"
          }`}
        >
          {isCollapsed ? "▶" : "▼"}
        </span>
        <span className="xml-brace">{"{"}</span>
        {isCollapsed && (
          <span className="xml-object-summary">
            {entries.length} {entries.length === 1 ? "property" : "properties"}
          </span>
        )}
      </div>
      {!isCollapsed && (
        <div className="xml-object-content">
          {entries.map(([key, value]) => (
            <div key={key} className="xml-property">
              <span className="xml-property-key">
                {key.startsWith("@") ? (
                  <span className="xml-attribute-key">{key.substring(1)}:</span>
                ) : (
                  <span className="xml-element-key">{key}:</span>
                )}
              </span>
              <span className="xml-property-value">
                <XmlNodeRenderer node={value} level={level + 1} />
              </span>
            </div>
          ))}
        </div>
      )}
      {!isCollapsed && <span className="xml-brace">{"}"}</span>}
    </div>
  );
};

// Safe renderer that doesn't use hooks in recursive calls
const XmlNodeRenderer = ({ node, level = 0 }) => {
  if (node === null || node === undefined) {
    return <span className="xml-null-value">null</span>;
  }

  if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "boolean"
  ) {
    return <span className={`xml-${typeof node}-value`}>{String(node)}</span>;
  }

  if (Array.isArray(node)) {
    return (
      <div className="xml-array" style={{ marginLeft: `${level * 20}px` }}>
        <span className="xml-bracket">[</span>
        {node.map((item, index) => (
          <div key={index} className="xml-array-item">
            <span className="xml-array-index">{index}:</span>
            <XmlNodeRenderer node={item} level={level + 1} />
          </div>
        ))}
        <span className="xml-bracket">]</span>
      </div>
    );
  }

  if (typeof node === "object") {
    return <XmlObjectNode node={node} level={level} />;
  }

  return <span>Unknown type</span>;
};

export const XmlObjectBrowser = (props) => {
  const { data } = props;
  const [parsedData, setParsedData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!data || data.trim() === "") {
      setError("No XML data provided");
      setParsedData(null);
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML parsing failed: " + parserError.textContent);
      }

      if (!xmlDoc.documentElement) {
        throw new Error("No root element found");
      }

      const result = xmlToObject(xmlDoc.documentElement);
      setParsedData(result);
      setError(null);
    } catch (err) {
      console.error("XML parsing error:", err);
      setError("Invalid XML: " + err.message);
      setParsedData(null);
    }
  }, [data]);

  if (error) {
    return (
      <div className="xml-object-browser">
        <div className="xml-error">
          <h4>XML Parse Error</h4>
          <p>{error}</p>
          <details>
            <summary>Raw XML Data</summary>
            <pre className="xml-raw-data">{data}</pre>
          </details>
        </div>
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div className="xml-object-browser">
        <div>Loading XML parser...</div>
      </div>
    );
  }

  return (
    <div className="xml-object-browser">
      <div className="xml-root">
        <XmlNodeRenderer node={parsedData} level={0} />
      </div>
    </div>
  );
};

XmlObjectNode.propTypes = {
  node: propTypes.object.isRequired,
  level: propTypes.number,
};

XmlNodeRenderer.propTypes = {
  node: propTypes.any.isRequired,
  level: propTypes.number,
};

XmlObjectBrowser.propTypes = {
  data: propTypes.string.isRequired,
};
