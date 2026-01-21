/* ============================================================
   PROJEKT: GitRepos Dashboard
   SÚBOR: script.js (Logika aplikácie)
   ============================================================ */

// 1. ZÁKLADNÉ PREMENNÉ
// Odkaz na GitHub API
const API_BASE = 'https://api.github.com/search/repositories';

// Prvky z HTML, s ktorými budeme pracovať
const mriezkaDomov = document.getElementById('grid'); // Grid na domovskej stránke
const zoznamJazykov = document.getElementById('lang-list'); // Filtre vľavo
const mriezkaHladanie = document.getElementById('vysledky-hladania'); // Grid na stránke hľadania

// Tlačidlo pre tmavý režim (nájde ho podľa jedného alebo druhého ID)
const tmaveTlacidlo = document.getElementById('mode-btn') || document.getElementById('dark-mode-toggle');

// Sem si uložíme stiahnuté dáta pre domovskú stránku
let dataDomov = [];


/* ============================================================
   2. DOMOVSKÁ STRÁNKA (index.html)
   Tento kód sa spustí len ak sme na hlavnej stránke
   ============================================================ */

if (mriezkaDomov) {
    // Sme na domovskej stránke -> spusti sťahovanie
    spustiAutomatikuDomov();
}

// Funkcia na stiahnutie dát (TOP 30 repozitárov)
async function spustiAutomatikuDomov() {
    try {
        // Zobrazím loading správu
        mriezkaDomov.innerHTML = '<p style="text-align:center; margin-top:50px">Načítavam dáta...</p>';
        
        // Pripravím URL adresu
        const adresa = `${API_BASE}?q=stars:>1000&sort=stars&order=desc&per_page=30&t=${Date.now()}`;
        
        // Stiahnem dáta (fetch)
        const odpoved = await fetch(adresa);
        const json = await odpoved.json();
        
        // Uložím si dáta do premennej
        dataDomov = json.items || [];

        // Ak niečo prišlo, vykreslím to
        if (dataDomov.length > 0) {
            vytvorMenuJazykovDomov(); // Spraví filtre vľavo
            vykresliKartyDomov();     // Spraví kartičky vpravo
        } else {
            mriezkaDomov.innerHTML = '<p>Nič sa nenašlo.</p>';
        }

    } catch (chyba) {
        console.error(chyba); // Vypíš chybu do konzoly
        mriezkaDomov.innerHTML = '<p style="color:red; text-align:center">Chyba pri sťahovaní dát.</p>';
    }
}

// Funkcia, ktorá zobrazí kartičky na Domovskej stránke
function vykresliKartyDomov() {
    if (!mriezkaDomov) return;

    // Zistím, čo je zakliknuté vo filtroch
    const chceVsetky = document.getElementById('check-all') ? document.getElementById('check-all').checked : true;
    
    // Nájdem všetky zakliknuté checkboxy pre jazyky
    const vybraneJazyky = Array.from(document.querySelectorAll('.jazyk-checkbox:checked')).map(cb => cb.value);
    
    // Zistím, ako chce užívateľ triediť (hviezdy, forky...)
    const sortElement = document.querySelector('input[name="sort"]:checked');
    const typTriedenia = sortElement ? sortElement.value : 'stars';

    // 1. FILTROVANIE
    let zoznam = dataDomov.filter(repo => {
        if (chceVsetky) return true; // Ak chce všetko, berieme všetko
        // Inak skontrolujeme, či je jazyk repozitára v zozname vybraných
        if (repo.language && vybraneJazyky.includes(repo.language)) return true;
        return false;
    });

    // 2. TRIEDENIE
    zoznam.sort((a, b) => {
        if (typTriedenia === 'stars') return b.stargazers_count - a.stargazers_count;
        if (typTriedenia === 'forks') return b.forks_count - a.forks_count;
        return b.open_issues_count - a.open_issues_count;
    });

    // 3. VYKRESLENIE
    generujHTML(mriezkaDomov, zoznam);
}

// Funkcia na vytvorenie bočného menu (zoznam jazykov)
function vytvorMenuJazykovDomov() {
    if (!zoznamJazykov) return;

    // Vytiahnem z dát unikátne jazyky
    let jazyky = [...new Set(dataDomov.map(r => r.language).filter(l => l))].sort();
    
    // HTML pre možnosť "Všetky"
    let html = `<li><label><input type="checkbox" id="check-all" checked onchange="klikolNaVsetky()"><div class="custom-box is-square"></div><span>Všetky</span></label></li>`;
    
    // HTML pre ostatné jazyky
    jazyky.forEach(j => {
        html += `<li><label><input type="checkbox" class="jazyk-checkbox" value="${j}" onchange="klikolNaJazyk()"><div class="custom-box is-square"></div><span>${j}</span></label></li>`;
    });
    
    zoznamJazykov.innerHTML = html;
    
    // Keď zmení zoradenie, prekreslím karty
    document.querySelectorAll('input[name="sort"]').forEach(el => el.onchange = vykresliKartyDomov);
}

// Keď klikne na "Všetky"
function klikolNaVsetky() {
    const checkAll = document.getElementById('check-all');
    if(checkAll && checkAll.checked) {
        // Odznačím ostatné
        document.querySelectorAll('.jazyk-checkbox').forEach(cb => cb.checked = false);
    }
    vykresliKartyDomov();
}

