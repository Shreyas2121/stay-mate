export interface HostProfile {
  id: string
  legalName: string
  phone: string
  address: string
  idType: string
  idNumber: string
  bankInfo: string
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason: string | null
  submittedAt: string | null
  user?: {
    email: string
    name: string | null
  }
}

export type HostProfileTab = 'all' | 'pending' | 'verified' | 'rejected'

export interface Coupon {
  id: string
  code: string
  discountType: 'percent' | 'flat'
  discount: number
  expiryDate: string | null
  isPublic: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  userId: string | null
}

export interface CouponFormValues {
  code: string
  discountType: 'percent' | 'flat'
  discount: string
  expiryDate: string
  userId: string
  isPublic: boolean
}

export interface AdminHost {
  id: string
  name: string | null
  email: string
  role: 'host'
  activeRole: 'guest' | 'host'
  isActive: boolean
  createdAt: string
  updatedAt: string
  hostProfile?: HostProfile | null
  listingCount: number
  activeListingCount: number
  bookingCount: number
  platformFeeTotal?: number
  hostAmountTotal?: number
}

export type AdminHostStatusFilter = 'all' | 'active' | 'terminated'
