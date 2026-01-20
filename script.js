/* ============================================================
   1. HLAVNÉ NASTAVENIA
   ============================================================ */

// Adresa, odkiaľ sťahujeme dáta
const API_BASE = 'https://api.github.com/search/repositories';

// Odkazy na prvky v HTML (podľa ID)
const mriezkaDomov = document.getElementById('grid');
const zoznamJazykov = document.getElementById('lang-list');
const mriezkaHladanie = document.getElementById('vysledky-hladania');

// Tlačidlo pre tmavý režim (funguje na oba názvy ID pre istotu)
const tmaveTlacidlo = document.getElementById('mode-btn') || document.getElementById('dark-mode-toggle');

// Sem si uložíme dáta pre domovskú stránku
let dataDomov = [];


/* ============================================================
   2. ČASŤ A: DOMOVSKÁ STRÁNKA (index.html)
   ============================================================ */

// Ak sme na domovskej stránke, spustíme automatické sťahovanie
if (mriezkaDomov) {
    spustiAutomatikuDomov();
}

async function spustiAutomatikuDomov() {
    try {
        // Zobrazíme správu o načítavaní
        mriezkaDomov.innerHTML = '<p style="text-align:center; margin-top:50px">Načítavam TOP repozitáre...</p>';
        
        // Stiahneme 30 najlepších repozitárov podľa hviezd
        const adresa = `${API_BASE}?q=stars:>1000&sort=stars&order=desc&per_page=30&t=${Date.now()}`;
        
        const odpoved = await fetch(adresa);
        const json = await odpoved.json();
        dataDomov = json.items || [];

        // Ak máme dáta, vykreslíme menu a kartičky
        if (dataDomov.length > 0) {
            vytvorMenuJazykovDomov();
            vykresliKartyDomov();
        } else {
            mriezkaDomov.innerHTML = '<p>Nič sa nenašlo.</p>';
        }

    } catch (chyba) {
        console.error(chyba);
        mriezkaDomov.innerHTML = '<p style="color:red; text-align:center">Nepodarilo sa stiahnuť dáta.</p>';
    }
}

// Funkcia na kreslenie kariet (Domov)
function vykresliKartyDomov() {
    if (!mriezkaDomov) return;

    // Získame nastavenia filtrov
    const chceVsetky = document.getElementById('check-all') ? document.getElementById('check-all').checked : true;
    const vybraneJazyky = Array.from(document.querySelectorAll('.jazyk-checkbox:checked')).map(cb => cb.value);
    const sortElement = document.querySelector('input[name="sort"]:checked');
    const typTriedenia = sortElement ? sortElement.value : 'stars';

    // 1. Filtrujeme zoznam
    let zoznam = dataDomov.filter(repo => {
        if (chceVsetky) return true;
        if (repo.language && vybraneJazyky.includes(repo.language)) return true;
        return false;
    });

    // 2. Triedime zoznam
    zoznam.sort((a, b) => {
        if (typTriedenia === 'stars') return b.stargazers_count - a.stargazers_count;
        if (typTriedenia === 'forks') return b.forks_count - a.forks_count;
        return b.open_issues_count - a.open_issues_count;
    });

    // 3. Vykreslíme
    generujHTML(mriezkaDomov, zoznam);
}

// Funkcia na vytvorenie bočného menu (Jazyky)
function vytvorMenuJazykovDomov() {
    if (!zoznamJazykov) return;

    // Získame unikátne jazyky
    let jazyky = [...new Set(dataDomov.map(r => r.language).filter(l => l))].sort();
    
    // Pridáme možnosť "Všetky"
    let html = `<li><label><input type="checkbox" id="check-all" checked onchange="klikolNaVsetky()"><div class="custom-box is-square"></div><span>Všetky</span></label></li>`;
    
    // Pridáme ostatné jazyky
    jazyky.forEach(j => {
        html += `<li><label><input type="checkbox" class="jazyk-checkbox" value="${j}" onchange="klikolNaJazyk()"><div class="custom-box is-square"></div><span>${j}</span></label></li>`;
    });
    
    zoznamJazykov.innerHTML = html;
    
    // Zapneme sledovanie zmeny pri sortovaní
    document.querySelectorAll('input[name="sort"]').forEach(el => el.onchange = vykresliKartyDomov);
}

