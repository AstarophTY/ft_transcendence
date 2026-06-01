import PlanetQuickSelect from "@/components/hud/PlanetQuickSelect";
import SocialPanel from "@/components/hud/SocialPanel";
import EditorMode from "@/components/hud/EditorMode";
import AuthPanel from "@/ui/hud/AuthPanel"

export default function HUDFrame() {
  return (
      <div className="absolute inset-0 z-10 h-full w-full pointer-events-none">
        <SocialPanel />
        {/* <AuthPanel /> */}
        <EditorMode />
        <PlanetQuickSelect />
      </div>
  )
}
