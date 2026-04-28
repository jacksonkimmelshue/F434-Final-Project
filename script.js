/* =====================================================
   DENOMINATOR EFFECT REPORT - JAVASCRIPT
   ===================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize syntax highlighting
    document.querySelectorAll('.code-block code').forEach(block => {
        hljs.highlightElement(block);
    });

    // ==================== APPENDIX VIEW TOGGLE ====================
    // The Appendix is rendered as a separate "page". The main-report sections
    // and the page header are hidden whenever body.appendix-mode is set.
    // Clicking the sidebar Appendix link enters that mode; clicking any other
    // sidebar link exits it and scrolls back to the chosen main-report anchor.
    const body = document.body;

    function enterAppendixMode() {
        if (body.classList.contains('appendix-mode')) return;
        body.classList.add('appendix-mode');
        // Charts that were created while hidden need an explicit resize to
        // compute correct dimensions on first reveal.
        setTimeout(() => {
            if (typeof Chart !== 'undefined' && Chart.instances) {
                Object.values(Chart.instances).forEach(c => {
                    try { c.resize(); } catch (err) {}
                });
            }
            window.scrollTo({ top: 0, behavior: 'auto' });
        }, 60);
    }

    function exitAppendixMode() {
        body.classList.remove('appendix-mode');
    }

    document.querySelectorAll('.toc a').forEach(link => {
        link.addEventListener('click', function(e) {
            const isAppendix = link.classList.contains('appendix-link');
            if (isAppendix) {
                e.preventDefault();
                enterAppendixMode();
            } else if (body.classList.contains('appendix-mode')) {
                // Coming back to the main report from the appendix view.
                e.preventDefault();
                exitAppendixMode();
                const targetSel = link.getAttribute('href');
                setTimeout(() => {
                    const tgt = document.querySelector(targetSel);
                    if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 30);
            }
            // else: default in-page anchor scroll handles main-report navigation.
        });
    });

    // Deep links: loading the page with an appendix anchor opens the
    // appendix view directly.
    const appendixHashes = ['#appendix', '#markov', '#cycles'];
    if (appendixHashes.includes(window.location.hash)) {
        enterAppendixMode();
    }

    // ==================== CORRELATION MATRIX ====================
    // Custom CSS-grid heatmap.
    //   - Diverging blue-red color scale (matches the rest of the report).
    //   - Lower-triangle only; mirrored values in the upper triangle are
    //     intentionally blank.
    //   - Column labels render at the BOTTOM of the grid; row labels on the
    //     left. A vertical legend bar runs the full height of the grid via a
    //     flex sibling element styled in styles.css.
    // Variable names match the data-table presentation order so the matrix
    // labels and the data table read the same way.
    const corrLabels = [
        'PE Returns',
        'PE Fundraising',
        'Market Excess Return',
        'HY Spread',
        'VIX',
        'Risk-Free Rate',
        '10Y Rate',
        'Fed Funds Rate'
    ];
    const corrMatrix = [
      // PE Ret, PE Fund, MktExc, HY Spr, VIX,    RF,     10Y,    FedFnd
      [  1.000, -0.155,  0.782, -0.526, -0.492,  0.158,  0.188,  0.169 ], // PE Returns
      [ -0.155,  1.000, -0.134, -0.051, -0.127, -0.326, -0.567, -0.319 ], // PE Fundraising
      [  0.782, -0.134,  1.000, -0.263, -0.353, -0.065, -0.028, -0.055 ], // Market Excess Return
      [ -0.526, -0.051, -0.263,  1.000,  0.803, -0.292, -0.130, -0.294 ], // HY Spread
      [ -0.492, -0.127, -0.353,  0.803,  1.000, -0.057,  0.024, -0.058 ], // VIX
      [  0.158, -0.326, -0.065, -0.292, -0.057,  1.000,  0.859,  0.997 ], // Risk-Free Rate
      [  0.188, -0.567, -0.028, -0.130,  0.024,  0.859,  1.000,  0.860 ], // 10Y Rate
      [  0.169, -0.319, -0.055, -0.294, -0.058,  0.997,  0.860,  1.000 ]  // Fed Funds Rate
    ];

    function corrColor(v){
        // Diverging blue-red scale that matches the rest of the report's
        // chart palette (primary blue + warm-red accents).
        //   v = +1 -> dark blue   (#1937b4)
        //   v =  0 -> white       (#ffffff)
        //   v = -1 -> dark red    (#b22222)
        const m = Math.min(1, Math.abs(v));
        let r, g, b;
        if (v >= 0) {
            // White -> dark blue
            r = Math.round(255 + (25  - 255) * m);
            g = Math.round(255 + (55  - 255) * m);
            b = Math.round(255 + (180 - 255) * m);
        } else {
            // White -> dark red
            r = Math.round(255 + (178 - 255) * m);
            g = Math.round(255 + (34  - 255) * m);
            b = Math.round(255 + (34  - 255) * m);
        }
        return `rgb(${r},${g},${b})`;
    }

    (function buildHeatmap(){
        const root = document.getElementById('heatmap');
        if (!root) return;
        const n = corrLabels.length;
        root.style.gridTemplateColumns = `auto repeat(${n}, 1fr)`;

        // Single shared tooltip element (created once, reused on every hover).
        let tooltip = document.getElementById('heatmap-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'heatmap-tooltip';
            tooltip.className = 'heatmap-tooltip';
            document.body.appendChild(tooltip);
        }
        function showTooltip(e, rowLabel, colLabel, v){
            tooltip.innerHTML =
                `<div class="tt-row"><strong>${rowLabel}</strong> &times; <strong>${colLabel}</strong></div>` +
                `<div class="tt-row">Correlation: <strong>${v.toFixed(3)}</strong></div>`;
            tooltip.style.opacity = '1';
            moveTooltip(e);
        }
        function moveTooltip(e){
            // Offset so the tooltip doesn't sit under the cursor.
            const pad = 14;
            tooltip.style.left = (e.pageX + pad) + 'px';
            tooltip.style.top  = (e.pageY + pad) + 'px';
        }
        function hideTooltip(){
            tooltip.style.opacity = '0';
        }

        // Body rows: row label (left) + lower-triangle data cells.
        // The upper triangle is left blank so duplicate / mirrored values
        // are not displayed.
        for (let i = 0; i < n; i++){
            const row = document.createElement('div');
            row.className = 'hcell hhead';
            row.textContent = corrLabels[i];
            root.appendChild(row);
            for (let j = 0; j < n; j++){
                const c = document.createElement('div');
                if (j > i) {
                    // Upper triangle: blank cell (no value, no fill).
                    c.className = 'hcell hempty';
                } else {
                    const v = corrMatrix[i][j];
                    c.className = 'hcell';
                    c.style.background = corrColor(v);
                    // Flip text color on darker (high-magnitude) cells for
                    // legibility against the saturated blue / red.
                    c.style.color = Math.abs(v) > 0.55 ? '#fff' : '#000';
                    c.textContent = v.toFixed(2);
                    // Hover interactivity: row × column + correlation.
                    const rowLabel = corrLabels[i];
                    const colLabel = corrLabels[j];
                    c.addEventListener('mouseenter', (e) => showTooltip(e, rowLabel, colLabel, v));
                    c.addEventListener('mousemove', moveTooltip);
                    c.addEventListener('mouseleave', hideTooltip);
                }
                root.appendChild(c);
            }
        }

        // Bottom header row: empty corner cell + column labels.
        const empty = document.createElement('div');
        empty.className = 'hcell hhead';
        root.appendChild(empty);
        corrLabels.forEach(l => {
            const c = document.createElement('div');
            c.className = 'hcell hhead';
            c.textContent = l;
            root.appendChild(c);
        });
    })();

    // ==================== TIME SERIES CHART ====================
    const quarters = ["1995Q1", "1995Q2", "1995Q3", "1995Q4", "1996Q1", "1996Q2", "1996Q3", "1996Q4", "1997Q1", "1997Q2", "1997Q3", "1997Q4", "1998Q1", "1998Q2", "1998Q3", "1998Q4", "1999Q1", "1999Q2", "1999Q3", "1999Q4", "2000Q1", "2000Q2", "2000Q3", "2000Q4", "2001Q1", "2001Q2", "2001Q3", "2001Q4", "2002Q1", "2002Q2", "2002Q3", "2002Q4", "2003Q1", "2003Q2", "2003Q3", "2003Q4", "2004Q1", "2004Q2", "2004Q3", "2004Q4", "2005Q1", "2005Q2", "2005Q3", "2005Q4", "2006Q1", "2006Q2", "2006Q3", "2006Q4", "2007Q1", "2007Q2", "2007Q3", "2007Q4", "2008Q1", "2008Q2", "2008Q3", "2008Q4", "2009Q1", "2009Q2", "2009Q3", "2009Q4", "2010Q1", "2010Q2", "2010Q3", "2010Q4", "2011Q1", "2011Q2", "2011Q3", "2011Q4", "2012Q1", "2012Q2", "2012Q3", "2012Q4", "2013Q1", "2013Q2", "2013Q3", "2013Q4", "2014Q1", "2014Q2", "2014Q3", "2014Q4", "2015Q1", "2015Q2", "2015Q3", "2015Q4", "2016Q1", "2016Q2", "2016Q3", "2016Q4", "2017Q1", "2017Q2", "2017Q3", "2017Q4", "2018Q1", "2018Q2", "2018Q3", "2018Q4", "2019Q1", "2019Q2", "2019Q3", "2019Q4", "2020Q1", "2020Q2"];
    
    const peReturns = [3.94, 4.17, 4.4, 10.36, 6.05, 6.56, 6.44, 7.19, 0.96, 11.12, 7.86, 8.53, 9.77, 4.98, -6.67, 7.52, 4.2, 10.29, 3.52, 18.17, 13.7, -1.34, -0.06, -6.31, -6.14, 3.33, -9.09, 0.2, -0.4, -2.69, -4.86, 0.12, -0.34, 7.02, 5.25, 9.45, 2.78, 3.46, 2.3, 15.2, 1.31, 9.1, 7.59, 8.06, 5.56, 4.12, 3.78, 12.66, 5.85, 7.6, 1.09, 3.22, -2.2, 0.85, -6.7, -16.08, -3.34, 4.52, 5.78, 6.15, 4.45, 1.7, 5.11, 9.15, 5.21, 4.73, -4.18, 5.35, 5.51, -0.11, 3.71, 3.8, 4.61, 3.19, 5.19, 7.01, 3.13, 5.53, 0.83, 1.46, 2.62, 3.91, -1.45, 0.5, 0.0, 4.09, 4.03, 4.66, 4.01, 3.72, 3.96, 5.22, 2.79, 5.3, 3.82, -1.97, 4.84, 3.38, 1.25, 3.75, -10.09, 9.43];
    
    const peFundraising = [12, 12, 12, 12, 8, 8, 8, 8, 18, 18, 18, 18, 27, 27, 27, 27, 34, 34, 34, 34, 52, 52, 52, 52, 34, 34, 34, 34, 25, 25, 25, 25, 22, 21, 19, 38, 55, 51, 48, 51, 63, 94, 80, 109, 122, 140, 149, 126, 123, 205, 122, 195, 173, 212, 128, 172, 79, 95, 59, 87, 77, 66, 84, 70, 76, 95, 66, 95, 86, 95, 83, 118, 55, 88, 64, 119, 72, 139, 74, 132, 77, 90, 78, 141, 117, 146, 77, 128, 132, 156, 143, 116, 91, 96, 121, 224, 122, 143, 181, 133, 90, 95];

    const barTrace = {
        x: quarters,
        y: peFundraising,
        name: 'PE Fundraising ($B)',
        type: 'bar',
        marker: { color: 'rgba(100, 150, 220, 0.6)' },
        yaxis: 'y1'
    };

    const lineTrace = {
        x: quarters,
        y: peReturns,
        name: 'PE Returns (%)',
        type: 'scatter',
        mode: 'lines',
        line: { color: 'rgba(178, 34, 34, 0.8)', width: 2.5 },
        yaxis: 'y2'
    };

    const timeSeriesLayout = {
        title: 'PE Fundraising & Returns Over Time (1995-2020)',
        titlefont: { size: 18, color: '#000000', family: "'Cambria', 'Georgia', serif" },
        xaxis: {
            title: 'Year',
            tickmode: 'array',
            tickvals: ['1995Q1','1996Q1','1997Q1','1998Q1','1999Q1','2000Q1','2001Q1','2002Q1','2003Q1','2004Q1','2005Q1','2006Q1','2007Q1','2008Q1','2009Q1','2010Q1','2011Q1','2012Q1','2013Q1','2014Q1','2015Q1','2016Q1','2017Q1','2018Q1','2019Q1','2020Q1'],
            ticktext: ['1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020'],
            tickangle: -45,
            tickfont: { size: 11 },
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: 'PE Fundraising ($B)',
            titlefont: { color: 'rgba(100, 150, 220, 0.8)' },
            tickfont: { color: 'rgba(100, 150, 220, 0.8)', size: 10 },
            zeroline: false,
            showline: false
        },
        yaxis2: {
            title: 'PE Returns (%)',
            titlefont: { color: 'rgba(178, 34, 34, 0.8)' },
            tickfont: { color: 'rgba(178, 34, 34, 0.8)', size: 10 },
            overlaying: 'y',
            side: 'right',
            zeroline: true,
            zerolinewidth: 1,
            zerolinecolor: 'rgba(200, 200, 200, 0.3)'
        },
        width: 1100,
        height: 640,
        margin: { bottom: 150, left: 100, top: 80, right: 100 },
        shapes: [
            { type: 'rect', xref: 'x', yref: 'paper', x0: '2001Q1', x1: '2001Q4', y0: 0, y1: 1, fillcolor: 'rgba(120,120,120,0.18)', line: { width: 0 }, layer: 'below' },
            { type: 'rect', xref: 'x', yref: 'paper', x0: '2007Q4', x1: '2009Q2', y0: 0, y1: 1, fillcolor: 'rgba(120,120,120,0.18)', line: { width: 0 }, layer: 'below' },
            { type: 'rect', xref: 'x', yref: 'paper', x0: '2020Q1', x1: '2020Q2', y0: 0, y1: 1, fillcolor: 'rgba(120,120,120,0.18)', line: { width: 0 }, layer: 'below' }
        ],
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: "'Cambria', 'Georgia', serif", size: 11 },
        hovermode: 'x unified',
        legend: { x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
        automargin: true
    };

    Plotly.newPlot('timeseries-chart', [barTrace, lineTrace], timeSeriesLayout, { responsive: true, displayModeBar: false });

    // ==================== SCATTER PLOT: FUNDRAISING(t) VS RETURN(t+1) ====================
    // Lag returns one quarter forward to match the prose and the notebook's
    // np.polyfit(PE_Fundraising, PE_Return.shift(-1)) construction.
    const scatterX = peFundraising.slice(0, -1);
    const scatterY = peReturns.slice(1);

    // Calculate trend line (simple linear regression) on lagged pairs
    const n = scatterX.length;
    const sumX = scatterX.reduce((a, b) => a + b, 0);
    const sumY = scatterY.reduce((a, b) => a + b, 0);
    const sumXY = scatterX.reduce((sum, x, i) => sum + x * scatterY[i], 0);
    const sumX2 = scatterX.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = scatterY.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const corrLagged = (n * sumXY - sumX * sumY) /
        Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const trendLineX = [Math.min(...scatterX), Math.max(...scatterX)];
    const trendLineY = trendLineX.map(x => slope * x + intercept);

    const scatterTrace = {
        x: scatterX,
        y: scatterY,
        mode: 'markers',
        type: 'scatter',
        name: 'Observations',
        marker: {
            size: 8,
            color: 'rgba(100, 150, 220, 0.7)',
            line: { color: 'rgba(100, 150, 220, 1)', width: 1 }
        },
        hovertemplate: 'Fundraising: $%{x:.1f}B<br>Returns: %{y:.2f}%<extra></extra>'
    };

    const trendTrace = {
        x: trendLineX,
        y: trendLineY,
        mode: 'lines',
        type: 'scatter',
        name: `Trend (slope=${slope.toFixed(4)})`,
        line: {
            color: 'rgba(178, 34, 34, 0.8)',
            width: 2.5
        },
        hoverinfo: 'skip'
    };

    const scatterLayout = {
        title: `Fundraising Predicts Returns? (Corr: ${corrLagged.toFixed(3)})`,
        xaxis: {
            title: 'PE Fundraising (t) [$Bn]',
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: 'PE Return (t+1) [%]',
            showgrid: true,
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinewidth: 1,
            zerolinecolor: 'rgba(200, 200, 200, 0.5)'
        },
        height: 600,
        margin: { bottom: 100, left: 100, top: 80, right: 100 },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: "'Cambria', 'Georgia', serif", size: 11 },
        hovermode: 'closest',
        legend: { x: 0.02, y: 0.98 }
    };

    Plotly.newPlot('scatter-chart', [scatterTrace, trendTrace], scatterLayout, { responsive: true, displayModeBar: false });

    // Force responsive sizing on the centered scatter plot so it fits its
    // max-width container on initial render (rather than waiting for resize).
    setTimeout(() => {
        const el = document.getElementById('scatter-chart');
        if (el && typeof Plotly !== 'undefined') {
            try { Plotly.Plots.resize(el); } catch (err) {}
        }
    }, 0);

    // ==================== SMOOTH SCROLL & CODE BLOCKS ====================
    
    // Add smooth scroll behavior for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Add "Copy Code" button to code blocks
    document.querySelectorAll('.code-block pre').forEach(pre => {
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.textContent = '📋 Copy';
        button.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background-color: #444;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10;
        `;

        pre.style.position = 'relative';
        pre.appendChild(button);

        button.addEventListener('click', function() {
            const code = pre.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.textContent = '✅ Copied!';
                setTimeout(() => {
                    button.textContent = '📋 Copy';
                }, 2000);
            });
        });
    });

    console.log('Page loaded and interactive elements initialized.');

    // ============================================================
    // IMPORTED CHARTS (Chart.js) — Phases 2–6
    // OLS coefficients, OLS R², Granger F-stats, VAR IRF + cumulative,
    // Markov regime probability, regime β, capital cycle vs returns.
    // ============================================================
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not available — skipping imported chart rendering.');
        return;
    }

    // ---- Embedded data (verbatim from F434_Final_Project notebook outputs) ----
    const QUARTERS = (function () {
        const out = [];
        for (let y = 1995; y <= 2020; y++) {
            for (let q = 1; q <= 4; q++) {
                if (y === 2020 && q > 2) break;
                out.push(y + 'Q' + q);
            }
        }
        return out; // 102 quarters
    })();

    const PE_RETURN = [3.94,4.17,4.4,10.36,6.05,6.56,6.44,7.19,0.96,11.12,7.86,8.53,9.77,4.98,-6.67,7.52,4.2,10.29,3.52,18.17,13.7,-1.34,-0.06,-6.31,-6.14,3.33,-9.09,0.2,-0.4,-2.69,-4.86,0.12,-0.34,7.02,5.25,9.45,2.78,3.46,2.3,15.2,1.31,9.1,7.59,8.06,5.56,4.12,3.78,12.66,5.85,7.6,1.09,3.22,-2.2,0.85,-6.7,-16.08,-3.34,4.52,5.78,6.15,4.45,1.7,5.11,9.15,5.21,4.73,-4.18,5.35,5.51,-0.11,3.71,3.8,4.61,3.19,5.19,7.01,3.13,5.53,0.83,1.46,2.62,3.91,-1.45,0.5,0.0,4.09,4.03,4.66,4.01,3.72,3.96,5.22,2.79,5.3,3.82,-1.97,4.84,3.38,1.25,3.75,-10.09,9.43];

    const CAP_CYCLE = [3.2428,2.7921,2.3722,7.7259,2.8643,2.8837,2.3388,2.7323,-3.7845,6.1581,2.7519,3.3452,4.5742,-0.1667,-11.7161,2.6176,-0.5167,5.7982,-0.7102,14.2322,10.0795,-4.6325,-3.0349,-8.9954,-8.5802,1.0805,-11.2086,-1.853,-2.4515,-4.8016,-7.0893,-2.2778,-2.9455,4.1804,2.1645,6.119,-0.7855,-0.3221,-1.6734,11.0682,-2.9388,4.7775,3.2405,3.7309,1.2971,-0.0347,-0.229,8.8295,2.2264,4.2017,-2.0758,0.2797,-4.9343,-1.7107,-9.1294,-18.429,-5.6625,2.1786,3.3864,3.6815,1.8926,-0.9542,2.3565,6.3001,2.2709,1.7093,-7.276,2.1829,2.2783,-3.3988,0.3712,0.4198,1.1987,-0.2412,1.7508,3.5752,-0.2886,2.1367,-2.5314,-1.8669,-0.672,0.6521,-4.6754,-2.6955,-3.1665,0.9551,0.9347,1.6171,1.0368,0.8368,1.1899,2.588,0.3226,3.0234,1.7599,-3.7903,3.2793,2.0977,0.2618,3.067,-10.4613,0.0];

    const P_CRISIS = [0.0448,0.0247,0.0129,0.0003,0.0033,0.0027,0.0031,0.0053,0.0565,0.0002,0.0006,0.0004,0.0004,0.0898,0.9184,0.0179,0.0051,0.0,0.005,0.0,0.0,0.7617,0.9025,0.9996,0.9997,0.9191,0.9999,0.99,0.994,0.9989,0.9994,0.9555,0.8171,0.0317,0.0066,0.0001,0.0035,0.0032,0.0073,0.0,0.0072,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0002,0.0,0.0002,0.0,0.9821,1.0,0.9201,0.0017,0.0002,0.0,0.0002,0.0044,0.0001,0.0,0.0001,0.0007,0.4611,0.0004,0.0,0.0048,0.0003,0.0,0.0007,0.0003,0.0002,0.0,0.0008,0.0,0.0063,0.0001,0.001,0.0003,0.0429,0.0003,0.001,0.0,0.0003,0.0,0.0,0.0,0.0,0.0,0.0003,0.0,0.0,0.0,0.0,0.0,0.0,0.0001,0.9933,0.0];

    const RECESSION_BANDS = [
        { label: 'Dot-com', x0: '2001Q1', x1: '2001Q4', color: 'rgba(100,150,220,0.10)' },
        { label: 'GFC',     x0: '2007Q4', x1: '2009Q2', color: 'rgba(100,150,220,0.14)' },
        { label: 'COVID',   x0: '2020Q1', x1: '2020Q2', color: 'rgba(100,150,220,0.10)' }
    ];

    // ---- Plugin: shaded recession bands by quarter labels ----
    const shadeBandsPlugin = {
        id: 'shadeBands',
        beforeDatasetsDraw(chart, args, opts) {
            const { ctx, chartArea, scales } = chart;
            if (!scales.x) return;
            const bands = (opts && opts.bands) || [];
            bands.forEach(b => {
                const x0 = scales.x.getPixelForValue(b.x0);
                const x1 = scales.x.getPixelForValue(b.x1);
                if (isFinite(x0) && isFinite(x1)) {
                    ctx.save();
                    ctx.fillStyle = b.color;
                    ctx.fillRect(Math.min(x0, x1), chartArea.top, Math.abs(x1 - x0), chartArea.bottom - chartArea.top);
                    ctx.restore();
                }
            });
        }
    };
    Chart.register(shadeBandsPlugin);

    // ---- Global Chart.js defaults — match existing Cambria/blue palette ----
    Chart.defaults.font.family = "'Cambria', 'Georgia', 'Times New Roman', serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#333';
    Chart.defaults.borderColor = 'rgba(0,0,0,.12)';

    // Project palette — base blue (100,150,220) and base red (178,34,34)
    // match the Plotly time-series chart in the Data section.
    const PAL = {
        blue:       'rgba(100,150,220,1)',
        blueSoft:   'rgba(100,150,220,0.20)',
        blueLight:  'rgba(100,150,220,0.45)',
        rose:       'rgba(178,34,34,0.85)',
        roseSoft:   'rgba(178,34,34,0.15)',
        gray:       '#8a8a8a',
        gridGray:   'rgba(0,0,0,0.08)'
    };

    // Helper: safely instantiate a chart only if its canvas is present
    function makeChart(canvasId, config) {
        const el = document.getElementById(canvasId);
        if (!el) return null;
        return new Chart(el, config);
    }

    // ============== OLS · COEFFICIENTS ==============
    const olsLabels = ['M1\nUnivariate', 'M2\n+ Controls', 'M3a\nLag 1', 'M3b\nLag 2', 'M4\nAll lags'];
    const olsCoef   = [-0.0193, -0.0132, -0.0111, -0.0100, -0.0122];
    const olsR2     = [0.0334, 0.1439, 0.1402, 0.1388, 0.1446];

    makeChart('ch_ols_coef', {
        type: 'bar',
        data: {
            labels: olsLabels,
            datasets: [{
                data: olsCoef,
                backgroundColor: PAL.blue,
                borderColor: PAL.blue,
                borderWidth: 1,
                borderRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => 'β = ' + c.parsed.y.toFixed(4) } }
            },
            scales: {
                y: { title: { display: true, text: 'β on PE_Fundraising' }, ticks: { callback: v => v.toFixed(3) }, grid: { color: PAL.gridGray } },
                x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
        }
    });

    makeChart('ch_ols_r2', {
        type: 'bar',
        data: {
            labels: olsLabels,
            datasets: [{
                data: olsR2.map(v => v * 100),
                backgroundColor: PAL.blueLight,
                borderColor: PAL.blue,
                borderWidth: 1,
                borderRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => 'R² = ' + c.parsed.y.toFixed(2) + '%' } }
            },
            scales: {
                y: { title: { display: true, text: 'R² (%)' }, ticks: { callback: v => v + '%' }, grid: { color: PAL.gridGray } },
                x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
        }
    });

    // ============== GRANGER · F-STATISTICS ==============
    const gLags    = [1, 2, 3, 4];
    const gFR      = [3.8844, 1.8667, 1.1794, 0.7752]; // Fund → Ret
    const gRF      = [0.1686, 7.4621, 4.6599, 4.3692]; // Ret → Fund
    const gCritical = 3.84;

    function grangerChart(canvasId, vals, fillStyle) {
        return makeChart(canvasId, {
            type: 'bar',
            data: {
                labels: gLags.map(l => 'Lag ' + l),
                datasets: [
                    { data: vals, backgroundColor: fillStyle, borderColor: PAL.blue, borderWidth: 1, borderRadius: 0, label: 'F-stat' },
                    { type: 'line', data: [gCritical, gCritical, gCritical, gCritical], borderColor: PAL.blue, borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, fill: false, label: '5% critical' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { title: { display: true, text: 'F-statistic' }, suggestedMax: Math.max(8.5, Math.max(...vals) + 1), grid: { color: PAL.gridGray } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
    grangerChart('ch_g1', gFR, PAL.blueLight);
    grangerChart('ch_g2', gRF, PAL.blue);

    // ============== VAR · IMPULSE RESPONSE ==============
    const irfQ    = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const irf     = [0, -0.013754, -0.012594, -0.016808, -0.015135, -0.015805, -0.014143, -0.013575, -0.012119];
    const irfCum  = [0, -0.013754, -0.026347, -0.043155, -0.058290, -0.074095, -0.088238, -0.101813, -0.113932];

    makeChart('ch_irf', {
        type: 'line',
        data: {
            labels: irfQ,
            datasets: [{
                data: irf,
                borderColor: PAL.blue,
                backgroundColor: PAL.blueSoft,
                pointBackgroundColor: PAL.blue,
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => c.parsed.y.toFixed(4) + '%' } }
            },
            scales: {
                x: { title: { display: true, text: 'Quarters ahead' }, grid: { color: PAL.gridGray } },
                y: { title: { display: true, text: 'Return response (%)' }, ticks: { callback: v => v.toFixed(3) + '%' }, grid: { color: PAL.gridGray } }
            }
        }
    });

    makeChart('ch_irf_cum', {
        type: 'line',
        data: {
            labels: irfQ,
            datasets: [{
                data: irfCum,
                borderColor: PAL.blue,
                backgroundColor: PAL.blueSoft,
                pointBackgroundColor: PAL.blue,
                borderDash: [5, 3],
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => c.parsed.y.toFixed(4) + '% cumulative' } }
            },
            scales: {
                x: { title: { display: true, text: 'Quarters ahead' }, grid: { color: PAL.gridGray } },
                y: { title: { display: true, text: 'Cumulative response (%)' }, ticks: { callback: v => v.toFixed(3) + '%' }, grid: { color: PAL.gridGray } }
            }
        }
    });

    // ============== MARKOV · SMOOTHED P(CRISIS) ==============
    makeChart('ch_regime_prob', {
        type: 'line',
        data: {
            labels: QUARTERS,
            datasets: [{
                data: P_CRISIS,
                borderColor: PAL.blue,
                backgroundColor: PAL.blueSoft,
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => 'P(Crisis) = ' + c.parsed.y.toFixed(2) } }
            },
            scales: {
                x: { ticks: { maxTicksLimit: 10 }, grid: { display: false } },
                y: { title: { display: true, text: 'P(Crisis)' }, min: 0, max: 1, grid: { color: PAL.gridGray } }
            }
        }
    });

    // ============== MARKOV · REGIME-SPECIFIC β ==============
    makeChart('ch_regime_beta', {
        type: 'bar',
        data: {
            labels: ['Crisis regime\n(17 quarters)', 'Normal regime\n(85 quarters)'],
            datasets: [{
                data: [-0.0801, -0.0255],
                backgroundColor: [PAL.rose, PAL.blueLight],
                borderColor: PAL.blue,
                borderWidth: 1,
                borderRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => 'β = ' + c.parsed.y.toFixed(4) } }
            },
            scales: {
                y: { title: { display: true, text: 'β on Fundraising' }, ticks: { callback: v => v.toFixed(3) }, grid: { color: PAL.gridGray } },
                x: { grid: { display: false } }
            }
        }
    });

    // ============== CYCLE · PE RETURNS vs HP CYCLE ==============
    makeChart('ch_cycle', {
        type: 'line',
        data: {
            labels: QUARTERS,
            datasets: [
                { label: 'PE return',           data: PE_RETURN, borderColor: PAL.gray, borderWidth: 1, pointRadius: 0, tension: 0.2, fill: false },
                { label: 'Capital cycle (HP)',  data: CAP_CYCLE, borderColor: PAL.blue, backgroundColor: PAL.blueSoft, borderWidth: 2.2, pointRadius: 0, tension: 0.25, fill: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: '#111', usePointStyle: true, pointStyle: 'rectRounded', font: { family: "'Cambria', 'Georgia', serif", size: 12 } } },
                shadeBands: { bands: RECESSION_BANDS }
            },
            scales: {
                x: { ticks: { maxTicksLimit: 10 }, grid: { display: false } },
                y: { title: { display: true, text: '%' }, ticks: { callback: v => v.toFixed(1) + '%' }, grid: { color: PAL.gridGray } }
            }
        }
    });

    console.log('Imported Chart.js charts (Phases 2–6) initialized.');
});