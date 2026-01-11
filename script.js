/* =========================================
   1. NASTAVENIA
   ========================================= */
const BASE_API_URL = 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=30';
const grid = document.getElementById('grid');
let repos = [];

/* =========================================
   2. NAČÍTANIE DÁT
   ========================================= */
async function load() {
    try {
        grid.innerHTML = '<p style="text-align:center; color:#888; margin-top:50px;">Načítavam TOP 30 repozitárov...</p>';
        
        const urlSCasom = `${BASE_API_URL}&t=${Date.now()}`;
        
        const res = await fetch(urlSCasom);
        if (!res.ok) throw new Error(`Chyba API: ${res.status}`);
        
        const data = await res.json();
        repos = data.items;
        
        console.log(`Načítaných ${repos.length} repozitárov.`);

        if (!repos || repos.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:red">Nenašli sa žiadne repozitáre.</p>';
            return;
        }

        renderSidebar();
        renderGrid();

    } catch (e) { 
        console.error(e);
        grid.innerHTML = `<p style="text-align:center; color:red">Chyba: ${e.message}</p>`;
    }
}

/* =========================================
   3. SIDEBAR (JAZYKY)
   ========================================= */
function renderSidebar() {
    const langList = document.getElementById('lang-list');
    if (!langList) return;

    const languages = [...new Set(repos.map(r => r.language).filter(l => l))].sort();

    let html = `
        <li>
            <label>
                <input type="checkbox" id="check-all" checked>
                <div class="custom-box is-square"></div>
                <span>Všetky</span>
            </label>
        </li>
    `;

    languages.forEach(lang => {
        html += `
            <li>
                <label>
                    <input type="checkbox" class="lang-check" value="${lang}">
                    <div class="custom-box is-square"></div>
                    <span>${lang}</span>
                </label>
            </li>
        `;
    });

    langList.innerHTML = html;

    const checkAll = document.getElementById('check-all');
    const langChecks = document.querySelectorAll('.lang-check');

    checkAll.addEventListener('change', function() {
        if (this.checked) langChecks.forEach(cb => cb.checked = false);
        renderGrid();
    });

    langChecks.forEach(cb => {
        cb.addEventListener('change', function() {
            if (checkAll) checkAll.checked = false;
            const anyChecked = document.querySelectorAll('.lang-check:checked').length > 0;
            if (!anyChecked) checkAll.checked = true;
            renderGrid();
        });
    });
}

document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.addEventListener('change', renderGrid);
});


/* =========================================
   4. VYKRESLENIE GRIDU
   ========================================= */
function renderGrid() {
    const checkAll = document.getElementById('check-all');
    if (!checkAll) return;

    const showAll = checkAll.checked;
    const checkedValues = Array.from(document.querySelectorAll('.lang-check:checked')).map(cb => cb.value.toLowerCase());

    const sortEl = document.querySelector('input[name="sort"]:checked');
    const sortType = sortEl ? sortEl.value : 'stars';

    // 1. Filter
    let list = repos.filter(r => {
        if (showAll) return true;
        if (!r.language) return false;
        return checkedValues.includes(r.language.toLowerCase());
    });

    // 2. Sort (Zmenené: Dátum je preč, sú tu Forky)
    list.sort((a, b) => {
        if (sortType === 'stars') {
            return b.stargazers_count - a.stargazers_count;
        } else if (sortType === 'forks') {
            return b.forks_count - a.forks_count;
        } else if (sortType === 'issues') {
            return b.open_issues_count - a.open_issues_count;
        }
        return 0;
    });

    // 3. Render
    grid.innerHTML = '';
    
    if (list.length === 0) {
        grid.innerHTML = '<p style="text-align:center; margin-top:20px;">Pre tento výber sa nenašli žiadne repozitáre.</p>';
        return;
    }

    list.forEach(r => {
        const stars = r.stargazers_count > 1000 ? (r.stargazers_count/1000).toFixed(1)+'k' : r.stargazers_count;
        const forks = r.forks_count > 1000 ? (r.forks_count/1000).toFixed(1)+'k' : r.forks_count;
        
        const langKey = r.language ? r.language.toLowerCase() : 'other';
        const colors = { javascript:'#f1e05a', python:'#3572A5', java:'#b07219', 'c++':'#f34b7d', c:'#555555', html:'#e34c26', css:'#563d7c', typescript:'#2b7489', shell:'#89e051' };
        const color = colors[langKey] || '#ccc';

        grid.innerHTML += `
            <div class="card" style="animation: fadeIn 0.4s ease forwards">
                <h4>
                    <a href="${r.html_url}" target="_blank" style="color:inherit; text-decoration:none">
                        ${r.name}
                    </a>
                </h4>
                <p>${r.description ? r.description.substring(0, 80)+'...' : 'Bez popisu'}</p>
                
                <div style="margin-top:15px; font-size:0.85rem; color:#666; display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; justify-content:space-between;">
                        <span>
                            <i class="fa-solid fa-circle" style="color:${color};font-size:8px"></i> 
                            <b>${r.language || 'Neznámy'}</b>
                        </span>
                        <span><i class="fa-regular fa-star"></i> ${stars}</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; opacity:0.8; border-top:1px solid #eee; padding-top:5px; margin-top:5px;">
                        
                        <span title="Forky (Kópie projektu)">
                            <i class="fa-solid fa-code-branch"></i> ${forks}
                        </span>

                        <span title="Issues + Pull Requesty" style="cursor:help;">
                            🐛 ${r.open_issues_count}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
}

/* =========================================
   5. DARK MODE
   ========================================= */
const toggle = document.getElementById('dark-mode-toggle');
if (toggle) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    toggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
}

// Spustenie
load();