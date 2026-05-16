// Shared sidebar + topbar (日本語)
const Sidebar = ({ active = 'ダッシュボード' }) => {
  const items = [
    { name: 'ダッシュボード', icon: I.Home },
    { name: '承認待ち', icon: I.Inbox, badge: 23 },
    { name: 'リスティング', icon: I.Tag },
    { name: '設定', icon: I.Settings },
    { name: 'ログ', icon: I.FileText },
  ];
  return (
    <div className="sb">
      <div className="sb-logo">
        <div className="sb-logo-icon"><I.Shield size={16} stroke="#fff"/></div>
        <span>eBay Price Sentry</span>
      </div>
      <div className="sb-nav">
        {items.map(it => {
          const IconC = it.icon;
          return (
            <div key={it.name} className={`sb-item ${active === it.name ? 'active' : ''}`}>
              <IconC size={16}/>
              <span>{it.name}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </div>
          );
        })}
      </div>
      <div className="sb-foot">
        <I.ChevronLeft size={14}/>
        <span>折りたたむ</span>
      </div>
    </div>
  );
};

const TopBar = ({ automation = true, lastSync = '10:16', extra = null }) => (
  <div className="tb">
    <I.Search size={18} stroke="var(--text-2)"/>
    <div className="tb-search">
      <I.Search size={14}/>
      <span>商品名・Item ID・SKU で検索…</span>
      <kbd>⌘K</kbd>
    </div>
    <div className="tb-spacer"/>
    <div className="tb-right">
      <div className="tb-pill" style={{cursor:'default'}}>
        <span style={{color:'var(--text-2)'}}>自動反映</span>
        <span className="toggle">
          <span className={`toggle-track ${automation ? 'on' : ''}`}><span className="toggle-thumb"/></span>
        </span>
        <span style={{fontWeight:600, color: automation ? 'var(--success-text)' : 'var(--text-2)'}}>{automation ? 'ON' : 'OFF'}</span>
      </div>
      <div className="tb-sync"><I.Clock size={14}/> 最終同期 {lastSync}</div>
      {extra}
    </div>
  </div>
);

window.Sidebar = Sidebar;
window.TopBar = TopBar;
