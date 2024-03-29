import { tr } from "../utils/translate";

export const initialPalette = [
  {
    "id": "1",
    "title": "",
    "image": "img/nodes/blank.png",
    "usesDefaultImage": true,
    "metadata": {
      "source": "internal",
      "title": tr("~METADATA.BLANK_NODE_TITLE"),
      "link": null,
      "license": "public domain"
    }
  },
  {
    "id": "flow-variable",
    "title": "",
    "image": "img/nodes/flow-variable.png",
    "usesDefaultImage": true,
    "metadata": {
      "source": "internal",
      "title": tr("~METADATA.FLOW_VARIABLE_NODE_TITLE"),
      "link": null,
      "license": "public domain"
    }
  },
  {
    "id": "collector",
    "title": "",
    "image": "img/nodes/collector.png",
    "usesDefaultImage": true,
    "metadata": {
      "source": "internal",
      "title": tr("~NODE-VALUE-EDIT.IS_ACCUMULATOR"),
      "link": null,
      "license": "public domain"
    }
  }
];
