export enum Role {
  ADMIN = 'ADMIN',
  FRONT_DESK = 'FRONT_DESK',
  ACCOUNTANT = 'ACCOUNTANT'
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  DIRTY = 'DIRTY',
  RESERVED = 'RESERVED',
  OUT_OF_ORDER = 'OUT_OF_ORDER'
}

export enum RoomCategory {
  FOUNTAIN_DELUXE = 'Fountain Deluxe',
  PREMIUM_DELUXE = 'Premium Deluxe',
  SUPERIOR_DELUXE = 'Superior Deluxe',
  TWIN_DELUXE = 'Twin Deluxe',
  ROYAL_SUITE = 'Royal Suite'
}

export enum PaymentMethod {
  CASH = 'Cash',
  BKASH = 'Bkash',
  NAGAD = 'Nagad',
  CARD = 'Card',
  BANK_TRANSFER = 'Bank Transfer'
}

export enum IdType {
  NID = 'NID',
  PASSPORT = 'Passport',
  BIRTH_CERTIFICATE = 'Birth Certificate',
  DRIVING_LICENSE = 'Driving License'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: Role;
  name: string;
}

export interface Room {
  id: string; // Added to match DB schema
  roomNumber: string;
  category: RoomCategory;
  price: number;
  status: RoomStatus;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  idType: IdType;
  idNumber: string;
  address: string;
  city: string;
  country: string;
  preferences?: string;
  idImageUrl?: string;
  outstandingBalance: number; // New field to track debt
}

export interface Staff {
  id: string;
  name: string;
  designation: string;
  joiningDate: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  month: string;
  year: number;
  amount: number;
  status: 'PAID' | 'PENDING';
  timestamp: string;
}

export interface Reservation {
  id: string;
  roomIds: string[];
  guestIds: string[];
  checkIn: string;
  checkOut: string;
  status: 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  stayType?: 'RESERVATION' | 'CHECK_IN';
  laundry: number;
  miniBar: number;
  discount: number;
  extraCharges: number;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
  onDutyOfficer?: string;
  specialRequests?: string;
  notes?: string;
  totalAmount?: number;
}

export enum TransactionType {
  LAUNDRY = 'Laundry',
  MINI_BAR = 'Mini-bar',
  ROOM_PAYMENT = 'Room Payment'
}

export interface Transaction {
  id: string;
  timestamp: string;
  roomNumber: string;
  guestName: string;
  type: TransactionType;
  amount: number;
}