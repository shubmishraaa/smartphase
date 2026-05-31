import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, TrendingUp, Zap, Shield, MapPin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
      });
    }

    function animate() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(59, 130, 246, 0.5)';
        ctx!.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 120)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function CountUpStat({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (end - start) * eased);
      if (ref.current) ref.current.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [end, suffix]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card p-5 rounded-2xl text-center min-w-[180px]"
    >
      <span ref={ref} className="text-3xl font-semibold gradient-text">0</span>
      <p className="text-text-secondary text-xs mt-1.5">{label}</p>
    </motion.div>
  );
}

export default function HomeModule() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  const features = [
    { icon: MessageSquare, title: 'AI Realtor Chat', desc: 'Bilingual AI advisor that understands your lifestyle', color: 'from-blue-500 to-cyan-400', module: 'chat' },
    { icon: Heart, title: 'Lifestyle Match', desc: 'Score properties against your life priorities', color: 'from-purple-500 to-pink-400', module: 'lifestyle' },
    { icon: MapPin, title: 'Smart Map', desc: 'Interactive heatmaps with price and amenity layers', color: 'from-green-500 to-emerald-400', module: 'map' },
    { icon: Zap, title: 'Life Simulator', desc: 'Visualize your daily routine from any property', color: 'from-amber-500 to-orange-400', module: 'simulator' },
    { icon: Shield, title: 'Property X-Ray', desc: 'AI vision analysis of property images', color: 'from-red-500 to-rose-400', module: 'xray' },
    { icon: TrendingUp, title: 'Investment Intel', desc: 'Forecasts, yields, and risk analysis', color: 'from-teal-500 to-cyan-400', module: 'investment' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 px-6">
        <ParticleField />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs text-accent-blue font-medium">AI-Powered Real Estate Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Find the home that fits{' '}
              <span className="gradient-text">your life</span>
              <br />not just your budget
            </h1>
            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered lifestyle matching for Indian real estate. SmartSpace analyzes 847+ properties across Delhi NCR and Mumbai to find your perfect match.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <button
              onClick={() => setActiveModule('chat')}
              className="px-7 py-3 bg-gradient-to-r from-accent-blue to-blue-400 rounded-xl text-white font-medium text-sm hover:shadow-lg hover:shadow-accent-blue/25 transition-all duration-300 flex items-center gap-2"
            >
              <MessageSquare size={16} />
              Start with AI Chat
            </button>
            <button
              onClick={() => setActiveModule('lifestyle')}
              className="px-7 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-text-primary font-medium text-sm hover:bg-white/[0.1] transition-all duration-300 flex items-center gap-2"
            >
              <Heart size={16} />
              Try Lifestyle Match
            </button>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <CountUpStat end={847} label="Properties Analyzed" />
            <CountUpStat end={4} label="Hours Saved per Search" suffix=".2" />
            <CountUpStat end={93} label="Match Accuracy" suffix="%" />
          </div>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent-purple/5 blur-[100px] pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-medium mb-3">Powered by 8 AI Modules</h2>
          <p className="text-text-secondary">Each module works together to give you the complete picture</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.button
              key={f.module}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => setActiveModule(f.module)}
              className="glass-card p-6 rounded-2xl text-left group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={18} className="text-white" />
              </div>
              <h3 className="text-text-primary font-medium mb-1.5">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
