// 1. Nájdeme všetky potrebné veci na stránke
const checkAll = document.getElementById('check-all'); // Checkbox "Všetky"
const checkboxes = document.querySelectorAll('.lang-check'); // Ostatné checkboxy
const cards = document.querySelectorAll('.card'); // Všetky karty

// 2. Čo sa stane, keď klikneš na "Všetky"
checkAll.addEventListener('change', function() {
    if (this.checked) {
        // Ak zapneš "Všetky", vypni ostatné checkboxy
        checkboxes.forEach(box => box.checked = false);
    }
    filtrovatKarty(); // Spusti filtrovanie
});

// 3. Čo sa stane, keď klikneš na konkrétny jazyk
checkboxes.forEach(box => {
    box.addEventListener('change', function() {
        // Ak zapneš nejaký jazyk, vypni "Všetky"
        if (this.checked) {
            checkAll.checked = false;
        }
        
        // Ak vypneš všetky jazyky, automaticky zapni "Všetky"
        let asponJedenZapnuty = false;
        checkboxes.forEach(b => {
            if (b.checked) asponJedenZapnuty = true;
        });

        if (asponJedenZapnuty === false) {
            checkAll.checked = true;
        }

        filtrovatKarty(); // Spusti filtrovanie
    });
});

// 4. Hlavná funkcia na skrývanie/zobrazovanie kariet
function filtrovatKarty() {
    // Zistíme, ktoré jazyky sú zaškrtnuté
    const vybraneJazyky = [];
    
    checkboxes.forEach(box => {
        if (box.checked) {
            vybraneJazyky.push(box.value);
        }
    });

    // Prejdeme každú kartu a rozhodneme, či ju ukážeme
    cards.forEach(card => {
        const jazykKarty = card.getAttribute('data-jazyk');

        // Ak je zapnuté "Všetky" ALEBO ak jazyk karty je v zozname vybraných
        if (checkAll.checked || vybraneJazyky.includes(jazykKarty)) {
            card.style.display = 'block'; // Ukáž kartu
        } else {
            card.style.display = 'none';  // Skry kartu
        }
    });
}