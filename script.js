/* ============================================================
   1. HLAVNÉ PREMENNÉ (Odkazy na veci v HTML)
   ============================================================ */
const API_URL = 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=30';

// Nájdeme miesto, kam sa budú kresliť kartičky (len na stránke Domov)
const grid = document.getElementById('grid');

// Miesto pre zoznam jazykov v ľavom menu
const zoznamJazykov = document.getElementById('lang-list');

// Premenná, kam si uložíme stiahnuté dáta z GitHubu
let stiahnuteRepozitare = [];


/* ============================================================
   2. SPÚŠŤANIE (Rozhodne sa, či sme na Domov alebo Info)
   ============================================================ */

// Ak sme na stránke "Domov" (existuje grid), stiahneme dáta
if (grid) {
    stiahniDataZGithubu();
}

// Ak sme na stránke Info alebo Kontakt, nič sa nesťahuje,
// ale Dark Mode (tmavý režim) bude fungovať všade (je na konci súboru).


/* ============================================================
   3. FUNKCIA: Sťahovanie dát
   ============================================================ */
async function stiahniDataZGithubu() {
    try {
        // Napíšeme užívateľovi, že pracujeme
        grid.innerHTML = '<p style="text-align:center; color:#888; margin-top:50px;">Sťahujem dáta z GitHubu...</p>';

        // Pridáme aktuálny čas, aby sme vždy dostali čerstvé dáta (nie staré z pamäte)
        const adresa = `${API_URL}&t=${Date.now()}`;

        // Pošleme požiadavku na GitHub
        const odpoved = await fetch(adresa);
        const data = await odpoved.json();

        // Uložíme si výsledok do našej premennej
        stiahnuteRepozitare = data.items;

        // Skontrolujeme, či niečo prišlo
        if (stiahnuteRepozitare.length === 0) {
            grid.innerHTML = '<p>Nenašli sa žiadne repozitáre.</p>';
            return;
        }

        // Ak je všetko OK:
        // 1. Vyrobíme menu s jazykmi vľavo
        vykresliBocneMenu();
        // 2. Vyrobíme kartičky v strede
        vykresliKarticky();

    } catch (chyba) {
        console.error(chyba);
        grid.innerHTML = '<p style="text-align:center; color:red">Nastala chyba pri spojení s GitHubom.</p>';
    }
}


/* ============================================================
   4. FUNKCIA: Kreslenie bočného menu (Jazyky)
   ============================================================ */
function vykresliBocneMenu() {
    // Ak na tejto stránke nie je bočné menu, končíme (napr. stránka Kontakt)
    if (!zoznamJazykov) return;

    // Zistíme, aké jazyky sa v repozitároch nachádzajú (aby sme tam nemali blbosti)
    const vsetkyJazyky = stiahnuteRepozitare.map(repo => repo.language).filter(jazyk => jazyk !== null);
    // Odstránime duplikáty (aby tam JavaScript nebol 10x) a zoradíme podľa abecedy
    const unikatneJazyky = [...new Set(vsetkyJazyky)].sort();

    // Začneme vyrábať HTML - prvé tlačidlo je "Všetky"
    let htmlKod = `
        <li>
            <label>
                <input type="checkbox" id="check-all" checked onchange="klikolNaVsetky()">
                <div class="custom-box is-square"></div>
                <span>Všetky</span>
            </label>
        </li>
    `;

    // Pre každý nájdený jazyk vyrobíme ďalšie tlačidlo
    unikatneJazyky.forEach(jazyk => {
        htmlKod += `
            <li>
                <label>
                    <input type="checkbox" class="jazyk-checkbox" value="${jazyk}" onchange="klikolNaJazyk()">
                    <div class="custom-box is-square"></div>
                    <span>${jazyk}</span>
                </label>
            </li>
        `;
    });

    // Vložíme vyrobený kód do stránky
    zoznamJazykov.innerHTML = htmlKod;
}


/* ============================================================
   5. REAKCIE NA KLIKNUTIA (Filtrovanie)
   ============================================================ */

// Keď klikneš na "Všetky"
function klikolNaVsetky() {
    const vsetkyInput = document.getElementById('check-all');
    const ostatneInputy = document.querySelectorAll('.jazyk-checkbox');

    if (vsetkyInput.checked) {
        // Odškrtni ostatné jazyky
        ostatneInputy.forEach(checkbox => checkbox.checked = false);
    }
    vykresliKarticky(); // Prekresli stred
}

// Keď klikneš na konkrétny jazyk (napr. Python)
function klikolNaJazyk() {
    const vsetkyInput = document.getElementById('check-all');
    const zaskrtnuteJazyky = document.querySelectorAll('.jazyk-checkbox:checked');

    // Ak si vybral nejaký jazyk, zruš fajku pri "Všetky"
    if (zaskrtnuteJazyky.length > 0) {
        vsetkyInput.checked = false;
    } else {
        // Ak si všetko odškrtol, automaticky zapni "Všetky"
        vsetkyInput.checked = true;
    }
    vykresliKarticky(); // Prekresli stred
}

// Keď klikneš na Zoradiť (Hviezdy / Forky / Issues)
// Nájde všetky prepínače s menom "sort" a povie im, aby pri zmene prekreslili karty
document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.addEventListener('change', vykresliKarticky);
});


