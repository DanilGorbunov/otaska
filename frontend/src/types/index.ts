export type IntentType = 'seeking_service' | 'seeking_material' | 'offering_service' | 'seeking_job'
export type EntryType = 'on_demand' | 'project'
export type EntryStatus = 'draft' | 'open' | 'matched' | 'booked' | 'in_progress' | 'done' | 'cancelled'
export type ProposalStatus = 'pending' | 'accepted' | 'rejected'
export type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'disputed'

export interface ProviderProfile {
  id: string
  bio?: string
  skills: string[]
  hourly_rate?: number
  rating: number
  jobs_completed: number
  verified: boolean
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  city?: string
  region?: string
  avatar_url?: string
  verified: boolean
  created_at: string
  provider_profile?: ProviderProfile
}

export interface Entry {
  id: string
  client_id: string
  title: string
  description?: string
  intent_type: IntentType
  entry_type: EntryType
  status: EntryStatus
  category?: string
  city?: string
  region?: string
  budget_min?: number
  budget_max?: number
  scheduled_date?: string
  scheduled_time?: string
  ai_estimate_min?: number
  ai_estimate_max?: number
  ai_category?: string
  ai_urgency?: string
  created_at: string
  proposal_count: number
  client?: User
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  done: boolean
  order: number
  entry_id?: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  desc?: string
  category?: string
  tasks: ProjectTask[]
  created_at: string
}

export interface Proposal {
  id: string
  entry_id: string
  provider_id: string
  price: number
  message?: string
  status: ProposalStatus
  created_at: string
  provider?: User
}

export interface Booking {
  id: string
  entry_id: string
  client_id: string
  provider_id: string
  price: number
  trust_fee: number
  platform_fee: number
  provider_payout: number
  status: BookingStatus
  created_at: string
  completed_at?: string
  client?: User
  provider?: User
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  content: string
  created_at: string
  read_at?: string
  sender?: User
}

export interface AICategorizeResponse {
  intent_type: string
  category: string
  entry_type: string
  urgency: string
  title: string
  skills: string[]
}

export interface AIEstimateResponse {
  min: number
  max: number
  currency: string
  duration: string
  basis: string
}
