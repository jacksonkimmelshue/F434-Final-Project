# F434 Final Project — Data Accuracy Audit

This is a step-by-step checklist for verifying that every numeric value, table,
chart, and narrative claim in `index.html` and `script.js` is faithful to the
authoritative source: **`F434_Final_Project.ipynb`** (Jupyter notebook outputs).

The audit was last run on 2026-04-27 against the uploaded notebook
`F434_Final_Project (1).ipynb`. The status column records the result of that run.

---

## How to re-run this audit

1. Open the notebook in Jupyter or Colab.
2. Run all cells top-to-bottom against the same data files
   (`PE_Quarterly_Returns.xlsx`, `PE_Fundraising.xlsx`,
   `master_data_1995_2020.csv`).
3. For each row in the checklist below, copy the figure printed by the notebook
   and compare to the value rendered in `index.html` / encoded in `script.js`.
4. Tick the box if they agree to the displayed precision; write a note if they
   do not. Treat anything in the notebook itself as the source of truth — fix
   the website, not the notebook output.

---

## 1 · Data shape & coverage

- [x] Notebook cell 6 reports "102 quarters × 9 variables, 1995 Q1 – 2020 Q2".
      `index.html` Methodology and Data sections both quote 102 quarters and the
      same date range.
- [x] `script.js` `QUARTERS` constant generates 102 labels from 1995Q1 to 2020Q2
      (verified by counting the array length).
- [x] HY-spread coverage = 95/102 (93%). `index.html` Limitations card and
      Descriptive table both report N=95 for HY spread.

## 2 · Descriptive statistics (notebook cell 7)

For each row, compare `index.html` lines 213–286 against cell 7 output.

- [x] PE Return: mean 3.46, sd 5.17, min &minus;16.08, max 18.17, n 102.
- [x] PE Fundraising ($B): mean 79.70, sd 52.29, min 8.00, max 224.00, n 102.
- [x] Market Excess Return: notebook is in **decimal**
      (mean 0.00712, sd 0.029124); `index.html` displays in **percent** (0.71,
      2.91). The conversion is correct but should stay flagged as a unit
      transformation, not a notebook number.
- [x] HY Spread: mean 5.53, sd 2.63, min 2.62, max 17.69, n 95.
- [x] VIX: mean 19.89, sd 7.61, min 10.31, max 58.60, n 102.
- [x] Risk-Free Rate (notebook decimal → website percent): mean 0.001886 →
      0.19%; sd 0.001766 → 0.18%; max 0.005233 → 0.52%.
- [x] 10Y Rate: mean 3.90, sd 1.59, min 0.69, max 7.47.
- [x] Fed Funds: mean 2.47, sd 2.24, min 0.06, max 6.52.

## 3 · Correlation matrix (cell 7)

- [x] PE_Return ↔ Market excess return = 0.782 (`index.html` line 291).
- [x] PE_Return ↔ PE_Fundraising = &minus;0.155.
- [x] PE_Fundraising ↔ rate_10y = &minus;0.567.
- [x] HY spread ↔ VIX = 0.803.
- [x] Risk-free ↔ Fed funds = 0.997.
- [x] Scatter slope = &minus;0.023, ρ = &minus;0.232 (line 363).

## 4 · Phase 2 OLS (cell 8) · sample n = 92

The notebook's `y` is `PE_Return.shift(-1)` (next-quarter return).

- [x] M1 univariate: β = &minus;0.0193, R² = 0.0334.
- [x] M2 + market/HY/VIX: β = &minus;0.0132, R² = 0.1439.
- [x] M3a fundraising lag-1: β = &minus;0.0111, R² = 0.1402.
- [x] M3b fundraising lag-2: β = &minus;0.0100, R² = 0.1388.
- [x] M4 all lags: β = &minus;0.0122, R² = 0.1446.
- [x] Sample size annotated as 92 in the Phase 2 lead sentence.

## 5 · Phase 3 Granger (cell 9)

