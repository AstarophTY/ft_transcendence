import Cross from "@/components/hud/Cross"
import ToolBar from "@/components/hud/ToolBar"
import KeysEditor from "@/components/hud/KeysEditor"

export default function EditorMode() {
  return (
    <div className='absolute flex w-full h-full'>
        <KeysEditor />
        <ToolBar />
        <Cross />
    </div>
  )
}
