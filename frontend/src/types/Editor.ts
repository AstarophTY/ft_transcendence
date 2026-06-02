export enum Tab {
  Search = "search",
  Add = "add",
  Remove = "remove",
  None = ""
}
export interface ToolBarProps {
  currentTool: Tab;
  updateCurrenTool: (name: Tab) => void;
}