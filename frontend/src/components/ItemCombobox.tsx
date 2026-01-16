import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
interface ComboboxItem {
  Id: string
  Name: string
  Sku?: string
}

interface ItemComboboxProps<T extends ComboboxItem> {
  items: T[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  renderSecondary?: (item: T) => string | undefined
}

export function ItemCombobox<T extends ComboboxItem>({ items, value, onValueChange, disabled, placeholder = "Select item...", renderSecondary }: ItemComboboxProps<T>) {
  const [open, setOpen] = useState(false)

  const selectedItem = items.find((item) => item.Id === value)

  const getSecondaryText = (item: T): string | undefined => {
    if (renderSecondary) return renderSecondary(item)
    if (item.Sku) return `SKU: ${item.Sku}`
    return undefined
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedItem ? selectedItem.Name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white shadow-lg border border-gray-200">
        <Command className="bg-white">
          <CommandInput placeholder="Search items..." className="bg-white" />
          <CommandList className="bg-white">
            <CommandEmpty className="bg-white">No item found.</CommandEmpty>
            <CommandGroup className="bg-white">
              {items.map((item) => {
                const secondary = getSecondaryText(item)
                return (
                  <CommandItem
                    key={item.Id}
                    value={item.Name}
                    onSelect={() => {
                      onValueChange(item.Id)
                      setOpen(false)
                    }}
                    className="bg-white hover:bg-gray-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === item.Id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.Name}</span>
                      {secondary && (
                        <span className="text-xs text-gray-500 ml-2 shrink-0">{secondary}</span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
