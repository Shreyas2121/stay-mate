import type { UseFormReturn } from 'react-hook-form'

// ─── Form Data ────────────────────────────────────────────────

export interface HostOnboardingForm {
  // Step 1: Personal Info
  legalName: string
  phone: string
  address: string

  // Step 2: Identity Verification
  idType: string
  idNumber: string

  // Step 3: Bank & Terms
  bankInfo: string
  agreeToTerms: boolean
}

// ─── API Response ─────────────────────────────────────────────

export interface HostProfileStatus {
  id: string
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason: string | null
  legalName: string
  phone: string
  address: string
  idType: string
  idNumber: string
  bankInfo: string
}

// ─── Shared Step Props ────────────────────────────────────────

export interface StepProps {
  register: UseFormReturn<HostOnboardingForm>['register']
  errors: UseFormReturn<HostOnboardingForm>['formState']['errors']
  watch?: UseFormReturn<HostOnboardingForm>['watch']
  setValue?: UseFormReturn<HostOnboardingForm>['setValue']
}
