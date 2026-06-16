import * as React from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mqlPortrait = window.matchMedia("(max-width: 767px)")
    const mqlLandscape = window.matchMedia("(max-width: 1023px) and (orientation: landscape)")

    const onChange = () => {
      setIsMobile(mqlPortrait.matches || mqlLandscape.matches)
    }

    mqlPortrait.addEventListener("change", onChange)
    mqlLandscape.addEventListener("change", onChange)

    setIsMobile(mqlPortrait.matches || mqlLandscape.matches)

    return () => {
      mqlPortrait.removeEventListener("change", onChange)
      mqlLandscape.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)")
    const onChange = () => {
      setIsTouch(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsTouch(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isTouch
}