
export enum UserStatus {
  Active = 'active',
  Banned = 'banned',
  Suspended = 'suspended'
}

export enum ReceiptStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected'
}

export type UserSegment = 'VIP' | 'New' | 'ChurnRisk' | 'Regular';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: UserStatus;
  pointsBalance: number;
  // Expiration Logic
  pointsExpiring: number;
  nextExpirationDate: string | null; // Kept for backward compatibility
  pointsExpiresAt: string | null; // New standard field
  totalSpent: number;
  joinedDate: string;
  // Demographics
  gender?: 'Male' | 'Female' | 'Other';
  birthdate?: string; // YYYY-MM-DD
  pin?: string;
  // Classification
  segment?: UserSegment;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'expiration' | 'system' | 'reward';
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  active: boolean;
  logoUrl: string;
  avgBasket: number;
  // New Fields
  businessHours?: string;
  latitude?: number;
  longitude?: number;
}

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: 'active' | 'draft' | 'ended';
  startDate: string;
  endDate: string;
  conversions: number; // Current number of redemptions
  // New Campaign Mechanics & Safety
  mechanic: string; // Text description
  minSpend?: number; // Numeric rule
  maxRedemptions?: number; // Safety limit (budget control)
  targetAudience?: 'all' | 'vip' | 'new' | 'churn_risk';
  
  supermarketIds: string[]; // Point of sales scope
  rewardType: 'points' | 'voucher' | 'giveaway';
  rewardValue: string | number;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface Receipt {
  id: string;
  userId: string;
  supermarketName: string;
  amount: number;
  date: string;
  status: ReceiptStatus;
  confidenceScore: number;
  imageUrl: string;
  items?: ReceiptItem[];
}

export interface ContentPage {
  title: string;
  content: string;
}

export interface LandingContent {
  appName: string;
  heroTitle1: string;
  heroTitle2: string;
  heroTitle3: string;
  heroDesc: string;
  btnDownload: string;
  whyTitle: string;
  whyDesc: string;
  featScanTitle: string;
  featScanDesc: string;
  featRewardsTitle: string;
  featRewardsDesc: string;
  featSecureTitle: string;
  featSecureDesc: string;
  footerCopy: string;
}

export interface AppContent {
  help: ContentPage;
  privacy: ContentPage;
  terms: ContentPage;
  landing: LandingContent;
}

export enum AppView {
  Landing = 'landing',
  Login = 'login',
  Dashboard = 'dashboard',
  Partners = 'partners',
  Users = 'users',
  UserDetails = 'user_details',
  Campaigns = 'campaigns',
  CampaignAnalytics = 'campaign_analytics',
  Moderation = 'moderation',
  AIAnalysis = 'ai_analysis',
  AdminContent = 'admin_content',
  DataExport = 'data_export',
  // Shopper Views
  ShopperLogin = 'shopper_login',
  ShopperSignup = 'shopper_signup',
  ShopperDashboard = 'shopper_dashboard',
  ShopperScan = 'shopper_scan',
  ShopperRewards = 'shopper_rewards',
  ShopperActivity = 'shopper_activity',
  ShopperProfile = 'shopper_profile',
  ShopperNotifications = 'shopper_notifications',
  // Shopper Static Pages
  ShopperHelp = 'shopper_help',
  ShopperPrivacy = 'shopper_privacy',
  ShopperTerms = 'shopper_terms'
}

export type Language = 'en' | 'fr';
