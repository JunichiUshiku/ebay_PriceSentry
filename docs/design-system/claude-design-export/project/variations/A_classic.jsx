// Variation A — クラシック・データテーブル（既存路線を洗練）
const VariationA = () => {
  const [selected, setSelected] = React.useState('123456789012');
  const sel = SAMPLE_LISTINGS.find(l => l.id === selected) || SAMPLE_LISTINGS[0];

  const metrics = [
    { label: '対象リスティング', value: '1,248', accent: 'info', icon: I.Target, sub: '今週 +12 件' },
    { label: '承認待ち', value: '23', accent: 'warning', icon: I.Bell, sub: '優先度高 8 件' },
    { label: '本日更新', value: '312', accent: 'success', icon: I.TrendingUp, sub: '平均下落 4.2%' },
    { label: 'スキップ', value: '87', accent: 'neutral', icon: I.Slash, sub: '主に最低価格' },
    { label: 'APIエラー', value: '5', accent: 'error', icon: I.AlertTriangle, sub: '直近24時間' },
  ];

  return (
    <div className="ds-root" style={{display:'flex', height: '100%', background: 'var(--surface)'}}>
      <Sidebar active="ダッシュボード"/>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <TopBar/>
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
          <div style={{flex:1, padding:'24px 24px 24px 24px', overflow:'auto', minWidth:0}}>
            {/* Page header */}
            <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16}}>
              <div>
                <h1 style={{margin:0, fontSize: 24, fontWeight: 600, letterSpacing:'-0.01em'}}>ダッシュボード</h1>
                <div className="muted" style={{marginTop:4, fontSize:13}}>本日の価格監視サマリー · 1日3巡回</div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="btn"><I.Filter size={14}/> 絞り込み</button>
                <button className="btn primary"><I.Plus size={14}/> リスティングを追加</button>
              </div>
            </div>

            {/* Metric row */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap: 12, marginBottom: 20}}>
              {metrics.map(m => {
                const Ic = m.icon;
                const tones = {
                  info:    { bg: 'var(--primary-subtle)', fg: 'var(--primary-active)' },
                  warning: { bg: 'var(--warning-bg)',     fg: 'var(--warning-text)' },
                  success: { bg: 'var(--success-bg)',     fg: 'var(--success-text)' },
                  error:   { bg: 'var(--error-bg)',       fg: 'var(--error-text)' },
                  neutral: { bg: 'var(--neutral-bg)',     fg: 'var(--neutral-text)' },
                }[m.accent];
                return (
                  <div key={m.label} className="card" style={{padding: 18, position:'relative'}}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
                      <div>
                        <div className="muted" style={{fontSize: 12, fontWeight: 500, marginBottom: 8}}>{m.label}</div>
                        <div style={{fontSize: 28, fontWeight: 700, letterSpacing:'-0.025em', lineHeight: 1.1}}>{m.value}</div>
                        <div style={{fontSize: 11, color: 'var(--text-3)', marginTop: 6}}>{m.sub}</div>
                      </div>
                      <div style={{width: 32, height: 32, borderRadius: 999, background: tones.bg, color: tones.fg, display:'grid', placeItems:'center'}}>
                        <Ic size={16}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="card" style={{overflow:'hidden'}}>
              <div style={{padding: '12px 14px', borderBottom: '1px solid var(--border)', display:'flex', alignItems:'center', gap:8}}>
                <div style={{fontWeight:600, fontSize: 14}}>リスティング</div>
                <span className="badge-pill neutral">1,248</span>
                <div style={{flex:1}}/>
                <div className="tb-search" style={{maxWidth: 260, height: 32}}>
                  <I.Search size={13}/>
                  <span>テーブル内を検索…</span>
                </div>
                <button className="btn sm"><I.Filter size={13}/> ステータス</button>
                <button className="btn sm"><I.ChevronDown size={13}/> 並べ替え</button>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{width: 36}}><input type="checkbox" disabled/></th>
                    <th>商品</th>
                    <th className="num">現在価格</th>
                    <th className="num">送料</th>
                    <th className="num">合計</th>
                    <th className="num">ライバル最安</th>
                    <th className="num">推奨価格</th>
                    <th className="num">変動</th>
                    <th>状態</th>
                    <th>最終確認</th>
                    <th style={{width: 60}}></th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_LISTINGS.map(l => (
                    <tr key={l.id} className={selected === l.id ? 'selected' : ''} onClick={() => setSelected(l.id)} style={{cursor:'pointer'}}>
                      <td><input type="checkbox"/></td>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap: 10}}>
                          <div className="thumb"><I.Image size={14}/></div>
                          <div style={{minWidth:0}}>
                            <div style={{fontWeight: 500, fontSize: 13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: 240}}>{l.title}</div>
                            <div className="mono tiny muted">{l.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num mono">{fmtMoney(l.price)}</td>
                      <td className="num mono muted">{fmtMoney(l.ship)}</td>
                      <td className="num mono" style={{fontWeight: 600}}>{fmtMoney(l.total)}</td>
                      <td className="num mono">{fmtMoney(l.compTotal)}</td>
                      <td className="num mono" style={{color: 'var(--primary-active)', fontWeight: 600}}>{fmtMoney(l.suggested)}</td>
                      <td className="num mono" style={{color: l.drop != null && l.drop < 0 ? 'var(--negative)' : 'var(--text-2)', fontSize:12}}>{fmtPct(l.drop)}</td>
                      <td><span className={`badge-pill ${STATUS_MAP[l.status]}`}><span className="dot"/>{l.status}</span></td>
                      <td className="muted tiny mono">{l.last}</td>
                      <td>
                        <div style={{display:'flex', gap:4, color:'var(--text-3)'}}>
                          <I.Eye size={16}/>
                          <I.More size={16}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{padding: '12px 14px', borderTop: '1px solid var(--border)', display:'flex', alignItems:'center', gap: 8, fontSize: 12, color:'var(--text-2)'}}>
                <span>1,248 件中 1〜10 件を表示</span>
                <div style={{flex:1}}/>
                <div style={{display:'flex', gap: 2}}>
                  {['‹','1','2','3','4','5','…','125','›'].map((p,i) => (
                    <span key={i} style={{minWidth: 28, height: 28, padding:'0 8px', display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius: 4, background: p === '1' ? 'var(--primary)' : 'transparent', color: p === '1' ? '#fff' : 'var(--text-1)', cursor: p === '…' ? 'default' : 'pointer', border: p === '1' ? 0 : '1px solid var(--border)'}}>{p}</span>
                  ))}
                </div>
                <span>表示件数 <strong>10</strong></span>
              </div>
            </div>
          </div>

          {/* Right detail panel */}
          <div style={{width: 360, background:'#fff', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden'}}>
            <div style={{padding: 18, borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 12}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize: 11, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight: 600, marginBottom:6}}>選択中のリスティング</div>
                  <div style={{fontSize: 15, fontWeight: 600, lineHeight: 1.35}}>{sel.title}</div>
                  <div className="mono tiny muted" style={{marginTop:4}}>Item ID: {sel.id}</div>
                </div>
                <I.X size={18} stroke="var(--text-2)"/>
              </div>
            </div>
            <div style={{flex:1, overflow:'auto', padding: 18, display:'flex', flexDirection:'column', gap: 18}}>

              {/* Competitor card */}
              <div className="card subtle" style={{padding: 14, display:'flex', gap: 12}}>
                <div className="thumb lg"><I.Image size={18}/></div>
                <div style={{flex:1, minWidth:0}}>
                  <div className="tiny muted">採用ライバル</div>
                  <div style={{fontWeight: 600, fontSize: 13, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>Pioneer FH-P7000MD</div>
                  <div className="mono tiny muted">$139.99 + 送料 $0.00</div>
                  <div style={{display:'flex', gap: 6, marginTop: 6}}>
                    <span className="badge-pill neutral">中古</span>
                    <span className="badge-pill info">SellerDealsDude (98.1%)</span>
                  </div>
                </div>
              </div>

              {/* Guard flags */}
              <div>
                <div style={{fontSize:11, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-2)', marginBottom: 10}}>ガード判定</div>
                {[
                  { ok: true,  text: '最低価格 設定あり ($90.00)' },
                  { ok: true,  text: '5%下落ガード 有効' },
                  { ok: false, text: '最低価格まで5%以内', note: '抵触' },
                  { ok: true,  text: '送料 取得済み' },
                  { ok: true,  text: 'AI同一商品判定 0.92' },
                ].map((g,i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap: 10, padding:'7px 0', fontSize: 13}}>
                    {g.ok ? <I.Check size={14} stroke="var(--success)"/> : <I.AlertCircle size={14} stroke="var(--warning)"/>}
                    <span>{g.text}</span>
                    {g.note && <span style={{marginLeft:'auto'}} className="badge-pill warning">{g.note}</span>}
                  </div>
                ))}
              </div>

              {/* Change summary */}
              <div>
                <div style={{fontSize:11, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-2)', marginBottom: 10}}>変更内容</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr auto', rowGap: 8, columnGap: 12, fontSize: 13}}>
                  <span className="muted">現在合計</span><span className="mono num" style={{textAlign:'right'}}>$150.00</span>
                  <span className="muted">ライバル合計</span><span className="mono num" style={{textAlign:'right'}}>$139.99</span>
                  <span className="muted">推奨価格</span><span className="mono num" style={{textAlign:'right', fontWeight: 600, color:'var(--primary-active)'}}>$109.99</span>
                  <span className="muted">差分</span><span className="mono num" style={{textAlign:'right', color:'var(--negative)'}}>−$40.01 (−26.67%)</span>
                  <span className="muted">最低価格ガード</span><span className="mono num" style={{textAlign:'right'}}>$90.00 ✓</span>
                  <span className="muted">5%下落ガード</span><span style={{textAlign:'right'}}><span className="badge-pill warning">抵触</span></span>
                  <span className="muted">自動反映</span><span style={{textAlign:'right', fontWeight:600}}>OFF</span>
                </div>
              </div>

              {/* Reason */}
              <div className="card" style={{padding: 12, background: 'var(--warning-bg)', border:'1px solid var(--warning-border)'}}>
                <div style={{display:'flex', gap: 8, color:'var(--warning-text)', fontSize: 13}}>
                  <I.AlertTriangle size={15} stroke="var(--warning-text)"/>
                  <div>
                    <div style={{fontWeight: 600, marginBottom: 2}}>承認待ち</div>
                    <div style={{fontSize: 12}}>下落幅が5%ガードを超過しています。最終確認 本日 09:15。</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{padding: 14, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap: 8}}>
              <div style={{display:'flex', gap:8}}>
                <button className="btn primary" style={{flex:1}}><I.Check size={14}/> 承認して更新</button>
                <button className="btn"><I.X size={14}/></button>
              </div>
              <div style={{display:'flex', gap: 8}}>
                <button className="btn ghost sm" style={{flex:1}}><I.Eye size={13}/> eBayで開く</button>
                <button className="btn ghost sm" style={{flex:1}}><I.Settings size={13}/> 設定を編集</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.VariationA = VariationA;
