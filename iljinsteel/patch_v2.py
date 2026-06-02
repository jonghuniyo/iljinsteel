"""
patch_v2.py  —  ILJIN Portal 컴파일 번들 패치 v2
기능:
  1. NT 함수: 날씨 호출과 함께 미세먼지(PM10/PM2.5) 병렬 조회 추가
  2. RT 함수: 헤더 날씨 pill에 미세먼지 등급 배지 추가
  3. ILStockIndices 컴포넌트: 글로벌 지수(코스피/코스닥/나스닥/다우) 위젯 추가
  4. ILMarketStrip 함수: 글로벌 지수 패널 추가 (모바일에서는 숨김)
"""

from pathlib import Path
import sys

SRC = Path('assets/index-fixed-20260601-moongchi.js')
OUT = Path('assets/index-fixed-20260601-moongchi.js')   # in-place

if not SRC.exists():
    print(f'ERROR: {SRC} not found', file=sys.stderr)
    sys.exit(1)

s = SRC.read_text(encoding='utf-8')
original_len = len(s)
print(f'읽기 완료: {SRC} ({original_len:,} bytes)')


def find_function(src, name):
    st = src.find('function ' + name)
    if st < 0:
        raise ValueError('함수를 찾을 수 없음: ' + name)
    i = src.find('(', st)
    par = 0
    in_str = None
    esc = False
    for j in range(i, len(src)):
        ch = src[j]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in "'\"'`":
            in_str = ch
            continue
        if ch == '(':
            par += 1
        elif ch == ')':
            par -= 1
            if par == 0:
                brace = src.find('{', j)
                break
    else:
        raise ValueError('파라미터 끝을 찾을 수 없음: ' + name)
    bal = 0
    in_str = None
    esc = False
    for j in range(brace, len(src)):
        ch = src[j]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in "'\"'`":
            in_str = ch
            continue
        if ch == '{':
            bal += 1
        elif ch == '}':
            bal -= 1
            if bal == 0:
                return st, j + 1, src[st:j + 1]
    raise ValueError('함수 끝을 찾을 수 없음: ' + name)


def replace_func(name, new_code):
    global s
    st, en, old = find_function(s, name)
    s = s[:st] + new_code + s[en:]
    print(f'[OK] {name} 교체: {len(old):,} → {len(new_code):,} bytes')


def replace_once(old, new, label):
    global s
    if old not in s:
        raise ValueError(f'대상 문자열을 찾을 수 없음: {label}')
    s = s.replace(old, new, 1)
    print(f'[OK] {label} 교체 완료')


def insert_before(anchor, new_code, label):
    global s
    idx = s.find(anchor)
    if idx < 0:
        raise ValueError(f'앵커를 찾을 수 없음: {label}')
    s = s[:idx] + new_code + s[idx:]
    print(f'[OK] {label} 삽입 완료 ({len(new_code):,} bytes)')


