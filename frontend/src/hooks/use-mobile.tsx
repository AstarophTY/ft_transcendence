import {useEffect, useState} from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
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
  const [isTouch, setIsTouch] = useState<boolean>(false)

  useEffect(() => {
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