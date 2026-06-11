import SocialPanel from "@/ui/hud/SocialPanel.tsx";
import PlanetQuickSelect from "@/ui/hud/PlanetQuickSelect.tsx";
import EditorMode from "@/ui/hud/editor/EditorMode";
import AuthPanel from "@/ui/hud/AuthPanel"
import MobileVirtualControls from "@/ui/hud/MobileVirtualControls"
import TakeoffOverlay from "@/ui/hud/TakeoffOverlay"
import TutorialOverlay from "@/ui/hud/TutorialOverlay"
import { usePlanetStore } from '@/store/planetStore'
import { useEditorStore } from '@/store/editorStore'
import { useAuth } from '@/store/auth'

export default function HUDFrame() {
  const sceneMode = usePlanetStore(state => state.sceneMode);
  const editorMode = useEditorStore(state => state.in_editor);
  const showTutorial = usePlanetStore(state => state.showTutorial);
  const setShowTutorial = usePlanetStore(state => state.setShowTutorial);
  const user = useAuth(state => state.user);

  return (
    <>
       {sceneMode === 'selection' ? <PlanetQuickSelect /> : <></>}
        <SocialPanel />
        <AuthPanel />
        {editorMode ? <EditorMode /> : <></>}
        {sceneMode === 'world' && <MobileVirtualControls />}
        <TakeoffOverlay />
        {user && showTutorial && (
          <TutorialOverlay
            onClose={() => {
              localStorage.setItem('ft_has_seen_tutorial', 'true')
              setShowTutorial(false)
            }}
          />
        )}
      </>
  )
}
