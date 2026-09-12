// Fetch and render apps
async function loadApps() {
    const grid = document.getElementById('apps-grid');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('/api/apps');
        if (!response.ok) throw new Error('Failed to load apps');

        const apps = await response.json();

        // Pre-load favicons
        const appsWithFavicons = await Promise.all(
            apps.map(async (app) => {
                try {
                    const faviconResponse = await fetch(`/api/favicon?url=${encodeURIComponent(app.url)}`);
                    const faviconData = await faviconResponse.json();
                    return { ...app, favicon: faviconData.favicon };
                } catch (error) {
                    console.error(`Failed to load favicon for ${app.name}:`, error);
                    return app;
                }
            })
        );

        // Render cards
        grid.innerHTML = appsWithFavicons.map(app => `
            <div class="app-card">
                <div class="app-header">
                    <div class="app-icon">
                        <img 
                            src="${app.favicon || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%232D3748%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'}" 
                            alt="${app.name}"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%232D3748%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'"
                        >
                    </div>
                    <div class="app-info">
                        <h2 class="app-name">${escapeHtml(app.name)}</h2>
                        <p class="app-service">${escapeHtml(app.description)}</p>
                    </div>
                </div>
                <p class="app-description">${escapeHtml(app.url)}</p>
                <a 
                    href="${app.url}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="app-link"
                ></a>
            </div>
        `).join('');

        // Hide loading, show grid
        loading.style.display = 'none';
        grid.style.display = 'grid';

    } catch (error) {
        console.error('Error loading apps:', error);
        loading.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary);">
                <p>⚠️ Failed to load applications</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load apps on page load
document.addEventListener('DOMContentLoaded', loadApps);
