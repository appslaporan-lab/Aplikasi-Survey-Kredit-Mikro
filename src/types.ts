/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SurveyStatus = 'DRAFT' | 'SUBMITTED_MO' | 'REVIEWED_KASUBAG' | 'APPROVED' | 'REJECTED';

export interface AIAnalysis {
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  scoringModel: number; // 0 - 100 score
  ewsFactors: string[]; // Warning flags/strengths
  recommendationLimit: number; // Recommended loan amount in IDR
  narrativeSummary: string; // Qualitative analysis report from Gemini
  businessViability: 'SEHAT' | 'CUKUP' | 'RENTAN'; // Business health
  repaymentCapacity: 'KUAT' | 'SEDANG' | 'LEMAH'; // Debt service capability
  capacityRatio: number; // Net income / installment ratio percentage
}

export type SurveyScheme = 'PJI' | 'PPP' | 'PAYROLL'; // Perdagangan/Jasa/Industri vs Pertanian/Peternakan/Perikanan vs Payroll

export interface CollateralItem {
  id: string;
  type: 'SHM' | 'BPKB' | 'LOS_PASAR' | 'SK_ASLI' | 'TANPA_AGUNAN' | 'LAINNYA';
  description: string;
  value: number;
  vehicleAge?: number; // vehicle age in years (for BPKB)
  taksasiValue?: number; // calculated taksasi value
}

export interface SlikActiveLoan {
  id: string;
  bankName: string;
  plafond: number;
  bakidebet: number;
  monthlyInstallment: number;
  collectibility: string; // e.g. KOL-1, KOL-2, etc
}

export interface Scoring5C {
  character: number; // 0 - 100
  capacity: number; // 0 - 100
  capital: number;  // 0 - 100
  collateral: number; // 0 - 100
  condition: number;  // 0 - 100
  // Qualitative checklist answers for PJI / PPP
  qCharacter: string;
  qCapacity: string;
  qCapital: string;
  qCollateral: string;
  qCondition: string;
}

export interface CreditSurvey {
  id: string;
  borrowerName: string;
  nik: string;
  phone: string;
  address: string;
  addressDusun?: string;
  addressDesa?: string;
  addressRt?: string;
  addressRw?: string;
  addressKabupaten?: string;
  businessType: string;
  businessAge: number; // in years
  requestedAmount: number; // IDR
  requestedTenor: number; // months
  interestRate?: number; // annual percentage flat rate, e.g. 12%
  monthlyInstallment?: number; // calculated monthly installment IDR
  monthlyRevenue: number; // monthly turnover, IDR
  monthlyExpenses: number; // monthly costs, IDR
  netMonthlyIncome: number; // calculated, IDR
  collateralType: 'SHM' | 'BPKB' | 'LOS_PASAR' | 'TANPA_AGUNAN' | 'SK_ASLI';
  collateralDescription: string;
  collateralValue: number; // IDR
  collaterals?: CollateralItem[];
  slikActiveLoans?: SlikActiveLoan[];
  moNotes: string; // Qualitative checks by Marketing Officer
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAddress: string;
  photoUrl: string | null;
  // Foto KTP dan Foto Calon Debitur
  photoKtp?: string | null;
  photoDebitur?: string | null;
  // Extra photos representing standard PWA survey files (supporting multiple photos)
  surveyPhotos: {
    rumah: string[];
    usaha: string[];
    stok: string[];
    agunan: string[];
  };
  status: SurveyStatus;
  createdAt: string;
  updatedAt: string;
  surveyorEmail: string;
  officeId: string; // Office where the MO is placed
  
  // New features requested by User
  slikStatus?: string; // SLIK customer status (KOL-1, KOL-2, etc)
  sectorType?: 'UMUM' | 'PERIKANAN' | 'PERTANIAN' | 'PETERNAKAN' | 'PAYROLL';
  sectorDetails?: {
    fishCount?: number;
    fishWeightPerUnit?: number;
    fishPricePerKg?: number;
    landSize?: number;
    yieldPerUnit?: number;
    pricePerKg?: number;
    livestockCount?: number;
    livestockPrice?: number;
    payrollBaseSalary?: number;
    payrollAllowances?: number;
    payrollDeductions?: number;
  };
  photoCoordinates?: {
    rumah?: ({ lat: number; lng: number } | null)[];
    usaha?: ({ lat: number; lng: number } | null)[];
    stok?: ({ lat: number; lng: number } | null)[];
    agunan?: ({ lat: number; lng: number } | null)[];
  };

  // 5C Scoring details
  scheme: SurveyScheme;
  scores5c: Scoring5C;
  
  // Kasubag (Supervisor / Tier 1)
  kasubagEmail: string | null;
  kasubagNotes: string | null;
  kasubagApprovedAmount: number | null;
  kasubagActionAt: string | null;

  // Kabag (Pimpinan / Tier 2)
  kabagEmail: string | null;
  kabagNotes: string | null;
  kabagApprovedAmount: number | null;
  kabagActionAt: string | null;

  // AI Recommendation Engine / EWS
  aiAnalysis: AIAnalysis | null;
  ewsScore: number; // 1-10 index of warning level
}

export type UserRole = 'MO' | 'KASUBAG' | 'KABAG' | 'PIMCAB' | 'ADMIN';

export type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FieldUser {
  email: string;
  name: string;
  role: UserRole;
  nik: string;
  officeId: string;
  status: UserApprovalStatus;
  createdAt: string;
  username?: string;
  password?: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  nik: string;
  officeId: string;
  status?: UserApprovalStatus;
  username?: string;
}

export interface Office {
  id: string;
  name: string;
  region: 'KP1' | 'KP2' | 'CAMPURDARAT';
  type: 'KANTOR_PUSAT' | 'KANTOR_KAS' | 'CABANG';
}
