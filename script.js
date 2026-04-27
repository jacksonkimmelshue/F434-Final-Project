/* =====================================================
   DENOMINATOR EFFECT REPORT - JAVASCRIPT
   ===================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize syntax highlighting
    document.querySelectorAll('.code-block code').forEach(block => {
        hljs.highlightElement(block);
    });

    // ==================== CORRELATION MATRIX ====================
    const correlationData = {
        'PE_Return': [1.0, -0.155, 0.782, -0.526, -0.492, 0.158, 0.188, 0.169],
        'PE_Fundraising': [-0.155, 1.0, -0.134, -0.051, -0.127, -0.326, -0.567, -0.319],
        'market_excess_return': [0.782, -0.134, 1.0, -0.263, -0.353, -0.065, -0.028, -0.055],
        'hy_spread': [-0.526, -0.051, -0.263, 1.0, 0.803, -0.292, -0.13, -0.294],
        'vix': [-0.492, -0.127, -0.353, 0.803, 1.0, -0.057, 0.024, -0.058],
        'risk_free_rate': [0.158, -0.326, -0.065, -0.292, -0.057, 1.0, 0.859, 0.997],
        'rate_10y': [0.188, -0.567, -0.028, -0.13, 0.024, 0.859, 1.0, 0.86],
        'fed_funds_rate': [0.169, -0.319, -0.055, -0.294, -0.058, 0.997, 0.86, 1.0]
    };

    const variables = ['PE_Return', 'PE_Fundraising', 'market_excess_return', 'hy_spread', 'vix', 'risk_free_rate', 'rate_10y', 'fed_funds_rate'];
    const cleanLabels = ['PE Returns', 'PE Fundraising', 'Market Excess Return', 'HY Spread', 'VIX', 'Risk-Free Rate', '10Y Rate', 'Fed Funds Rate'];
    
    // Create lower triangular matrix (only lower half, no mirror)
    const zReshaped = [];
    const xLabels = cleanLabels;
    const yLabels = cleanLabels;
    
    for (let i = 0; i < variables.length; i++) {
        const row = [];
        for (let j = 0; j <= i; j++) {
            row.push(correlationData[variables[i]][j]);
        }
        zReshaped.push(row);
    }

    const heatmapTrace = {
        z: zReshaped,
        x: xLabels,
        y: yLabels,
        type: 'heatmap',
        text: zReshaped.map(row => row.map(val => val.toFixed(3))),
        texttemplate: '%{text}',
        textfont: { size: 10, color: '#000000' },
        colorscale: [
            [0, 'rgba(178, 34, 34, 0.7)'],      // Dark red for -1
            [0.25, 'rgba(220, 100, 100, 0.7)'], // Medium red
            [0.5, 'rgba(255, 255, 255, 0.5)'],  // White for 0
            [0.75, 'rgba(100, 150, 220, 0.7)'], // Medium blue
            [1, 'rgba(25, 55, 180, 0.7)']       // Dark blue for 1
        ],
        zmid: 0,
        zmin: -1,
        zmax: 1,
        showscale: true,
        colorbar: {
            title: 'Correlation',
            thickness: 12,
            len: 0.6,
            tickfont: { size: 10 }
        },
        hovertemplate: '<b>%{y}</b> vs <b>%{x}</b><br>Correlation: %{z:.3f}<extra></extra>'
    };

    const layout = {
        title: 'Correlation Matrix',
        titlefont: { size: 18, color: '#000000', family: "'Cambria', 'Georgia', serif" },
        xaxis: { 
            side: 'bottom', 
            tickangle: -45,
            tickfont: { size: 10 },
            showgrid: false,
            zeroline: false
        },
        yaxis: { 
            autorange: 'reversed',
            tickfont: { size: 10 },
            showgrid: false,
            zeroline: false
        },
        width: 850,
        height: 700,
        margin: { bottom: 200, left: 200, top: 80, right: 120 },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        font: { family: "'Cambria', 'Georgia', serif", size: 11 }
    };

    Plotly.newPlot('correlation-heatmap', [heatmapTrace], layout, { responsive: true, displayModeBar: false });

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
            title: 'Quarter',
            tickangle: -45,
            tickfont: { size: 9 },
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
        width: 950,
        height: 550,
        margin: { bottom: 150, left: 100, top: 80, right: 100 },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        font: { family: "'Cambria', 'Georgia', serif", size: 11 },
        hovermode: 'x unified',
        legend: { x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
        automargin: true
    };

    Plotly.newPlot('timeseries-chart', [barTrace, lineTrace], timeSeriesLayout, { responsive: true, displayModeBar: false });

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
});