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

  const handleCustomerCreated = async (newCustomer: Customer) => {
    setDialogOpen(false)
    setOpen(false)

    // Refresh customer list first
    if (onCustomerCreated) {
      await onCustomerCreated()
    }

    // Then select the newly created customer
    onValueChange(newCustomer.Id)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white hover:bg-gray-50"
            disabled={disabled}
          >
            {selectedCustomer ? selectedCustomer.DisplayName : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white shadow-lg border border-gray-200">
          <Command className="bg-white">
            <CommandInput placeholder="Search customers..." className="bg-white border-0" />
            <CommandList className="bg-white">
              <CommandGroup className="bg-white p-1">
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setDialogOpen(true)
                  }}
                  className="bg-white hover:bg-green-50 text-green-600 font-medium cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Customer
                </CommandItem>
              </CommandGroup>
              <CommandSeparator className="bg-gray-200" />
              <CommandGroup className="bg-white p-1">
                <CommandEmpty className="bg-white text-gray-500 py-4">No customer found.</CommandEmpty>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.Id}
                    value={customer.DisplayName}
                    onSelect={() => {
                      onValueChange(customer.Id)
                      setOpen(false)
                    }}
                    className="bg-white hover:bg-gray-50 text-gray-900"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.Id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-900">{customer.DisplayName}</span>
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
