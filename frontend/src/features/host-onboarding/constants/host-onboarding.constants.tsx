import { User, IdCard, CreditCard } from 'lucide-react'

export const STEPS = [
  { id: 1, label: 'Personal Info', icon: <User className="size-4" /> },
  { id: 2, label: 'Verification', icon: <IdCard className="size-4" /> },
  { id: 3, label: 'Bank & Terms', icon: <CreditCard className="size-4" /> },
] as const

export const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'aadhar', label: 'Aadhaar Card' },
] as const
