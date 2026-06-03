import Cross from "@/components/hud/editor/Cross"
import ToolBar from "@/components/hud/editor/ToolBar"
import { SearchBlock } from "@/components/hud/editor/SearchBlock"
import { Tab } from "@/types/Editor"
import { useEditorStore } from '@/store/editorStore'
import { useHotkeys } from 'react-hotkeys-hook'

export default function EditorMode() {
  const currentTool = useEditorStore((state) => state.tool)
  const setCurrentTool = useEditorStore((state) => state.setTool)

  const changeTool = (tool: Tab) => {
    setCurrentTool(tool === currentTool ? Tab.None : tool)
  }
  useHotkeys('1', () => changeTool(Tab.Add))
  useHotkeys('2', () => changeTool(Tab.Remove))
  useHotkeys('3', () => changeTool(Tab.RotateX))
  useHotkeys('4', () => changeTool(Tab.RotateY))
  useHotkeys('5', () => changeTool(Tab.RotateZ))
  useHotkeys('escape', () => changeTool(Tab.None))

  return (
      <>
        <ToolBar updateCurrenTool={changeTool} currentTool={currentTool} />
        <Cross />
        {currentTool === Tab.Add && (<SearchBlock />)}
    </>
  )
}
