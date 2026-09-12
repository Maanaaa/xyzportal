// Fetch and render apps
async function loadApps() {
    const grid = document.getElementById('apps-grid');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('/api/apps');
        if (!response.ok) throw new Error('Failed to load apps');

        const apps = await response.json();

        // Pre-load favicons in parallel
        const appsWithFavicons = await Promise.all(
            apps.map(async (app) => {
                try {
                    const faviconResponse = await fetch(`/api/favicon?url=${encodeURIComponent(app.url)}`, {
                        signal: AbortSignal.timeout(5000) // 5 second timeout
                    });
                    
                    if (!faviconResponse.ok) throw new Error('Favicon fetch failed');
                    
                    const faviconData = await faviconResponse.json();
                    return { ...app, favicon: faviconData.favicon };
                } catch (error) {
                    console.warn(`Favicon error for ${app.name}:`, error.message);
                    // Return app without favicon - will use error fallback in HTML
                    return app;
                }
            })
        );

        // Render cards
        grid.innerHTML = appsWithFavicons.map(app => {
            // Use fallback if no favicon
            const faviconSrc = app.favicon || generatePlaceholder(app.name);
            
            return `
            <div class="app-card">
                <div class="app-header">
                    <div class="app-icon">
                        <img 
                            src="${escapeHtml(faviconSrc)}" 
                            alt="${escapeHtml(app.name)}"
                            loading="lazy"
                            onerror="this.src='${generatePlaceholder(this.alt)}'"
                        >
                    </div>
                    <div class="app-info">
                        <h2 class="app-name">${escapeHtml(app.name)}</h2>
                        <p class="app-service">${escapeHtml(app.description)}</p>
                    </div>
                </div>
                <p class="app-description">${escapeHtml(app.url)}</p>
                <a 
                    href="${escapeHtml(app.url)}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="app-link"
                ></a>
            </div>
            `;
        }).join('');

        // Hide loading, show grid
        loading.style.display = 'none';
        grid.style.display = 'grid';

    } catch (error) {
        console.error('Error loading apps:', error);
        loading.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary);">
                <p>⚠️ Failed to load applications</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

// Generate colored placeholder with first letter
function generatePlaceholder(text) {
    const letter = (text || '?').charAt(0).toUpperCase();
    const colors = ['%233b82f6', '%238b5cf6', '%23ec4899', '%23f59e0b', '%2310b981', '%2306b6d4'];
    const color = colors[letter.charCodeAt(0) % colors.length];
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${color}' width='100' height='100'/%3E%3Ctext x='50' y='60' font-size='50' font-weight='bold' fill='white' text-anchor='middle' font-family='Arial'%3E${letter}%3C/text%3E%3C/svg%3E`;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load apps on page load
document.addEventListener('DOMContentLoaded', loadApps);