- [x] Fund → Returns F-stats: 3.8844 / 1.8667 / 1.1794 / 0.7752 at lags 1–4.
- [x] Fund → Returns p-values: 0.0516 / 0.1603 / 0.3220 / 0.5442.
- [x] Returns → Fund F-stats: 0.1686 / 7.4621 / 4.6599 / 4.3692.
- [x] Returns → Fund p-values: 0.6822 / 0.0010 / 0.0045 / 0.0028.
- [x] 5% F-critical line on the chart = 3.84 (matches `gCritical` in
      `script.js`).
- [x] Verbal verdict — "marginal at lag 1, ns elsewhere" for fund → ret;
      "significant at lags 2/3/4" for ret → fund — agrees with notebook
      `*` annotations.

## 6 · Phase 4 VAR (cell 10) · n = 102, lag = 2

- [x] PE_Return equation: const 3.571 (p 0.001); L1.PE_Return 0.202 (p 0.049);
      L1.PE_Fundraising &minus;0.0138 (p 0.361); L2.PE_Return 0.207 (p 0.048);
      L2.PE_Fundraising &minus;0.0055 (p 0.716).
- [x] PE_Fundraising equation: const &minus;0.36 (p 0.950); L1.PE_Return 0.359
      (p 0.504); L1.PE_Fundraising 0.312 (p 0.000); L2.PE_Return 1.850
      (p 0.001); L2.PE_Fundraising 0.612 (p 0.000).
- [x] IRF Q0–Q8: 0, &minus;0.013754, &minus;0.012594, &minus;0.016808,
      &minus;0.015135, &minus;0.015805, &minus;0.014143, &minus;0.013575,
      &minus;0.012119 (matches the `irf` array in `script.js`).
- [x] Cumulative IRF Q8 = &minus;0.113932; rounded to &minus;0.114% in the
      caption — agrees.

## 7 · Phase 5 Markov (cell 11) · n = 102

The notebook's printed labels for the two regimes are economically reversed
(it calls the 17-obs −4.14% mean state "Normal" and the 85-obs +4.98% mean
state "Crisis"). The website corrects this by using "Crisis" for the 17-obs
state and "Normal" for the 85-obs state. The underlying numerical parameters
are unchanged. **Keep this correction; do not match the notebook's mislabel.**

The notebook's "REGIME-SPECIFIC FUNDRAISING EFFECTS" block prints
0.0542 / 7.1370 / 131.63x; these are pulled from the wrong indices of
`result.params` (transition probability and a regime constant, not the
exogenous-variable slope). The actual regime-specific slopes from the model
summary are &minus;0.0801 (regime 0) and &minus;0.0255 (regime 1). **The
website uses the correct slopes; do not regress to the buggy print.**

- [x] Regime-0 (Crisis, 17 obs): mean return &minus;4.14%, sd 4.68,
      mean fundraising $53.5B (notebook prints $53.53B).
- [x] Regime-1 (Normal, 85 obs): mean return +4.98%, sd 3.68,
      mean fundraising $84.9B (notebook prints $84.93B).
- [x] Crisis β on fundraising = &minus;0.0801 (rounded &minus;0.080), p 0.000.
- [x] Normal β on fundraising = &minus;0.0255 (rounded &minus;0.026), p 0.001.
- [x] Crisis-vs-Normal β ratio ≈ 3× (&minus;0.0801 / &minus;0.0255 = 3.14).
- [x] Smoothed P(Crisis) array `P_CRISIS` in `script.js` has 102 entries; 17
      of them exceed 0.5 — matches the regime-membership count.

## 8 · Phase 6 DMD / HP (cells 12 and 13)

- [x] Hankel DMD with d = 24 quarters, rank 12, 2 modes in 4–10 yr band
      (cell 12 & cell 13).
- [x] Dominant DMD mode period = 6.94 yrs, amplitude 8.8949.
- [x] DMD-reconstructed cycle correlation with returns = 0.3759 (cell 13).
- [x] HP filter (λ = 1600) trend mean 3.20%, sd 1.18% (cell 12: 3.2030 /
      1.1793).