# ── 1. NT 함수: 미세먼지 병렬 조회 추가 ──────────────────────────────────
NEW_NT = (
    'function NT(e=10*60*1e3){'
    'const[t,r]=P.useState([]),'
    '[n,i]=P.useState(!0),'
    '[o,a]=P.useState(null),'
    '[l,s]=P.useState(null),'
    '[u,c]=P.useState(()=>ILHeaderLoad().weather);'
    'P.useEffect(()=>{'
      'const h=()=>c(ILHeaderLoad().weather);'
      'return window.addEventListener("iljin-header-settings",h),'
      '()=>window.removeEventListener("iljin-header-settings",h)'
    '},[]);'
    'const d=P.useCallback(async()=>{'
      'i(!0),a(null);'
      'try{'
        'const p=IT.filter(m=>u.includes(m.name)),h=p.length?p:IT;'
        'const y=await Promise.all(h.map(async x=>{'
          'const wxUrl=`https://api.open-meteo.com/v1/forecast?latitude=${x.lat}&longitude=${x.lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m,precipitation&timezone=Asia%2FSeoul`,'
          'aqUrl=`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${x.lat}&longitude=${x.lon}&hourly=pm10,pm2_5&timezone=Asia%2FSeoul&forecast_days=1`;'
          'const[wxRes,aqRes]=await Promise.all(['
            'fetch(wxUrl,{signal:AbortSignal.timeout(7000)}),'
            'fetch(aqUrl,{signal:AbortSignal.timeout(7000)}).catch(()=>null)'
          ']);'
          'if(!wxRes.ok)throw new Error(`${x.name} API 오류`);'
          'const S=(await wxRes.json()).current;'
          'let pm10=null,pm25=null,pmGrade="보통",pmColor="var(--blue)";'
          'try{'
            'if(aqRes&&aqRes.ok){'
              'const aq=await aqRes.json(),'
              'times=aq.hourly?.time||[],'
              'now=Date.now();'
              'let bi=0,bd=Infinity;'
              'times.forEach((tv,ti)=>{'
                'const df=Math.abs(new Date(tv).getTime()-now);'
                'if(df<bd){bi=ti;bd=df}'
              '});'
              'const p10=aq.hourly?.pm10?.[bi]??null,'
              'p25=aq.hourly?.pm2_5?.[bi]??null;'
              'if(p10!=null&&p25!=null){'
                'pm10=Math.round(p10);pm25=Math.round(p25);'
                'const sc=Math.max('
                  'pm10<=30?0:pm10<=80?1:pm10<=150?2:3,'
                  'pm25<=15?0:pm25<=35?1:pm25<=75?2:3'
                ');'
                'pmGrade=["좋음","보통","나쁨","매우나쁨"][sc];'
                'pmColor=["var(--green)","var(--blue)","var(--orange)","var(--red)"][sc]'
              '}'
            '}'
          '}catch(_e){}' 
          'return{'
            'name:x.name,'
            'temp:Math.round(S.temperature_2m*10)/10,'
            'feels:Math.round(S.apparent_temperature*10)/10,'
            'code:S.weathercode,'
            'wind:Math.round(S.windspeed_10m),'
            'humidity:S.relativehumidity_2m??0,'
            'precip:S.precipitation??0,'
            'pm10,pm25,pmGrade,pmColor'
          '}'
        '}));'
        'r(y),s(new Date)'
      '}catch(p){a(p.message)}finally{i(!1)}'
    '},[u.join("|")]);'
    'return P.useEffect(()=>{'
      'd();'
      'const p=setInterval(d,e);'
      'return()=>clearInterval(p)'
    '},[d,e]),'
    '{weathers:t,loading:n,error:o,lastUpdated:l,refresh:d}'
    '}'
)
replace_func('NT', NEW_NT)


# ── 2. RT 함수: 날씨 pill에 미세먼지 배지 추가 ───────────────────────────
# 현재 pill 내 마지막 요소: [N.temp,"°"] — 여기에 PM배지를 추가
OLD_PILL_TAIL = (
    'f.jsxs("span",{style:{fontSize:13,fontWeight:900,'
    'fontFamily:"JetBrains Mono,monospace",color:"var(--text-primary)"},'
    'children:[N.temp,"°"]})]},N.name))'
)
NEW_PILL_TAIL = (
    'f.jsxs("span",{style:{fontSize:13,fontWeight:900,'
    'fontFamily:"JetBrains Mono,monospace",color:"var(--text-primary)"},'
    'children:[N.temp,"°"]}),'
    'N.pmGrade&&f.jsx("span",{style:{'
      'fontSize:9,fontWeight:800,color:N.pmColor,'
      'background:"rgba(0,0,0,.07)",padding:"1px 4px",'
      'borderRadius:4,letterSpacing:.2,marginLeft:-2'
    '},children:N.pmGrade})'
    ']},N.name))'
)
replace_once(OLD_PILL_TAIL, NEW_PILL_TAIL, 'RT 날씨 pill 미세먼지 배지')


