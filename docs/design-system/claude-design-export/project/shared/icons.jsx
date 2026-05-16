// Lucide-style inline icon components (stroke 1.5)
const Icon = ({ d, size = 16, children, ...rest }) =>
<svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...rest} style={{ width: "17px" }}>
    {d ? <path d={d} /> : children}
  </svg>;


const I = {
  Shield: (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /></Icon>,
  Home: (p) => <Icon {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12l5 5 9-11" /></Icon>,
  CheckCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></Icon>,
  ListChecks: (p) => <Icon {...p}><path d="M3 6h2l1 2 3-3" /><path d="M3 12h2l1 2 3-3" /><path d="M3 18h2l1 2 3-3" /><path d="M14 7h7" /><path d="M14 13h7" /><path d="M14 19h7" /></Icon>,
  Tag: (p) => <Icon {...p}><path d="M3 12V4h8l9 9-8 8-9-9z" /><circle cx="7.5" cy="7.5" r="1" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 8 3.9l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V8a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>,
  FileText: (p) => <Icon {...p}><path d="M14 3H6v18h12V7l-4-4z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>,
  RefreshCw: (p) => <Icon {...p}><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" /><path d="M3 21v-5h5" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>,
  More: (p) => <Icon {...p}><circle cx="12" cy="6" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="18" r="1" /></Icon>,
  Target: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></Icon>,
  TrendingUp: (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Icon>,
  TrendingDown: (p) => <Icon {...p}><path d="M3 7l6 6 4-4 8 8" /><path d="M14 17h7v-7" /></Icon>,
  AlertTriangle: (p) => <Icon {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5" /><path d="M12 18h.01" /></Icon>,
  AlertCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></Icon>,
  X: (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Icon>,
  Zap: (p) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Icon>,
  Filter: (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" /></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Activity: (p) => <Icon {...p}><path d="M3 12h4l3-9 4 18 3-9h4" /></Icon>,
  DollarSign: (p) => <Icon {...p}><path d="M12 2v20" /><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>,
  Image: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5-9 9" /></Icon>,
  Inbox: (p) => <Icon {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 5h14l3 7v7H2v-7l3-7z" /></Icon>,
  ShoppingCart: (p) => <Icon {...p}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h3l2.5 12h11l2.5-9H6" /></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="4" /><path d="M2 20c0-4 3-6 7-6s7 2 7 6" /><circle cx="17" cy="6" r="3" /><path d="M22 18c0-3-2-5-5-5" /></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></Icon>,
  Play: (p) => <Icon {...p}><path d="M6 4l14 8-14 8z" /></Icon>,
  Slash: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M5 5l14 14" /></Icon>
};

window.I = I;