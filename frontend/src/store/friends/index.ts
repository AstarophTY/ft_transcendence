import { create } from 'zustand'
import { createChatSlice } from './chat'
import { createListSlice } from './list'
import { createSocketSlice } from './socket'
import type { FriendsState } from './types'

export const useFriends = create<FriendsState>()((...a) => ({
  ...createListSlice(...a),
  ...createChatSlice(...a),
  ...createSocketSlice(...a),
}))
