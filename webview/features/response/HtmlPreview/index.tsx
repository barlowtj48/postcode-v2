import * as React from "react";
import * as propTypes from "prop-types";
import "./styles.css";

export const HtmlPreview = (props) => {
  const { data } = props;
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (iframeRef.current && data) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        if (iframe.contentDocument) {
          iframe.contentDocument.open();
          iframe.contentDocument.write(data);
          iframe.contentDocument.close();
        }
      };
      // Trigger the onload by setting src to about:blank first
      iframe.src = "about:blank";
    }
  }, [data]);

  return (
    <div className="html-preview">
      <iframe
        ref={iframeRef}
        title="HTML Preview"
        className="html-preview-iframe"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

HtmlPreview.propTypes = {
  data: propTypes.string.isRequired,
};
