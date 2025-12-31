/* --- 1. DARK MODE (Tmavý režim) --- */
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const icon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

// Načítanie uloženej témy
if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

/* --- 2. FILTROVANIE KARIET (Nová časť) --- */
const checkAll = document.getElementById('check-all');
const langCheckboxes = document.querySelectorAll('.lang-check');
const cards = document.querySelectorAll('.card');

// Funkcia, ktorá rozhodne, čo sa zobrazí
function filterCards() {
    // Zistíme, ktoré konkrétne jazyky sú zaškrtnuté
    const activeLangs = Array.from(langCheckboxes)
                             .filter(cb => cb.checked)
                             .map(cb => cb.value);

    // Ak je zaškrtnuté "Všetky" ALEBO nie je zaškrtnuté nič -> ukáž všetko
    if (checkAll.checked || activeLangs.length === 0) {
        cards.forEach(card => {
            card.style.display = 'block';
            // Pridáme malú animáciu (voliteľné)
            card.style.animation = 'fadeIn 0.5s'; 
        });
    } else {
        // Inak ukáž len tie, ktoré sa zhodujú
        cards.forEach(card => {
            const cardLang = card.getAttribute('data-lang');
            if (activeLangs.includes(cardLang)) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Logika pre checkbox "Všetky"
if (checkAll) {
    checkAll.addEventListener('change', () => {
        if (checkAll.checked) {
            // Ak klikneš na Všetky, odškrtni ostatné
            langCheckboxes.forEach(cb => cb.checked = false);
        }
        filterCards();
    });
}

// Logika pre konkrétne jazyky
langCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        if (cb.checked) {
            // Ak klikneš na jazyk, odškrtni "Všetky"
            checkAll.checked = false;
        }
        // Ak odškrtneš posledný jazyk, automaticky zaškrtni "Všetky"
        const anyChecked = Array.from(langCheckboxes).some(c => c.checked);
        if (!anyChecked) {
            checkAll.checked = true;
        }
        
        filterCards();
    });
});

/* --- 3. MODÁLNE OKNO (Kontakt) --- */
const modal = document.getElementById("contact-modal");
const btn = document.getElementById("contact-link");
const closeBtn = document.querySelector(".close-btn");

if (btn) btn.onclick = () => modal.style.display = "block";
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// Malý CSS trik pre animáciu pri filtrovaní (pridaj do JS dynamicky)
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);