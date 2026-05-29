const HUDFrame = () => {
  return (
      <div className="absolute inset-0 z-10 h-full w-full pointer-events-none flex flex-col justify-between p-6">

        { /* TODO: Fill Real Content */ }
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

export default HUDFrame