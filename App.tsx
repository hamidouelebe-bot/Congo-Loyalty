
import React, { useState } from 'react';
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
import LandingPage from './views/LandingPage';
import Login from './views/Login';
import ShopperLogin from './views/ShopperLogin';
import ShopperSignup from './views/ShopperSignup';
import ShopperDashboard from './views/ShopperDashboard';
import ShopperScan from './views/ShopperScan';
import ShopperRewards from './views/ShopperRewards';
import ShopperActivity from './views/ShopperActivity';
import ShopperProfile from './views/ShopperProfile';
import ShopperStaticPage from './views/ShopperStaticPage';
import ShopperNotifications from './views/ShopperNotifications';
import { AppView, Language, AppContent, User, Notification, Supermarket } from './types';
import { IconSearch, IconBell } from './components/Icons';
import { INITIAL_CONTENT, MOCK_USERS, MOCK_NOTIFICATIONS, MOCK_SUPERMARKETS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.Landing);
  // Default to French
  const [lang, setLang] = useState<Language>('fr');
  
  // Data State (Lifted Up for Persistence in Demo Mode)
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [partners, setPartners] = useState<Supermarket[]>(MOCK_SUPERMARKETS);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'shopper' | null>(null);
  
  // Shopper State
  const [shopperUser, setShopperUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  
  // Navigation State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Content Management State (Shared between Admin Editor and Shopper Views)
  const [appContent, setAppContent] = useState<AppContent>(INITIAL_CONTENT);

  const handleNavigate = (view: AppView, id?: string) => {
    if (id) setSelectedId(id);
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Close menu on navigation
  };

  const handleAdminLogin = () => {
    setIsAuthenticated(true);
    setUserRole('admin');
    setCurrentView(AppView.Dashboard);
  };

  const checkPointsExpiration = (user: User): User => {
    const updatedUser = { ...user };
    
    if (updatedUser.pointsExpiresAt && updatedUser.pointsExpiring > 0) {
      const today = new Date();
      // Use current time, or fix a date for testing expiration
      const expDate = new Date(updatedUser.pointsExpiresAt);

      // 1. Check for Expiration Warning (e.g. 7 days before) to simulate Email sending
      const warningDate = new Date(expDate);
      warningDate.setDate(warningDate.getDate() - 7);
      
      if (today >= warningDate && today < expDate) {
         // Simulate Backend Job sending email
         console.info(`[Backend Notification Service] Sending expiration warning email to ${user.email}: "Your ${user.pointsExpiring} points expire on ${user.pointsExpiresAt}"`);
         
         // Add warning notification if not exists
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
        console.warn(`[Backend Point Service] Points expired for user ${user.id}. Deducting ${user.pointsExpiring} points.`);
        
        // Add expiration notification
        const expiredNotif: Notification = {
          id: `exp-${Date.now()}`,
          userId: user.id,
          title: 'Points Expired',
          message: `${user.pointsExpiring} points have expired from your balance as of ${user.pointsExpiresAt}.`,
          date: new Date().toISOString().split('T')[0],
          read: false,
          type: 'expiration'
        };
        setNotifications(prev => [expiredNotif, ...prev]);

        updatedUser.pointsBalance = Math.max(0, updatedUser.pointsBalance - updatedUser.pointsExpiring);
        updatedUser.pointsExpiring = 0;
        updatedUser.pointsExpiresAt = null; // Clear or set next expiration date
        updatedUser.nextExpirationDate = null;
        
        alert('Notice: Some of your points have expired and were deducted from your balance. Check notifications for details.');
      }
    }
    return updatedUser;
  };

  const handleShopperLogin = (user: User) => {
    // Run Expiration Check Job
    const updatedUser = checkPointsExpiration(user);

    setShopperUser(updatedUser);
    setIsAuthenticated(true);
    setUserRole('shopper');
    setCurrentView(AppView.ShopperDashboard);
  };

  const handleShopperSignup = (newUser: User) => {
    // Add to local state (for Demo mode persistence)
    setAllUsers(prev => [...prev, newUser]);
    // Log them in immediately
    handleShopperLogin(newUser);
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setShopperUser(null);
    setCurrentView(AppView.Landing);
    setIsMobileMenuOpen(false);
  };

  // --- PUBLIC / UNAUTH VIEWS ---
  if (!isAuthenticated) {
    if (currentView === AppView.Login) {
      return <Login onLogin={handleAdminLogin} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.ShopperLogin) {
      return <ShopperLogin onLogin={handleShopperLogin} users={allUsers} onNavigate={setCurrentView} lang={lang} />;
    }
    if (currentView === AppView.ShopperSignup) {
      return <ShopperSignup onLogin={handleShopperSignup} onNavigate={setCurrentView} lang={lang} />;
    }
    // Default to Landing Page
    return <LandingPage onNavigate={setCurrentView} lang={lang} setLang={setLang} content={appContent.landing} />;
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
      case AppView.ShopperRewards: return <ShopperRewards user={shopperUser} onNavigate={setCurrentView} lang={lang} />;
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
