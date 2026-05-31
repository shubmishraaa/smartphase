import { Search, Bell, Menu, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TopBar() {
  const { setSidebarOpen } = useAppStore();

  return (
    <header className="h-14 bg-bg-secondary/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden text-text-secondary hover:text-text-primary transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-bg-primary/60 border border-white/[0.06] rounded-xl px-3 py-1.5 w-[320px]">
          <Search size={15} className="text-text-secondary" />
          <input
            type="text"
            placeholder="Search properties, localities..."
            className="bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none w-full"
          />
          <kbd className="text-[10px] text-text-secondary/50 bg-white/[0.05] rounded px-1.5 py-0.5">/</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors relative">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue" />
        </button>
        <button className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
          <Settings size={17} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-xs font-medium ml-1">
          SM
        </div>
      </div>
    </header>
  );
}