// Keď klikne na konkrétny jazyk
function klikolNaJazyk() {
    const checkAll = document.getElementById('check-all');
    if (checkAll) {
        // Ak užívateľ niečo vybral, odznačím "Všetky"
        checkAll.checked = document.querySelectorAll('.jazyk-checkbox:checked').length === 0;
    }
    vykresliKartyDomov();
}


/* ============================================================
   3. STRÁNKA HĽADANIA (search.html)
   ============================================================ */

async function mojeHladanie() {
    // 1. Zoberiem hodnoty z formulára
    let nazov = document.getElementById('hladany-nazov').value.trim();
    let jazyk = document.getElementById('hladany-jazyk').value.trim();
    let minHviezdy = document.getElementById('hladane-hviezdy').value;
    let pocet = document.getElementById('hladany-pocet').value;
    let zoradenie = document.getElementById('hladane-zoradenie').value;

    // Musí zadať aspoň názov
    if (!nazov) {
        alert("Prosím, zadajte názov projektu.");
        return;
    }

    // 2. Poskladám URL adresu
    let dotaz = `q=${nazov}`;
    
    if (jazyk) {
        dotaz += `+language:${jazyk}`;
    }
    if (minHviezdy) {
        dotaz += `+stars:>${minHviezdy}`;
    }

    // GitHub API nevie triediť issues, tak to obídeme
    let apiSort = zoradenie;
    if (zoradenie === 'issues') apiSort = 'stars'; 

    let adresa = `${API_BASE}?${dotaz}&sort=${apiSort}&order=desc&per_page=100`;

    // 3. Stiahnutie dát
    try {
        if(mriezkaHladanie) mriezkaHladanie.innerHTML = '<p style="text-align:center; margin-top:50px">Hľadám...</p>';

        const odpoved = await fetch(adresa);
        const json = await odpoved.json();
        let data = json.items || [];

        // Ak chcel triediť podľa Issues, musíme to spraviť ručne
        if (zoradenie === 'issues') {
            data.sort((a, b) => b.open_issues_count - a.open_issues_count);
        }

        // Orežeme na počet výsledkov
        let finalnyZoznam = data.slice(0, pocet);

        if (mriezkaHladanie) {
            if (finalnyZoznam.length === 0) {
                mriezkaHladanie.innerHTML = '<p style="text-align:center">Nič sa nenašlo.</p>';
            } else {
                generujHTML(mriezkaHladanie, finalnyZoznam);
            }
        }

    } catch (chyba) {
        console.error(chyba);
        if(mriezkaHladanie) mriezkaHladanie.innerHTML = '<p style="color:red; text-align:center">Chyba API.</p>';
    }
}


/* ============================================================
   4. SPOLOČNÉ FUNKCIE (Generovanie HTML a Tmavý režim)
   ============================================================ */

// Funkcia, ktorá vyrobí HTML kód pre kartičky
function generujHTML(element, zoznamDat) {
    let html = '';
    
    zoznamDat.forEach(repo => {
        // Formátovanie čísla hviezd (napr. 1.5k)
        let hviezdy = (repo.stargazers_count / 1000).toFixed(1) + 'k';
        // Skrátenie popisu
        let popis = repo.description ? repo.description.slice(0, 80) + '...' : 'Bez popisu';
        let jazyk = repo.language || 'Neznámy';
        
        // Farby pre jazyky
        const farby = { javascript:'#f1e05a', python:'#3572A5', java:'#b07219', html:'#e34c26', css:'#563d7c' };
        const farbaBodky = farby[jazyk.toLowerCase()] || '#ccc';

        // HTML šablóna karty
        html += `
            <div class="card" style="animation: fadeIn 0.4s ease forwards">
                <h4>
                    <a href="${repo.html_url}" target="_blank" style="color:inherit; text-decoration:none">
                        ${repo.name}
                    </a>
                </h4>
                <p>${popis}</p>
                <div style="margin-top:15px; font-size:0.85rem; color:#666; display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; justify-content:space-between;">
                        <span><i class="fa-solid fa-circle" style="color:${farbaBodky}; font-size:8px"></i> <b>${jazyk}</b></span>
                        <span><i class="fa-regular fa-star"></i> ${hviezdy}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; opacity:0.8; border-top:1px solid #eee; padding-top:5px; margin-top:5px;">
                        <span title="Forky"><i class="fa-solid fa-code-branch"></i> ${repo.forks_count}</span>
                        <span title="Issues">🐛 ${repo.open_issues_count}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    element.innerHTML = html;
}

// Nastavenie Tmavého režimu (Dark Mode)
if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
    if (tmaveTlacidlo) tmaveTlacidlo.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

if (tmaveTlacidlo) {
    tmaveTlacidlo.onclick = () => {
        // Prepni triedu
        document.body.classList.toggle('dark-mode');
        
        // Zisti či je zapnutý a ulož do pamäte
        const jeTmave = document.body.classList.contains('dark-mode');
        localStorage.setItem('tema', jeTmave ? 'dark' : 'light');
        
        // Zmeň ikonku
        tmaveTlacidlo.innerHTML = jeTmave ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
}