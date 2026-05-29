import PlanetQuickSelect from "@/ui/hud/components/PlanetQuickSelect";
import SocialPanel from "@/ui/hud/components/SocialPanel";

export default function HUDFrame() {
  return (
      <div className="absolute inset-0 z-10 h-full w-full pointer-events-none">
        
        <SocialPanel />

        <PlanetQuickSelect />

      </div>
  )
}
