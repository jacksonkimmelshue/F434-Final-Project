/* =====================================================
   DENOMINATOR EFFECT REPORT - JAVASCRIPT
   ===================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize syntax highlighting
    document.querySelectorAll('.code-block code').forEach(block => {
        hljs.highlightElement(block);
    });

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

    // Add table sorting functionality
    document.querySelectorAll('table').forEach(table => {
        table.querySelectorAll('th').forEach((th, index) => {
            th.style.cursor = 'pointer';
            th.title = 'Click to sort';

            th.addEventListener('click', function() {
                const tbody = table.querySelector('tbody');
                if (!tbody) return;

                const rows = Array.from(tbody.querySelectorAll('tr'));
                const isNumeric = rows.every(row => {
                    const cell = row.children[index];
                    return !isNaN(parseFloat(cell.textContent));
                });

                rows.sort((a, b) => {
                    const aVal = a.children[index].textContent.trim();
                    const bVal = b.children[index].textContent.trim();

                    if (isNumeric) {
                        return parseFloat(aVal) - parseFloat(bVal);
                    }
                    return aVal.localeCompare(bVal);
                });

                rows.forEach(row => tbody.appendChild(row));
            });
        });
    });

    // Highlight rows on hover (tables)
    document.querySelectorAll('table tr').forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e0e0e0';
        });
        row.addEventListener('mouseleave', function() {
            if (this.rowIndex % 2 === 0) {
                this.style.backgroundColor = '';
            } else {
                this.style.backgroundColor = 'var(--bg-light)';
            }
        });
    });

    console.log('Page loaded and interactive elements initialized.');
});

/* =====================================================
   UTILITY: Scroll to top button
   ===================================================== */

window.addEventListener('scroll', function() {
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (scrollTopBtn) {
        if (window.pageYOffset > 300) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    }
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}