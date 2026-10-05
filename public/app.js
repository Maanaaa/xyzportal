// Fetch and render apps
async function loadApps() {
    const grid = document.getElementById('apps-grid');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('/api/apps');
        if (!response.ok) throw new Error('Failed to load apps');

        const apps = await response.json();

        if (apps.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <p style="font-size: 1.1rem;">Aucun site configuré pour le moment.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Cliquez sur "Ajouter un site" ci-dessus pour en ajouter un.</p>
                </div>
            `;
            loading.style.display = 'none';
            grid.style.display = 'grid';
            return;
        }

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
                    return app;
                }
            })
        );

        // Render cards
        grid.innerHTML = appsWithFavicons.map((app) => {
            const faviconSrc = app.favicon || generatePlaceholder(app.name);
            
            return `
            <div class="app-card">
                <div class="card-actions">
                    <button 
                        class="edit-app-btn" 
                        data-url="${escapeHtml(app.url)}" 
                        data-name="${escapeHtml(app.name)}"
                        data-description="${escapeHtml(app.description)}"
                        title="Modifier ${escapeHtml(app.name)}"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button 
                        class="delete-app-btn" 
                        data-url="${escapeHtml(app.url)}" 
                        data-name="${escapeHtml(app.name)}"
                        title="Supprimer ${escapeHtml(app.name)}"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="app-header">
                    <div class="app-icon">
                        <img 
                            src="${escapeHtml(faviconSrc)}" 
                            alt="${escapeHtml(app.name)}"
                            loading="lazy"
                            onerror="this.src='${generatePlaceholder(app.name)}'"
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

        // Attach event listeners for edit buttons
        document.querySelectorAll('.edit-app-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const url = btn.getAttribute('data-url');
                const name = btn.getAttribute('data-name');
                const description = btn.getAttribute('data-description');
                
                openAppModal(true, { url, name, description });
            });
        });

        // Attach event listeners for delete buttons
        document.querySelectorAll('.delete-app-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const url = btn.getAttribute('data-url');
                const name = btn.getAttribute('data-name');
                
                if (confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) {
                    await deleteApp(url, name);
                }
            });
        });

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

// Function to delete an app
async function deleteApp(url, name) {
    try {
        const response = await fetch('/api/apps', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, name })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Erreur lors de la suppression');
        }

        // Reload app grid
        await loadApps();
    } catch (err) {
        alert(err.message);
    }
}

let openAppModal;

// Modal functions
function initModal() {
    const modal = document.getElementById('add-modal');
    const modalTitle = document.getElementById('modal-title');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('add-app-form');
    const modalError = document.getElementById('modal-error');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const originalUrlInput = document.getElementById('app-original-url');

    openAppModal = function(isEdit = false, appData = null) {
        form.reset();
        modalError.style.display = 'none';
        modalError.textContent = '';
        
        if (isEdit && appData) {
            modalTitle.textContent = 'Modifier le site';
            submitText.textContent = 'Mettre à jour';
            originalUrlInput.value = appData.url;
            document.getElementById('app-name').value = appData.name || '';
            document.getElementById('app-description').value = appData.description || '';
            document.getElementById('app-url').value = appData.url || '';
        } else {
            modalTitle.textContent = 'Ajouter un site';
            submitText.textContent = 'Enregistrer';
            originalUrlInput.value = '';
        }

        modal.style.display = 'flex';
        document.getElementById('app-name').focus();
    };

    function closeModal() {
        modal.style.display = 'none';
    }

    openBtn.addEventListener('click', () => openAppModal(false));
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close when clicking overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalUrl = originalUrlInput.value;
        const name = document.getElementById('app-name').value.trim();
        const description = document.getElementById('app-description').value.trim();
        const url = document.getElementById('app-url').value.trim();

        if (!name || !url) {
            modalError.textContent = 'Le nom et l\'URL sont obligatoires.';
            modalError.style.display = 'block';
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitSpinner.style.display = 'inline-block';
        modalError.style.display = 'none';

        try {
            const isEdit = Boolean(originalUrl);
            const endpoint = '/api/apps';
            const method = isEdit ? 'PUT' : 'POST';
            const payload = isEdit 
                ? { originalUrl, name, description, url }
                : { name, description, url };

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'enregistrement');
            }

            closeModal();
            await loadApps();
        } catch (err) {
            modalError.textContent = err.message;
            modalError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitSpinner.style.display = 'none';
        }
    });
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
    div.textContent = text || '';
    return div.innerHTML;
}

// Load apps and init modal on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initModal();
    loadApps();
});