# ── 3. ILStockIndices 컴포넌트 삽입 ─────────────────────────────────────
STOCK_INDICES_COMPONENT = (
    'function ILStockIndices(){'
    'const[data,setData]=P.useState(null);'
    'const[loading,setLoading]=P.useState(!0);'
    'P.useEffect(()=>{'
      'let alive=!0;'
      'const CACHE_KEY="iljin-indices-cache";'
      'try{'
        'const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");'
        'if(cached&&Date.now()-new Date(cached.updatedAt).getTime()<3*60*1e3){'
          'setData(cached);setLoading(!1)'
        '}'
      '}catch(_){}' 
      'const load=()=>fetch("/api/indices").then(r=>r.json()).then(d=>{'
        'if(!alive)return;'
        'setData(d);setLoading(!1);'
        'if(d.ok)try{localStorage.setItem(CACHE_KEY,JSON.stringify(d))}catch(_){}'
      '}).catch(()=>{if(alive)setLoading(!1)});'
      'load();'
      'const t=setInterval(load,3*60*1e3);'
      'return()=>{alive=!1;clearInterval(t)}'
    '},[]);'
    'const indices=(data&&data.indices)||[];'
    'const fmtPrice=v=>{'
      'if(v==null)return"—";'
      'if(v>=10000)return v.toLocaleString("ko-KR",{maximumFractionDigits:0});'
      'if(v>=1000)return v.toLocaleString("ko-KR",{maximumFractionDigits:2});'
      'return v.toLocaleString("ko-KR",{maximumFractionDigits:2})'
    '};'
    'const fmtPct=v=>v==null?"":Math.abs(v).toFixed(2)+"%";'
    'return f.jsxs("div",{style:{'
      'background:"var(--surface)",border:"1px solid var(--border)",'
      'borderRadius:"var(--radius-lg)",overflow:"hidden",boxShadow:"var(--shadow-sm)"'
    '},children:['
      'f.jsxs("div",{style:{'
        'display:"flex",justifyContent:"space-between",alignItems:"center",'
        'padding:"12px 16px",borderBottom:"1px solid var(--border)"'
      '},children:['
        'f.jsxs("div",{children:['
          'f.jsx("div",{style:{fontSize:13,fontWeight:700,color:"var(--text-primary)"},children:"글로벌 지수"}),'
          'f.jsx("div",{style:{fontSize:10,color:"var(--text-muted)",marginTop:1},children:"코스피·코스닥·나스닥·다우 참고값"})'
        ']}),'
        'loading&&!indices.length&&f.jsx("div",{style:{width:60,height:12,borderRadius:4,background:"var(--surface-alt)"}})'
      ']},'
      'f.jsx("div",{style:{padding:"0 16px"},children:'
        'loading&&!indices.length'
          '?[1,2,3,4].map(k=>f.jsx("div",{key:k,style:{'
              'height:38,borderRadius:6,margin:"8px 0",'
              'background:"var(--surface-alt)",'
              'backgroundImage:"linear-gradient(90deg,transparent,var(--border),transparent)",'
              'backgroundSize:"200%",animation:"shimmer 1.4s infinite"'
            '}}))'
          ':indices.map((idx,k)=>{'
            'const up=(idx.changePct??0)>=0;'
            'const col=up?"var(--red)":"var(--green)";'
            'return f.jsxs("div",{style:{'
              'display:"flex",alignItems:"center",'
              'padding:"8px 0",borderBottom:"1px solid var(--border)",gap:8'
            '},children:['
              'f.jsx("div",{style:{'
                'width:8,height:8,borderRadius:"50%",'
                'background:idx.color||"var(--blue)",flexShrink:0'
              '}}),'
              'f.jsxs("div",{style:{flex:1,minWidth:0},children:['
                'f.jsx("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:idx.name}),'
                'f.jsx("div",{style:{fontSize:9.5,color:"var(--text-muted)"},children:idx.market})'
              ']})'  
              ',f.jsxs("div",{style:{textAlign:"right",flexShrink:0},children:['
                'f.jsx("div",{style:{fontSize:13,fontWeight:700,fontFamily:"JetBrains Mono,monospace",color:"var(--text-primary)"},children:fmtPrice(idx.price)}),'
                'idx.changePct!=null'
                  '?f.jsxs("div",{style:{fontSize:10,fontWeight:600,color:col},children:[up?"▲":"▼"," ",fmtPct(idx.changePct)]})'
                  ':f.jsx("div",{style:{fontSize:9.5,color:"var(--text-muted)"},children:"데이터 없음"})'
              ']})'
            ']},k)'
          '})'
      '}),'
      'f.jsx("div",{style:{fontSize:10,color:"var(--text-muted)",padding:"6px 16px",borderTop:"1px solid var(--border)"},children:"Yahoo Finance 참고값 · 실시간 아님"})'
    ']})'
    '}'
)

# ILMarketStrip 바로 앞에 삽입
insert_before(
    'function ILMarketStrip(',
    STOCK_INDICES_COMPONENT,
    'ILStockIndices 컴포넌트'
)


