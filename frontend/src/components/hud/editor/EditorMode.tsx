import { useState } from "react"
import Cross from "@/components/hud/editor/Cross"
import ToolBar from "@/components/hud/editor/ToolBar"
import KeysEditor from "@/components/hud/editor/KeysEditor"
import { SearchBlock } from "@/components/hud/editor/SearchBlock"
import { Tab } from "@/types/Editor"

export default function EditorMode() {
  const [currentTool, setCurrentTool] = useState<Tab>("")
  
  const changeTool = (tool: Tab) => {
    setCurrentTool(tool === currentTool ? "" : tool)
  }

  return (
      <>
        <KeysEditor />
        <ToolBar updateCurrenTool={changeTool} currentTool={currentTool} />
        <Cross />
        {currentTool === "search" && (
          <div className="absolute top-16 right-16 w-[400px] h-[500px] z-50">
            <SearchBlock />
          </div>
        )}
    </>
  )
}
