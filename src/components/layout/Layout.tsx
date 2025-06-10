import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { SideNavigation } from './SideNavigation';
import { useAuth } from '../../context/AuthContext';

export function Layout() {
  const { user } = useAuth();
  
  if (!user) {
    return <Outlet />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <SideNavigation />
      
      <main className="md:ml-64 pt-16 pb-16 md:py-8 px-4 md:px-8 max-w-screen-xl mx-auto">
        <Outlet />
      </main>
      
      <MobileNavigation />
    </div>
  );
}