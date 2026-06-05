export enum Tab {
  Search = "search",
  Add = "add",
  Lookup = "lookup",
  Remove = "remove",
  RotateX = "rotate_x",
  RotateY = "rotate_y",
  RotateZ = "rotate_z",
  None = ""
}

export enum Shape {
  Sphere = "sphere",
  Cube = "cube"
}

export interface ToolBarProps {
  currentTool: Tab;
  updateCurrenTool: (name: Tab) => void;
  currentShape: Shape;
  updateCurrentShape: () => void;
}