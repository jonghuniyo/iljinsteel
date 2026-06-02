(function () {
  const STORE_KEY = "iljin-steelmax-saved-v1";
  const state = { query: "강관", category: "", page: 1, categories: [], items: [], selected: null, saved: [] };

  function loadSaved() {
    try { state.saved = JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { state.saved = []; }
  }
  function saveSaved() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.saved.slice(0, 200))); } catch {}
  }
  function esc(v) {
    return String(v ?? "").replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[ch]));
  }
  function date(v) {
    if (!v) return "";
    try { return new Date(v).toLocaleDateString("ko-KR"); } catch { return ""; }
  }
  async function api(params) {
    const qs = new URLSearchParams(params);
    const res = await fetch(`/api/steelmax?${qs.toString()}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || `Steelmax API ${res.status}`);
    return json;
  }
  function injectStyle() {
    if (document.getElementById("steelmaxPortalStyle")) return;
    const style = document.createElement("style");
    style.id = "steelmaxPortalStyle";
    style.textContent = `
      .smx-open-btn{position:fixed;left:18px;bottom:92px;z-index:9996;border:1px solid rgba(12,65,153,.22);background:#0c4199;color:#fff;border-radius:999px;padding:11px 15px;font:800 13px/1.1 'Noto Sans KR',system-ui,sans-serif;box-shadow:0 14px 36px rgba(15,23,42,.18);cursor:pointer;letter-spacing:-.2px}.smx-open-btn small{display:block;font-size:9px;font-weight:700;opacity:.72;margin-top:2px}.smx-overlay{position:fixed;inset:0;z-index:9998;background:rgba(15,23,42,.38);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;padding:18px}.smx-overlay.on{display:flex}.smx-panel{width:min(1180px,96vw);height:min(790px,92vh);border-radius:22px;background:#f8fafc;color:#1e293b;box-shadow:0 26px 80px rgba(15,23,42,.32);display:grid;grid-template-columns:360px 1fr;overflow:hidden;border:1px solid rgba(148,163,184,.35);font-family:'Noto Sans KR',system-ui,sans-serif}.smx-left{background:#fff;border-right:1px solid #e2e8f0;padding:20px;display:flex;flex-direction:column;gap:14px;min-width:0}.smx-main{padding:22px;overflow:auto}.smx-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.smx-title{font-size:21px;font-weight:900;letter-spacing:-.7px;margin:0;color:#0f172a}.smx-sub{font-size:12px;color:#64748b;margin-top:5px;line-height:1.55}.smx-close{width:34px;height:34px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:20px;line-height:1;color:#334155}.smx-search{display:flex;gap:7px}.smx-search input{flex:1;height:38px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;font-weight:700;outline:none;min-width:0}.smx-search button,.smx-primary{height:38px;border:none;border-radius:12px;background:#0c4199;color:#fff;font-size:13px;line-height:1;font-weight:900;padding:0 12px;min-width:52px;white-space:nowrap;flex-shrink:0;cursor:pointer}.smx-chips{display:flex;gap:6px;flex-wrap:wrap}.smx-chip{border:1px solid #dbe3ef;background:#fff;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:800;color:#475569;cursor:pointer}.smx-chip.on{background:#eaf2ff;border-color:#0c4199;color:#0c4199}.smx-results{overflow:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px}.smx-card{border:1px solid #e2e8f0;background:#fff;border-radius:14px;padding:12px;cursor:pointer;transition:.15s ease}.smx-card:hover{border-color:#0c4199;box-shadow:0 10px 24px rgba(12,65,153,.1)}.smx-card strong{display:block;font-size:13.5px;line-height:1.35;color:#0f172a;letter-spacing:-.3px}.smx-card p{margin:6px 0 0;color:#64748b;font-size:11.5px;line-height:1.5}.smx-meta{display:flex;gap:8px;align-items:center;margin-top:7px;font-size:10.5px;color:#94a3b8;font-weight:700}.smx-article{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px;min-height:100%}.smx-article h2{font-size:24px;line-height:1.28;letter-spacing:-.8px;margin:0 0 10px}.smx-article .body{white-space:pre-wrap;font-size:14.5px;line-height:1.85;color:#334155;max-width:850px}.smx-tools{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 18px}.smx-tools button,.smx-tools a{border:1px solid #dbe3ef;background:#fff;border-radius:11px;padding:8px 11px;font-size:12px;font-weight:900;color:#334155;text-decoration:none;cursor:pointer}.smx-tools .blue{background:#0c4199;color:#fff;border-color:#0c4199}.smx-empty{height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:#64748b;line-height:1.7}.smx-saved-title{font-size:12px;font-weight:900;color:#0f172a;margin-top:2px}.smx-note{font-size:11px;line-height:1.6;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:13px;padding:10px}.smx-status{font-size:11px;color:#64748b;min-height:16px}@media(max-width:860px){.smx-panel{grid-template-columns:1fr;height:94vh}.smx-left{max-height:46vh;border-right:0;border-bottom:1px solid #e2e8f0}.smx-open-btn{left:12px;bottom:84px}.smx-main{padding:16px}.smx-article h2{font-size:20px}}
    `;
    document.head.appendChild(style);
  }
  function renderResults() {
    const list = document.querySelector("#smxResults");
    if (!list) return;
    list.innerHTML = state.items.map((it) => `
      <button class="smx-card" data-id="${esc(it.id)}">
        <strong>${esc(it.title)}</strong>
        <p>${esc(it.excerpt || "요약 없음")}</p>
        <div class="smx-meta"><span>Steelmax</span><span>${esc(date(it.date))}</span></div>
      </button>`).join("") || `<div class="smx-note">검색 결과가 없습니다. 다른 키워드로 검색해보세요.</div>`;
    list.querySelectorAll("[data-id]").forEach((el) => el.addEventListener("click", () => openPost(el.getAttribute("data-id"))));
  }
  function renderCategories() {
    const wrap = document.querySelector("#smxCategories");
    if (!wrap) return;
    const important = ["Steel(철강)", "강관(Pipes/Tube)", "강관(Seamless)", "ASTM", "API", "DIN-EN", "KS", "JIS", "Stainless", "Non-Ferrous(비철)"];
    const cats = state.categories.filter((c) => important.some((k) => c.name.includes(k.replace("(철강)", "").replace("(Pipes/Tube)", "").replace("(Seamless)", "")))).slice(0, 20);
    wrap.innerHTML = `<button class="smx-chip ${state.category ? "" : "on"}" data-cat="">전체</button>` + cats.map((c) => `<button class="smx-chip ${String(state.category) === String(c.id) ? "on" : ""}" data-cat="${esc(c.id)}">${esc(c.name)}</button>`).join("");
    wrap.querySelectorAll("[data-cat]").forEach((el) => el.addEventListener("click", () => { state.category = el.getAttribute("data-cat") || ""; state.page = 1; search(); }));
  }
  function renderSelected() {
    const main = document.querySelector("#smxMain");
    if (!main) return;
    if (!state.selected) {
      main.innerHTML = `<div class="smx-empty"><div><strong style="font-size:18px;color:#0f172a">철강·강관 자료실</strong><br/>왼쪽에서 철강·강관·규격 키워드를 검색하면 원문을 포털 안에서 열람하고 저장할 수 있습니다.<br/><br/><span style="font-size:12px">권한 받은 개인용 이전 작업 기준 · 원문 출처 링크 유지</span></div></div>`;
      return;
    }
    const it = state.selected;
    const isSaved = state.saved.some((s) => String(s.id || s.url) === String(it.id || it.url));
    main.innerHTML = `
      <article class="smx-article">
        <div class="smx-meta" style="margin:0 0 10px"><span>Steelmax</span><span>${esc(date(it.date || it.modified))}</span></div>
        <h2>${esc(it.title)}</h2>
        <div class="smx-tools">
          <button class="blue" id="smxSaveBtn">${isSaved ? "저장됨" : "내 자료함 저장"}</button>
          ${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">원문 열기</a>` : ""}
          <button id="smxCopyBtn">본문 복사</button>
        </div>
        <div class="body">${esc(it.content || it.excerpt || "본문을 불러오지 못했습니다.")}</div>
      </article>`;
    document.querySelector("#smxSaveBtn")?.addEventListener("click", () => {
      const key = String(it.id || it.url);
      if (!state.saved.some((s) => String(s.id || s.url) === key)) {
        state.saved.unshift({ ...it, savedAt: new Date().toISOString() });
        saveSaved();
        renderSaved();
        renderSelected();
      }
    });
    document.querySelector("#smxCopyBtn")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(`${it.title}\n\n${it.content || it.excerpt || ""}\n\n출처: ${it.url || "Steelmax"}`); setStatus("본문을 클립보드에 복사했습니다."); } catch { setStatus("복사 권한이 없어 실패했습니다."); }
    });
  }
  function renderSaved() {
    const box = document.querySelector("#smxSaved");
    if (!box) return;
    box.innerHTML = state.saved.slice(0, 8).map((it, i) => `<button class="smx-card" data-saved="${i}"><strong>${esc(it.title)}</strong><p>${esc((it.excerpt || it.content || "").slice(0, 100))}</p></button>`).join("") || `<div class="smx-note">아직 저장한 자료가 없습니다. 글을 열고 “내 자료함 저장”을 누르세요.</div>`;
    box.querySelectorAll("[data-saved]").forEach((el) => el.addEventListener("click", () => { state.selected = state.saved[Number(el.getAttribute("data-saved"))]; renderSelected(); }));
  }
  function setStatus(msg) {
    const el = document.querySelector("#smxStatus");
    if (el) el.textContent = msg || "";
  }
  async function search() {
    setStatus("검색 중...");
    try {
      const data = await api({ q: state.query, category: state.category, page: state.page, per_page: 20 });
      state.items = data.items || [];
      renderResults();
      setStatus(`검색 결과 ${data.total || state.items.length}건${data.totalPages ? ` · ${data.page}/${data.totalPages}쪽` : ""}`);
    } catch (err) {
      state.items = [];
      renderResults();
      setStatus(`검색 실패: ${err.message}`);
    }
  }
  async function openPost(id) {
    setStatus("본문 불러오는 중...");
    try {
      const data = await api({ action: "post", id });
      state.selected = data.post;
      renderSelected();
      setStatus("본문을 불러왔습니다.");
    } catch (err) {
      setStatus(`본문 조회 실패: ${err.message}`);
    }
  }
  async function loadCategories() {
    try {
      const data = await api({ action: "categories" });
      state.categories = data.categories || [];
      renderCategories();
    } catch {
      renderCategories();
    }
  }
  function open() {
    document.querySelector("#steelmaxOverlay")?.classList.add("on");
    if (!state.items.length) search();
  }
  function close() { document.querySelector("#steelmaxOverlay")?.classList.remove("on"); }
  function mount() {
    injectStyle();
    loadSaved();
    window.ILOpenSteelmax = open;
    window.addEventListener("iljin-steelmax-open", open);
    const overlay = document.createElement("div");
    overlay.id = "steelmaxOverlay";
    overlay.className = "smx-overlay";
    overlay.innerHTML = `
      <section class="smx-panel" role="dialog" aria-modal="true" aria-label="철강·강관 자료실">
        <aside class="smx-left">
          <div class="smx-head"><div><h1 class="smx-title">철강·강관 자료실</h1><div class="smx-sub">허락받은 자료를 개인 포털에서 검색·열람·저장합니다. 원문 출처 링크는 유지됩니다.</div></div><button class="smx-close" id="smxClose" aria-label="닫기">×</button></div>
          <div class="smx-search"><input id="smxQuery" value="강관" placeholder="예: A106, SMLS, API 5L, STS"/><button id="smxSearchBtn">검색</button></div>
          <div class="smx-chips" id="smxCategories"><button class="smx-chip on">전체</button></div>
          <div class="smx-status" id="smxStatus"></div>
          <div class="smx-results" id="smxResults"></div>
          <div class="smx-saved-title">내 자료함</div>
          <div class="smx-results" id="smxSaved" style="max-height:190px"></div>
        </aside>
        <main class="smx-main" id="smxMain"></main>
      </section>`;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    document.querySelector("#smxClose")?.addEventListener("click", close);
    document.querySelector("#smxSearchBtn")?.addEventListener("click", () => { state.query = document.querySelector("#smxQuery").value.trim() || "강관"; state.page = 1; search(); });
    document.querySelector("#smxQuery")?.addEventListener("keydown", (e) => { if (e.key === "Enter") document.querySelector("#smxSearchBtn")?.click(); });
    renderSaved();
    renderSelected();
    loadCategories();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