- [x] HP filter cycle mean 0.26%, sd 4.78%, ρ(returns) = 0.9745 (cell 12).
- [x] `script.js` `CAP_CYCLE` array reproduces the HP cycle to four decimals
      (re-derived independently and bit-for-bit identical, including the
      endpoint 0.0 at 2020Q2 — that zero is a known endpoint artefact of the
      two-sided HP equation system, not a placeholder).

## 9 · Embedded data arrays in `script.js`

These were verified by computation, not just transcription.

- [x] `PE_RETURN`: 102 values, mean 3.4609, sd 5.146 (population), min
      &minus;16.08, max 18.17 — matches notebook.
- [x] `CAP_CYCLE`: 102 values, mean 0.2579, sd 4.7788, ρ(returns) 0.9745 —
      matches the HP-filter formula in cell 12 exactly.
- [x] `P_CRISIS`: 102 values, 17 above 0.5 — matches Markov regime membership.
- [x] `RECESSION_BANDS`: dot-com 2001Q1–Q4, GFC 2007Q4–2009Q2, COVID
      2020Q1–Q2 — these are conventional NBER-aligned dates used for shading
      only; not numerical claims.

## 10 · Narrative claims that should be checked separately

These are interpretations on top of the notebook output. They were rewritten
during this audit so that the page does not state more than the notebook
supports.

- [x] **GP card in "Why It Matters"** — previously claimed a "1–2 percentage
      points on the resulting fund's IRR" structural drag. The notebook does
      not contain fund-level IRR data; rewritten to point at the per-$1B
      quarterly-return effect (≈ &minus;0.014% per $1B in the VAR) plus the
      regime-amplification factor.
- [x] **VAR caption** — previously claimed a "0.5–1.0% structural shave on
      vintage IRR". The IRF unit is per-quarter percentage point on aggregate
      returns; the IRR translation is not in the notebook. Rewritten to keep
      the &minus;0.114% cumulative number and describe the swing in
      quarterly-return units.
- [x] **LP allocator callout in Findings** — previously claimed "2007 vintage
      printed below trend; 2009–2010 vintages printed above trend". The
      notebook has no vintage-year fund data. Rewritten as an
      explicitly-aggregate-level statement and a parenthetical that
      vintage-year claims are outside the data's scope.
- [x] **Conclusion lead sentence** — previously called the structural drag a
      "drag on subsequent vintage IRRs". Rewritten to "drag on subsequent
      quarterly aggregate returns" and the regime-amplification claim made
      precise (β &minus;0.080 vs &minus;0.026).

## 11 · Wiring / rendering checks

- [x] Every TOC anchor (`#intro`, `#question`, `#why`, `#methodology`, `#data`,
      `#ols`, `#granger`, `#var`, `#markov`, `#cycles`, `#findings`,
      `#limitations`, `#conclusion`) resolves to a section ID in `index.html`.
- [x] Every `<canvas>` ID has a matching Chart.js instantiation in `script.js`
      (`ch_ols_coef`, `ch_ols_r2`, `ch_g1`, `ch_g2`, `ch_irf`, `ch_irf_cum`,
      `ch_regime_prob`, `ch_regime_beta`, `ch_cycle`).
- [x] Chart.js 4.4.1 CDN script is loaded in `<head>`; the imported chart
      block runs inside the existing `DOMContentLoaded` listener and is
      guarded by `typeof Chart === 'undefined'`.

## 12 · Final smoke test (re-run after any edit)

- [ ] Open `index.html` in a browser; confirm no console errors, all 9
      Chart.js charts render, and the existing Plotly heatmap/timeseries/scatter
      still render in the Data section.
- [ ] Spot-check a representative number from each phase against the open
      notebook tab (e.g. Granger lag-2 ret→fund F = 7.4621; VAR L2.PE_Return
      coef on fundraising = 1.850; HP cycle ρ(returns) = 0.9745).
- [ ] If the notebook is re-run on updated data, walk steps 1–11 again and tick
      every box that still holds; revise this file with new authoritative
      values where it does not.