// Pomocné funkcie pre klikanie na checkboxy
function klikolNaVsetky() {
    const checkAll = document.getElementById('check-all');
    if(checkAll && checkAll.checked) document.querySelectorAll('.jazyk-checkbox').forEach(cb => cb.checked = false);
    vykresliKartyDomov();
}
function klikolNaJazyk() {
    const checkAll = document.getElementById('check-all');
    if (checkAll) checkAll.checked = document.querySelectorAll('.jazyk-checkbox:checked').length === 0;
    vykresliKartyDomov();
}


/* ============================================================
   3. ČASŤ B: VYHĽADÁVACIA STRÁNKA (search.html)
   ============================================================ */

async function mojeHladanie() {
    // 1. Získame hodnoty z formulára
    let nazov = document.getElementById('hladany-nazov').value.trim();
    let jazyk = document.getElementById('hladany-jazyk').value.trim();
    let minHviezdy = document.getElementById('hladane-hviezdy').value;
    let pocet = document.getElementById('hladany-pocet').value;
    let zoradenie = document.getElementById('hladane-zoradenie').value;

    // Musíme skontrolovať, či je zadaný názov
    if (!nazov) {
        alert("Prosím, zadajte aspoň názov (kľúčové slovo).");
        return;
    }

    // 2. Poskladáme URL adresu pre API
    let dotaz = `q=${nazov}`;
    
    if (jazyk) {
        dotaz += `+language:${jazyk}`;
    }
    if (minHviezdy) {
        dotaz += `+stars:>${minHviezdy}`;
    }

    // GitHub nevie triediť podľa issues, takže ak to chceme, musíme to spraviť ručne
    let apiSort = zoradenie;
    if (zoradenie === 'issues') apiSort = 'stars'; 

    let adresa = `${API_BASE}?${dotaz}&sort=${apiSort}&order=desc&per_page=100`;

    // 3. Stiahnutie a spracovanie
    try {
        if(mriezkaHladanie) mriezkaHladanie.innerHTML = '<p style="text-align:center; margin-top:50px">Hľadám...</p>';

        const odpoved = await fetch(adresa);
        const json = await odpoved.json();
        let data = json.items || [];

        // Ručné triedenie pre Issues
        if (zoradenie === 'issues') {
            data.sort((a, b) => b.open_issues_count - a.open_issues_count);
        }

        // Orežeme zoznam na požadovaný počet
        let finalnyZoznam = data.slice(0, pocet);

        if (mriezkaHladanie) {
            if (finalnyZoznam.length === 0) {
                mriezkaHladanie.innerHTML = '<p style="text-align:center">Pre tieto kritériá sa nič nenašlo.</p>';
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
   4. SPOLOČNÉ FUNKCIE (HTML Generátor + Dark Mode)
   ============================================================ */

function generujHTML(element, zoznamDat) {
    let html = '';
    zoznamDat.forEach(repo => {
        // Úprava čísel (napr. 1500 -> 1.5k)
        let hviezdy = (repo.stargazers_count / 1000).toFixed(1) + 'k';
        let popis = repo.description ? repo.description.slice(0, 80) + '...' : 'Bez popisu';
        let jazyk = repo.language || 'Neznámy';
        
        // Farby pre bodku pri jazyku
        const farby = { javascript:'#f1e05a', python:'#3572A5', java:'#b07219', html:'#e34c26', css:'#563d7c' };
        const farbaBodky = farby[jazyk.toLowerCase()] || '#ccc';

        html += `
            <div class="card" style="animation: fadeIn 0.4s ease forwards">
                <h4><a href="${repo.html_url}" target="_blank" style="color:inherit; text-decoration:none">${repo.name}</a></h4>
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

// Dark Mode logika
if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
    if (tmaveTlacidlo) tmaveTlacidlo.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

if (tmaveTlacidlo) {
    tmaveTlacidlo.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const jeTmave = document.body.classList.contains('dark-mode');
        
        localStorage.setItem('tema', jeTmave ? 'dark' : 'light');
        tmaveTlacidlo.innerHTML = jeTmave ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
}