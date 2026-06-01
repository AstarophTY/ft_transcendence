export type Tab = 'add' | 'remove' | 'search' | "";


export interface ToolBarProps {
  currentTool: Tab;
  updateCurrenTool: (name: Tab) => void;
}