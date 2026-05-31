import { useMemo, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  ArrowRight, BadgeIndianRupee, Building2, CalendarDays, Check, Clock3,
  Filter, Heart, Home, IndianRupee, MapPin, Mic, Route, ScanLine,
  Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Star, TrendingUp, Users, Zap,
} from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import HomeModule from './components/modules/HomeModule';
import { properties, type Property } from './data/properties';
import { localities } from './data/localities';
import { useAppStore } from './store/useAppStore';
import { analyzeImagesWithGemini, chatWithGemini, hasGeminiKey } from './utils/gemini';

const cityOptions = ['All cities', ...Array.from(new Set(properties.map((p) => p.city)))];
const budgetOptions = [
  { label: 'Any budget', min: 0, max: Infinity },
  { label: 'Under 1 Cr', min: 0, max: 10000000 },
  { label: '1-2 Cr', min: 10000000, max: 20000000 },
  { label: '2-5 Cr', min: 20000000, max: 50000000 },
  { label: '5 Cr+', min: 50000000, max: Infinity },
];

function formatPrice(value: number) {
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(value >= 100000000 ? 1 : 2)} Cr`;
  return `Rs ${(value / 100000).toFixed(1)} L`;
}

function scoreProperty(p: Property, weights = { commute: 35, family: 25, investment: 25, calm: 15 }) {
  const commute = p.nearbyMetro.toLowerCase().includes('metro') ? 88 : 62;
  const family = Math.min(96, p.builderRating * 16 + p.nearbySchools.length * 7 + p.bedrooms * 3);
  const investment = Math.min(98, p.appreciationRate * 7 + p.rentalYield * 9);
  const calm = Math.max(20, 100 - p.noiseLevel);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  return Math.round(
    (commute * weights.commute + family * weights.family + investment * weights.investment + calm * weights.calm) /
      totalWeight,
  );
}

function getBestProperties(limit = 6) {
  return [...properties]
    .map((property) => ({ property, score: scoreProperty(property) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ModuleShell({ title, eyebrow, children, action }: { title: string; eyebrow: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-green">{eyebrow}</p>
          <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = 'blue' }: { icon: typeof Home; label: string; value: string; tone?: 'blue' | 'green' | 'amber' | 'purple' }) {
  const tones = {
    blue: 'bg-accent-blue/12 text-accent-blue',
    green: 'bg-accent-green/12 text-accent-green',
    amber: 'bg-accent-amber/12 text-accent-amber',
    purple: 'bg-accent-purple/12 text-accent-purple',
  };
  return (
    <div className="glass-card rounded-lg p-4">
      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function PropertyCard({ item, compact = false }: { item: { property: Property; score: number }; compact?: boolean }) {
  const { setSelectedPropertyId, setActiveModule } = useAppStore();
  const p = item.property;
  return (
    <article className="glass-card overflow-hidden rounded-lg">
      {!compact && (
        <img src={p.imageUrl} alt={p.title} className="h-40 w-full object-cover" />
      )}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{p.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
              <MapPin size={13} /> {p.locality}, {p.city}
            </p>
          </div>
          <div className="rounded-lg bg-accent-green/12 px-2.5 py-1 text-sm font-semibold text-accent-green">{item.score}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 py-3 text-xs text-text-secondary">
          <span>{p.bedrooms} BHK</span>
          <span>{p.area} sqft</span>
          <span>{p.rentalYield}% yield</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
          <p className="text-base font-semibold text-text-primary">{formatPrice(p.price)}</p>
          <button
            onClick={() => {
              setSelectedPropertyId(p.id);
              setActiveModule('lifestyle');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-text-primary transition hover:bg-white/[0.1]"
          >
            Analyze <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ChatModule() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Tell me your budget, preferred city, commute, and family needs. I will shortlist properties with a clear reason.' },
  ]);
  const [draft, setDraft] = useState('3BHK near metro under 2 Cr with good schools');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!draft.trim()) return;
    const userText = draft.trim();
    const nextMessages = [...messages, { role: 'user', text: userText }];
    setMessages(nextMessages);
    setDraft('');
    setLoading(true);
    const picks = getBestProperties(3).map((p) => p.property);
    const fallback = `I found ${picks.length} strong fits. ${picks[0].title} leads because it balances metro access, schools, and ${picks[0].rentalYield}% rental yield. I would compare it with ${picks[1].title} if you want a quieter micro-market.`;
    try {
      const reply = hasGeminiKey()
        ? await chatWithGemini(
            nextMessages,
            `You are SmartSpace, an Indian real estate advisor. Recommend from this property data: ${JSON.stringify(picks)}. Be concise and practical.`,
          )
        : fallback;
      setMessages((m) => [...m, { role: 'ai', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: fallback }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModuleShell title="AI Realtor Chat" eyebrow="Conversational shortlist">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="glass-card flex min-h-[590px] flex-col rounded-lg">
          <div className="border-b border-white/[0.08] p-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Sparkles size={16} className="text-accent-green" /> {hasGeminiKey() ? 'Gemini is connected from environment variables.' : 'Instant AI demo mode is active.'}
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-accent-blue text-white' : 'bg-white/[0.06] text-text-primary'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-text-secondary">Thinking...</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-white/[0.08] p-4">
            <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] text-text-secondary hover:text-text-primary" title="Voice input">
              <Mic size={18} />
            </button>
            <input value={draft} onChange={(e: any) => setDraft(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && sendMessage()} className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-bg-primary/80 px-4 text-sm text-text-primary outline-none focus:border-accent-blue/50" />
            <button onClick={sendMessage} disabled={loading} className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-blue text-white disabled:opacity-60" title="Send">
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {getBestProperties(3).map((item) => <PropertyCard key={item.property.id} item={item} compact />)}
        </div>
      </div>
    </ModuleShell>
  );
}

function LifestyleModule() {
  const selectedId = useAppStore((s) => s.selectedPropertyId);
  const [weights, setWeights] = useState({ commute: 35, family: 25, investment: 25, calm: 15 });
  const ranked = useMemo(
    () => [...properties].map((property) => ({ property, score: scoreProperty(property, weights) })).sort((a, b) => b.score - a.score).slice(0, 9),
    [weights],
  );
  const selected = ranked.find((x) => x.property.id === selectedId) ?? ranked[0];

  return (
    <ModuleShell title="Lifestyle Match" eyebrow="Personalized scoring" action={<button className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-text-primary"><Filter size={16} /> Saved profile</button>}>
      <div className="grid gap-5 xl:grid-cols-[300px_1fr_340px]">
        <div className="glass-card rounded-lg p-4">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Priorities</h2>
          {Object.entries(weights).map(([key, value]) => (
            <label key={key} className="mb-5 block">
              <div className="mb-2 flex justify-between text-xs capitalize text-text-secondary">
                <span>{key}</span><span>{value}%</span>
              </div>
              <input type="range" min="5" max="60" value={value} onChange={(e: any) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))} />
            </label>
          ))}
          <div className="rounded-lg bg-accent-blue/10 p-3 text-xs leading-relaxed text-text-secondary">
            Scores combine locality quality, metro access, schools, yield, appreciation, noise, and builder rating.
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map((item) => <PropertyCard key={item.property.id} item={item} />)}
        </div>
        <div className="glass-card rounded-lg p-4">
          <h2 className="text-sm font-semibold text-text-primary">Best current fit</h2>
          <p className="mt-2 text-xl font-semibold text-accent-green">{selected.score}/100</p>
          <p className="mt-2 text-sm text-text-primary">{selected.property.title}</p>
          <div className="mt-5 space-y-3 text-sm text-text-secondary">
            {['Strong metro coverage', 'School and hospital access', 'Healthy rental demand', 'Noise risk reviewed'].map((x) => (
              <p key={x} className="flex items-center gap-2"><Check size={15} className="text-accent-green" /> {x}</p>
            ))}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

function SmartMapModule() {
  const topLocalities = [...localities].sort((a, b) => b.amenityDensity + b.transitScore - (a.amenityDensity + a.transitScore)).slice(0, 8);
  return (
    <ModuleShell title="Smart Map" eyebrow="Location intelligence">
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="glass-card relative min-h-[600px] overflow-hidden rounded-lg p-5">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          {topLocalities.map((l, i) => (
            <div key={l.name} className="absolute rounded-full border border-white/20 bg-accent-blue/25 p-2 shadow-lg shadow-accent-blue/20" style={{ left: `${12 + (i * 13) % 72}%`, top: `${16 + (i * 19) % 64}%`, width: 54 + l.amenityDensity / 3, height: 54 + l.amenityDensity / 3 }}>
              <div className="flex h-full w-full items-center justify-center rounded-full bg-bg-secondary/80 text-xs font-semibold text-text-primary">{l.transitScore}</div>
            </div>
          ))}
          <div className="relative z-10 max-w-sm rounded-lg border border-white/[0.08] bg-bg-secondary/90 p-4">
            <p className="text-sm font-semibold text-text-primary">Heatmap layers</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
              {['Transit', 'Price', 'Safety', 'Greenery', 'Rental demand'].map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-3 py-1">{x}</span>)}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {topLocalities.map((l) => (
            <div key={l.name} className="glass-card rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-text-primary">{l.name}</p><p className="text-xs text-text-secondary">{l.city}</p></div>
                <span className="rounded-lg bg-accent-green/12 px-2 py-1 text-sm text-accent-green">{l.safetyScore}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-text-secondary">
                <span>Walk {l.walkScore}</span><span>Transit {l.transitScore}</span><span>Growth {l.priceGrowth5yr}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModuleShell>
  );
}

function SimulatorModule() {
  const property = getBestProperties(1)[0].property;
  const timeline = [
    ['08:10', 'Leave home', `${property.nearbyMetro} connection`],
    ['09:05', 'Office arrival', property.nearbyOffices[0]],
    ['18:40', 'Gym / errands', property.amenities.includes('Gym') ? 'On-site gym' : 'Nearby fitness center'],
    ['20:15', 'Family time', `${property.noiseLevel} dB estimated evening noise`],
  ];
  return (
    <ModuleShell title="Life Simulator" eyebrow="Day-in-the-life planning">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card rounded-lg p-5">
          <p className="text-sm text-text-secondary">Selected property</p>
          <h2 className="mt-2 text-xl font-semibold text-text-primary">{property.title}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard icon={Route} label="Commute" value="52 min" />
            <MetricCard icon={Clock3} label="Errand time" value="34 min" tone="green" />
            <MetricCard icon={ShieldCheck} label="Calm score" value={`${100 - property.noiseLevel}/100`} tone="purple" />
            <MetricCard icon={CalendarDays} label="Weekly saved" value="4.2 hrs" tone="amber" />
          </div>
        </div>
        <div className="glass-card rounded-lg p-5">
          <div className="space-y-4">
            {timeline.map(([time, title, detail]) => (
              <div key={time} className="grid grid-cols-[72px_1fr] gap-4">
                <p className="text-sm font-semibold text-accent-blue">{time}</p>
                <div className="border-l border-white/[0.12] pl-4">
                  <p className="font-medium text-text-primary">{title}</p>
                  <p className="text-sm text-text-secondary">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

function XrayModule() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const flags = ['Check bathroom seepage near shared wall', 'Ask for latest maintenance ledger', 'Verify balcony waterproofing', 'Confirm fire NOC and parking allotment'];

  async function runInspection(selectedFiles: File[]) {
    setFiles(selectedFiles);
    setLoading(true);
    const fallback = [
      'Inspection summary: Photos received and checklist generated.',
      'Verdict: Consider after verification.',
      'Priority checks: seepage, balcony waterproofing, electrical panel age, parking allotment, and society maintenance ledger.',
      'Negotiation angle: keep 3-5% buffer until documents and snag list are cleared.',
    ].join('\n');
    try {
      if (hasGeminiKey() && selectedFiles.length) {
        const images = await Promise.all(
          selectedFiles.slice(0, 4).map(async (file) => ({
            data: await fileToBase64(file),
            mimeType: file.type || 'image/jpeg',
          })),
        );
        const aiReport = await analyzeImagesWithGemini(
          images,
          'Inspect these property photos for visible real-estate risks. Return concise bullets with red flags, green flags, maintenance questions, and a buy/consider/avoid verdict.',
        );
        setReport(aiReport);
      } else {
        setReport(fallback);
      }
    } catch {
      setReport(fallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModuleShell title="Property X-Ray" eyebrow="Inspection assistant">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="glass-card flex min-h-[430px] flex-col items-center justify-center rounded-lg border-dashed p-8 text-center">
          <ScanLine size={42} className="text-accent-blue" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">Upload photos for AI inspection</h2>
          <p className="mt-2 max-w-md text-sm text-text-secondary">{hasGeminiKey() ? 'Gemini image analysis is connected from environment variables.' : 'Upload works now and returns a complete demo inspection report.'}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e: any) => runInspection(Array.from(e.target.files ?? []))}
          />
          <button onClick={() => fileInputRef.current?.click()} className="mt-6 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-medium text-white">Choose images</button>
          {files.length > 0 && <p className="mt-4 text-xs text-text-secondary">{files.length} image{files.length === 1 ? '' : 's'} selected</p>}
        </div>
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-semibold text-text-primary">Instant inspection checklist</h2>
          {loading && <p className="mt-4 rounded-lg bg-white/[0.04] p-3 text-sm text-text-secondary">Analyzing property photos...</p>}
          {report && (
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-bg-primary/70 p-4 text-sm leading-relaxed text-text-primary">{report}</pre>
          )}
          <div className="mt-5 space-y-3">
            {flags.map((flag, i) => (
              <div key={flag} className="flex items-start gap-3 rounded-lg bg-white/[0.04] p-3">
                <span className={`mt-0.5 rounded px-2 py-1 text-xs ${i < 2 ? 'bg-accent-amber/15 text-accent-amber' : 'bg-accent-green/15 text-accent-green'}`}>{i < 2 ? 'Review' : 'Verify'}</span>
                <p className="text-sm text-text-secondary">{flag}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

function NegotiationModule() {
  const property = properties[14];
  const rows = [
    ['Aggressive', '15%', 'Point to area oversupply and ask for faster possession clause', 'High'],
    ['Balanced', '9%', 'Use comparable transactions and bank-ready closing', 'Medium'],
    ['Relationship-first', '5%', 'Ask for extras: parking, club fee waiver, modular kitchen', 'Low'],
  ];
  return (
    <ModuleShell title="Negotiation" eyebrow="Offer strategy">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="glass-card rounded-lg p-5">
          <p className="text-sm text-text-secondary">Target property</p>
          <h2 className="mt-2 text-lg font-semibold text-text-primary">{property.title}</h2>
          <p className="mt-4 text-3xl font-semibold text-text-primary">{formatPrice(property.price)}</p>
          <p className="mt-1 text-sm text-text-secondary">Suggested opening: {formatPrice(property.price * 0.91)}</p>
        </div>
        <div className="glass-card overflow-hidden rounded-lg">
          {rows.map(([name, discount, argument, risk]) => (
            <div key={name} className="grid gap-3 border-b border-white/[0.08] p-4 last:border-b-0 md:grid-cols-[160px_90px_1fr_90px]">
              <p className="font-medium text-text-primary">{name}</p>
              <p className="text-accent-green">{discount}</p>
              <p className="text-sm text-text-secondary">{argument}</p>
              <p className="text-sm text-text-secondary">{risk}</p>
            </div>
          ))}
        </div>
      </div>
    </ModuleShell>
  );
}

function FamilyModule() {
  const personas = [
    ['Parents', 'Hospital proximity and low-noise evenings', 86],
    ['Children', 'Schools, play areas, safer crossings', 82],
    ['Commuter', 'Metro access and office corridor', 91],
    ['Investor', 'Yield, liquidity, appreciation', 88],
  ];
  return (
    <ModuleShell title="Family Compass" eyebrow="Multi-person decisioning">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {personas.map(([name, detail, score]) => (
          <div key={name} className="glass-card rounded-lg p-5">
            <Users className="text-accent-purple" size={22} />
            <p className="mt-4 text-lg font-semibold text-text-primary">{name}</p>
            <p className="mt-2 min-h-[44px] text-sm text-text-secondary">{detail}</p>
            <div className="mt-5 h-2 rounded-full bg-white/[0.08]"><div className="h-2 rounded-full bg-accent-green" style={{ width: `${score}%` }} /></div>
            <p className="mt-2 text-sm text-accent-green">{score}% aligned</p>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}

function InvestmentModule() {
  const data = properties.slice(0, 12).map((p) => ({ name: p.locality.split(' ')[0], growth: p.appreciationRate, yield: p.rentalYield }));
  return (
    <ModuleShell title="Investment Intel" eyebrow="Returns and risk">
      <div className="grid gap-5 lg:grid-cols-3">
        <MetricCard icon={TrendingUp} label="Top appreciation" value="12.5%" tone="green" />
        <MetricCard icon={IndianRupee} label="Best rental yield" value="4.0%" tone="amber" />
        <MetricCard icon={Star} label="Balanced score" value="91/100" tone="purple" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="glass-card h-[360px] rounded-lg p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Growth trend by locality</h2>
          <ResponsiveContainer width="100%" height="86%">
            <AreaChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8 }} />
              <Area dataKey="growth" stroke="#10B981" fill="#10B98133" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card h-[360px] rounded-lg p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Rental yield comparison</h2>
          <ResponsiveContainer width="100%" height="86%">
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8 }} />
              <Bar dataKey="yield" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ModuleShell>
  );
}

function DiscoverModule() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [city, setCity] = useState(cityOptions[0]);
  const [budget, setBudget] = useState(budgetOptions[0]);
  const filtered = properties.filter((p) => {
    const text = `${p.title} ${p.locality} ${p.city} ${p.amenities.join(' ')}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase()) && (city === 'All cities' || p.city === city) && p.price >= budget.min && p.price <= budget.max;
  });
  const ranked = filtered.slice(0, 12).map((property) => ({ property, score: scoreProperty(property) }));

  return (
    <ModuleShell title="Property Discovery" eyebrow="Fast search">
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-bg-secondary px-3">
          <Search size={17} className="text-text-secondary" />
          <input value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} placeholder="Search area, amenity, builder..." className="h-11 min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none" />
        </div>
        <select value={city} onChange={(e: any) => setCity(e.target.value)} className="h-11 rounded-lg border border-white/[0.08] bg-bg-secondary px-3 text-sm text-text-primary">
          {cityOptions.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={budget.label} onChange={(e: any) => setBudget(budgetOptions.find((b) => b.label === e.target.value) ?? budgetOptions[0])} className="h-11 rounded-lg border border-white/[0.08] bg-bg-secondary px-3 text-sm text-text-primary">
          {budgetOptions.map((b) => <option key={b.label}>{b.label}</option>)}
        </select>
        <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-white/[0.06] px-4 text-sm text-text-primary"><SlidersHorizontal size={16} /> Filters</button>
      </div>
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <MetricCard icon={Building2} label="Listings" value={String(filtered.length)} />
        <MetricCard icon={BadgeIndianRupee} label="Median price" value={formatPrice(filtered[Math.floor(filtered.length / 2)]?.price ?? 0)} tone="green" />
        <MetricCard icon={Zap} label="Avg growth" value={`${(filtered.reduce((s, p) => s + p.appreciationRate, 0) / Math.max(filtered.length, 1)).toFixed(1)}%`} tone="amber" />
        <MetricCard icon={Heart} label="Top match" value={`${ranked[0]?.score ?? 0}/100`} tone="purple" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ranked.map((item) => <PropertyCard key={item.property.id} item={item} />)}
      </div>
    </ModuleShell>
  );
}

export default function App() {
  const activeModule = useAppStore((s) => s.activeModule);
  const moduleMap: Record<string, JSX.Element> = {
    home: <HomeModule />,
    chat: <ChatModule />,
    discover: <DiscoverModule />,
    lifestyle: <LifestyleModule />,
    map: <SmartMapModule />,
    simulator: <SimulatorModule />,
    xray: <XrayModule />,
    negotiation: <NegotiationModule />,
    family: <FamilyModule />,
    investment: <InvestmentModule />,
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />
      <main className="min-h-screen md:pl-[240px]">
        <TopBar />
        {moduleMap[activeModule] ?? <DiscoverModule />}
      </main>
    </div>
  );
}
