import type { Gender } from "./user";

export type MaritalStatus =
  | "Never_Married"
  | "Divorced"
  | "Widowed"
  | "Separated"
  | "Awaiting_Divorce"
  | "Second_Marriage"
  | "Annulled";
export type FamilyType = "Nuclear" | "Joint" | "Extended" | "Single_Parent" | "Other" | string;

export interface Sibling {
  name: string;
  relation?: string;
  ageRelation?: string;
  maritalStatus?: string;
  education: string;
  profession: string;
}

export interface Child {
  age: string;
  gender: string;
  stayingWithYou: boolean;
}

export interface ProfileImage {
  id: string;
  profileId: string;
  url: string;
  isPrimary: boolean;
  isPrivate: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  isVerified: boolean; // account email verified
  isActive: boolean; // account active (false = blocked)
  profileNumber: string;
  hasProfile: boolean;
  userId?: string;
  age: number;
  religion: string;
  caste: string;
  city: string;
  state: string;
  education: string;
  occupation: string;
  income: string;
  height: string;
  about: string;
  familyType: FamilyType;
  maritalStatus: MaritalStatus;
  motherTongue: string;
  interests: string[];
  // Extended matrimony fields (BACKEND.md §4 / §7)
  educationUniversity?: string | null;
  complexion?: string | null;
  homeTown?: string | null;
  educationCity?: string | null;
  castePreference?: string | null;
  marriagePreference?: string | null;
  languagesKnown?: string[] | null;
  currentAddress?: string | null; // private
  addressCity?: string | null;
  addressArea?: string | null;
  motherPhone?: string | null; // private
  fatherPhone?: string | null; // private
  otherPhone?: string | null; // private
  coordinatorNumber?: string | null; // private
  fatherName?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  totalSiblings?: string | null;
  brotherEducation?: string | null;
  sisterEducation?: string | null;
  siblings?: Sibling[] | null;
  hasChildren?: boolean | null;
  children?: Child[] | null;
  otherDetails?: string | null;
  isPublished: boolean;
  isProfileVerified: boolean;
  isVip?: boolean;
  isPremium?: boolean;
  images?: ProfileImage[];
  createdAt: string;
  updatedAt: string;
}

// Payload for creating a brand-new profile from the admin panel.
// Combines the signup account fields (BACKEND.md §5) with the matrimony
// profile fields (BACKEND.md §7).
export interface CreateProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  password?: string;
  religion: string;
  caste: string;
  city: string;
  state: string;
  education: string;
  educationUniversity?: string;
  occupation: string;
  income: string;
  height: string;
  about: string;
  familyType: FamilyType;
  maritalStatus: MaritalStatus;
  motherTongue: string;
  interests: string[];
  // Extended matrimony fields (all optional)
  complexion?: string;
  homeTown?: string;
  educationCity?: string;
  castePreference?: string;
  marriagePreference?: string;
  languagesKnown?: string[];
  currentAddress?: string;
  addressCity?: string;
  addressArea?: string;
  motherPhone?: string;
  fatherPhone?: string;
  otherPhone?: string;
  coordinatorNumber?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  totalSiblings?: string;
  brotherEducation?: string;
  sisterEducation?: string;
  siblings?: Sibling[];
  hasChildren?: boolean;
  children?: Child[];
  otherDetails?: string;
}

export interface CreateProfileResult {
  userId: string;
  profile: AdminProfile | null;
}

// POST /api/admin/users/bulk (BACKEND.md §10)
export interface BulkImportCreatedUser {
  row: number;
  id: string;
  email: string;
  profileNumber: string | null;
  generatedPassword: string | null;
}

export interface BulkImportError {
  row: number;
  email?: string;
  message: string;
}

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  createdUsers: BulkImportCreatedUser[];
  errors: BulkImportError[];
}

export interface ProfileFilters {
  profileNumber?: string;
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  religion?: string;
  caste?: string;
  city?: string;
  state?: string;
  maritalStatus?: MaritalStatus;
  motherTongue?: string;
  education?: string;
  search?: string;
}

// GET /api/admin/profiles/:id/completion (BACKEND.md §7.5 / §10)
export interface ProfileCompletionSection {
  section: string;
  completed: number;
  total: number;
  percentage: number;
  missingFields: string[];
}

export interface ProfileCompletion {
  hasProfile: boolean;
  profileId: string | null;
  profileNumber: string | null;
  isPublished: boolean;
  isVerified: boolean;
  imageCount: number;
  overallPercentage: number;
  totalCompleted: number;
  totalRequired: number;
  sections: ProfileCompletionSection[];
}
