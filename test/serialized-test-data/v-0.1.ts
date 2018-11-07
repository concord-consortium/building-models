// Initial test data using inherited v 0.1 format
export const v01data = {
  version: 0.1,
  filename: "sample model",
  nodes: [
    {
      title: "Chicken",
      x: 200,
      y: 180,
      image: "img/nodes/chicken.png",
      key: "a"
    },
    {
        "title": "Egg",
        "x": 90,
        "y": 74,
        "image": "img/nodes/egg.png",
        "key": "b"
    },
  ],
  links:  [
    {
      title: "Becomes a",
      color: "#777",
      sourceNodeKey: "a",
      sourceTerminal: "a",
      targetNodeKey: "b",
      targetTerminal: "b"
    }
  ]
};
