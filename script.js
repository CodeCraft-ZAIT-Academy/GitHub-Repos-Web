/* =========================================
   1. KONFIGURÁCIA (Teraz hľadáme globálne)
   ========================================= */
// Hľadáme repozitáre s viac ako 1000 hviezdami, zoradené podľa hviezd
const API_URL = 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=30';

/* =========================================
   2. DARK MODE
   ========================================= */
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const icon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
            localStorage.setItem('darkMode', 'enabled');
        } else {
            if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

/* =========================================
   3. HLAVNÁ FUNKCIA: NAČÍTANIE DÁT
   ========================================= */
const grid = document.getElementById('grid');
const filterList = document.querySelector('.filtre'); 

async function loadRepositories() {
    try {
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #888;">Načítavam TOP repozitáre sveta...</p>';

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Nepodarilo sa načítať dáta');
        
        const data = await response.json();
        // POZOR: Pri vyhľadávaní sú repozitáre skryté v poli "items"
        const repos = data.items; 

        // 1. Vyčistíme grid
        grid.innerHTML = '';
        
        // 2. Vygenerujeme karty
        repos.forEach(repo => createCard(repo));

        // 3. Vygenerujeme filtre podľa toho, čo sme stiahli
        generateFilters(repos);

        // 4. Spustíme filtrovanie
        filterCards();

    } catch (error) {
        grid.innerHTML = `<p style="color:red; text-align:center;">Chyba: ${error.message}</p>`;
        console.error(error);
    }
}

/* =========================================
   4. GENERÁTOR FILTROV
   ========================================= */
function generateFilters(repos) {
    const languages = new Set();
    repos.forEach(repo => {
        if (repo.language) {
            languages.add(repo.language);
        }
    });

    if (filterList) {
        filterList.innerHTML = '';

        // "Všetky"
        const liAll = document.createElement('li');
        liAll.innerHTML = `
            <label>
                <input type="checkbox" id="check-all" checked> Všetky
            </label>
        `;
        filterList.appendChild(liAll);

        // Zoradíme jazyky abecedne a pridáme ich
        Array.from(languages).sort().forEach(lang => {
            const li = document.createElement('li');
            li.innerHTML = `
                <label>
                    <input type="checkbox" class="lang-check" value="${lang.toLowerCase()}"> ${lang}
                </label>
            `;
            filterList.appendChild(li);
        });

        setupFilterLogic();
    }
}

/* =========================================
   5. LOGIKA FILTROVANIA
   ========================================= */
function filterCards() {
    const checkAll = document.getElementById('check-all');
    const langCheckboxes = document.querySelectorAll('.lang-check');
    const cards = document.querySelectorAll('.card');

    if (!checkAll) return;

    const activeLangs = Array.from(langCheckboxes)
                             .filter(cb => cb.checked)
                             .map(cb => cb.value.toLowerCase());

    const showAll = checkAll.checked || activeLangs.length === 0;

    cards.forEach(card => {
        const cardLang = card.getAttribute('data-lang');
        card.style.animation = 'none';
        card.offsetHeight; 

        if (showAll || activeLangs.includes(cardLang)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.4s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

function setupFilterLogic() {
    const checkAll = document.getElementById('check-all');
    const langCheckboxes = document.querySelectorAll('.lang-check');

    if (checkAll) {
        checkAll.addEventListener('change', () => {
            if (checkAll.checked) {
                langCheckboxes.forEach(cb => cb.checked = false);
            } else if (!Array.from(langCheckboxes).some(cb => cb.checked)) {
                checkAll.checked = true;
            }
            filterCards();
        });
    }

    langCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) checkAll.checked = false;
            if (!Array.from(langCheckboxes).some(c => c.checked)) checkAll.checked = true;
            filterCards();
        });
    });
}

/* =========================================
   6. VYTVORENIE KARTY & FARBY
   ========================================= */
function createCard(repo) {
    const card = document.createElement('div');
    card.classList.add('card');
    
    const lang = repo.language ? repo.language.toLowerCase() : 'other';
    const langDisplay = repo.language || 'Iné';
    
    card.setAttribute('data-lang', lang);

    // Formátovanie čísla (napr. 12000 -> 12k)
    const stars = repo.stargazers_count > 1000 
                  ? (repo.stargazers_count / 1000).toFixed(1) + 'k' 
                  : repo.stargazers_count;

    card.innerHTML = `
        <h4><a href="${repo.html_url}" target="_blank" style="text-decoration:none; color:inherit;">${repo.name}</a></h4>
        <p>${repo.description ? repo.description.substring(0, 100) + '...' : 'Bez popisu'}</p>
        <small>
            <i class="fa-solid fa-circle" style="font-size: 8px; color: ${getLangColor(lang)}"></i> 
            ${langDisplay} • 
            <i class="fa-regular fa-star"></i> ${stars}
        </small>
    `;

    grid.appendChild(card);
}

function getLangColor(lang) {
    const colors = {
        javascript: '#f1e05a', python: '#3572A5', java: '#b07219',
        c: '#555555', 'c++': '#f34b7d', 'c#': '#178600',
        html: '#e34c26', css: '#563d7c', typescript: '#2b7489',
        php: '#4F5D95', shell: '#89e051', vue: '#41b883',
        go: '#00ADD8', rust: '#dea584', ruby: '#701516'
    };
    return colors[lang] || '#ccc';
}

/* =========================================
   7. MODAL & START
   ========================================= */
const modal = document.getElementById("contact-modal");
const btn = document.getElementById("contact-link");
const closeBtn = document.querySelector(".close-btn");

if (btn) btn.onclick = (e) => { e.preventDefault(); modal.style.display = "block"; };
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);

// SPUSTENIE
loadRepositories();