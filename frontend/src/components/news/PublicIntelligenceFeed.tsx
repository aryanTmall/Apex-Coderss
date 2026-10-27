import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Building2,
  MapPin,
  Flag,
  Radio,
  ExternalLink,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Newspaper,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { NewsArticle } from '../../api/types';
import { api } from '../../api/client';

interface PublicIntelligenceFeedProps {
  initialScope?: string;
  onSelectCategoryFilter?: (category: string) => void;
  title?: string;
  subtitle?: string;
}

export const PublicIntelligenceFeed: React.FC<PublicIntelligenceFeedProps> = ({
  initialScope = 'ALL',
  onSelectCategoryFilter,
  title = 'Public Intelligence & Municipal Bulletins',
  subtitle = 'Real-time infrastructure notices, monsoon drainage advisories, and smart city telemetry.',
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScope, setSelectedScope] = useState<string>(initialScope);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [userLocality, setUserLocality] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);

  useEffect(() => {
    fetchNews();
  }, [selectedScope, selectedCategory]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await api.getCivicNews(
        selectedScope,
        selectedCategory,
        searchQuery,
        userLocality || undefined
      );
      setArticles(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load civic intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scopeId: string) => {
    setSelectedScope(scopeId);
    if (scopeId === 'LOCAL' || scopeId === 'AROUND_ME') {
      if (!gpsActive && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setGpsActive(true);
            setUserLocality('Delhi NCR');
          },
          () => {
            setUserLocality('New Delhi');
          }
        );
      }
    }
  };

  const SCOPES = [
    { id: 'ALL', label: 'All Feeds', icon: Radio },
    { id: 'LOCAL', label: 'Around Me', icon: Compass },
    { id: 'CITY', label: 'City (Delhi)', icon: Building2 },
    { id: 'STATE', label: 'State / NCR', icon: MapPin },
    { id: 'NATIONAL', label: 'National', icon: Flag },
    { id: 'GLOBAL', label: 'Global Cities', icon: Globe },
  ];

  const CATEGORIES = [
    { id: 'ALL', label: 'All Topics' },
    { id: 'INFRASTRUCTURE', label: 'Roads & Bridges' },
    { id: 'UTILITIES', label: 'Power & Water' },
    { id: 'PUBLIC_SAFETY', label: 'Public Safety' },
    { id: 'DISASTER', label: 'Monsoon & Floods' },
    { id: 'POLICY', label: 'Civic Standards' },
  ];

  const filteredArticles = articles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.source_name.toLowerCase().includes(q)
    );
  });

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'LOCAL':
        return 'text-verified-teal bg-verified-teal/10 border-verified-teal/30';
      case 'CITY':
        return 'text-civic-blue bg-civic-blue/10 border-civic-blue/30';
      case 'STATE':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'NATIONAL':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'GLOBAL':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      default:
        return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Header & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-4 rounded-xl bg-surface-1 border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-verified-teal animate-pulse" />
              PUBLIC INTELLIGENCE FEED // LIVE RADAR
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] font-mono text-text-muted">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">{title}</h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{subtitle}</p>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg bg-surface-2 hover:bg-white/10 text-white text-xs font-mono border border-white/10 flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-civic-blue ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* 2. Filters & Geographic Scope Selector Bar */}
      <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-surface-1 border border-white/10">
        {/* Geographic Scope Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 pb-2.5">
          <span className="text-[11px] font-mono text-text-muted uppercase mr-1">Scope:</span>
          {SCOPES.map((sc) => {
            const Icon = sc.icon;
            const isSelected = selectedScope === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleScopeChange(sc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-civic-blue text-white font-bold shadow-md shadow-civic-blue/20'
                    : 'bg-surface-2 hover:bg-white/10 text-text-muted hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Topic Category & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white/20 text-white font-bold border border-white/30'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news or topic..."
              className="w-full pl-8 pr-3 py-1 bg-surface-2 border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. News Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-5 rounded-xl bg-surface-1 border border-white/5 animate-pulse flex flex-col gap-3">
              <div className="w-24 h-4 bg-white/10 rounded" />
              <div className="w-3/4 h-5 bg-white/10 rounded" />
              <div className="w-full h-12 bg-white/5 rounded" />
              <div className="w-1/2 h-4 bg-white/5 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface-1 border border-white/10 text-center flex flex-col items-center">
          <Newspaper className="w-8 h-8 text-text-muted mb-2" />
          <h4 className="text-sm font-semibold text-white">No Bulletins Found</h4>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            No intelligence articles match your selected scope and search criteria. Try selecting "All Feeds" or clearing your query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => {
            const pubDate = new Date(art.published_at);
            return (
              <div
                key={art.id}
                className="p-5 rounded-xl bg-surface-1 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-md group"
              >
                <div>
                  {/* Scope & Timestamp Meta */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getScopeBadgeColor(
                        art.geographic_scope
                      )}`}
                    >
                      {art.geographic_scope} {art.city ? `// ${art.city}` : ''}
                    </span>

                    <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{pubDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-civic-blue transition-colors">
                    {art.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    {art.summary}
                  </p>

                  {/* AI Civic Relevance Insight */}
                  {art.civic_relevance && (
                    <div className="mt-3 p-2.5 rounded-lg bg-surface-2/80 border border-purple-500/20 text-[11px] flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="text-purple-200/90 leading-relaxed">
                        {art.civic_relevance}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions: Source, Map Connection, and Article Link */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-verified-teal shrink-0" />
                    <span className="truncate max-w-[160px]">{art.source_name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Link intelligence to civic incidents */}
                    {art.related_incident_count && art.related_incident_count > 0 ? (
                      <Link
                        to={`/app?category=${encodeURIComponent(art.related_category || 'pothole')}`}
                        className="px-2.5 py-1 rounded bg-civic-blue/15 hover:bg-civic-blue/25 text-civic-blue font-mono text-[10px] font-semibold border border-civic-blue/30 flex items-center gap-1 transition-colors"
                        title="View matching complaints on live map"
                      >
                        <span>{art.related_incident_count} Active Incidents</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : null}

                    {/* Original Source Link */}
                    <a
                      href={art.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] border border-white/10 flex items-center gap-1 transition-colors"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
