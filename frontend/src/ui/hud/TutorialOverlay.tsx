import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Sparkles, Globe, Keyboard, Trophy, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'

interface TutorialOverlayProps {
  onClose: () => void
}

export default function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  const { t } = useTranslation()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      icon: <Sparkles className="size-16 text-amber-500 animate-pulse" />,
      title: t('tutorial.welcome', { defaultValue: 'Welcome!' }),
      content: (
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('tutorial.welcome_body', {
              defaultValue: 'Explore, build, and design 3D islands in a shared voxel universe!',
            })}
          </p>
        </div>
      ),
    },
    {
      icon: <Globe className="size-16 text-blue-500" />,
      title: t('tutorial.planets', { defaultValue: 'Private & Campus Planets' }),
      content: (
        <div className="text-left space-y-4 text-sm leading-relaxed">
          <div className="p-3.5 rounded-xl border border-border/30 bg-muted/20">
            <h4 className="font-semibold text-primary mb-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              {t('tutorial.planets_private_title', { defaultValue: 'Private Planet' })}
            </h4>
            <p className="text-muted-foreground text-xs pl-3.5">
              {t('tutorial.planets_private_body', { defaultValue: 'Your own creative space where you are the sole master. Build without limits and in complete privacy.' })}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-border/30 bg-muted/20">
            <h4 className="font-semibold text-primary mb-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              {t('tutorial.planets_campus_title', { defaultValue: 'Campus Planet' })}
            </h4>
            <p className="text-muted-foreground text-xs pl-3.5">
              {t('tutorial.planets_campus_body', { defaultValue: 'A shared world with other students from your campus. Collaborate, share resources, and build together!' })}
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Keyboard className="size-16 text-purple-500" />,
      title: t('tutorial.controls', { defaultValue: 'Controls & Keybinds' }),
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs w-full">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 p-2 rounded-lg border border-border/20 bg-muted/10">
            <div className="flex gap-0.5 shrink-0">
              <kbd className="px-1.5 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm">W</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm">A</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm">S</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm">D</kbd>
            </div>
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">{t('tutorial.control_move', { defaultValue: 'Movement (WASD)' })}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2.5 p-2 rounded-lg border border-border/20 bg-muted/10">
            <kbd className="px-2 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm shrink-0">{t('tutorial.key_space', { defaultValue: 'Space' })}</kbd>
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">{t('tutorial.control_jump', { defaultValue: 'Jump / Fly up' })}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2.5 p-2 rounded-lg border border-border/20 bg-muted/10">
            <kbd className="px-2 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm shrink-0">{t('tutorial.key_shift', { defaultValue: 'Shift' })}</kbd>
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">{t('tutorial.control_down', { defaultValue: 'Fly down / Descend' })}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2.5 p-2 rounded-lg border border-border/20 bg-muted/10">
            <div className="flex gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm shrink-0">E</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm shrink-0">{t('tutorial.key_esc', { defaultValue: 'Esc' })}</kbd>
            </div>
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">{t('tutorial.control_unlock', { defaultValue: 'Unlock cursor' })}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2.5 p-2 rounded-lg border border-border/20 bg-muted/10">
            <kbd className="px-2 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm shrink-0">C</kbd>
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">{t('tutorial.control_freecam', { defaultValue: 'Activate freecam' })}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 p-2 rounded-lg border border-border/20 bg-muted/10">
            <div className="flex gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm font-bold">{t('tutorial.key_left_click', { defaultValue: 'Left Click' })}</span>
              <kbd className="px-2 py-0.5 bg-muted-foreground/15 border border-border/50 text-[10px] rounded shadow-sm">{t('tutorial.key_enter', { defaultValue: 'Enter' })}</kbd>
            </div>
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">{t('tutorial.control_action', { defaultValue: 'Place, remove, or interact' })}</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Trophy className="size-16 text-yellow-500" />,
      title: t('tutorial.votes', { defaultValue: 'Seasons & Campus Voting' }),
      content: (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('tutorial.votes_body_2', { defaultValue: "Each season features a building phase followed by a voting phase. Visit other campus members' islands and vote for the best one!" })}
          </p>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs inline-flex items-center gap-2">
            <Trophy className="size-4 shrink-0" />
            {t('tutorial.votes_winner_reward', { defaultValue: "Winners earn rewards and enter history!" })}
          </div>
        </div>
      ),
    },
  ]

  const next = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    } else {
      onClose()
    }
  }

  const prev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[3px] sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[95vh] overflow-y-auto bg-background/75 dark:bg-background/40 backdrop-blur-xl border-none sm:border border-border/40 shadow-2xl rounded-none sm:rounded-2xl flex flex-col p-6 max-sm:pt-14"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-full p-1.5 transition-all cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* Slide Content Container */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <div className="mb-4">
            {slides[currentSlide]!.icon}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-center text-primary mb-4 sm:mb-5 px-4 select-none">
            {slides[currentSlide]!.title}
          </h3>

          <div className="w-full min-h-[170px] flex items-center justify-center">
            {slides[currentSlide]!.content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-6 border-t border-border/20 pt-4">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {t('tutorial.skip', { defaultValue: 'Skip' })}
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`size-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === index ? 'w-5 bg-primary' : 'bg-muted-foreground/35'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentSlide > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                className="gap-1 text-xs max-sm:px-2"
              >
                <ChevronLeft className="size-4" />
                {t('tutorial.prev', { defaultValue: 'Previous' })}
              </Button>
            )}

            <Button
              size="sm"
              onClick={next}
              className="gap-1 text-xs font-semibold px-4 cursor-pointer"
            >
              {currentSlide === slides.length - 1 ? (
                t('tutorial.start', { defaultValue: 'Get Started' })
              ) : (
                <>
                  {t('tutorial.next', { defaultValue: 'Next' })}
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
