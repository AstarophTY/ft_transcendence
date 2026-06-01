import { Kbd, KbdGroup } from "@/components/shadcn/kbd"

export default function KeysEditor() {
  return (
    <div className='absolute flex flex-col bottom-10 left-10  gap-2 w-full '>
        <p className="text-sm text-muted-foreground">
            Use{" "}
            <KbdGroup>
            <Kbd>Mouse click left</Kbd>
            </KbdGroup>{" "}
            to destroy a block
        </p>
        <p className="text-sm text-muted-foreground">
            Use{" "}
            <KbdGroup>
            <Kbd>Mouse click right</Kbd>
            </KbdGroup>{" "}
            to build a block
        </p>
    </div>
  )
}
