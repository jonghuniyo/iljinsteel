// Netlify Function — 뉴스 RSS 프록시
// 국내: 한국경제 (작동 확인), 해외: Bloomberg Markets (작동 확인)

const FEEDS = [
  { name:'한국경제', url:'https://www.hankyung.com/feed/economy',       type:'ko' },
  { name:'한국경제', url:'https://www.hankyung.com/feed/politics',      type:'ko' },
  { name:'Bloomberg',url:'https://feeds.bloomberg.com/markets/news.rss', type:'en' },
];

const STEEL_KW = [
  '철강','강관','파이프','POSCO','포스코','현대제철','무계목','SMLS','관세',
  'steel','pipe','tariff','iron','nickel','니켈','알루미늄','구리','LME',
];

// CDATA + 일반 패턴 모두 처리하는 파서
function extractTag(str, tag) {
  const cdataRx = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const plainRx = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = str.match(cdataRx) || str.match(plainRx);
  return m ? m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim() : '';
}

function extractLink(str) {
  // CDATA link
  let m = str.match(/<link>\s*<!\[CDATA\[(https?:\/\/[^\]]+)\]\]>\s*<\/link>/i);
  if (m) return m[1].trim();
  // plain link
  m = str.match(/<link>(https?:\/\/[^\s<]+)<\/link>/i);
  if (m) return m[1].trim();
  // guid as fallback
  m = str.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/i);
  if (m) return m[1].trim();
  return '';
}

function parseRSS(xml, source) {
  const items = [];
  // <item>...</item> 블록 추출 (CDATA 안전하게)
  const itemRx = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const chunk = m[1];
    const title = extractTag(chunk, 'title');
    const link  = extractLink(chunk);
    const pub   = extractTag(chunk, 'pubDate');
    if (title && title.length > 3) {
      items.push({ title, link, pub, source });
    }
  }
  return items;
}

function isSteelRelated(title) {
  const low = title.toLowerCase();
  return STEEL_KW.some(kw => low.includes(kw.toLowerCase()));
}

export const handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=300',
  };

  try {
    const results = await Promise.allSettled(FEEDS.map(async feed => {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IljinPortal/1.0; +https://iljin.com)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml, feed.name).map(item => ({
        ...item,
        feedType: feed.type,
      }));
    }));

    const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    const domestic      = all.filter(i => i.feedType === 'ko');
    const international = all.filter(i => i.feedType === 'en');
    const steel         = all.filter(i => isSteelRelated(i.title + ' ' + i.link));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        updatedAt: new Date().toISOString(),
        counts: { domestic: domestic.length, international: international.length, steel: steel.length },
        domestic:      domestic.slice(0, 8),
        international: international.slice(0, 8),
        steel:         steel.slice(0, 4),
        // NewsPage 호환 (flat 배열)
        items: all.map(item => ({
          ...item,
          priority: isSteelRelated(item.title) ? 8 : 0,
          matchedKeywords: STEEL_KW.filter(kw => item.title.toLowerCase().includes(kw.toLowerCase())).slice(0,3),
        })).slice(0, 25),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
