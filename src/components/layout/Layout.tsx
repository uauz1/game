import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07090d] text-off-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -right-40 top-24 h-[460px] w-[460px] rounded-full bg-[#f6b94f]/[.045] blur-3xl" />
        <div className="absolute -left-40 bottom-20 h-[420px] w-[420px] rounded-full bg-[#f6b94f]/[.03] blur-3xl" />
      </div>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}