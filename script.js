// --- Pôvodný kód pre modálne okno a filtre (ak ho máš) ---
// Sem patrí tvoj existujúci JavaScript pre funkčnosť stránky.
// Pre stručnosť tu uvádzam len nový kód pre Dark Mode.

// --- DARK MODE FUNKCIONALITA ---
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const icon = darkModeToggle.querySelector('i');

// Skontrolujeme, či má používateľ uloženú preferenciu
const isDarkMode = localStorage.getItem('darkMode') === 'enabled';

// Ak áno, zapneme tmavý režim hneď pri načítaní
if (isDarkMode) {
    body.classList.add('dark-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

// Prepínanie režimu po kliknutí na tlačidlo
darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // Zmena ikony (mesiac <-> slnko)
    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'enabled'); // Uložíme voľbu
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'disabled'); // Uložíme voľbu
    }
});

// --- Príklad pôvodného JS pre modálne okno (aby ti fungovalo) ---
const modal = document.getElementById("contact-modal");
const btn = document.getElementById("contact-link");
const span = document.getElementsByClassName("close-btn")[0];

if (btn) {
    btn.onclick = function() { modal.style.display = "block"; }
}
if (span) {
    span.onclick = function() { modal.style.display = "none"; }
}
window.onclick = function(event) {
    if (event.target == modal) { modal.style.display = "none"; }
}