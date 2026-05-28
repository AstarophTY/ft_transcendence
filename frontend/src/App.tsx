import HUDFrame from './hud/HUDFrame'
import SceneFrame from './three/SceneFrame'

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SceneFrame />
      <HUDFrame />
    </div>
  )
}

export default App
