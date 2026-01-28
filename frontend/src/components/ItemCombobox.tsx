import { useMemo, useState } from "react"
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
  Description?: string
  Sku?: string
  Type?: string
  FullyQualifiedName?: string
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
  const [hoveredItem, setHoveredItem] = useState<T | null>(null)

  const selectedItem = items.find((item) => item.Id === value)

  const getSecondaryText = (item: T): string | undefined => {
    if (renderSecondary) return renderSecondary(item)
    if (item.Sku) return `SKU: ${item.Sku}`
    return undefined
  }

  // Group items by category
  const groupedItems = useMemo(() => {
    const categories = items.filter(item => item.Type === 'Category')
    const selectableItems = items.filter(item => item.Type !== 'Category')

    // Build a map of category names to their items
    const groups: { category: string; items: T[] }[] = []
    const uncategorized: T[] = []

    // Create a set of category names for quick lookup
    const categoryNames = new Set(categories.map(c => c.Name))

    selectableItems.forEach(item => {
      // Check if the item has a parent category via FullyQualifiedName
      // Format is typically "Category:ItemName" or just "ItemName"
      const fqn = item.FullyQualifiedName || item.Name
      const parts = fqn.split(':')

      if (parts.length > 1 && categoryNames.has(parts[0])) {
        // This item belongs to a category
        const categoryName = parts[0]
        let group = groups.find(g => g.category === categoryName)
        if (!group) {
          group = { category: categoryName, items: [] }
          groups.push(group)
        }
        group.items.push(item)
      } else {
        uncategorized.push(item)
      }
    })

    // Sort groups alphabetically
    groups.sort((a, b) => a.category.localeCompare(b.category))

    return { groups, uncategorized }
  }, [items])

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setHoveredItem(null)
    }}>
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
      <PopoverContent className="w-full p-0 bg-white shadow-lg border border-gray-200 relative">
        <Command className="bg-white">
          <CommandInput placeholder="Search items..." className="bg-white" />
          <CommandList className="bg-white max-h-60 overflow-y-auto">
            <CommandEmpty className="bg-white">No item found.</CommandEmpty>
            {/* Uncategorized items first */}
            {groupedItems.uncategorized.length > 0 && (
              <CommandGroup className="bg-white">
                {groupedItems.uncategorized.map((item) => {
                  const secondary = getSecondaryText(item)
                  return (
                    <CommandItem
                      key={item.Id}
                      value={`${item.Name} ${item.Description || ''}`}
                      onSelect={() => {
                        onValueChange(item.Id)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
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
            )}
            {/* Categorized items with headers */}
            {groupedItems.groups.map((group) => (
              <CommandGroup key={group.category} heading={group.category} className="bg-white">
                {group.items.map((item) => {
                  const secondary = getSecondaryText(item)
                  return (
                    <CommandItem
                      key={item.Id}
                      value={`${item.Name} ${item.Description || ''}`}
                      onSelect={() => {
                        onValueChange(item.Id)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
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
            ))}
          </CommandList>
        </Command>
        {/* Description tooltip - floating to the right */}
        {hoveredItem?.Description && (
          <div className="absolute left-full bg-white top-[40%] ml-2 w-48 z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <p className="font-medium mb-1">{hoveredItem.Name}</p>
            <p>{hoveredItem.Description}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
