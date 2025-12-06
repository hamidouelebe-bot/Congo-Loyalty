
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Partners from './views/Partners';
import Users from './views/Users';
import UserDetails from './views/UserDetails';
import Campaigns from './views/Campaigns';
import CampaignAnalytics from './views/CampaignAnalytics';
import Moderation from './views/Moderation';
import AIAnalysis from './views/AIAnalysis';
import AdminContent from './views/AdminContent';
import DataExport from './views/DataExport';
import AdminRewards from './views/AdminRewards';
import LandingPage from './views/LandingPage';
import Login from './views/Login';
import AdminSignup from './views/AdminSignup';
import PartnerLogin from './views/PartnerLogin';
import PartnerSignup from './views/PartnerSignup';
import PartnerDashboard from './views/PartnerDashboard';
import ShopperLogin from './views/ShopperLogin';
import ShopperSignup from './views/ShopperSignup';
import ShopperDashboard from './views/ShopperDashboard';
import ShopperScan from './views/ShopperScan';
import ShopperRewards from './views/ShopperRewards';
import ShopperActivity from './views/ShopperActivity';
import ShopperProfile from './views/ShopperProfile';
import ShopperStaticPage from './views/ShopperStaticPage';
import ShopperNotifications from './views/ShopperNotifications';
import { AppView, Language, AppContent, User, Notification, Supermarket, Partner } from './types';
import { IconSearch, IconBell } from './components/Icons';
import { INITIAL_CONTENT, MOCK_NOTIFICATIONS } from './constants';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.Landing);
  // Default to French
  const [lang, setLang] = useState<Language>('fr');
  
  // Data State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If Admin, we fetch all users. If Shopper, we don't strictly need all users here unless we want to check duplicates locally (which we don't anymore).
        // Only fetch global data if we are likely an admin or just want to preload.
        // For now, let's keep it simple: Fetch users if we are admin or just on mount.
        const [usersData, supermarketsData] = await Promise.all([
          api.users.getAll(),
          api.supermarkets.getAll()
        ]);
        setAllUsers(usersData);
        setPartners(supermarketsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check LocalStorage for session
    const savedShopperUser = localStorage.getItem('shopperUser');
    const savedPartnerUser = localStorage.getItem('partnerUser');
    const savedAdminSession = localStorage.getItem('adminSession');
    
    if (savedShopperUser) {
      try {
        const user = JSON.parse(savedShopperUser);
        setShopperUser(user);
        setIsAuthenticated(true);
        setUserRole('shopper');
        setCurrentView(AppView.ShopperDashboard);
      } catch (e) {
        localStorage.removeItem('shopperUser');
      }
    } else if (savedPartnerUser) {
      try {
        const partner = JSON.parse(savedPartnerUser);
        setPartnerUser(partner);
        setIsAuthenticated(true);
        setUserRole('partner');
        setCurrentView(AppView.PartnerDashboard);
      } catch (e) {
        localStorage.removeItem('partnerUser');
      }
    } else if (savedAdminSession) {
      setIsAuthenticated(true);
      setUserRole('admin');
      setCurrentView(AppView.Dashboard);
    }

    fetchData();
  }, []);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'shopper' | 'partner' | null>(null);
  
  // Shopper State
  const [shopperUser, setShopperUser] = useState<User | null>(null);
  
  // Partner State
  const [partnerUser, setPartnerUser] = useState<Partner | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Navigation State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Content Management State (Shared between Admin Editor and Shopper Views)
  const [appContent, setAppContent] = useState<AppContent>(INITIAL_CONTENT);

  // Fetch Notifications when Shopper logs in
  useEffect(() => {
    const fetchNotifications = async () => {
      if (shopperUser) {
        try {
           const notifs = await api.notifications.getByUserId(shopperUser.id);
           setNotifications(notifs);
        } catch (error) {
           console.error("Failed to fetch notifications", error);
        }
      }
    };
    fetchNotifications();
  }, [shopperUser]);

  const handleNavigate = (view: AppView, id?: string) => {
    if (id) setSelectedId(id);
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Close menu on navigation
  };

  const handleAdminLogin = () => {
    setIsAuthenticated(true);
    setUserRole('admin');
    setCurrentView(AppView.Dashboard);
    localStorage.setItem('adminSession', 'true');
  };

  const handlePartnerLogin = (partner: Partner) => {
    setPartnerUser(partner);
    setIsAuthenticated(true);
    setUserRole('partner');
    setCurrentView(AppView.PartnerDashboard);
    localStorage.setItem('partnerUser', JSON.stringify(partner));
  };

  const checkPointsExpiration = (user: User): User => {
    // ... (keep existing logic if valid, but maybe move to backend eventually)
    // For now, client-side check is fine for the UI notification simulation
    const updatedUser = { ...user };
    
    if (updatedUser.pointsExpiresAt && updatedUser.pointsExpiring > 0) {
       // Logic preserved from original file... 
       // (Omitting full body for brevity in this edit unless user asks to change logic)
       // actually I need to keep the function body or it will be lost.
       // I'll just copy the function body from original.
      const today = new Date();
      const expDate = new Date(updatedUser.pointsExpiresAt);

      // 1. Check for Expiration Warning
      const warningDate = new Date(expDate);
      warningDate.setDate(warningDate.getDate() - 7);
      
      if (today >= warningDate && today < expDate) {
         const hasWarning = notifications.some(n => n.type === 'expiration' && n.userId === user.id && n.title.includes('Warning'));
         if (!hasWarning) {
            const warningNotif: Notification = {
              id: `warn-${Date.now()}`,
              userId: user.id,
              title: 'Points Expiration Warning',
              message: `You have ${user.pointsExpiring} points expiring soon on ${user.pointsExpiresAt}. Redeem them now!`,
              date: new Date().toISOString().split('T')[0],
              read: false,
              type: 'expiration'
            };
            setNotifications(prev => [warningNotif, ...prev]);
         }
      }

      // 2. Check for Expiration
      if (today > expDate) {
        // In real app, backend handles this. Frontend just notifies.
        const expiredNotif: Notification = {
          id: `exp-${Date.now()}`,
          userId: user.id,
          title: 'Points Expired',
          message: `${user.pointsExpiring} points have expired from your balance as of ${user.pointsExpiresAt}.`,
          date: new Date().toISOString().split('T')[0],
          read: false,
          type: 'expiration'
        };
        // Ideally check if we already showed this
        setNotifications(prev => [expiredNotif, ...prev]);

        updatedUser.pointsBalance = Math.max(0, updatedUser.pointsBalance - updatedUser.pointsExpiring);
        updatedUser.pointsExpiring = 0;
        updatedUser.pointsExpiresAt = null; 
        updatedUser.nextExpirationDate = null;
      }
    }
    return updatedUser;
  };

  const handleShopperLogin = (user: User) => {
    const updatedUser = checkPointsExpiration(user);
    setShopperUser(updatedUser);
    setIsAuthenticated(true);
    setUserRole('shopper');
    setCurrentView(AppView.ShopperDashboard);
    localStorage.setItem('shopperUser', JSON.stringify(updatedUser));
  };

  const updateShopperUser = (user: User) => {
    setShopperUser(user);
    localStorage.setItem('shopperUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setShopperUser(null);
    setPartnerUser(null);
    setCurrentView(AppView.Landing);
    setIsMobileMenuOpen(false);
    localStorage.removeItem('shopperUser');
    localStorage.removeItem('partnerUser');
    localStorage.removeItem('adminSession');
  };

  // --- PUBLIC / UNAUTH VIEWS ---
  if (!isAuthenticated) {
    if (currentView === AppView.Login) {
      return <Login onLogin={handleAdminLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.AdminSignup) {
      return <AdminSignup onSignup={handleAdminLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.PartnerLogin) {
      return <PartnerLogin onLogin={handlePartnerLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.PartnerSignup) {
      return <PartnerSignup onSignup={handlePartnerLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.ShopperLogin) {
      return <ShopperLogin onLogin={handleShopperLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.ShopperSignup) {
      return <ShopperSignup onLogin={handleShopperLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    // Default to Landing Page
    return <LandingPage onNavigate={setCurrentView} lang={lang} setLang={setLang} content={appContent.landing} />;
  }

  // --- PARTNER APP VIEW ---
  if (userRole === 'partner') {
    if (!partnerUser) {
      handleLogout();
      return null;
    }
    return <PartnerDashboard partner={partnerUser} onNavigate={setCurrentView} onLogout={handleLogout} lang={lang} />;
  }

  // --- SHOPPER APP VIEW ---
  if (userRole === 'shopper') {
    if (!shopperUser) {
      // Fallback if role is set but user data missing (should not happen)
      handleLogout();
      return null;
    }
    
    switch (currentView) {
      case AppView.ShopperDashboard: return <ShopperDashboard user={shopperUser} notifications={notifications} onNavigate={setCurrentView} onLogout={handleLogout} lang={lang} />;
      case AppView.ShopperScan: return <ShopperScan onNavigate={setCurrentView} lang={lang} />;
      case AppView.ShopperRewards: return <ShopperRewards user={shopperUser} onNavigate={setCurrentView} lang={lang} onUpdateUser={updateShopperUser} />;
      case AppView.ShopperActivity: return <ShopperActivity onNavigate={setCurrentView} lang={lang} />;
      case AppView.ShopperProfile: return <ShopperProfile user={shopperUser} onNavigate={setCurrentView} onLogout={handleLogout} lang={lang} />;
      case AppView.ShopperNotifications: return <ShopperNotifications notifications={notifications} onNavigate={setCurrentView} lang={lang} />;
      // Static Pages
      case AppView.ShopperHelp: return <ShopperStaticPage onNavigate={setCurrentView} pageData={appContent.help} lang={lang} />;
      case AppView.ShopperPrivacy: return <ShopperStaticPage onNavigate={setCurrentView} pageData={appContent.privacy} lang={lang} />;
      case AppView.ShopperTerms: return <ShopperStaticPage onNavigate={setCurrentView} pageData={appContent.terms} lang={lang} />;
      default: return <ShopperDashboard user={shopperUser} notifications={notifications} onNavigate={setCurrentView} onLogout={handleLogout} lang={lang} />;
    }
  }

  // --- ADMIN CONSOLE VIEW ---
  // STRICT CHECK: Only render if role is explicitly admin
  if (userRole === 'admin') {
    const renderAdminView = () => {
      switch (currentView) {
        case AppView.Dashboard: return <Dashboard lang={lang} />;
        case AppView.Partners: return <Partners lang={lang} partners={partners} setPartners={setPartners} />;
        case AppView.Users: return <Users lang={lang} users={allUsers} setUsers={setAllUsers} onNavigate={handleNavigate} />;
        case AppView.UserDetails: return <UserDetails lang={lang} userId={selectedId} onNavigate={handleNavigate} />;
        case AppView.Campaigns: return <Campaigns lang={lang} onNavigate={handleNavigate} />;
        case AppView.CampaignAnalytics: return <CampaignAnalytics lang={lang} campaignId={selectedId} onNavigate={handleNavigate} />;
        case AppView.Moderation: return <Moderation lang={lang} />;
        case AppView.AIAnalysis: return <AIAnalysis lang={lang} />;
        case AppView.DataExport: return <DataExport lang={lang} />;
        case AppView.AdminRewards: return <AdminRewards lang={lang} />;
        case AppView.AdminContent: return <AdminContent content={appContent} onUpdateContent={setAppContent} lang={lang} />;
        default: return <Dashboard lang={lang} />;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Sidebar 
          currentView={currentView} 
          setView={(v) => handleNavigate(v)} 
          lang={lang} 
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        
        <div className="md:ml-64 flex flex-col min-h-screen transition-all duration-300">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
               {/* Mobile Menu Trigger */}
               <button 
                 onClick={() => setIsMobileMenuOpen(true)} 
                 className="md:hidden text-gray-500 hover:text-gray-700 p-1"
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
               </button>
               <span className="font-bold text-blue-900 md:hidden">DRC Loyalty Admin</span>
            </div>
            
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96">
              <IconSearch className="text-gray-400 w-5 h-5 mr-2" />
              <input 
                type="text" 
                placeholder={lang === 'fr' ? "Rechercher..." : "Search..."} 
                className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-700" 
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang('fr')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === 'fr' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  FR
                </button>
              </div>
              <button className="text-gray-500 hover:text-gray-700 relative">
                <IconBell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {renderAdminView()}
          </main>
        </div>
      </div>
    );
  }

  // --- FALLBACK (Unauthorized State) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
         <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
         <p className="text-gray-600 mb-4">You do not have permission to view this page or your session is invalid.</p>
         <button onClick={handleLogout} className="bg-gray-800 text-white px-4 py-2 rounded-lg">Return Home</button>
      </div>
    </div>
  );
};

export default App;
