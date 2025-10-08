import * as React from "react";
import * as propTypes from "prop-types";
import "./styles.css";

export const JsonObjectBrowser = (props) => {
  const { data } = props;
  const [ReactJson, setReactJson] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("react-json-view")
      .then((module) => {
        setReactJson(() => module.default);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  // Parse JSON data
  const getParsedData = () => {
    try {
      return JSON.parse(data);
    } catch (error) {
      // If parsing fails, return an error object
      return {
        error: "Invalid JSON",
        message: "Could not parse the response as JSON",
        rawData: data,
      };
    }
  };

  if (isLoading) {
    return (
      <div className="json-object-browser">
        <div>Loading JSON viewer...</div>
      </div>
    );
  }

  if (!ReactJson) {
    return (
      <div className="json-object-browser">
        <div>Failed to load JSON viewer</div>
      </div>
    );
  }

  return (
    <div className="json-object-browser">
      <ReactJson
        src={getParsedData()}
        theme="monokai"
        name={false}
        displayDataTypes={false}
        displayObjectSize={true}
        enableClipboard={true}
        collapsed={1}
        collapseStringsAfterLength={100}
        iconStyle="triangle"
        style={{
          backgroundColor: "var(--background)",
          fontSize: "var(--default-font-size)",
          fontFamily: "var(--vscode-editor-font-family)",
          padding: "10px",
          borderRadius: "4px",
        }}
      />
    </div>
  );
};

JsonObjectBrowser.propTypes = {
  data: propTypes.string.isRequired,
};
