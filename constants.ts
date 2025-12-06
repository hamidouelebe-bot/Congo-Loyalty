
import { User, UserStatus, Supermarket, Campaign, Receipt, ReceiptStatus, Language, AppContent, Notification } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', firstName: 'Jean', lastName: 'Kabeya', email: 'jean.k@example.com', phoneNumber: '+243 81 123 4567', status: UserStatus.Active, pointsBalance: 1250, pointsExpiring: 200, nextExpirationDate: '2024-06-30', pointsExpiresAt: '2024-06-30', totalSpent: 45000, joinedDate: '2023-11-15', gender: 'Male', birthdate: '1990-05-15', pin: '1234', segment: 'Regular' },
  { id: '2', firstName: 'Marie', lastName: 'Lumba', email: 'marie.l@example.com', phoneNumber: '+243 99 876 5432', status: UserStatus.Active, pointsBalance: 3400, pointsExpiring: 0, nextExpirationDate: null, pointsExpiresAt: null, totalSpent: 120000, joinedDate: '2023-10-01', gender: 'Female', birthdate: '1985-11-20', pin: '1234', segment: 'VIP' },
  { id: '3', firstName: 'Patrick', lastName: 'Mbuyi', email: 'pat.mbuyi@example.com', phoneNumber: '+243 82 555 0101', status: UserStatus.Suspended, pointsBalance: 0, pointsExpiring: 0, nextExpirationDate: null, pointsExpiresAt: null, totalSpent: 1500, joinedDate: '2024-01-20', gender: 'Male', birthdate: '1998-02-10', pin: '1234', segment: 'ChurnRisk' },
  { id: '4', firstName: 'Sarah', lastName: 'Ngalula', email: 's.ngalula@gmail.com', phoneNumber: '+243 90 000 1122', status: UserStatus.Banned, pointsBalance: 0, pointsExpiring: 0, nextExpirationDate: null, pointsExpiresAt: null, totalSpent: 500, joinedDate: '2024-05-10', gender: 'Female', birthdate: '2000-07-04', pin: '1234', segment: 'New' },
  { id: '5', firstName: 'David', lastName: 'Ilunga', email: 'david.il@hotmail.com', phoneNumber: '+243 85 444 3322', status: UserStatus.Active, pointsBalance: 560, pointsExpiring: 50, nextExpirationDate: '2024-07-15', pointsExpiresAt: '2024-07-15', totalSpent: 22000, joinedDate: '2023-12-05', gender: 'Male', birthdate: '1992-09-30', pin: '1234', segment: 'Regular' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', userId: '1', title: 'Points Expiring Soon', message: 'You have 200 points expiring on June 30th. Redeem them now!', date: '2024-06-01', read: false, type: 'expiration' },
  { id: '2', userId: '1', title: 'Double Points Weekend', message: 'Earn 2x points at Kin Marché this Saturday.', date: '2024-05-28', read: true, type: 'system' },
];

