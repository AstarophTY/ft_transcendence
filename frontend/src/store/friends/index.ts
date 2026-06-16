import { create } from 'zustand'
import { createChatSlice } from '@/store/friends/chat'
import { createListSlice } from '@/store/friends/list'
import { createSocketSlice } from '@/store/friends/socket'
import {FriendsState} from "@/types/store/friends.ts";

export const useFriends = create<FriendsState>()((...a) => ({
  ...createListSlice(...a),
  ...createChatSlice(...a),
  ...createSocketSlice(...a),
}))
