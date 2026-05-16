// Variation B — トリアージ／カードフォワード
const VariationB = () => {
  const pending = SAMPLE_LISTINGS.filter(l => l.status === '承認待ち');

  return (
    <div className="ds-root" style={{display:'flex', height:'100%', background:'var(--surface)'}}>
      <Sidebar active="ダッシュボード"/>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <TopBar/>
        <div style={{flex:1, overflow:'auto', padding: '24px 28px'}}>

          {/* Hero header */}
          <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 20}}>
            <div>
              <div className="muted" style={{fontSize: 12, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.06em'}}>4月29日（火）</div>
              <h1 style={{margin:'6px 0 0', fontSize: 28, fontWeight: 700, letterSpacing:'-0.02em'}}>おはようございます。<span className="muted" style={{fontWeight: 500}}>本日は 23 件の確認が必要です。</span></h1>
            </div>
            <div style={{display:'flex', gap: 8}}>
              <button className="btn"><I.RefreshCw size={14}/> 今すぐ巡回</button>
              <button className="btn primary"><I.CheckCircle size={14}/> 承認キューを開く</button>
            </div>
          </div>

          {/* Triage row */}
          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 16, marginBottom: 20}}>
            <div className="card" style={{padding: 0, overflow:'hidden', borderTop: '3px solid var(--warning)'}}>
              <div style={{padding: '16px 20px', display:'flex', alignItems:'center', gap: 12}}>
                <div style={{width: 36, height: 36, borderRadius: 8, background: 'var(--warning-bg)', color: 'var(--warning-text)', display:'grid', placeItems:'center'}}>
                  <I.AlertTriangle size={18}/>
                </div>
                <div>
                  <div style={{fontSize: 12, color:'var(--text-2)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.04em'}}>要対応</div>
                  <div style={{fontSize: 22, fontWeight: 700, letterSpacing:'-0.02em'}}>承認待ち 23 件 ・ エラー 5 件</div>
                </div>
                <div style={{flex:1}}/>
                <button className="btn sm">すべて表示</button>
              </div>

              <div style={{borderTop: '1px solid var(--border)'}}>
                {pending.slice(0,3).map(l => (
                  <div key={l.id} style={{padding: '14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap: 14}}>
                    <div className="thumb lg"><I.Image size={18}/></div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight: 600, fontSize: 14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{l.title}</div>
                      <div style={{display:'flex', gap: 14, fontSize: 12, color:'var(--text-2)', marginTop: 4}}>
                        <span className="mono">{l.id}</span>
                        <span>·</span>
                        <span>{l.drop && l.drop < -5 ? `5%下落ガードに抵触` : l.sale ? 'セール中商品' : 'AI信頼度が低い'}</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="mono muted tiny">現在</div>
                      <div className="mono num" style={{fontWeight: 600}}>{fmtMoney(l.total)}</div>
                    </div>
                    <div style={{textAlign:'right', minWidth: 80}}>
                      <div className="mono tiny" style={{color:'var(--primary-active)'}}>推奨</div>
                      <div className="mono num" style={{fontWeight: 700, color:'var(--primary-active)'}}>{fmtMoney(l.suggested)}</div>
                    </div>
                    <div style={{textAlign:'right', minWidth: 70}}>
                      <div className="mono tiny muted">変動</div>
                      <div className="mono" style={{color:'var(--negative)', fontSize:13, fontWeight:600}}>{fmtPct(l.drop)}</div>
                    </div>
                    <div style={{display:'flex', gap: 6}}>
                      <button className="btn sm primary"><I.Check size={13}/></button>
                      <button className="btn sm"><I.X size={13}/></button>
                    </div>
                  </div>
                ))}
                <div style={{padding:'10px 20px', textAlign:'center', fontSize: 13}}>
                  <a style={{color:'var(--primary)', fontWeight: 500, textDecoration:'none', cursor:'pointer'}}>残り 20 件の承認待ちを見る →</a>
                </div>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap: 12}}>
              <div className="card" style={{padding: 18, display:'flex', alignItems:'center', gap: 14}}>
                <div style={{width: 44, height: 44, borderRadius: 10, background:'var(--success-bg)', color:'var(--success-text)', display:'grid', placeItems:'center'}}>
                  <I.TrendingUp size={20}/>
                </div>
                <div style={{flex:1}}>
                  <div className="tiny muted">本日更新</div>
                  <div style={{fontSize: 26, fontWeight: 700, letterSpacing:'-0.02em', lineHeight: 1.1}}>312</div>
                  <div className="tiny" style={{color:'var(--success-text)'}}>平均下落 −4.2% ・ 推定 $1,142 削減</div>
                </div>
                <div className="spark-bar" style={{height: 36}}>
                  {[6,9,11,8,14,12,16,10,18,15,22,19].map((h,i) => <i key={i} style={{height: h*1.6, background: 'var(--success)'}}/>)}
                </div>
              </div>

              <div className="card" style={{padding: 18, display:'flex', alignItems:'center', gap: 14}}>
                <div style={{width: 44, height: 44, borderRadius: 10, background:'var(--primary-subtle)', color:'var(--primary-active)', display:'grid', placeItems:'center'}}>
                  <I.Target size={20}/>
                </div>
                <div style={{flex:1}}>
                  <div className="tiny muted">対象リスティング</div>
                  <div style={{fontSize: 26, fontWeight: 700, letterSpacing:'-0.02em', lineHeight: 1.1}}>1,248</div>
                  <div className="tiny muted">今週 +12 件 ・ 本日スキップ 87 件</div>
                </div>
              </div>

              <div className="card" style={{padding: 14, display:'flex', alignItems:'center', gap: 14, background:'var(--error-bg)', borderColor:'var(--error-border)'}}>
                <I.AlertCircle size={20} stroke="var(--error-text)"/>
                <div style={{flex:1}}>
                  <div style={{fontSize: 13, fontWeight: 600, color:'var(--error-text)'}}>直近24時間で APIエラー 5 件</div>
                  <div className="tiny" style={{color:'var(--error-text)', opacity:.8}}>Inventory API 管理商品の可能性</div>
                </div>
                <button className="btn sm" style={{background:'#fff'}}>確認</button>
              </div>
            </div>
          </div>

          {/* Activity / health row */}
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap: 16, marginBottom: 20}}>
            <div className="card" style={{padding: 20}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16}}>
                <div>
                  <div style={{fontSize: 14, fontWeight: 600}}>本日の巡回状況</div>
                  <div className="tiny muted">1日3回 ・ 09:00 / 15:00 / 21:00</div>
                </div>
                <div style={{display:'flex', gap: 6}}>
                  <span className="badge-pill success"><span className="dot"/>更新 312</span>
                  <span className="badge-pill warning"><span className="dot"/>承認待ち 23</span>
                  <span className="badge-pill neutral"><span className="dot"/>スキップ 87</span>
                  <span className="badge-pill error"><span className="dot"/>エラー 5</span>
                </div>
              </div>
              <div style={{display:'flex', gap: 4, alignItems:'flex-end', height: 120, marginTop: 10}}>
                {Array.from({length: 24}).map((_, i) => {
                  const h = 30 + Math.abs(Math.sin(i*0.7))*70 + (i%5===0 ? 18 : 0);
                  const isPending = i % 7 === 3 || i % 7 === 5;
                  const isError = i === 11;
                  return (
                    <div key={i} style={{flex:1, display:'flex', flexDirection:'column-reverse', gap: 1}}>
                      <div style={{height: h*0.6, background: 'var(--success)', borderRadius: '0 0 2px 2px'}}/>
                      {isPending && <div style={{height: h*0.18, background: 'var(--warning)'}}/>}
                      {isError && <div style={{height: 6, background: 'var(--error)'}}/>}
                      <div style={{height: h*0.12, background: 'var(--neutral-bg)', borderRadius: '2px 2px 0 0'}}/>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize: 11, color:'var(--text-3)', marginTop: 8}}>
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
              </div>
            </div>

            <div className="card" style={{padding: 20}}>
              <div style={{fontSize: 14, fontWeight: 600, marginBottom: 4}}>スキップ／ガード理由</div>
              <div className="tiny muted" style={{marginBottom: 16}}>自動反映を見送った理由（直近24時間）</div>
              {[
                { label: '最低価格を下回る', count: 41, color: 'var(--neutral-text)', pct: 47 },
                { label: 'セール中商品', count: 22, color: 'var(--warning)', pct: 25 },
                { label: '5%下落ガード', count: 14, color: 'var(--negative)', pct: 16 },
                { label: 'AI信頼度が低い', count: 7, color: 'var(--primary)', pct: 8 },
                { label: '送料が不明', count: 3, color: 'var(--text-3)', pct: 4 },
              ].map(r => (
                <div key={r.label} style={{marginBottom: 12}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                    <span>{r.label}</span>
                    <span className="mono num" style={{color:'var(--text-2)'}}>{r.count}</span>
                  </div>
                  <div style={{height: 6, background:'var(--surface-2)', borderRadius: 3, overflow:'hidden'}}>
                    <div style={{width: `${r.pct}%`, height:'100%', background: r.color}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent updates feed */}
          <div className="card" style={{padding: 0, overflow:'hidden'}}>
            <div style={{padding: '14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center'}}>
              <div style={{fontSize: 14, fontWeight: 600}}>直近の自動更新</div>
              <span className="badge-pill success" style={{marginLeft: 10}}>自動</span>
              <div style={{flex:1}}/>
              <button className="btn sm ghost">すべてのログを見る <I.ChevronRight size={13}/></button>
            </div>
            <div>
              {SAMPLE_LISTINGS.filter(l => l.status === '更新済').slice(0,4).map(l => (
                <div key={l.id} style={{padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap: 14}}>
                  <I.CheckCircle size={16} stroke="var(--success)"/>
                  <div className="thumb"><I.Image size={14}/></div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize: 13, fontWeight: 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{l.title}</div>
                    <div className="tiny muted mono">{l.id} · {l.last}</div>
                  </div>
                  <div className="mono num" style={{fontSize: 13, color:'var(--text-2)', textDecoration:'line-through'}}>{fmtMoney(l.price)}</div>
                  <I.ChevronRight size={14} stroke="var(--text-3)"/>
                  <div className="mono num" style={{fontSize: 13, fontWeight: 700, color:'var(--success-text)'}}>{fmtMoney(l.suggested)}</div>
                  <div className="mono num" style={{fontSize: 12, color:'var(--negative)', minWidth: 60, textAlign:'right'}}>{fmtPct(l.drop)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

window.VariationB = VariationB;
