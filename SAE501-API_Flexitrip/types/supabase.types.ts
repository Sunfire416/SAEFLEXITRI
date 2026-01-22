/**
 * Types Supabase - Définitions des schémas et interfaces
 * 
 * Basé sur le schéma PostgreSQL Supabase:
 * - tables: users, voyages, reservations, pmr_missions, transactions, blockchain, notifications
 * - views: blockchain_details, reservations_completes, voyages_details
 */

// ==================== ENUMS ====================

export enum UserRole {
  PMR = 'PMR',
  ACCOMPAGNANT = 'Accompagnant',
  AGENT = 'Agent',
  ADMIN = 'admin',
  GUEST = 'guest'
}

export enum VoyageStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELAYED = 'delayed'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum TicketStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  SCANNED = 'scanned',
  USED = 'used'
}

export enum TransactionType {
  BOOKING_PAYMENT = 'booking_payment',
  REFUND = 'refund',
  CREDIT = 'credit',
  WALLET_TOPUP = 'wallet_topup',
  SERVICE_CHARGE = 'service_charge'
}

export enum PmrMissionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum NotificationType {
  BOOKING = 'booking',
  MISSION = 'mission',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  ALERT = 'alert',
  INFO = 'info'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// ==================== TYPES ====================

// USER
export interface User {
  user_id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  date_naissance?: string | null;
  nationalite?: string | null;
  address?: string | null;
  type_handicap?: string | null;
  besoins_specifiques?: Record<string, any> | null;
  pmr_profile?: PMRProfile | null;
  needs_assistance?: boolean | null;
  solde: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PMRProfile {
  service_dog?: boolean;
  medical_info?: string;
  mobility_aid?: string;
  dietary_requirements?: string;
  [key: string]: any;
}

// VOYAGE
export interface Voyage {
  id_voyage: string;
  id_pmr?: string | null;
  id_accompagnant?: string | null;
  date_debut: string; // timestamptz
  date_fin: string;
  lieu_depart: Location;
  lieu_arrivee: Location;
  bagage?: Bagage[] | null;
  etapes?: Etape[] | null;
  prix_total: number;
  status?: VoyageStatus | null;
  created_at?: string | null;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  country?: string;
}

export interface Bagage {
  id?: string;
  type: string;
  weight?: number;
  description?: string;
}

export interface Etape {
  id?: string;
  order: number;
  mode: string; // 'train', 'bus', 'plane', 'metro', etc.
  departure: Location;
  arrival: Location;
  departure_time: string;
  arrival_time: string;
  operator?: string;
  confirmation?: string;
}

// RESERVATION
export interface Reservation {
  reservation_id: string;
  user_id: string;
  id_voyage?: string | null;
  num_reza_mmt: string; // Unique
  num_pax?: string | null;
  booking_reference?: string | null;
  type_transport?: string | null;
  assistance_pmr?: boolean | null;
  date_reservation?: string | null;
  lieu_depart?: string | null;
  lieu_arrivee?: string | null;
  date_depart?: string | null;
  date_arrivee?: string | null;
  enregistre?: boolean | null;
  statut?: ReservationStatus | null;
  ticket_status?: TicketStatus | null;
  pmr_options?: Record<string, any> | null;
  ticket_qr_code?: string | null;
  ticket_generated_at?: string | null;
  qr_code_data?: string | null;
  facturation_id?: string | null;
  etape_voyage?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// PMR_MISSION
export interface PmrMission {
  id: string;
  reservation_id: string; // Unique (1 mission per reservation)
  agent_id?: string | null;
  status?: PmrMissionStatus | null;
  agent_lat?: number | null;
  agent_lng?: number | null;
  eta?: number | null; // minutes
  updated_at?: string | null;
}

// TRANSACTION
export interface Transaction {
  id: string;
  user_id: string;
  reservation_id?: string | null;
  amount: number;
  type: TransactionType;
  payment_status?: string | null;
  date_payement?: string | null;
  balance_after?: number | null;
  description?: string | null;
  created_at?: string | null;
}

// BLOCKCHAIN
export interface BlockchainRecord {
  id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  transaction_type: string;
  balance_before?: number | null;
  balance_after?: number | null;
  previous_hash: string;
  hash: string;
  nonce?: number | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// NOTIFICATION
export interface Notification {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  agent_info?: Record<string, any> | null;
  icon?: string | null;
  priority?: NotificationPriority | null;
  action_url?: string | null;
  read?: boolean | null;
  read_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ==================== VUE MODELS ====================

export interface BlockchainDetails extends BlockchainRecord {
  user_name?: string;
  user_surname?: string;
  user_email?: string;
}

export interface ReservationComplete extends Reservation {
  user_name?: string;
  user_surname?: string;
  user_email?: string;
  user_role?: string;
  voyage_date_debut?: string;
  voyage_date_fin?: string;
}

export interface VoyageDetails extends Voyage {
  pmr_name?: string;
  pmr_surname?: string;
  pmr_email?: string;
  accompagnant_name?: string;
  accompagnant_surname?: string;
  accompagnant_email?: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

export interface CreateUserRequest {
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  date_naissance?: string;
  nationalite?: string;
  address?: string;
  type_handicap?: string;
  besoins_specifiques?: Record<string, any>;
  pmr_profile?: PMRProfile;
  needs_assistance?: boolean;
}

export interface CreateVoyageRequest {
  id_pmr?: string;
  id_accompagnant?: string;
  date_debut: string;
  date_fin: string;
  lieu_depart: Location;
  lieu_arrivee: Location;
  bagage?: Bagage[];
  etapes?: Etape[];
  prix_total?: number;
  status?: VoyageStatus;
}

export interface CreateReservationRequest {
  user_id: string;
  id_voyage?: string;
  num_reza_mmt: string;
  num_pax?: string;
  booking_reference?: string;
  type_transport?: string;
  assistance_pmr?: boolean;
  pmr_options?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// ==================== ERROR TYPES ====================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  validationErrors?: ValidationError[];
}
