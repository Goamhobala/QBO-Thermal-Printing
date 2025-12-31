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
import { Item } from "../types"

interface ItemComboboxProps {
  items: Item[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function ItemCombobox({ items, value, onValueChange, disabled }: ItemComboboxProps) {
  const [open, setOpen] = useState(false)

  const selectedItem = items.find((item) => item.Id === value)

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
          {selectedItem ? selectedItem.Name : "Select item..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white shadow-lg border border-gray-200">
        <Command className="bg-white">
          <CommandInput placeholder="Search items..." className="bg-white" />
          <CommandList className="bg-white">
            <CommandEmpty className="bg-white">No item found.</CommandEmpty>
            <CommandGroup className="bg-white">
              {items.map((item) => (
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
                      "mr-2 h-4 w-4",
                      value === item.Id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{item.Name}</span>
                    {item.Sku && (
                      <span className="text-xs text-gray-500">SKU: {item.Sku}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
