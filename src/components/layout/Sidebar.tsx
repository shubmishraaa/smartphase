import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageSquare, Heart, Map, Play,
  ScanLine, Handshake, Users, TrendingUp, X, Search, Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'chat', label: 'AI Realtor', icon: MessageSquare },
  { id: 'lifestyle', label: 'Lifestyle Match', icon: Heart },
  { id: 'map', label: 'Smart Map', icon: Map },
  { id: 'simulator', label: 'Life Simulator', icon: Play },
  { id: 'xray', label: 'Property X-Ray', icon: ScanLine },
  { id: 'negotiation', label: 'Negotiation', icon: Handshake },
  { id: 'family', label: 'Family Compass', icon: Users },
  { id: 'investment', label: 'Investment Intel', icon: TrendingUp },
];

export default function Sidebar() {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed left-0 top-0 h-full w-[240px] bg-bg-secondary border-r border-white/[0.08] z-50 flex flex-col
          md:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <span className="text-text-primary font-medium text-[15px]">SmartSpace</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-text-secondary hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveModule(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                    ${isActive
                      ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }`}
                >
                  <item.icon size={18} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* AI status */}
        <div className="p-4 border-t border-white/[0.08]">
          <div className="glass-card p-3 rounded-xl flex items-start gap-2.5">
            <Sparkles size={16} className="text-accent-green mt-0.5" />
            <div>
              <p className="text-[11px] text-text-primary font-medium">AI assistant ready</p>
              <p className="text-[11px] text-text-secondary mt-1">Uses Vercel env when available, with instant demo fallback.</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
