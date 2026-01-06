/* =========================================
   1. NASTAVENIA
   ========================================= */
const API_URL = 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=30';
const grid = document.getElementById('grid');
const sidebar = document.querySelector('.sidebar');
let repos = [];

/* =========================================
   2. AGRESÍVNY ŠTÝL (Prebije všetko ostatné)
   ========================================= */
const style = document.createElement('style');
style.innerHTML = `
    /* 1. ÚPLNE SKRYŤ SYSTÉMOVÉ TLAČIDLÁ */
    .sidebar input { 
        display: none !important; 
        width: 0 !important;
        height: 0 !important;
        opacity: 0 !important;
    }

    /* 2. RESET TEXTU */
    .sidebar label {
        display: flex !important;
        align-items: center !important;
        cursor: pointer !important;
        padding: 5px 0 !important;
        color: #bdc3c7 !important;
        background: none !important;
        border: none !important;
    }

    /* 3. NÁŠ JEDINÝ RÁMČEK */
    .box {
        min-width: 18px; height: 18px;
        border: 2px solid #7f8c8d;
        margin-right: 10px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.05);
    }

    /* KRÚŽOK (pre radio) */
    .okruhly { border-radius: 50%; }
    /* ŠTVOREC (pre checkbox) */
    .hranaty { border-radius: 4px; }

    /* 4. KEĎ KLIKNEŠ (Zafarbí sa) */
    input:checked + .box {
        background: #3498db;
        border-color: #3498db;
    }

    /* 5. VYKRESLENIE SYMBOLU VNÚTRI */
    input:checked + .okruhly::after {
        content: ""; width: 6px; height: 6px; background: white; border-radius: 50%; display: block;
    }
    input:checked + .hranaty::after {
        content: "✔"; font-size: 12px; color: white; line-height: 1; display: block;
    }

    /* Zvýraznenie textu */
    input:checked ~ span { color: white; font-weight: bold; }
`;
document.head.appendChild(style);

/* =========================================
   3. JEDNODUCHÉ NAČÍTANIE
   ========================================= */
async function load() {
    try {
        grid.innerHTML = '<p style="text-align:center; color:#888;">Načítavam...</p>';
        const res = await fetch(API_URL);
        const data = await res.json();
        repos = data.items;
        renderSidebar();
        renderGrid();
    } catch (e) { console.log(e); }
}

/* =========================================
   4. HTML PRE SIDEBAR (Len to najnutnejšie)
   ========================================= */
function renderSidebar() {
    const langs = [...new Set(repos.map(r => r.language).filter(l => l))].sort();

    // Vyčistíme sidebar a vložíme nanovo
    sidebar.innerHTML = `
        <br>
        <h3>Zoradiť</h3>
        <ul class="filtre" style="list-style:none; padding:0">
            <li><label><input type="radio" name="sort" value="stars" checked onchange="renderGrid()"> <div class="box okruhly"></div> <span>Hviezdy</span></label></li>
            <li><label><input type="radio" name="sort" value="updated" onchange="renderGrid()"> <div class="box okruhly"></div> <span>Dátum</span></label></li>
            <li><label><input type="radio" name="sort" value="issues" onchange="renderGrid()"> <div class="box okruhly"></div> <span>Issues</span></label></li>
        </ul>

        <br>
        <h3>Jazyky</h3>
        <ul class="filtre" style="list-style:none; padding:0">
            <li><label><input type="checkbox" id="all" checked onchange="toggleAll()"> <div class="box hranaty"></div> <span>Všetky</span></label></li>
            ${langs.map(l => `
                <li><label><input type="checkbox" class="lang" value="${l}" onchange="toggleLang()"> <div class="box hranaty"></div> <span>${l}</span></label></li>
            `).join('')}
        </ul>
    `;
}

/* =========================================
   5. LOGIKA (Prepínanie)
   ========================================= */
function toggleAll() {
    const all = document.getElementById('all');
    if (all.checked) document.querySelectorAll('.lang').forEach(c => c.checked = false);
    renderGrid();
}

function toggleLang() {
    const all = document.getElementById('all');
    const checks = document.querySelectorAll('.lang:checked');
    all.checked = checks.length === 0;
    renderGrid();
}

/* =========================================
   6. GRID A ISSUES (Zoradenie)
   ========================================= */
function renderGrid() {
    const sort = document.querySelector('input[name="sort"]:checked').value;
    const checked = [...document.querySelectorAll('.lang:checked')].map(c => c.value);
    const showAll = document.getElementById('all').checked;

    // Filter
    let list = repos.filter(r => showAll || (r.language && checked.includes(r.language)));

    // Sort (Issues od najväčšieho)
    list.sort((a, b) => {
        if (sort === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sort === 'issues') return b.open_issues_count - a.open_issues_count;
        return new Date(b.updated_at) - new Date(a.updated_at);
    });

    // Vykreslenie
    grid.innerHTML = '';
    list.forEach(r => {
        const stars = r.stargazers_count > 1000 ? (r.stargazers_count/1000).toFixed(1)+'k' : r.stargazers_count;
        const color = {javascript:'#f1e05a', python:'#3572A5', java:'#b07219', html:'#e34c26', css:'#563d7c'}[r.language?.toLowerCase()] || '#ccc';

        grid.innerHTML += `
            <div class="card" style="animation: fadeIn 0.4s ease forwards">
                <h4><a href="${r.html_url}" target="_blank" style="color:inherit;text-decoration:none">${r.name}</a></h4>
                <p>${r.description ? r.description.substring(0, 80)+'...' : 'Bez popisu'}</p>
                <div style="margin-top:15px; font-size:0.85rem; color:#666">
                    <div><i class="fa-solid fa-circle" style="color:${color};font-size:8px"></i> <b>${r.language || 'Iné'}</b> • <i class="fa-regular fa-star"></i> ${stars}</div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px; opacity:0.8">
                        <span>📅 ${new Date(r.updated_at).toLocaleDateString('sk')}</span>
                        <span>🐛 ${r.open_issues_count} Issues</span>
                    </div>
                </div>
            </div>
        `;
    });
}

/* --- Dark Mode --- */
const toggle = document.getElementById('dark-mode-toggle');
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
if (toggle) toggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

load();