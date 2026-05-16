// Variation C — スプリット比較ビュー
const VariationC = () => {
  const [selected, setSelected] = React.useState('123456789012');
  const sel = SAMPLE_LISTINGS.find(l => l.id === selected) || SAMPLE_LISTINGS[0];

  const watchlist = SAMPLE_LISTINGS.slice(0, 8);

  return (
    <div className="ds-root" style={{display:'flex', height:'100%', background:'var(--surface)'}}>
      <Sidebar active="ダッシュボード"/>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <TopBar/>
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>

          {/* Left rail */}
          <div style={{width: 320, borderRight: '1px solid var(--border)', background:'#fff', display:'flex', flexDirection:'column', flexShrink: 0}}>
            <div style={{padding: '16px 18px', borderBottom: '1px solid var(--border)'}}>
              <div style={{fontSize: 14, fontWeight: 600, marginBottom: 8}}>マッチブック</div>
              <div style={{display:'flex', gap: 4}}>
                <span className="badge-pill warning" style={{cursor:'pointer'}}>承認待ち 23</span>
                <span className="badge-pill neutral" style={{cursor:'pointer'}}>すべて 1,248</span>
                <span className="badge-pill success" style={{cursor:'pointer'}}>更新済</span>
              </div>
            </div>
            <div style={{flex:1, overflow:'auto'}}>
              {watchlist.map(l => {
                const isSel = l.id === selected;
                return (
                  <div key={l.id} onClick={() => setSelected(l.id)} style={{padding:'12px 18px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: isSel ? 'var(--primary-subtle)' : 'transparent', borderLeft: isSel ? '3px solid var(--primary)' : '3px solid transparent', display:'flex', gap: 12, alignItems:'center'}}>
                    <div className="thumb"><I.Image size={14}/></div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize: 13, fontWeight: 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{l.title}</div>
                      <div style={{display:'flex', gap: 8, alignItems:'center', marginTop: 4}}>
                        <span className={`dot-status ${STATUS_MAP[l.status]}`}/>
                        <span className="mono tiny muted">{fmtMoney(l.total)}</span>
                        <I.ChevronRight size={11} stroke="var(--text-3)"/>
                        <span className="mono tiny" style={{color:'var(--primary-active)'}}>{fmtMoney(l.suggested)}</span>
                        <span className="mono tiny" style={{color: l.drop && l.drop < 0 ? 'var(--negative)' : 'var(--text-3)', marginLeft:'auto'}}>{l.drop != null ? `${l.drop > 0 ? '+' : ''}${l.drop.toFixed(1)}%` : '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center: compare view */}
          <div style={{flex:1, padding: 28, overflow:'auto', minWidth:0}}>

            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20}}>
              <div>
                <div className="tiny muted mono">Item ID {sel.id}</div>
                <h1 style={{margin:'4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing:'-0.01em'}}>{sel.title}</h1>
              </div>
              <div style={{display:'flex', gap: 8}}>
                <button className="btn"><I.Eye size={14}/> eBayで開く</button>
                <button className="btn"><I.Settings size={14}/> 設定</button>
              </div>
            </div>

            {/* Side-by-side compare */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 56px 1fr', gap: 16, marginBottom: 20}}>
              <div className="card" style={{padding: 20, borderTop:'3px solid var(--primary)'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14}}>
                  <span className="badge-pill info">自分</span>
                  <span className="tiny muted">出品中のリスティング</span>
                </div>
                <div style={{display:'flex', gap: 14, marginBottom: 16}}>
                  <div className="thumb lg" style={{width: 76, height: 76}}><I.Image size={22}/></div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize: 14, fontWeight: 600, lineHeight: 1.3}}>{sel.title}</div>
                    <div style={{display:'flex', gap: 6, marginTop: 8, flexWrap:'wrap'}}>
                      <span className="badge-pill neutral">中古</span>
                      <span className="badge-pill neutral">日本発送</span>
                      <span className="badge-pill neutral">動作確認済</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 10}}>
                  <div>
                    <div className="tiny muted">商品価格</div>
                    <div className="mono num" style={{fontSize: 18, fontWeight: 700}}>${sel.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="tiny muted">送料</div>
                    <div className="mono num" style={{fontSize: 18, fontWeight: 600, color:'var(--text-2)'}}>${sel.ship.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="tiny muted">合計</div>
                    <div className="mono num" style={{fontSize: 18, fontWeight: 700}}>${sel.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 8}}>
                <div style={{width: 40, height: 40, borderRadius: 20, background:'#fff', border:'1px solid var(--border)', display:'grid', placeItems:'center', boxShadow:'var(--shadow-sm)', fontWeight: 700, fontSize: 13, color:'var(--text-2)'}}>VS</div>
                <div style={{width: 1, flex:1, background:'var(--border)'}}/>
                <div className="mono tiny muted" style={{writingMode:'vertical-rl', transform:'rotate(180deg)'}}>合計を比較</div>
                <div style={{width: 1, flex:1, background:'var(--border)'}}/>
                <div style={{padding:'4px 10px', borderRadius:999, background:'var(--negative)', color:'#fff', fontSize:11, fontWeight:700}}>−$10.01</div>
              </div>

              <div className="card" style={{padding: 20, borderTop:'3px solid var(--negative)'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14}}>
                  <span className="badge-pill error" style={{background:'#FEE2E2', color:'#991B1B'}}>ライバル ・ 採用</span>
                  <span className="tiny muted">SellerDealsDude · 98.1%</span>
                </div>
                <div style={{display:'flex', gap: 14, marginBottom: 16}}>
                  <div className="thumb lg" style={{width: 76, height: 76}}><I.Image size={22}/></div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize: 14, fontWeight: 600, lineHeight: 1.3}}>Pioneer FH-P7000MD MD CD Receiver Tested</div>
                    <div style={{display:'flex', gap: 6, marginTop: 8, flexWrap:'wrap'}}>
                      <span className="badge-pill neutral">中古</span>
                      <span className="badge-pill neutral">米国発送</span>
                      <span className="badge-pill info">AI 0.92</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 10}}>
                  <div>
                    <div className="tiny muted">商品価格</div>
                    <div className="mono num" style={{fontSize: 18, fontWeight: 700}}>$139.99</div>
                  </div>
                  <div>
                    <div className="tiny muted">送料</div>
                    <div className="mono num" style={{fontSize: 18, fontWeight: 600, color:'var(--text-2)'}}>$0.00</div>
                  </div>
                  <div>
                    <div className="tiny muted">合計</div>
                    <div className="mono num" style={{fontSize: 18, fontWeight: 700}}>$139.99</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation strip */}
            <div className="card" style={{padding: 24, marginBottom: 20, background: 'linear-gradient(180deg, #fff, #F5F8FF)', borderColor: 'var(--primary-subtle-hover)'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18}}>
                <div>
                  <div className="tiny" style={{fontWeight: 600, color:'var(--primary-active)', textTransform:'uppercase', letterSpacing:'0.05em'}}>推奨価格調整</div>
                  <div style={{fontSize: 13, color:'var(--text-2)', marginTop: 4}}>ライバル合計から $0.01 の値下げ幅</div>
                </div>
                <span className="badge-pill warning"><I.AlertTriangle size={12}/>5%下落ガード抵触のため手動承認</span>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap: 18, alignItems:'end'}}>
                <div>
                  <div className="tiny muted">現在合計</div>
                  <div className="mono num" style={{fontSize: 24, fontWeight: 700, color:'var(--text-2)', textDecoration:'line-through'}}>$150.00</div>
                </div>
                <div>
                  <div className="tiny muted">目標合計</div>
                  <div className="mono num" style={{fontSize: 24, fontWeight: 700}}>$139.98</div>
                </div>
                <div>
                  <div className="tiny" style={{color:'var(--primary)', fontWeight: 600}}>新しい商品価格</div>
                  <div className="mono num" style={{fontSize: 32, fontWeight: 800, color:'var(--primary-active)', letterSpacing:'-0.02em', lineHeight:1}}>$109.99</div>
                  <div className="tiny muted mono" style={{marginTop:4}}>+ 送料 $25.00 → 合計 $134.99</div>
                </div>
                <div>
                  <div className="tiny muted">変動</div>
                  <div className="mono num" style={{fontSize: 24, fontWeight: 700, color:'var(--negative)'}}>−$40.01</div>
                  <div className="tiny" style={{color:'var(--negative)', marginTop: 2}}>−26.67%</div>
                </div>
              </div>

              {/* Range bar */}
              <div style={{marginTop: 24}}>
                <div style={{position:'relative', height: 8, background:'var(--surface-2)', borderRadius: 4}}>
                  <div style={{position:'absolute', left:'30%', top:-6, bottom:-6, width:2, background:'var(--negative)'}}/>
                  <div style={{position:'absolute', left:'45%', top:-2, height: 12, width:12, borderRadius: 6, background:'var(--primary)', border:'2px solid #fff', boxShadow:'var(--shadow-sm)'}}/>
                  <div style={{position:'absolute', left:'68%', top:-6, bottom:-6, width:2, background:'var(--negative)'}}/>
                  <div style={{position:'absolute', left:'78%', top:-2, height: 12, width:12, borderRadius: 6, background:'var(--text-2)', border:'2px solid #fff'}}/>
                  <div style={{position:'absolute', left:0, right:'55%', height:'100%', borderRadius: 4, background:'linear-gradient(90deg, var(--error-bg), transparent)'}}/>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop: 8, fontSize: 11, color:'var(--text-3)'}}>
                  <span>$0</span>
                  <span style={{color:'var(--negative)'}}>最低 $90</span>
                  <span style={{color:'var(--primary)', fontWeight: 600}}>推奨 $109.99</span>
                  <span style={{color:'var(--negative)'}}>ライバル $139.99</span>
                  <span>現在 $150</span>
                  <span>$200</span>
                </div>
              </div>

              <div style={{display:'flex', gap: 10, marginTop: 20, alignItems:'center'}}>
                <button className="btn primary"><I.Check size={14}/>承認して更新</button>
                <button className="btn"><I.X size={14}/>却下</button>
                <button className="btn ghost">手動で調整…</button>
                <div style={{flex:1}}/>
                <span className="tiny muted">提案 09:15 ・ この商品は自動反映 OFF</span>
              </div>
            </div>

            {/* Reason / log */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16}}>
              <div className="card" style={{padding: 18}}>
                <div style={{fontSize: 13, fontWeight: 600, marginBottom: 12}}>同一商品判定の根拠</div>
                {[
                  { ok: true, label: '型番 FH-P7000MD 一致' },
                  { ok: true, label: 'コンディション一致（中古）' },
                  { ok: true, label: '画像一致（AI 0.92）' },
                  { ok: false, label: 'タイトルが微妙に異なる（"MD CD Receiver"）', note: 'AI判定' },
                  { ok: true, label: 'セール中ではない／For-parts等でない' },
                ].map((r,i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize: 13}}>
                    {r.ok ? <I.Check size={14} stroke="var(--success)"/> : <I.AlertCircle size={14} stroke="var(--warning)"/>}
                    <span>{r.label}</span>
                    {r.note && <span className="badge-pill info" style={{marginLeft:'auto'}}>{r.note}</span>}
                  </div>
                ))}
              </div>
              <div className="card" style={{padding: 18}}>
                <div style={{fontSize: 13, fontWeight: 600, marginBottom: 12}}>直近に取得したライバル</div>
                {[
                  { seller: 'SellerDealsDude', total: 139.99, time: '09:15', adopted: true },
                  { seller: 'AudioVintageStore', total: 142.50, time: '09:15', adopted: false },
                  { seller: 'CarTunesNJ', total: 149.00, time: '08:01', adopted: false },
                  { seller: 'DealsByDoug', total: 155.25, time: '08:01', adopted: false },
                ].map((r, i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap: 12, padding:'7px 0', fontSize: 13, borderBottom: i < 3 ? '1px solid var(--border)' : 0}}>
                    <span className={`dot-status ${r.adopted ? 'success' : 'neutral'}`}/>
                    <span style={{flex:1}}>{r.seller}</span>
                    <span className="mono num" style={{fontWeight: r.adopted ? 700 : 500}}>${r.total.toFixed(2)}</span>
                    <span className="mono tiny muted" style={{minWidth: 40, textAlign:'right'}}>{r.time}</span>
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

window.VariationC = VariationC;
