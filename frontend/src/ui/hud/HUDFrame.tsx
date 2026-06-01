import PlanetQuickSelect from "@/components/hud/PlanetQuickSelect";
import SocialPanel from "@/components/hud/SocialPanel";
import EditorMode from "@/components/hud/editor/EditorMode";
// import AuthPanel from "@/ui/hud/AuthPanel"

export default function HUDFrame() {
  return (
    <>
        <SocialPanel />
        {/* <AuthPanel /> */}
        <EditorMode />
        <PlanetQuickSelect />
      </>
  )
}