# ── 4. ILMarketStrip 함수: 지수 패널 추가 + 그리드 컬럼 조정 ─────────────
NEW_MARKET_STRIP = (
    'function ILMarketStrip({visible:e,metals:t,loading:r}){'
    'const ILM=ILUseMobile(),'
    'n=(t||[]).filter(d=>d.category==="metal"&&d.price!=null&&!/철광석|iron ore/i.test(`${d.name||""} ${d.id||""}`)),'
    'i=(t||[]).filter(d=>d.category==="steel"&&d.price!=null),'
    'o=(t||[]).filter(d=>d.category==="oil"&&d.price!=null),'
    'a=o.some(d=>String(d.unit).includes("KRW")||String(d.name).includes("국내")),'
    'l=[e.fx,e.market,e.oil].filter(Boolean).length;'
    'if(!l)return null;'
    'const s={fontSize:12,color:"var(--text-muted)",borderTop:"1px solid var(--border)",padding:"8px 0 3px",lineHeight:1.5};'
    # 데스크톱에서 지수 패널 추가(+1열), 모바일은 기존 그대로
    'const totalCols=ILM?l:l+1;'
    'const colTpl=ILM'
      '?(l===1?"1fr":l===2?"repeat(2,minmax(0,1fr))":"repeat(3,minmax(0,1fr))")'
      ':(totalCols===1?"1fr":totalCols===2?"repeat(2,minmax(0,1fr))":totalCols===3?"repeat(3,minmax(0,1fr))":"repeat(4,minmax(0,1fr))");'
    'return f.jsx("div",{style:{display:"grid",gridTemplateColumns:colTpl,gap:ILM?10:14,marginBottom:16},children:['
      'e.fx&&f.jsx(aJ,{}),'
      'e.market&&f.jsxs(pn,{title:"광물 시세",sub:"니켈·구리·철강 참고값",'
        'action:f.jsx(Su,{to:"/mineral",style:{fontSize:12.5,fontWeight:900,color:"var(--blue)",textDecoration:"none"},children:"차트 →"}),'
        'children:['
          'r&&!t.length?f.jsx("div",{style:{padding:"20px 0",display:"flex",justifyContent:"center"},children:f.jsx("div",{className:"pipe-spinner",style:{width:70}})}):'
          'n.map((d,p)=>f.jsx(Kd,{item:d},p)),'
          'i.length>0&&f.jsxs(f.Fragment,{children:['
            'f.jsx("div",{style:{fontSize:11.5,fontWeight:900,color:"var(--text-muted)",padding:"9px 0 3px",letterSpacing:.4,borderTop:"1px solid var(--border)",marginTop:4},children:"철강·원재료"}),'
            'i.map((d,p)=>f.jsx(Kd,{item:d},p))'
          ']}),'
          '!r&&!n.length&&!i.length&&f.jsx("div",{style:{padding:"15px 0",textAlign:"center",fontSize:13,color:"var(--text-muted)",lineHeight:1.6},children:"표시 가능한 광물 API 응답 없음"}),'
          'f.jsx("div",{style:s,children:"동향 파악용 참고값입니다. 0/비정상 응답은 표시하지 않습니다."})'
        ']}),'
      'e.oil&&f.jsxs(pn,{title:"유가 시세",sub:"WTI · 브렌트 · 국내 ℓ당 평균",children:['
        'r&&!t.length?f.jsx("div",{style:{padding:"16px 0",display:"flex",justifyContent:"center"},children:f.jsx("div",{className:"pipe-spinner",style:{width:60}})}):'
        'o.map((d,p)=>f.jsx(Kd,{item:d},p)),'
        '!r&&!o.length&&f.jsx("div",{style:{padding:"15px 0",textAlign:"center",fontSize:13,color:"var(--text-muted)"},children:"유가 API 응답 없음 · 잠시 후 새로고침하세요"}),'
        '!a&&f.jsx("div",{style:s,children:"국내 휘발유/경유 ℓ당 평균은 오피넷 인증키(OPINET_API_KEY 또는 OPINET_CODE)를 Vercel 환경변수에 넣으면 표시됩니다."})'
      ']}),'
      # 모바일에서는 지수 패널 숨김
      '!ILM&&f.jsx(ILStockIndices,{})'
    '].filter(Boolean)})}'
)
replace_func('ILMarketStrip', NEW_MARKET_STRIP)


# ── 5. CSS: shimmer 애니메이션이 없다면 추가 (이미 있으면 skip) ──────────
# (이미 번들 내에 shimmer 키프레임이 있으므로 스킵)


# ── 최종 저장 ────────────────────────────────────────────────────────────
OUT.write_text(s, encoding='utf-8')
print(f'\n완료! {OUT} 저장됨 ({len(s):,} bytes, Δ {len(s) - original_len:+,} bytes)')
