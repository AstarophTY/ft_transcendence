import { Kbd, KbdGroup } from "@/components/shadcn/kbd"

export default function KeysEditor() {
  return (
    <div className='absolute flex flex-col bottom-10 left-10  gap-2 w-full '>
        <p className="text-sm text-muted-foreground">
            Use{" "}
            <KbdGroup>
            <Kbd>1</Kbd>
            </KbdGroup>{" "}
            to use build tool
        </p>
        <p className="text-sm text-muted-foreground">
            Use{" "}
            <KbdGroup>
            <Kbd>2</Kbd>
            </KbdGroup>{" "}
            to use destroy tool
        </p>
    </div>
  )
}
