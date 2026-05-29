import PlanetList from "@/ui/hud/components/PlanetList";
import PlanetQuickSelect from "@/ui/hud/components/PlanetQuickSelect";

export default function HUDFrame() {
  return (
      <div className="absolute inset-0 z-10 h-full w-full pointer-events-none">

        {/* <PlanetList /> */}
        <PlanetQuickSelect />

      </div>
  )
}
