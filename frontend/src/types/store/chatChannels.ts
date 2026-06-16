export interface ChatMessage {
    id: string
    senderId: string
    senderName: string
    content: string
    timestamp: string
}

export interface ChatChannelsState {
    serverMessages: ChatMessage[]

    /** Call once when the friends socket connects. */
    setupListeners: () => void

    sendServer: (content: string) => void
}