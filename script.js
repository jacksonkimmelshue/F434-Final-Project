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

    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = document.querySelector('.dark-mode-icon');
    
    // Check if dark mode was previously enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeIcon.textContent = '☀️';
    } else {
        darkModeIcon.textContent = '🌙';
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isNowDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isNowDark);
        
        // Update icon
        darkModeIcon.textContent = isNowDark ? '☀️' : '🌙';
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

    console.log('Page loaded and interactive elements initialized.');
});