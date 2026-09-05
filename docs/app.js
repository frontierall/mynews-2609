const CATEGORY_EMOJI = {
  AI: "🤖",
  경제: "💵",
  창업: "🚀",
  "크리에이터 이코노미": "🎬",
  날씨: "☀️",
  정부지원정책: "🏛️",
  개발: "💻",
};

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return iso;
  }
}

function uniqueCategories(items) {
  return [...new Set(items.map((i) => i.category))].sort();
}

function populateSelect(select, values, allLabel) {
  select.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = allLabel;
  select.appendChild(allOpt);
  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  }
}

function renderGrouped(container, items) {
  if (items.length === 0) {
    container.innerHTML = '<p class="empty">표시할 뉴스가 없습니다.</p>';
    return;
  }
  const byCategory = new Map();
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  container.innerHTML = "";
  for (const [category, catItems] of byCategory) {
    const section = document.createElement("div");
    section.className = "category-group";
    const heading = document.createElement("h2");
    heading.textContent = `${CATEGORY_EMOJI[category] ?? "📰"} ${category} (${catItems.length})`;
    section.appendChild(heading);

    for (const item of catItems) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
        <div class="meta">${item.source} · ${fmtTime(item.publishedAt)}</div>
        ${item.snippet ? `<div class="snippet">${item.snippet}</div>` : ""}
      `;
      section.appendChild(card);
    }
    container.appendChild(section);
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function initLatest() {
  const meta = await fetchJson("data/meta.json");
  const lastUpdatedEl = document.getElementById("last-updated");
  lastUpdatedEl.textContent = meta.lastUpdated
    ? `마지막 수집: ${fmtTime(meta.lastUpdated)} (${meta.latestCount ?? 0}건)`
    : "아직 수집된 데이터가 없습니다.";

  const items = await fetchJson("data/latest.json");
  items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const searchInput = document.getElementById("latest-search");
  const categorySelect = document.getElementById("latest-category");
  populateSelect(categorySelect, uniqueCategories(items), "전체 카테고리");

  const container = document.getElementById("latest-content");

  function apply() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = categorySelect.value;
    const filtered = items.filter((item) => {
      const matchesQ = !q || item.title.toLowerCase().includes(q);
      const matchesCat = !cat || item.category === cat;
      return matchesQ && matchesCat;
    });
    renderGrouped(container, filtered);
  }

  searchInput.addEventListener("input", apply);
  categorySelect.addEventListener("change", apply);
  apply();
}

async function initHistory() {
  const months = await fetchJson("data/archive/index.json");
  const monthSelect = document.getElementById("history-month");
  monthSelect.innerHTML = "";
  for (const m of months) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  }

  const searchInput = document.getElementById("history-search");
  const categorySelect = document.getElementById("history-category");
  const container = document.getElementById("history-content");

  let currentItems = [];

  async function loadMonth() {
    const month = monthSelect.value;
    if (!month) {
      currentItems = [];
      populateSelect(categorySelect, [], "전체 카테고리");
      renderGrouped(container, []);
      return;
    }
    currentItems = await fetchJson(`data/archive/${month}.json`);
    currentItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    populateSelect(categorySelect, uniqueCategories(currentItems), "전체 카테고리");
    apply();
  }

  function apply() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = categorySelect.value;
    const filtered = currentItems.filter((item) => {
      const matchesQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.snippet ?? "").toLowerCase().includes(q);
      const matchesCat = !cat || item.category === cat;
      return matchesQ && matchesCat;
    });
    renderGrouped(container, filtered);
  }

  monthSelect.addEventListener("change", loadMonth);
  searchInput.addEventListener("input", apply);
  categorySelect.addEventListener("change", apply);

  if (months.length > 0) {
    monthSelect.value = months[0];
    await loadMonth();
  } else {
    renderGrouped(container, []);
  }
}

function initTabs() {
  const buttons = document.querySelectorAll("nav.tabs button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-latest").hidden = btn.dataset.tab !== "latest";
      document.getElementById("tab-history").hidden = btn.dataset.tab !== "history";
    });
  });
}

initTabs();
initLatest();
initHistory();
