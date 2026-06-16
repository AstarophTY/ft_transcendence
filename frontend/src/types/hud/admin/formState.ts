/** The editable state of one season form (edit or schedule). */
export interface FormState {
    title: string
    buildStartsAt: string
    buildEndsAt: string
    delay: string
    duration: string
}