/* ============================================================
   6. FUNKCIA: Kreslenie kartičiek (To hlavné)
   ============================================================ */
function vykresliKarticky() {
    // Ak nie sme na domovskej stránke, nerob nič
    if (!grid) return;

    // 1. Zistíme, čo chce užívateľ vidieť (Filtrovanie)
    const chceVsetky = document.getElementById('check-all').checked;
    
    // Zozbierame názvy zaškrtnutých jazykov (napr. ["Python", "Java"])
    const vybraneJazyky = Array.from(document.querySelectorAll('.jazyk-checkbox:checked'))
                               .map(checkbox => checkbox.value.toLowerCase());

    // Vyfiltrujeme zoznam
    let zoznamNaZobrazenie = stiahnuteRepozitare.filter(repo => {
        if (chceVsetky) return true; // Ak chce všetky, berieme všetko
        if (!repo.language) return false; // Ak repo nemá jazyk, ignorujeme
        return vybraneJazyky.includes(repo.language.toLowerCase()); // Má repo jazyk, ktorý sme vybrali?
    });

    // 2. Zoradíme zoznam (Sortovanie)
    // Zistíme, ktorý krúžok je vybratý (stars, forks, issues)
    const vybraneZoradenie = document.querySelector('input[name="sort"]:checked').value;

    zoznamNaZobrazenie.sort((a, b) => {
        if (vybraneZoradenie === 'stars') {
            return b.stargazers_count - a.stargazers_count; // Od najviac hviezd
        } else if (vybraneZoradenie === 'forks') {
            return b.forks_count - a.forks_count;           // Od najviac forkov
        } else if (vybraneZoradenie === 'issues') {
            return b.open_issues_count - a.open_issues_count; // Od najviac issues
        }
        return 0; // Inak nemeň poradie
    });

    // 3. Vykreslíme HTML do stránky
    grid.innerHTML = ''; // Vyčistíme staré karty

    if (zoznamNaZobrazenie.length === 0) {
        grid.innerHTML = '<p style="text-align:center; margin-top:20px;">Pre tento výber sa nič nenašlo.</p>';
        return;
    }

    zoznamNaZobrazenie.forEach(repo => {
        // Formátovanie čísel (1500 -> 1.5k)
        const hviezdy = repo.stargazers_count > 1000 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count;
        const forky = repo.forks_count > 1000 ? (repo.forks_count/1000).toFixed(1)+'k' : repo.forks_count;
        const datum = new Date(repo.updated_at).toLocaleDateString('sk-SK');

        // Farbičky pre bodku pri jazyku
        const farby = { javascript:'#f1e05a', python:'#3572A5', java:'#b07219', html:'#e34c26', css:'#563d7c' };
        // Ak nemáme farbu, použijeme šedú (#ccc)
        const farbaBodky = farby[repo.language?.toLowerCase()] || '#ccc';

        // Vložíme HTML kartičky
        grid.innerHTML += `
            <div class="card" style="animation: fadeIn 0.4s ease forwards">
                <h4>
                    <a href="${repo.html_url}" target="_blank" style="color:inherit; text-decoration:none">
                        ${repo.name}
                    </a>
                </h4>
                <p>${repo.description ? repo.description.substring(0, 80)+'...' : 'Bez popisu'}</p>
                
                <div style="margin-top:15px; font-size:0.85rem; color:#666; display:flex; flex-direction:column; gap:5px;">
                    
                    <div style="display:flex; justify-content:space-between;">
                        <span>
                            <i class="fa-solid fa-circle" style="color:${farbaBodky}; font-size:8px"></i> 
                            <b>${repo.language || 'Neznámy'}</b>
                        </span>
                        <span><i class="fa-regular fa-star"></i> ${hviezdy}</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; opacity:0.8; border-top:1px solid #eee; padding-top:5px; margin-top:5px;">
                        <span title="Počet ľudí (Forky)">
                            <i class="fa-solid fa-code-branch"></i> ${forky}
                        </span>
                        <span title="Issues">
                            🐛 ${repo.open_issues_count}
                        </span>
                    </div>

                </div>
            </div>
        `;
    });
}


/* ============================================================
   7. DARK MODE (Tmavý režim)
   ============================================================ */
const tlacidloMode = document.getElementById('dark-mode-toggle');

// Ak tlačidlo na stránke existuje (malo by byť všade)
if (tlacidloMode) {
    // Pozrieme sa do pamäte prehliadača, či si užívateľ minule zapol tmavý režim
    if (localStorage.getItem('tema') === 'dark') {
        document.body.classList.add('dark-mode');
        tlacidloMode.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    // Keď klikneš na tlačidlo
    tlacidloMode.onclick = () => {
        document.body.classList.toggle('dark-mode');
        
        // Zistíme, či je teraz zapnutý tmavý režim
        const jeTmave = document.body.classList.contains('dark-mode');
        
        // Uložíme to do pamäte ('dark' alebo 'light')
        localStorage.setItem('tema', jeTmave ? 'dark' : 'light');
        
        // Zmeníme ikonku (Slnko alebo Mesiac)
        tlacidloMode.innerHTML = jeTmave ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
}