// Variation D — コマンドセンター（高密度オペレーションUI）
const VariationD = () => {
  return (
    <div className="ds-root" style={{display:'flex', height:'100%', background:'#0F172A'}}>
      <div className="sb" style={{width: 56, alignItems:'center'}}>
        <div style={{padding:'14px 0'}}>
          <div className="sb-logo-icon" style={{width: 32, height: 32, borderRadius: 8}}><I.Shield size={18} stroke="#fff"/></div>
        </div>
        <div className="sb-nav" style={{padding:'4px 6px', alignItems:'center'}}>
          {[I.Home, I.Inbox, I.Tag, I.Activity, I.Settings].map((Ic, i) => (
            <div key={i} className={`sb-item ${i === 0 ? 'active' : ''}`} style={{justifyContent:'center', padding: 10, position:'relative'}}>
              <Ic size={18}/>
              {i === 1 && <span style={{position:'absolute', top:4, right:4, background:'var(--warning)', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:8}}>23</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'#0F172A', color:'#E2E8F0'}}>
        {/* Topbar */}
        <div style={{height: 44, borderBottom: '1px solid #1E293B', display:'flex', alignItems:'center', padding:'0 16px', gap: 16, fontSize: 12}}>
          <div style={{display:'flex', alignItems:'center', gap: 8, fontWeight: 600, color:'#fff'}}>
            <span>PRICE SENTRY</span>
            <span style={{color:'#475569', fontWeight: 400}}>/ ダッシュボード</span>
          </div>
          <div style={{flex:1, maxWidth: 360, height: 28, background:'#1E293B', border:'1px solid #334155', borderRadius: 4, display:'flex', alignItems:'center', gap:6, padding:'0 10px', color:'#94A3B8'}}>
            <I.Search size={12}/>
            <span>商品・SKU・セラーを検索…</span>
            <span style={{marginLeft:'auto', fontSize: 10, color:'#64748B'}}>⌘K</span>
          </div>
          <div style={{flex:1}}/>
          <div style={{display:'flex', gap: 16, alignItems:'center', fontSize: 11}}>
            <span><span style={{color:'#64748B'}}>巡回</span> <span className="mono" style={{color:'#10B981'}}>● 待機中</span></span>
            <span><span style={{color:'#64748B'}}>次回</span> <span className="mono">15:00</span></span>
            <span><span style={{color:'#64748B'}}>最終</span> <span className="mono">10:16</span></span>
            <span><span style={{color:'#64748B'}}>API</span> <span className="mono" style={{color:'#10B981'}}>4,127/5,000</span></span>
            <div style={{display:'flex', alignItems:'center', gap: 6, padding:'4px 10px', background:'#064E3B', border:'1px solid #047857', borderRadius: 4, fontSize: 11, fontWeight: 600, color:'#A7F3D0'}}>
              <span style={{width:6, height:6, borderRadius:3, background:'#10B981'}}/>自動反映 ON
            </div>
            <button className="btn sm" style={{background:'#1E293B', borderColor:'#334155', color:'#E2E8F0'}}><I.RefreshCw size={11}/> 巡回</button>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', borderBottom:'1px solid #1E293B'}}>
          {[
            { l: '対象', v: '1,248', c: '#E2E8F0' },
            { l: '承認待ち', v: '23', c: '#FBBF24' },
            { l: '更新済', v: '312', c: '#10B981' },
            { l: 'スキップ', v: '87', c: '#94A3B8' },
            { l: 'エラー', v: '5', c: '#EF4444' },
            { l: '平均下落', v: '−4.2%', c: '#EF4444', mono: true },
            { l: '推定削減額', v: '$1,142', c: '#10B981', mono: true },
            { l: '次回まで', v: '4時間44分', c: '#E2E8F0', mono: false },
          ].map((s, i) => (
            <div key={i} style={{padding:'10px 14px', borderRight: i < 7 ? '1px solid #1E293B' : 0}}>
              <div style={{fontSize: 10, color:'#64748B', fontWeight: 600, letterSpacing:'0.04em'}}>{s.l}</div>
              <div className={s.mono ? 'mono num' : 'num'} style={{fontSize: 18, fontWeight: 700, color: s.c, marginTop: 2}}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{flex:1, display:'grid', gridTemplateColumns:'2fr 1fr', minHeight: 0}}>
          <div style={{borderRight:'1px solid #1E293B', display:'flex', flexDirection:'column', minHeight: 0}}>
            <div style={{padding:'8px 14px', borderBottom:'1px solid #1E293B', display:'flex', alignItems:'center', gap: 10, fontSize: 11}}>
              <span style={{fontWeight: 600, color:'#fff'}}>リスティング</span>
              <div style={{display:'flex', gap: 4}}>
                {['すべて', '承認待ち', '更新済', 'スキップ', 'エラー'].map((t, i) => (
                  <span key={t} style={{padding:'3px 8px', borderRadius: 3, background: i === 1 ? '#1E40AF' : '#1E293B', color: i === 1 ? '#fff' : '#94A3B8', fontSize: 10, fontWeight: 600, cursor:'pointer'}}>{t}</span>
                ))}
              </div>
              <div style={{flex:1}}/>
              <span style={{color:'#64748B', fontSize: 10}}>並び</span>
              <span style={{color:'#94A3B8', fontSize: 10, fontWeight: 600}}>変動% 降順 ▾</span>
            </div>

            <div style={{flex:1, overflow:'auto', fontSize: 11, fontFamily:'JetBrains Mono, monospace'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#0B1120', position:'sticky', top: 0, zIndex: 1}}>
                    {['', 'ITEM', '商品名', '現在', '送料', '合計', 'ライバル', '推奨', '差額', '変動%', 'AI', '状態', '時刻'].map((h, i) => (
                      <th key={i} style={{textAlign: i >= 3 && i <= 9 ? 'right' : 'left', padding:'6px 10px', color:'#64748B', fontWeight: 600, fontSize: 10, letterSpacing:'0.02em', borderBottom:'1px solid #1E293B'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_LISTINGS.concat(SAMPLE_LISTINGS.slice(0,4)).map((l, idx) => {
                    const statusColor = {
                      '更新済': '#10B981',
                      '承認待ち': '#FBBF24',
                      'スキップ': '#94A3B8',
                      'エラー': '#EF4444',
                    }[l.status];
                    const dropColor = l.drop != null && l.drop < -5 ? '#EF4444' : l.drop != null && l.drop < 0 ? '#FBBF24' : '#94A3B8';
                    return (
                      <tr key={idx} style={{borderBottom:'1px solid #1E293B'}}>
                        <td style={{padding:'5px 10px'}}><span style={{display:'inline-block', width:6, height:6, borderRadius:3, background: statusColor}}/></td>
                        <td style={{padding:'5px 10px', color:'#94A3B8'}}>{l.id.slice(-7)}</td>
                        <td style={{padding:'5px 10px', color:'#E2E8F0', maxWidth: 240, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily: 'Inter, sans-serif'}}>{l.title}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color:'#E2E8F0'}}>{l.price.toFixed(2)}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color:'#64748B'}}>{l.ship.toFixed(2)}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color:'#fff', fontWeight: 700}}>{l.total.toFixed(2)}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color:'#94A3B8'}}>{l.compTotal != null ? l.compTotal.toFixed(2) : '—'}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color:'#60A5FA', fontWeight: 700}}>{l.suggested != null ? l.suggested.toFixed(2) : '—'}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color: dropColor}}>{l.suggested != null ? (l.suggested - l.price).toFixed(2) : '—'}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color: dropColor, fontWeight: 600}}>{l.drop != null ? `${l.drop > 0 ? '+' : ''}${l.drop.toFixed(2)}` : '—'}</td>
                        <td style={{padding:'5px 10px', textAlign:'right', color: l.ai != null && l.ai >= 0.85 ? '#10B981' : l.ai != null ? '#FBBF24' : '#475569'}}>{l.ai != null ? l.ai.toFixed(2) : '—'}</td>
                        <td style={{padding:'5px 10px', color: statusColor, fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600}}>{l.status}</td>
                        <td style={{padding:'5px 10px', color:'#64748B'}}>{l.last}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{padding:'6px 14px', borderTop:'1px solid #1E293B', display:'flex', alignItems:'center', fontSize: 10, color:'#64748B'}}>
              <span>1〜14 / 1,248</span>
              <div style={{flex:1}}/>
              <span style={{marginRight: 12}}>絞り込み <span style={{color:'#94A3B8'}}>状態:承認待ち</span></span>
              <span>CSV出力</span>
            </div>
          </div>

          {/* Right: detail / activity */}
          <div style={{display:'flex', flexDirection:'column', minHeight: 0, fontSize: 12}}>
            <div style={{padding: 16, borderBottom:'1px solid #1E293B'}}>
              <div style={{fontSize: 10, color:'#64748B', fontWeight: 600, letterSpacing:'0.04em', marginBottom: 6}}>選択中 ・ 9012</div>
              <div style={{fontSize: 14, fontWeight: 600, color:'#fff', lineHeight: 1.3, marginBottom: 12}}>Pioneer FH-P7000MD Car Audio Used Tested</div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 1, background:'#1E293B', border:'1px solid #1E293B', borderRadius: 4, marginBottom: 14}}>
                {[
                  { l:'自分の合計',  v:'$150.00', c:'#fff' },
                  { l:'ライバル合計', v:'$139.99', c:'#FBBF24' },
                  { l:'推奨価格',  v:'$109.99', c:'#60A5FA', big: true },
                  { l:'変動',     v:'−$40.01 / −26.67%', c:'#EF4444' },
                  { l:'最低価格',  v:'$90.00', c:'#94A3B8' },
                  { l:'AI信頼度',    v:'0.92', c:'#10B981' },
                ].map((c, i) => (
                  <div key={i} style={{padding: '8px 10px', background:'#0B1120'}}>
                    <div style={{fontSize: 9, color:'#64748B', fontWeight: 600, letterSpacing:'0.04em'}}>{c.l}</div>
                    <div className="mono num" style={{fontSize: c.big ? 16 : 13, fontWeight: 700, color: c.c, marginTop: 2}}>{c.v}</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize: 10, color:'#64748B', fontWeight: 600, letterSpacing:'0.04em', marginBottom: 8}}>ガード判定</div>
              {[
                { ok: true,  k: '最低価格',     v: '$90.00 OK' },
                { ok: false, k: '5%下落',     v: '抵触 ・ −26.67%' },
                { ok: true,  k: 'セール中',       v: 'なし' },
                { ok: true,  k: '送料',      v: '取得済' },
                { ok: true,  k: 'AI閾値',  v: '0.92 ≥ 0.85' },
                { ok: true,  k: '自動反映',   v: 'OFF（ローカル）' },
              ].map((g, i) => (
                <div key={i} style={{display:'flex', gap: 8, padding:'3px 0', fontSize: 11}}>
                  <span style={{color: g.ok ? '#10B981' : '#FBBF24', width: 12}}>{g.ok ? '✓' : '!'}</span>
                  <span style={{color:'#94A3B8', width: 110}}>{g.k}</span>
                  <span style={{color:'#E2E8F0'}}>{g.v}</span>
                </div>
              ))}

              <div style={{display:'flex', gap: 6, marginTop: 14}}>
                <button className="btn sm" style={{flex: 2, background:'#1E40AF', borderColor:'#1E40AF', color:'#fff', fontWeight:600}}><I.Check size={12}/>承認</button>
                <button className="btn sm" style={{flex: 1, background:'#1E293B', borderColor:'#334155', color:'#FCA5A5'}}>却下</button>
                <button className="btn sm" style={{background:'#1E293B', borderColor:'#334155', color:'#94A3B8'}}><I.More size={12}/></button>
              </div>
            </div>

            {/* Live activity feed */}
            <div style={{flex:1, overflow:'auto', minHeight: 0}}>
              <div style={{padding:'10px 16px', display:'flex', alignItems:'center', gap: 8, fontSize: 10, color:'#64748B', fontWeight:600, letterSpacing:'0.04em', borderBottom:'1px solid #1E293B'}}>
                <span style={{width: 6, height: 6, borderRadius: 3, background:'#10B981'}}/>
                ライブ活動
                <div style={{flex:1}}/>
                <span>直近1時間</span>
              </div>
              <div style={{padding: '6px 16px', fontFamily:'JetBrains Mono, monospace', fontSize: 11}}>
                {[
                  { t: '10:16:42', kind: '更新', c:'#10B981', text: '789013 $230.00 → $199.95（−13.07%）' },
                  { t: '10:16:38', kind: '保留', c:'#FBBF24', text: '789012 承認待ち：5%下落抵触' },
                  { t: '10:16:35', kind: '更新', c:'#10B981', text: '789014 $110.00 → $89.99（−18.19%）' },
                  { t: '10:16:33', kind: '除外', c:'#94A3B8', text: '789016 スキップ：最低価格を下回る' },
                  { t: '10:16:30', kind: '更新', c:'#10B981', text: '789018 $64.99 → $44.99（−30.77%）' },
                  { t: '10:16:28', kind: 'エラー',  c:'#EF4444', text: '789021 Trading API 500 ・ Inventory商品の可能性' },
                  { t: '10:16:25', kind: '保留', c:'#FBBF24', text: '789017 AI信頼度 0.74 < 0.85' },
                  { t: '10:16:22', kind: '更新', c:'#10B981', text: '789019 $74.99 → $54.99（−26.67%）' },
                  { t: '10:16:20', kind: '除外', c:'#94A3B8', text: '789020 セール中商品のためスキップ' },
                  { t: '10:16:18', kind: '更新', c:'#10B981', text: '789015 $70.00 → $70.49（+0.70%）' },
                  { t: '10:16:15', kind: '情報', c:'#60A5FA', text: '09:00巡回完了 ・ 4分21秒 ・ 1,248件チェック' },
                ].map((e, i) => (
                  <div key={i} style={{display:'flex', gap: 10, padding:'4px 0', alignItems:'baseline'}}>
                    <span style={{color:'#475569', width: 56, flexShrink:0}}>{e.t}</span>
                    <span style={{color: e.c, width: 44, flexShrink:0, fontWeight: 700, fontFamily:'Inter, sans-serif', fontSize: 10}}>{e.kind}</span>
                    <span style={{color:'#94A3B8', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.VariationD = VariationD;
