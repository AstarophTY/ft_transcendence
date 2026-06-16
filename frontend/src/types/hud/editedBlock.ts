import {Block} from "@/types/block.ts";

export interface EditedBlock {
    x: number
    y: number
    z: number
    block: Block
    rotation?: number
}