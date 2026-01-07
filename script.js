/* =========================================
   1. NASTAVENIA
   ========================================= */
const BASE_API_URL = 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=30';

const grid = document.getElementById('grid');
const sidebar = document.querySelector('.sidebar');
let repos = [];

/* =========================================
    ŠTÝL PRE CHECKBOXY
   ========================================= */
// Tento štýl sa vloží dynamicky, aby prepísal všetko ostatné
const style = document.createElement('style');
style.innerHTML = `
    .sidebar input { display: none !important; }
    .sidebar label { display: flex !important; align-items: center !important; cursor: pointer !important; padding: 5px 0 !important; color: #bdc3c7 !important; transition: 0.2s; }
    .sidebar label:hover { color: #fff; transform: translateX(5px); }
    
    /* Vlastné rámčeky */
    .box {
        min-width: 18px; height: 18px;
        border: 2px solid #7f8c8d;
        margin-right: 10px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.05);
        transition: all 0.2s;
    }
    .okruhly { border-radius: 50%; }
    .hranaty { border-radius: 4px; }

    /* Checked stav */
    input:checked + .box { background: #3498db; border-color: #3498db; box-shadow: 0 0 8px rgba(52, 152, 219, 0.4); }
    input:checked + .okruhly::after { content: ""; width: 6px; height: 6px; background: white; border-radius: 50%; display: block; }
    input:checked + .hranaty::after { content: ""; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); display: block; margin-bottom: 2px; }
    input:checked ~ span { color: white; font-weight: bold; }
`;
document.head.appendChild(style);

/* =========================================
   3. NAČÍTANIE DÁT
   ========================================= */
async function load() {
    try {
        grid.innerHTML = '<p style="text-align:center; color:#888; margin-top:50px;">Načítavam repozitáre z GitHubu...</p>';
        
        // Pridávame čas, aby prehliadač neukladal staré dáta
        // POZNÁMKA: GitHub Search API má vlastnú cache cca 2-5 minút, ktorú neovplyvníme.
        const urlSCasom = `${BASE_API_URL}&t=${Date.now()}`;
        
        const res = await fetch(urlSCasom);
        
        if (!res.ok) throw new Error(`Chyba API: ${res.status}`);
        
        const data = await res.json();
        repos = data.items;
        
        console.log(`Načítaných ${repos.length} repozitárov.`);
        
        // Ak sa nenačítali žiadne dáta
        if (!repos || repos.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:red">Nenašli sa žiadne repozitáre.</p>';
            return;
        }

        // Renderujeme
        renderSidebar(); // Toto vygeneruje filtre podľa skutočných jazykov v dátach
        renderGrid();    // Toto vygeneruje kartičky

    } catch (e) { 
        console.error(e);
        grid.innerHTML = `<p style="text-align:center; color:red">Nastala chyba pri načítaní: ${e.message}<br>Skús to o chvíľu znova (limit API).</p>`;
    }
}

/* =========================================
   4. SIDEBAR (Dynamické filtre)
   ========================================= */
function renderSidebar() {
    // Zistíme unikátne jazyky z načítaných dát
    const availableLangs = [...new Set(repos.map(r => r.language).filter(l => l))].sort();

    
    // Nájde element v HTML, kam vložiť filtre (ak existuje zoznam, vymažeme ho a dáme nový)
    const filterList = document.querySelector('.filtre');
    if (!filterList) return;

    // Keďže v HTML máš filtre natvrdo, poďme ich len oživiť, namiesto premazávania:
    // Pridáme im event listenery, ak ešte nemajú.
    
    document.querySelectorAll('input[name="sort"]').forEach(el => {
        el.onchange = renderGrid;
    });
}

/* =========================================
   5. FILTROVACIA LOGIKA
   ========================================= */
// Tieto funkcie voláme priamo z HTML (onchange) alebo cez event listenery
window.toggleAll = function() {
    const all = document.getElementById('check-all'); // Upravil som ID podľa tvojho HTML
    if (all && all.checked) {
        document.querySelectorAll('.lang-check').forEach(c => c.checked = false);
    }
    renderGrid();
}

// Pridáme poslucháča na manuálne jazyky
document.querySelectorAll('.lang-check').forEach(chk => {
    chk.onchange = function() {
        const all = document.getElementById('check-all');
        const anyChecked = document.querySelectorAll('.lang-check:checked').length > 0;
        if (all) all.checked = !anyChecked; // Ak je niečo zaškrtnuté, zruš "Všetky"
        renderGrid();
    }
});

/* =========================================
   6. GRID A VYKRESLENIE
   ========================================= */
function renderGrid() {
    // 1. Zistíme, ako triediť
    // Keďže v HTML nemáš input name="sort", ale asi si ho tam chceš nechať z JS generovania:
    // Ak používaš JS na generovanie sidebaru (ako v starom kóde), tu je logika.
    // Ak používaš HTML sidebar, musíme čítať hodnoty inak. 
    
    // Pre istotu skúsime nájsť sort input, ak neexistuje, default je hviezdy
    const sortEl = document.querySelector('input[name="sort"]:checked');
    const sort = sortEl ? sortEl.value : 'stars';

    // 2. Zistíme, aké jazyky filtrovať
    const checkedBoxes = document.querySelectorAll('.lang-check:checked');
    const checkedLangs = [...checkedBoxes].map(c => c.value.toLowerCase());
    const showAll = document.getElementById('check-all')?.checked ?? true;

    // 3. Filtrujeme pole repos
    let list = repos.filter(r => {
        if (showAll) return true;
        if (!r.language) return false;
        // Porovnanie (napr. API vráti "JavaScript", checkbox má value "javascript")
        return checkedLangs.includes(r.language.toLowerCase());
    });

    // 4. Triedime
    list.sort((a, b) => {
        if (sort === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sort === 'issues') return b.open_issues_count - a.open_issues_count;
        return new Date(b.updated_at) - new Date(a.updated_at);
    });

    // 5. Vykreslíme
    grid.innerHTML = '';
    
    if (list.length === 0) {
        grid.innerHTML = '<p>Pre tento filter sa nenašli žiadne repozitáre.</p>';
        return;
    }

    list.forEach(r => {
        // Formátovanie čísel (1500 -> 1.5k)
        const stars = r.stargazers_count > 1000 ? (r.stargazers_count/1000).toFixed(1)+'k' : r.stargazers_count;
        
        // Farba bodky podľa jazyka
        const langKey = r.language ? r.language.toLowerCase() : 'other';
        const colors = { javascript:'#f1e05a', python:'#3572A5', java:'#b07219', 'c++':'#f34b7d', html:'#e34c26', css:'#563d7c' };
        const color = colors[langKey] || '#ccc';

        // Dátum
        const date = new Date(r.updated_at).toLocaleDateString('sk-SK');

        //  OPRAVA ISSUES
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
                        <span>📅 ${date}</span>
                        
                        <span title="Toto číslo zahŕňa Issues aj Pull Requesty (Vlastnosť GitHub API)" style="cursor:help; border-bottom:1px dotted #999;">
                            🐛 ${r.open_issues_count} <small>Issues</small>
                        </span>
                    </div>

                </div>
            </div>
        `;
    });
}

// Spustenie
load();