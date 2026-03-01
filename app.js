// --- Data ---
const RED_TARIFF_PRICES = {
  "Red Essential": 460,
  "Essential+": 510,
  "Red Advance": 760,
  "Advance+": 860,
  "Red Prime": 1060,
  "Prime+": 1210,
  "Red Elite": 1510,
  "Elite+": 1760,
  "Red Exclusive": 3010
};

const DSL_TARIFFS = {
  "30 * 140": 210,
  "30 * 200": 290,
  "30 * 300": 430,
  "30 * 600": 850,
  "70 * 300": 610,
  "100 * 300": 780,
  "100 * 600": 1230,
  "200 * 1T": 1760
};

const AT_HOME_TARIFFS = {
  "40 GB": 250,
  "135 GB": 450,
  "250 GB": 720,
  "400 GB": 1100
};

// DSL discount tied to the selected Red tariff (by name)
const DSL_DISCOUNT_BY_RED = {
  "Red Essential": 210,
  "Essential+": 210,
  "Red Advance": 210,
  "Advance+": 210,
  "Red Prime": 290,
  "Prime+": 290,
  "Red Elite": 430,
  "Elite+": 430,
  "Red Exclusive": 850
};

// --- Helpers ---
const formatEGP = (n) => `${n.toFixed(2)} EGP`;

// Core calculation (Red + optional DSL + optional At home)
// Red: A * 1.08 * 1.14
// DSL: max(B - discount, 0) * 1.14           (discount BEFORE VAT)
// At home: base * 1.08 * 1.14                (same taxes as Red)
// Final = Red + DSL + At home
function calcTotals({ redName, includeDSL, dslName, includeAtHome, athomeName }) {
  const A = RED_TARIFF_PRICES[redName];
  const redWithTaxes = (A * 1.08) * 1.14;

  // DSL
  let E = 0;
  let discount = 0;
  let discountedB = 0;
  if (includeDSL) {
    const B = DSL_TARIFFS[dslName];
    discount = DSL_DISCOUNT_BY_RED[redName] || 0;
    discountedB = Math.max(B - discount, 0);
    E = discountedB * 1.14;
  }

  // At home
  let H = 0;
  if (includeAtHome) {
    const base = AT_HOME_TARIFFS[athomeName];
    H = (base * 1.08) * 1.14;
  }

  const Final = redWithTaxes + E + H;

  return { E, H, Final, discount, discountedB };
}

// --- UI elements ---
const redSel = document.getElementById('red-tariff');

const dslToggle = document.getElementById('toggle-dsl');
const dslWrap = document.getElementById('dsl-wrap');
const dslSel = document.getElementById('dsl-bundle');

const atHomeToggle = document.getElementById('toggle-athome');
const atHomeWrap = document.getElementById('athome-wrap');
const atHomeSel = document.getElementById('athome-bundle');

const resultBox = document.getElementById('result');
const auditBox = document.getElementById('audit');

// --- Render logic: auto-calc with validation based on toggles ---
function render() {
  const redName = redSel.value;
  const includeDSL = dslToggle.checked;
  const includeAtHome = atHomeToggle.checked;

  // Always keep selects enabled/disabled in sync with toggles
  dslSel.disabled = !includeDSL;
  atHomeSel.disabled = !includeAtHome;

  // If Red not selected yet, clear outputs
  if (!redName) {
    resultBox.textContent = '';
    auditBox.textContent = '';
    return;
  }

  // If a toggle is ON but no bundle chosen yet, ask for it
  if (includeDSL && !dslSel.value) {
    resultBox.textContent = 'Please select a DSL bundle.';
    auditBox.textContent = '';
    return;
  }
  if (includeAtHome && !atHomeSel.value) {
    resultBox.textContent = 'Please select an At home bundle.';
    auditBox.textContent = '';
    return;
  }

  const { E, H, Final, discount, discountedB } = calcTotals({
    redName,
    includeDSL,
    dslName: dslSel.value,
    includeAtHome,
    athomeName: atHomeSel.value
  });

  // Build output
  let html = '';
  if (includeDSL) {
    html += `<div>DSL after discount and VAT: <strong>${formatEGP(E)}</strong></div>`;
  }
  html += `<div>Total of the bill: <strong>${formatEGP(Final)}</strong></div>`;
  resultBox.innerHTML = html;

  // Audit (only if DSL is included)
  if (includeDSL) {
    auditBox.textContent =
      `Audit: Discount applied = ${formatEGP(discount)} | ` +
      `DSL after discount (pre‑VAT) = ${formatEGP(discountedB)}`;
  } else {
    auditBox.textContent = '';
  }
}

// --- Toggle behaviors: show/hide and enable/disable selects ---
dslToggle.addEventListener('change', () => {
  const on = dslToggle.checked;
  dslWrap.style.display = on ? 'block' : 'none';
  dslSel.disabled = !on;
  if (!on) dslSel.selectedIndex = 0; // clear selection when turned off
  render();
});

atHomeToggle.addEventListener('change', () => {
  const on = atHomeToggle.checked;
  atHomeWrap.style.display = on ? 'block' : 'none';
  atHomeSel.disabled = !on;
  if (!on) atHomeSel.selectedIndex = 0; // clear selection when turned off
  render();
});

// Auto-calc on any selection change
redSel.addEventListener('change', render);
dslSel.addEventListener('change', render);
atHomeSel.addEventListener('change', render);

// Initial render
render();