export const MOCK_SUPERMARKETS: Supermarket[] = [
  { 
    id: '1', 
    name: 'Kin Marché', 
    address: '33 Blvd du 30 Juin, Gombe', 
    active: true, 
    logoUrl: 'https://picsum.photos/40/40', 
    avgBasket: 45000,
    businessHours: '08:00 - 22:00',
    latitude: -4.3025,
    longitude: 15.3050 
  },
  { 
    id: '2', 
    name: 'Shoprite', 
    address: 'GB Shopping Mall', 
    active: true, 
    logoUrl: 'https://picsum.photos/40/41', 
    avgBasket: 62000,
    businessHours: '09:00 - 21:00',
    latitude: -4.3211,
    longitude: 15.2890
  },
  { 
    id: '3', 
    name: 'GG Mart', 
    address: 'Av. Kasa-Vubu, Bandal', 
    active: true, 
    logoUrl: 'https://picsum.photos/40/42', 
    avgBasket: 28000,
    businessHours: '07:00 - 23:00',
    latitude: -4.3400,
    longitude: 15.2700 
  },
  { 
    id: '4', 
    name: 'Regal', 
    address: 'Limete 1ère Rue', 
    active: false, 
    logoUrl: 'https://picsum.photos/40/43', 
    avgBasket: 31000,
    businessHours: '08:30 - 20:30',
    latitude: -4.3600,
    longitude: 15.3500
  },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  { 
    id: '1', 
    name: 'Rentrée Scolaire Kellogg\'s', 
    brand: 'Kellogg\'s', 
    status: 'active', 
    startDate: '2024-08-15', 
    endDate: '2024-09-15', 
    conversions: 1240,
    maxRedemptions: 5000,
    mechanic: 'Achetez 2 boîtes de Corn Flakes',
    minSpend: 15000,
    targetAudience: 'all',
    supermarketIds: ['1', '2'],
    rewardType: 'points',
    rewardValue: 500
  },
  { 
    id: '2', 
    name: 'Heineken Summer Fest', 
    brand: 'Bralima', 
    status: 'draft', 
    startDate: '2024-11-01', 
    endDate: '2024-12-31', 
    conversions: 0,
    maxRedemptions: 200,
    mechanic: 'Dépensez plus de 20,000 FC en produits Heineken',
    minSpend: 20000,
    targetAudience: 'vip',
    supermarketIds: ['1', '2', '3', '4'],
    rewardType: 'giveaway',
    rewardValue: 'T-Shirt Marque'
  },
  { 
    id: '3', 
    name: 'Nutrition Nido', 
    brand: 'Nestlé', 
    status: 'ended', 
    startDate: '2024-01-01', 
    endDate: '2024-02-01', 
    conversions: 3450,
    maxRedemptions: 3500,
    mechanic: 'Achetez 1 Nido 2.5kg',
    minSpend: 0,
    targetAudience: 'new',
    supermarketIds: ['3'],
    rewardType: 'voucher',
    rewardValue: 'Bon de 10%'
  },
];

export const MOCK_RECEIPTS: Receipt[] = [
  { 
    id: 'R-1023', 
    userId: '1', 
    supermarketName: 'Kin Marché', 
    amount: 54000, 
    date: '2024-05-20', 
    status: ReceiptStatus.Pending, 
    confidenceScore: 0.85, 
    imageUrl: 'https://picsum.photos/200/300',
    items: [
      { name: 'Kelloggs Corn Flakes', quantity: 2, unitPrice: 12000, total: 24000, category: 'Cereals' },
      { name: 'Nido Milk Powder', quantity: 1, unitPrice: 30000, total: 30000, category: 'Dairy' }
    ]
  },
  { 
    id: 'R-1024', 
    userId: '2', 
    supermarketName: 'Shoprite', 
    amount: 125000, 
    date: '2024-05-20', 
    status: ReceiptStatus.Pending, 
    confidenceScore: 0.45, 
    imageUrl: 'https://picsum.photos/201/300',
    items: [
      { name: 'Heineken Case (24)', quantity: 2, unitPrice: 50000, total: 100000, category: 'Beverages' },
      { name: 'Pringles Original', quantity: 5, unitPrice: 5000, total: 25000, category: 'Snacks' }
    ]
  },
  { 
    id: 'R-1025', 
    userId: '5', 
    supermarketName: 'GG Mart', 
    amount: 22000, 
    date: '2024-05-19', 
    status: ReceiptStatus.Verified, 
    confidenceScore: 0.98, 
    imageUrl: 'https://picsum.photos/202/300',
    items: [
      { name: 'Coca-Cola 6-pack', quantity: 2, unitPrice: 11000, total: 22000, category: 'Beverages' }
    ]
  },
];

