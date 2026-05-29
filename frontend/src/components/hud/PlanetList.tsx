export default function PlanetList() {
  return (
    <div className="w-full flex flex-col justify-between p-6">
        <button
            className="
                pointer-events-auto
                cursor-pointer
                self-center
                rounded
                bg-gray-800 hover:bg-gray-700
                text-white
                px-6 py-2
                transition-all
            "
            onClick={() => console.log('Action triggered')}
        >
            Interactive Button
        </button>
    </div>
  )
}
