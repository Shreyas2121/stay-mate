import type { HostOnboardingForm } from '../types/host-onboarding.types'

export function getStepFields(step: number): Array<keyof HostOnboardingForm> {
  switch (step) {
    case 1:
      return ['legalName', 'phone', 'address']
    case 2:
      return ['idType', 'idNumber']
    case 3:
      return ['bankInfo', 'agreeToTerms']
    default:
      return []
  }
}
