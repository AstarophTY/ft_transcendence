import SocialPanel from "@/ui/hud/SocialPanel.tsx";
import PlanetQuickSelect from "@/ui/hud/PlanetQuickSelect.tsx";
import EditorMode from "@/ui/hud/editor/EditorMode";
import AuthPanel from "@/ui/hud/AuthPanel"
import MobileVirtualControls from "@/ui/hud/MobileVirtualControls"
import TakeoffOverlay from "@/ui/hud/TakeoffOverlay"
import { usePlanetStore } from '@/store/planetStore'
import { useEditorStore } from '@/store/editorStore'

export default function HUDFrame() {
  const sceneMode = usePlanetStore(state => state.sceneMode);
  const editorMode = useEditorStore(state => state.in_editor);
  return (
    <>
       {sceneMode === 'selection' ? <PlanetQuickSelect /> : <></>}
        <SocialPanel />
        <AuthPanel />
        {editorMode ? <EditorMode /> : <></>}
        {sceneMode === 'world' && <MobileVirtualControls />}
        <TakeoffOverlay />
      </>
  )
}
