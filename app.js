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

// Determine if Red tier is Essential/Advance family
const isEssentialAdvanceTier = (redName) =>
  redName === "Red Essential" || redName === "Essential+" ||
  redName === "Red Advance"   || redName === "Advance+";

// At home discount rules:
// - If DSL OFF  -> 250 (Essential/Advance tiers) else 450 (others)
// - If DSL ON   -> 450 ONLY for "Red Exclusive", otherwise 0
function getAtHomeDiscount(redName, includeDSL) {
  if (!includeDSL) {
    return isEssentialAdvanceTier(redName) ? 250 : 450;
  }
  // DSL is ON
  return redName === "Red Exclusive" ? 450 : 0;
}

// Core calculation (Red + optional DSL + optional At home)
// Red:  base × 1.08 × 1.14
// DSL:  preVAT = max(base - dslDiscount, 0); postVAT = preVAT × 1.14
// Home: preTaxes = max(base - atHomeDiscount, 0); postTaxes = preTaxes × 1.08 × 1.14
// Total = Red_postTaxes + DSL_postVAT + Home_postTaxes
function calcTotals({ redName, includeDSL, dslName, includeAtHome, athomeName }) {
  const redBase = RED_TARIFF_PRICES[redName];
  const redPostTaxes = (redBase * 1.08) * 1.14;

  // DSL
  let dslPreVAT = 0;
  let dslPostVAT = 0;
  if (includeDSL) {
    const dslBase = DSL_TARIFFS[dslName];
    const dslDiscount = DSL_DISCOUNT_BY_RED[redName] || 0;
    dslPreVAT = Math.max(dslBase - dslDiscount, 0);
    dslPostVAT = dslPreVAT * 1.14;
  }

  // At home
  let homePreTaxes = 0;
  let homePostTaxes = 0;
  if (includeAtHome) {
    const homeBase = AT_HOME_TARIFFS[athomeName];
    const atHomeDiscount = getAtHomeDiscount(redName, includeDSL);
    homePreTaxes = Math.max(homeBase - atHomeDiscount, 0);
    homePostTaxes = (homePreTaxes * 1.08) * 1.14;
  }

  const total = redPostTaxes + dslPostVAT + homePostTaxes;

  return {
    redPostTaxes,
    dslPreVAT, dslPostVAT,
    homePreTaxes, homePostTaxes,
    total
  };
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

// --- Render logic: auto-calc with validation based on toggles ---
function render() {
  const redName = redSel.value;
  const includeDSL = dslToggle.checked;
  const includeAtHome = atHomeToggle.checked;

  // Keep selects enabled/disabled in sync with toggles
  dslSel.disabled = !includeDSL;
  atHomeSel.disabled = !includeAtHome;

  // If Red not selected yet, clear outputs
  if (!redName) {
    resultBox.textContent = '';
    return;
  }

  // If a toggle is ON but no bundle chosen yet, ask for it
  if (includeDSL && !dslSel.value) {
    resultBox.textContent = 'Please select a DSL bundle.';
    return;
  }
  if (includeAtHome && !atHomeSel.value) {
    resultBox.textContent = 'Please select an At home bundle.';
    return;
  }

  const {
    dslPreVAT, dslPostVAT,
    homePreTaxes, homePostTaxes,
    total
  } = calcTotals({
    redName,
    includeDSL, dslName: dslSel.value,
    includeAtHome, athomeName: atHomeSel.value
  });

  // Build output:
  // - DSL line shown only if DSL is ON
  // - At home line shown only if At home is ON
  // - Total always shown (when inputs valid)
  let html = '';

  if (includeDSL) {
    html += `
      <div>
        DSL (after discount) — pre‑VAT: <strong>${formatEGP(dslPreVAT)}</strong>,
        after VAT: <strong>${formatEGP(dslPostVAT)}</strong>
      </div>
    `;
  }

  if (includeAtHome) {
    html += `
      <div>
        At home (after discount) — pre‑taxes: <strong>${formatEGP(homePreTaxes)}</strong>,
        after taxes: <strong>${formatEGP(homePostTaxes)}</strong>
      </div>
    `;
  }

  html += `<div class="final-total">Total of the bill: <strong class="final-number">${formatEGP(total)}</strong></div>`;

  resultBox.innerHTML = html;
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