import Cross from "@/components/hud/editor/Cross"
import ToolBar from "@/components/hud/editor/ToolBar"
import { SearchBlock } from "@/components/hud/editor/SearchBlock"
import { Tab, Shape } from "@/types/Editor"
import { useEditorStore } from '@/store/editorStore'
import { useHotkeys } from 'react-hotkeys-hook'

export default function EditorMode() {
  const currentTool = useEditorStore((state) => state.tool)
  const setCurrentTool = useEditorStore((state) => state.setTool)
  const currentShape = useEditorStore((state) => state.shape)
  const setCurrentShape = useEditorStore((state) => state.setShape)

  const changeTool = (tool: Tab) => {
    setCurrentTool(tool === currentTool ? Tab.None : tool)
  }
  const changeShape = () => {
    setCurrentShape(currentShape === Shape.Cube ? Shape.Sphere : Shape.Cube)
  }
  useHotkeys('1', () => changeShape())
  useHotkeys('2', () => changeTool(Tab.Add))
  useHotkeys('3', () => changeTool(Tab.Remove))
  useHotkeys('4', () => changeTool(Tab.RotateX))
  useHotkeys('5', () => changeTool(Tab.RotateY))
  useHotkeys('6', () => changeTool(Tab.RotateZ))
  useHotkeys('7', () => changeTool(Tab.Lookup))
  useHotkeys('escape', () => changeTool(Tab.None))

  return (
      <>
        <ToolBar updateCurrenTool={changeTool} currentTool={currentTool} updateCurrentShape={changeShape} currentShape={currentShape}/>
        <Cross />
        {currentTool === Tab.Add && (<SearchBlock />)}
    </>
  )
}
