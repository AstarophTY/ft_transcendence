import SocialPanel from "@/components/hud/SocialPanel";
import PlanetQuickSelect from "@/components/hud/PlanetQuickSelect";
import EditorMode from "@/components/hud/editor/EditorMode";
import AuthPanel from "@/ui/hud/AuthPanel"
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
      </>
  )
}
