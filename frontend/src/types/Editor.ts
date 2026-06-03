export enum Tab {
  Search = "search",
  Add = "add",
  Remove = "remove",
  RotateX = "rotate_x",
  RotateY = "rotate_y",
  RotateZ = "rotate_z",
  None = ""
}
export interface ToolBarProps {
  currentTool: Tab;
  updateCurrenTool: (name: Tab) => void;
}