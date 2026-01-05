import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Input from "@/components/Input"
import { Customer } from "../types"

interface AddCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerCreated: (customer: Customer) => void
}

interface CustomerFormData {
  title: string
  givenName: string
  middleName: string
  familyName: string
  suffix: string
  displayName: string
  companyName: string
  email: string
  phone: string
  mobile: string
  fax: string
  vatNumber: string
  // Address fields
  street1: string
  street2: string
  city: string
  state: string
  postalCode: string
  country: string
}

const initialFormData: CustomerFormData = {
  title: "",
  givenName: "",
  middleName: "",
  familyName: "",
  suffix: "",
  displayName: "",
  companyName: "",
  email: "",
  phone: "",
  mobile: "",
  fax: "",
  vatNumber: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "South Africa",
}

export function AddCustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
}: AddCustomerDialogProps) {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    // Validate required field
    if (!formData.displayName && !formData.familyName) {
      setError("Either Display Name or Last Name is required")
      return
    }

    setLoading(true)

    try {
      // Build the customer payload for QuickBooks API
      const customerPayload: any = {}

      // Name fields
      if (formData.displayName) customerPayload.DisplayName = formData.displayName
      if (formData.givenName) customerPayload.GivenName = formData.givenName
      if (formData.middleName) customerPayload.MiddleName = formData.middleName
      if (formData.familyName) customerPayload.FamilyName = formData.familyName
      if (formData.title) customerPayload.Title = formData.title
      if (formData.suffix) customerPayload.Suffix = formData.suffix
      if (formData.companyName) customerPayload.CompanyName = formData.companyName

      // Contact fields
      if (formData.email) {
        customerPayload.PrimaryEmailAddr = { Address: formData.email }
      }
      if (formData.phone) {
        customerPayload.PrimaryPhone = { FreeFormNumber: formData.phone }
      }
      if (formData.mobile) {
        customerPayload.Mobile = { FreeFormNumber: formData.mobile }
      }
      if (formData.fax) {
        customerPayload.Fax = { FreeFormNumber: formData.fax }
      }

      // VAT field - prepend "VAT NO. " to bypass API censoring
      if (formData.vatNumber) {
        customerPayload.PrimaryTaxIdentifier = `VAT NO. ${formData.vatNumber}`
      }

      // Billing address
      if (formData.street1 || formData.city || formData.postalCode) {
        customerPayload.BillAddr = {}
        if (formData.street1) customerPayload.BillAddr.Line1 = formData.street1
        if (formData.street2) customerPayload.BillAddr.Line2 = formData.street2
        if (formData.city) customerPayload.BillAddr.City = formData.city
        if (formData.state) customerPayload.BillAddr.CountrySubDivisionCode = formData.state
        if (formData.postalCode) customerPayload.BillAddr.PostalCode = formData.postalCode
        if (formData.country) customerPayload.BillAddr.Country = formData.country
      }

      // Generate FullyQualifiedName if not provided
      if (!customerPayload.FullyQualifiedName && formData.displayName) {
        customerPayload.FullyQualifiedName = formData.displayName
      }

      console.log("Creating customer with payload:", customerPayload)

      const response = await fetch("/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(customerPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create customer")
      }

      const data = await response.json()
      console.log("Customer created successfully:", data)

      // Extract the customer from the response
      const newCustomer = data.Customer

      // Reset form
      setFormData(initialFormData)

      // Call the callback with the new customer
      onCustomerCreated(newCustomer)
    } catch (err) {
      console.error("Error creating customer:", err)
      setError(err instanceof Error ? err.message : "Failed to create customer")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer in QuickBooks. Display Name or Last Name is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Name and Contact Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Name and Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Mr, Ms, Dr"
                />
                <Input
                  label="First name"
                  value={formData.givenName}
                  onChange={(e) => handleChange("givenName", e.target.value)}
                />
                <Input
                  label="Middle name"
                  value={formData.middleName}
                  onChange={(e) => handleChange("middleName", e.target.value)}
                />
                <Input
                  label="Last name"
                  value={formData.familyName}
                  onChange={(e) => handleChange("familyName", e.target.value)}
                />
                <Input
                  label="Suffix"
                  value={formData.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                  placeholder="Jr, Sr, III"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  label="Customer display name *"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="How this customer appears in lists"
                  required
                />
                <Input
                  label="Company name"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                <Input
                  label="Phone number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  label="Mobile number"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                />
                <Input
                  label="Fax"
                  type="tel"
                  value={formData.fax}
                  onChange={(e) => handleChange("fax", e.target.value)}
                />
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Street address 1"
                  value={formData.street1}
                  onChange={(e) => handleChange("street1", e.target.value)}
                />
                <Input
                  label="Street address 2"
                  value={formData.street2}
                  onChange={(e) => handleChange("street2", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Province/State"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  label="Postal code"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
                <Input
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
              </div>
            </div>

            {/* Tax Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tax Information</h3>
              <Input
                label="VAT Registration Number"
                value={formData.vatNumber}
                onChange={(e) => handleChange("vatNumber", e.target.value)}
                placeholder="Enter VAT number (will be prefixed with 'VAT NO.')"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