export const INITIAL_CONTENT: AppContent = {
  help: {
    title: "Aide & Support",
    content: "Bienvenue dans le centre d'aide DRC Loyalty.\n\nComment gagner des points ?\nScannez simplement votre reçu après chaque achat dans nos supermarchés partenaires. Nos systèmes valideront votre achat et créditeront votre compte.\n\nMon reçu a été rejeté, pourquoi ?\nAssurez-vous que la photo est claire, que la date et le nom du magasin sont visibles. Les reçus de plus de 7 jours ne sont pas acceptés.\n\nContactez-nous :\nEmail: support@drcloyalty.com\nTel: +243 81 000 0000"
  },
  privacy: {
    title: "Politique de Confidentialité",
    content: "Dernière mise à jour : Mai 2024\n\n1. Collecte des données\nNous collectons votre numéro de téléphone, votre nom et les données relatives à vos achats (reçus scannés) pour vous fournir nos services de fidélité.\n\n2. Utilisation des données\nVos données sont utilisées pour calculer vos points, personnaliser les offres et améliorer nos services. Nous ne vendons pas vos données personnelles à des tiers sans votre consentement.\n\n3. Sécurité\nNous mettons en œuvre des mesures de sécurité techniques pour protéger vos informations."
  },
  terms: {
    title: "Conditions d'Utilisation",
    content: "En utilisant l'application DRC Loyalty, vous acceptez les conditions suivantes :\n\n1. Éligibilité\nVous devez avoir au moins 18 ans et résider en RDC pour utiliser ce service.\n\n2. Points et Récompenses\nLes points n'ont pas de valeur monétaire directe et ne peuvent être échangés contre de l'argent. DRC Loyalty se réserve le droit de modifier la valeur des points à tout moment.\n\n3. Fraude\nTout compte suspecté de soumettre de faux reçus sera immédiatement suspendu."
  },
  landing: {
    appName: 'Loyalty',
    heroTitle1: 'Le Futur du ',
    heroTitle2: 'Retail',
    heroTitle3: ' au Congo.',
    heroDesc: 'Rejoignez le programme de fidélité le plus innovant de la RDC. Scannez vos reçus, cumulez des points et gagnez des récompenses exclusives auprès de vos marques préférées.',
    btnDownload: 'Télécharger l\'App',
    whyTitle: 'Pourquoi choisir DRC Loyalty ?',
    whyDesc: 'Notre mission est de valoriser chaque achat. Que vous fassiez vos courses au supermarché ou dans une boutique partenaire, DRC Loyalty transforme vos dépenses en avantages tangibles.',
    featScanTitle: 'Scan Simple',
    featScanDesc: 'Une simple photo de votre ticket de caisse suffit pour valider vos achats.',
    featRewardsTitle: 'Récompenses Réelles',
    featRewardsDesc: 'Convertissez vos points en crédit d\'appel, bons d\'achat ou produits gratuits.',
    featSecureTitle: '100% Sécurisé',
    featSecureDesc: 'Vos données sont protégées et vos points sont garantis à vie.',
    footerCopy: '© 2024 DRC Loyalty. Tous droits réservés.'
  }
};

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    // Admin Keys
    dashboard: 'Dashboard',
    partners: 'Partners',
    users: 'Users',
    campaigns: 'Campaigns',
    moderation: 'Moderation',
    ai_analysis: 'AI Analysis',
    content_management: 'Content Management',
    data_export: 'Data Export',
    rewards_management: 'Rewards',
    active_users: 'Active Users',
    total_sales: 'Total Sales Volume',
    receipts_processed: 'Receipts Processed',
    avg_basket: 'Avg Basket',
    recent_activity: 'Recent Activity',
    top_brands: 'Top Brands',
    view_details: 'View Details',
    status: 'Status',
    actions: 'Actions',
    create_new: 'Create New',
    ban_user: 'Ban User',
    approve: 'Approve',
    reject: 'Reject',
    confidence: 'AI Confidence',
    ask_ai: 'Ask Gemini Analyst',
    ai_placeholder: 'Ask a question about your data (e.g. "Summarize sales trend for Kin Marché")',
    analyze: 'Analyze',
    thinking: 'Analyzing...',

    // Data Export
    export_title: 'Data Export',
    export_desc: 'Download comprehensive datasets including user profiles, transactions, and POS metadata for downstream analysis.',
    export_transactions_btn: 'Export Comprehensive Transactions (CSV)',
    export_users_btn: 'Export User Profiles (CSV)',
    export_items_btn: 'Export Item-Level Analysis (CSV)',
    export_items_desc: 'Deep dive into user spending habits with total quantity and value spent per product item.',
    export_generating: 'Generating...',
    export_success: 'Download Started',

    // Landing Page (Fallback)
    landing: {
      nav_shopper: 'Client App',
      nav_partner: 'Partner Access',
      footer_terms: 'Terms',
      footer_privacy: 'Privacy',
      footer_help: 'Help',
    },

    // Auth
    auth: {
      welcome_back: 'Welcome Back',
      sign_in_subtitle: 'Sign in to access your admin dashboard',
      email_label: 'Email Address',
      password_label: 'Password',
      sign_in_btn: 'Sign In',
      back_home: '← Back to Home',
      shopper_login_title: 'Client Login',
      shopper_login_desc: 'Enter your phone and PIN to access rewards.',
      phone_label: 'Phone Number',
      continue_btn: 'Continue',
      login_btn: 'Log In',
      verifying: 'Verifying...',
      not_client: 'Not a client yet?',
      partner_link: 'Partner & Admin Login',
      back_website: 'Back to Website',
      // Signup
      create_account: 'Create Account',
      signup_title: 'Join the Program',
      signup_subtitle: 'Start earning rewards today.',
      first_name: 'First Name',
      last_name: 'Last Name',
      gender_label: 'Gender',
      birthdate_label: 'Date of Birth',
      pin_code: 'Secret PIN (4 digits)',
      have_account: 'Already have an account?',
      login_link: 'Log in',
      signup_btn: 'Send Verification Code',
      verify_btn: 'Verify & Create Account',
      creating_account: 'Creating account...',
      select_gender: 'Select Gender',
      gender_male: 'Male',
      gender_female: 'Female',
      gender_other: 'Other',
      // OTP
      otp_title: 'Verify Email',
      otp_desc: 'We sent a 6-digit code to',
      otp_label: 'Enter OTP Code',
      otp_placeholder: '123456',
      resend_code: 'Resend Code',
    },

    // Shopper UI
    shopper: {
      welcome: 'Welcome back,',
      points_balance: 'Points Balance',
      scan_receipt: 'Scan a Receipt',
      earn_now: 'Earn points now',
      recent_activity: 'Recent Activity',
      view_all: 'View All',
      for_you: 'For You',
      exclusive: 'Exclusive',
      offer_title: 'Double Points this Weekend',
      offer_desc: 'Shop at Kin Marché this Saturday and get 2x points on Kellogg\'s products.',
      view_offer: 'View Offer',
      nav_home: 'Home',
      nav_rewards: 'Rewards',
      nav_activity: 'Activity',
      nav_profile: 'Profile',
      verified: 'verified',
      pending: 'pending',
      rejected: 'rejected',
      no_transactions: 'No recent transactions',
      // Expiration
      notifications: 'Notifications',
      no_notifications: 'No new notifications',
      expiring_warning: 'Points Expiring Soon',
      expiring_message: '{{amount}} points will expire on {{date}}.',
      expires_on: 'Expires on',
    }
  },
  fr: {
    // Admin Keys
    dashboard: 'Tableau de Bord',
    partners: 'Partenaires',
    users: 'Utilisateurs',
    campaigns: 'Campagnes',
    moderation: 'Modération',
    ai_analysis: 'Analyse IA',
    content_management: 'Gestion du Contenu',
    data_export: 'Export de Données',
    rewards_management: 'Récompenses',
    active_users: 'Utilisateurs Actifs',
    total_sales: 'Volume Total des Ventes',
    receipts_processed: 'Reçus Traités',
    avg_basket: 'Panier Moyen',
    recent_activity: 'Activité Récente',
    top_brands: 'Marques Performantes',
    view_details: 'Voir Détails',
    status: 'Statut',
    actions: 'Actions',
    create_new: 'Créer Nouveau',
    ban_user: 'Bannir',
    approve: 'Approuver',
    reject: 'Rejeter',
    confidence: 'Confiance IA',
    ask_ai: 'Demander à l\'Analyste Gemini',
    ai_placeholder: 'Posez une question sur vos données (ex: "Résumez la tendance des ventes pour Kin Marché")',
    analyze: 'Analyser',
    thinking: 'Analyse en cours...',

    // Data Export
    export_title: 'Export de Données',
    export_desc: 'Téléchargez des jeux de données complets incluant les profils utilisateurs, transactions et métadonnées POS pour vos analyses.',
    export_transactions_btn: 'Exporter Transactions Complètes (CSV)',
    export_users_btn: 'Exporter Profils Utilisateurs (CSV)',
    export_items_btn: 'Exporter Analyse par Article (CSV)',
    export_items_desc: 'Analysez les habitudes d\'achat avec les quantités et montants dépensés par article.',
    export_generating: 'Génération...',
    export_success: 'Téléchargement Lancé',

    // Landing Page (Fallback)
    landing: {
      nav_shopper: 'App Client',
      nav_partner: 'Accès Partenaire',
      footer_terms: 'Conditions',
      footer_privacy: 'Confidentialité',
      footer_help: 'Aide',
    },

    // Auth
    auth: {
      welcome_back: 'Bon retour',
      sign_in_subtitle: 'Connectez-vous pour accéder à votre tableau de bord admin',
      email_label: 'Adresse Email',
      password_label: 'Mot de passe',
      sign_in_btn: 'Se connecter',
      back_home: '← Retour à l\'accueil',
      shopper_login_title: 'Connexion Client',
      shopper_login_desc: 'Entrez votre téléphone et PIN pour accéder aux récompenses.',
      phone_label: 'Numéro de Téléphone',
      continue_btn: 'Continuer',
      login_btn: 'Se Connecter',
      verifying: 'Vérification...',
      not_client: 'Pas encore client ?',
      partner_link: 'Connexion Partenaire & Admin',
      back_website: 'Retour au Site Web',
      // Signup
      create_account: 'Créer un compte',
      signup_title: 'Rejoindre le Programme',
      signup_subtitle: 'Commencez à gagner des récompenses aujourd\'hui.',
      first_name: 'Prénom',
      last_name: 'Nom',
      gender_label: 'Genre',
      birthdate_label: 'Date de Naissance',
      pin_code: 'Code PIN (4 chiffres)',
      have_account: 'Déjà un compte ?',
      login_link: 'Se connecter',
      signup_btn: 'Envoyer le Code de Vérification',
      verify_btn: 'Vérifier & Créer Compte',
      creating_account: 'Création du compte...',
      select_gender: 'Sélectionner le genre',
      gender_male: 'Homme',
      gender_female: 'Femme',
      gender_other: 'Autre',
      // OTP
      otp_title: 'Vérifier Email',
      otp_desc: 'Nous avons envoyé un code à 6 chiffres à',
      otp_label: 'Entrer le Code OTP',
      otp_placeholder: '123456',
      resend_code: 'Renvoyer le code',
    },

    // Shopper UI
    shopper: {
      welcome: 'Bon retour,',
      points_balance: 'Solde de Points',
      scan_receipt: 'Scanner un Reçu',
      earn_now: 'Gagnez des points maintenant',
      recent_activity: 'Activité Récente',
      view_all: 'Voir Tout',
      for_you: 'Pour Vous',
      exclusive: 'Exclusif',
      offer_title: 'Double Points ce W.E.',
      offer_desc: 'Achetez chez Kin Marché ce samedi et obtenez 2x points sur les produits Kellogg\'s.',
      view_offer: 'Voir l\'offre',
      nav_home: 'Accueil',
      nav_rewards: 'Cadeaux',
      nav_activity: 'Activité',
      nav_profile: 'Profil',
      verified: 'validé',
      pending: 'en attente',
      rejected: 'rejeté',
      no_transactions: 'Aucune transaction récente',
      // Expiration
      notifications: 'Notifications',
      no_notifications: 'Aucune nouvelle notification',
      expiring_warning: 'Expiration Proche',
      expiring_message: '{{amount}} points expireront le {{date}}.',
      expires_on: 'Expire le',
    }
  }
};
