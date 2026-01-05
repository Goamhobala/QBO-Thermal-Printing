import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Customer } from "../types"
import { AddCustomerDialog } from "./AddCustomerDialog"

interface CustomerComboboxProps {
  customers: Customer[]
  value?: string
  onValueChange: (value: string) => void
  onCustomerCreated?: () => void
  disabled?: boolean
}

export function CustomerCombobox({
  customers,
  value,
  onValueChange,
  onCustomerCreated,
  disabled
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedCustomer = customers.find((customer) => customer.Id === value)

  const handleCustomerCreated = (newCustomer: Customer) => {
    onValueChange(newCustomer.Id)
    setDialogOpen(false)
    setOpen(false)
    if (onCustomerCreated) {
      onCustomerCreated()
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedCustomer ? selectedCustomer.DisplayName : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white shadow-lg border border-gray-200">
          <Command className="bg-white">
            <CommandInput placeholder="Search customers..." className="bg-white" />
            <CommandList className="bg-white">
              <CommandGroup className="bg-white">
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setDialogOpen(true)
                  }}
                  className="bg-white hover:bg-gray-100 text-green-600 font-medium cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Customer
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup className="bg-white">
                <CommandEmpty className="bg-white">No customer found.</CommandEmpty>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.Id}
                    value={customer.DisplayName}
                    onSelect={() => {
                      onValueChange(customer.Id)
                      setOpen(false)
                    }}
                    className="bg-white hover:bg-gray-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.Id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.DisplayName}</span>
                      {customer.CompanyName && customer.CompanyName !== customer.DisplayName && (
                        <span className="text-xs text-gray-500">{customer.CompanyName}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  )
}
