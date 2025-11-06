import PropTypes from "prop-types";
import NavigateConfigFields from "./NavigateConfigFields.jsx";
import ScrollConfigFields from "./ScrollConfigFields.jsx";
import ClickConfigFields from "./ClickConfigFields.jsx";
import FillConfigFields from "./FillConfigFields.jsx";
import PressConfigFields from "./PressConfigFields.jsx";
import LogConfigFields from "./LogConfigFields.jsx";
import ScriptConfigFields from "./ScriptConfigFields.jsx";
import ExtractTextConfigFields from "./ExtractTextConfigFields.jsx";
import FallbackConfigFields from "./FallbackConfigFields.jsx";
import { getDefaultConfig } from "../utils/workflowBuilder.js";

const COMPONENT_BY_TYPE = {
  navigate: NavigateConfigFields,
  scroll: ScrollConfigFields,
  click: ClickConfigFields,
  fill: FillConfigFields,
  press: PressConfigFields,
  log: LogConfigFields,
  script: ScriptConfigFields,
  extract_text: ExtractTextConfigFields,
};

export default function NodeConfigFields({ type, config, onChange }) {
  const Component = COMPONENT_BY_TYPE[type] || FallbackConfigFields;
  const resolvedConfig = config && typeof config === "object" ? config : getDefaultConfig(type);

  if (Component === FallbackConfigFields) {
    return <FallbackConfigFields />;
  }

  return <Component config={resolvedConfig} onChange={onChange} />;
}

NodeConfigFields.propTypes = {
  type: PropTypes.string.isRequired,
  config: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

NodeConfigFields.defaultProps = {
  config: null,
};
