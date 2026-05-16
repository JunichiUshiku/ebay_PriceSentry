// Variation E — A の配色/レイアウト × D の高密度（一目把握）
const VariationE = () => {
  const [selected, setSelected] = React.useState('123456789012');
  const sel = SAMPLE_LISTINGS.find((l) => l.id === selected) || SAMPLE_LISTINGS[0];
  const list = SAMPLE_LISTINGS.concat(SAMPLE_LISTINGS.slice(0, 4));

  const metrics = [
  { label: '対象', value: '1,248', accent: 'info', sub: '今週 +12' },
  { label: '承認待ち', value: '23', accent: 'warning', sub: '優先度高 8' },
  { label: '本日更新', value: '312', accent: 'success', sub: '平均 −4.2%' },
  { label: 'スキップ', value: '87', accent: 'neutral', sub: '最低価格 41' },
  { label: 'エラー', value: '5', accent: 'error', sub: '直近24時間' },
  { label: '推定削減', value: '$1,142', accent: 'info', sub: '本日合計' },
  { label: 'API使用', value: '4,127', accent: 'neutral', sub: '/ 5,000' },
  { label: '次回巡回', value: '15:00', accent: 'neutral', sub: 'あと 4h44m' }];


  const tone = (a) => ({
    info: { bg: 'var(--primary-subtle)', fg: 'var(--primary-active)' },
    warning: { bg: 'var(--warning-bg)', fg: 'var(--warning-text)' },
    success: { bg: 'var(--success-bg)', fg: 'var(--success-text)' },
    error: { bg: 'var(--error-bg)', fg: 'var(--error-text)' },
    neutral: { bg: 'var(--neutral-bg)', fg: 'var(--neutral-text)' }
  })[a];

  return (
    <div className="ds-root vE" style={{ display: 'flex', height: '100%', background: 'var(--surface)' }}>
      <Sidebar active="ダッシュボード" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', minWidth: 0, padding: "14px 16px", fontFamily: "Inter" }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>ダッシュボード</h1>
                <span className="muted" style={{ fontSize: 12 }}>4月29日 ・ 1日3巡回 ・ 最終 10:16</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm"><I.Filter size={12} /> 絞り込み</button>
                <button className="btn sm"><I.RefreshCw size={12} /> 巡回</button>
                <button className="btn sm primary"><I.Plus size={12} /> 追加</button>
              </div>
            </div>

            {/* Compact KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0,1fr))', gap: 6, marginBottom: 10 }}>
              {metrics.map((m) => {
                const t = tone(m.accent);
                return (
                  <div key={m.label} className="card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: t.fg }} />
                      <span style={{ fontSize: 10.5, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.02em' }}>{m.label}</span>
                    </div>
                    <div className="num" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: t.fg }}>{m.value}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{m.sub}</div>
                  </div>);

              })}
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden', borderRadius: "8px", borderStyle: "solid" }}>
              <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>リスティング</span>
                <span className="badge-pill neutral" style={{ padding: '1px 7px', fontSize: 10.5 }}>1,248</span>
                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                  {[
                  { l: 'すべて', n: '1,248', active: false },
                  { l: '承認待ち', n: '23', active: true, c: 'warning' },
                  { l: '更新済', n: '312', active: false, c: 'success' },
                  { l: 'スキップ', n: '87', active: false },
                  { l: 'エラー', n: '5', active: false, c: 'error' }].
                  map((t) =>
                  <span key={t.l} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: t.active ? 'var(--primary-subtle)' : 'transparent',
                    color: t.active ? 'var(--primary-active)' : 'var(--text-2)',
                    border: t.active ? '1px solid var(--primary-subtle-hover)' : '1px solid transparent' }}>
                      {t.l} <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>{t.n}</span>
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                <div className="tb-search" style={{ maxWidth: 200, height: 26, fontSize: 11.5 }}>
                  <I.Search size={11} />
                  <span>テーブル内を検索…</span>
                </div>
                <button className="btn sm" style={{ height: 26, fontSize: 11.5 }}><I.ChevronDown size={11} /> 変動% ↓</button>
              </div>

              <table className="tbl tbl-dense">
                <thead>
                  <tr>
                    <th style={{ width: 24, padding: '5px 8px' }}><input type="checkbox" disabled /></th>
                    <th style={{ width: 6, padding: 0 }}></th>
                    <th>商品</th>
                    <th>Item No</th>
                    <th className="num">現在</th>
                    <th className="num">送料</th>
                    <th className="num">合計</th>
                    <th className="num">ライバル</th>
                    <th className="num">推奨</th>
                    <th className="num">差額</th>
                    <th className="num">変動%</th>
                    <th className="num">AI</th>
                    <th>状態</th>
                    <th>時刻</th>
                    <th style={{ width: 24 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((l, idx) => {
                    const isSel = selected === l.id && idx < 10;
                    const tk = STATUS_MAP[l.status];
                    const dropTone = l.drop != null && l.drop < -5 ? 'var(--negative)' : l.drop != null && l.drop < 0 ? 'var(--warning-text)' : 'var(--text-2)';
                    const aiTone = l.ai == null ? 'var(--text-3)' : l.ai >= 0.85 ? 'var(--success-text)' : 'var(--warning-text)';
                    const diff = l.suggested != null ? l.suggested - l.price : null;
                    return (
                      <tr key={idx} className={isSel ? 'selected' : ''} onClick={() => setSelected(l.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '0 8px' }}><input type="checkbox" /></td>
                        <td style={{ padding: 0, width: 6 }}>
                          <span style={{ display: 'block', width: 3, height: 10, marginLeft: 2, borderRadius: 2, background:
                            tk === 'success' ? 'var(--success)' :
                            tk === 'warning' ? 'var(--warning)' :
                            tk === 'error' ? 'var(--error)' :
                            'var(--text-3)' }} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <div className="thumb" style={{ width: 14, height: 14, borderRadius: 2 }}><I.Image size={8} /></div>
                            <span style={{ fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260, display: 'inline-block' }}>{l.title}</span>
                          </div>
                        </td>
                        <td className="mono" style={{ color: 'var(--text-2)', fontSize: 11 }}>{l.id}</td>
                        <td className="num mono" style={{ fontSize: 12.5 }}>{fmtMoney(l.price)}</td>
                        <td className="num mono" style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmtMoney(l.ship)}</td>
                        <td className="num mono" style={{ fontWeight: 700, fontSize: 12.5 }}>{fmtMoney(l.total)}</td>
                        <td className="num mono" style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{fmtMoney(l.compTotal)}</td>
                        <td className="num mono" style={{ color: 'var(--primary-active)', fontWeight: 700, fontSize: 12.5 }}>{fmtMoney(l.suggested)}</td>
                        <td className="num mono" style={{ color: dropTone, fontSize: 12 }}>{diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '—'}</td>
                        <td className="num mono" style={{ color: dropTone, fontWeight: 600, fontSize: 12 }}>{l.drop != null ? `${l.drop > 0 ? '+' : ''}${l.drop.toFixed(2)}%` : '—'}</td>
                        <td className="num mono" style={{ color: aiTone, fontSize: 12 }}>{l.ai != null ? l.ai.toFixed(2) : '—'}</td>
                        <td style={{ padding: '1px 8px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, lineHeight: 1.15, color:
                            tk === 'success' ? 'var(--success-text)' :
                            tk === 'warning' ? 'var(--warning-text)' :
                            tk === 'error' ? 'var(--error-text)' :
                            'var(--text-2)', whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background:
                              tk === 'success' ? 'var(--success)' :
                              tk === 'warning' ? 'var(--warning)' :
                              tk === 'error' ? 'var(--error)' :
                              'var(--text-3)' }} />
                            {l.status}
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.last}</td>
                        <td style={{ padding: '4px 6px', color: 'var(--text-3)' }}><I.More size={14} /></td>
                      </tr>);

                  })}
                </tbody>
              </table>

              <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-2)' }}>
                <span>1,248 件中 1〜14 件</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 2 }}>
                  {['‹', '1', '2', '3', '4', '5', '…', '125', '›'].map((p, i) =>
                  <span key={i} style={{ minWidth: 22, height: 22, padding: '0 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: p === '1' ? 'var(--primary)' : 'transparent', color: p === '1' ? '#fff' : 'var(--text-1)', fontSize: 11, fontWeight: 600, border: p === '1' ? 0 : '1px solid var(--border)' }}>{p}</span>
                  )}
                </div>
                <span>表示 <strong>50</strong></span>
                <span>CSV出力</span>
              </div>
            </div>
          </div>

          {/* Right detail panel — compact */}
          <div style={{ width: 320, background: '#fff', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>選択中</span>
                <span className="badge-pill warning" style={{ padding: '1px 6px', fontSize: 10 }}><span className="dot" />{sel.status}</span>
                <div style={{ flex: 1 }} />
                <I.X size={14} stroke="var(--text-3)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{sel.title}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>Item ID {sel.id}</div>
            </div>

            {/* Compare strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', margin: '10px 14px 0', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {[
              { l: '自分の合計', v: fmtMoney(sel.total), c: 'var(--text-1)' },
              { l: 'ライバル合計', v: fmtMoney(sel.compTotal), c: 'var(--text-1)' },
              { l: '推奨価格', v: fmtMoney(sel.suggested), c: 'var(--primary-active)', big: true },
              { l: '変動', v: fmtPct(sel.drop), c: 'var(--negative)' }].
              map((c, i) =>
              <div key={i} style={{ padding: '7px 10px', background: '#fff' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.02em' }}>{c.l}</div>
                  <div className="mono num" style={{ fontSize: c.big ? 16 : 13, fontWeight: 700, color: c.c, marginTop: 1 }}>{c.v}</div>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 14px 0' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-2)', marginBottom: 6 }}>ガード判定</div>
              {[
              { ok: true, k: '最低価格', v: '$90.00' },
              { ok: false, k: '5%下落ガード', v: '抵触 −26.67%', warn: true },
              { ok: true, k: 'セール中商品', v: 'なし' },
              { ok: true, k: '送料取得', v: '$25.00' },
              { ok: true, k: 'AI同一商品', v: '0.92 ≥ 0.85' }].
              map((g, i) =>
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                  {g.ok ? <I.Check size={12} stroke="var(--success)" /> : <I.AlertCircle size={12} stroke="var(--warning)" />}
                  <span style={{ color: 'var(--text-2)', width: 110 }}>{g.k}</span>
                  <span className="mono" style={{ color: g.warn ? 'var(--warning-text)' : 'var(--text-1)', fontWeight: g.warn ? 600 : 400, fontSize: 11.5 }}>{g.v}</span>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 14px 0' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-2)', marginBottom: 6 }}>ライバル候補（4件）</div>
              {[
              { s: 'SellerDealsDude', t: 139.99, time: '09:15', adopted: true },
              { s: 'AudioVintageStore', t: 142.50, time: '09:15' },
              { s: 'CarTunesNJ', t: 149.00, time: '08:01' },
              { s: 'DealsByDoug', t: 155.25, time: '08:01' }].
              map((r, i) =>
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                  <span className={`dot-status ${r.adopted ? 'success' : 'neutral'}`} style={{ width: 6, height: 6 }} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: r.adopted ? 600 : 400 }}>{r.s}</span>
                  <span className="mono num" style={{ fontWeight: r.adopted ? 700 : 500 }}>${r.t.toFixed(2)}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', minWidth: 36, textAlign: 'right' }}>{r.time}</span>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn primary sm" style={{ flex: 1 }}><I.Check size={12} /> 承認して更新</button>
                <button className="btn sm"><I.X size={12} /></button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn ghost sm" style={{ flex: 1, fontSize: 11.5 }}><I.Eye size={11} /> eBayで開く</button>
                <button className="btn ghost sm" style={{ flex: 1, fontSize: 11.5 }}><I.Settings size={11} /> 設定</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .vE .sb { width: 168px; }
        .vE .sb-logo { padding: 12px 14px; font-size: 13px; gap: 8px; }
        .vE .sb-logo-icon { width: 22px; height: 22px; border-radius: 5px; }
        .vE .sb-nav { padding: 6px; gap: 1px; }
        .vE .sb-item { padding: 6px 9px; font-size: 12.5px; gap: 9px; }
        .vE .sb-item .badge { font-size: 10px; padding: 1px 6px; }
        .vE .sb-foot { padding: 8px 12px; font-size: 11.5px; }
        .vE .tb { height: 44px; padding: 0 14px; gap: 12px; }
        .vE .tb-search { height: 28px; max-width: 280px; font-size: 12px; padding: 0 10px; }
        .vE .tb-pill { height: 26px; padding: 0 10px; font-size: 12px; }
        .vE .tb-sync { font-size: 11px; }
        .vE .tb-right { gap: 10px; }
        .vE .tbl-dense th { padding: 3px 8px; font-size: 10.5px; white-space: nowrap; line-height: 1.1; }
        .vE .tbl-dense td { padding: 0 8px !important; line-height: 1; height: 20px; font-size: 11.5px; white-space: nowrap; vertical-align: middle; }
        .vE .tbl-dense .badge-pill { white-space: nowrap !important; flex-shrink: 0; display: inline-block; }
        .vE .tbl-dense input[type=checkbox] { margin: 0; vertical-align: middle; }
        .vE .tbl-dense tr td { border-bottom: 1px solid var(--border); }
        .vE .tbl-dense tr:hover td { background: rgba(37,99,235,0.04); }
        .vE .tbl-dense tr.selected td { background: var(--primary-subtle); }
      `}</style>
    </div>);

};

window.VariationE = VariationE;