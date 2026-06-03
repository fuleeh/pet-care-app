export enum Role {
  PET_PARENT = 'PET_PARENT',
  ADMIN = 'ADMIN',
}

export enum Species {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  OTHER = 'OTHER',
}

export enum FrequencyUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface PetDto {
  id: string;
  userId: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicationDto {
  id: string;
  petId: string;
  name: string;
  dosage: string | null;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicationLogDto {
  id: string;
  medicationId: string;
  administeredAt: string;
  notes: string | null;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePetRequest {
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  notes?: string;
}

export interface CreateMedicationRequest {
  name: string;
  dosage?: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface CreateLogRequest {
  administeredAt?: string;
  notes?: string;
}

export interface DashboardSummary {
  totalPets: number;
  upcomingMedications: number;
  overdueMedications: number;
  complianceRate: number;
}
