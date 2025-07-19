/**
 * Module pour ajouter des filtres et une barre de recherche à une page
 * @module add_filtres
 */

/**
 * Crée un conteneur de filtres avec une barre de recherche
 * @param {Object} options - Options de configuration
 * @param {string} [options.containerId='filtres-container'] - ID du conteneur parent
 * @param {string} [options.title='Filtres et Recherche'] - Titre du panneau de filtres
 * @param {Array} [options.filtres=[]] - Configuration des filtres
 * @param {Function} [options.onFilterChange=null] - Callback appelé quand les filtres changent
 * @returns {Object} Interface publique avec méthodes pour gérer les filtres
 */
function creerFiltres(options = {}) {
    // Configuration par défaut
    const config = {
        containerId: 'filtres-container',
        title: 'Filtres et Recherche',
        filtres: [],
        onFilterChange: null,
        ...options
    };

    // État des filtres
    let filtresActifs = {};
    let container = null;

    /**
     * Initialise le conteneur des filtres
     * @private
     */
    function initContainer() {
        // Vérifier si le conteneur existe déjà
        container = document.getElementById(config.containerId);
        
        if (!container) {
            // Créer un nouveau conteneur si nécessaire
            container = document.createElement('div');
            container.id = config.containerId;
            container.className = 'card mb-4';
            
            // Ajouter le conteneur au DOM (à la fin du body par défaut)
            document.body.appendChild(container);
        }
        
        // Vider et recréer le contenu du conteneur
        container.innerHTML = `
            <div class="card-header">
                <h5 class="card-title mb-0">${config.title}</h5>
            </div>
            <div class="card-body">
                <div class="row g-3" id="${config.containerId}-filtres"></div>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="${config.containerId}-recherche" 
                                   placeholder="Rechercher...">
                            <button class="btn btn-outline-secondary" type="button" id="${config.containerId}-btn-recherche">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Ajoute un filtre au conteneur
     * @param {string} id - Identifiant du filtre
     * @param {string} label - Libellé du filtre
     * @param {string} [type='select'] - Type de filtre (select, range, etc.)
     * @param {boolean} [multiple=false] - Si true, permet la sélection multiple
     * @param {Array} [options=[]] - Options pour les listes déroulantes
     */
    function ajouterFiltre(id, label, type = 'select', multiple = false, options = []) {
        if (!container) return;
        
        const filtresContainer = document.getElementById(`${config.containerId}-filtres`);
        if (!filtresContainer) return;
        
        const filtreDiv = document.createElement('div');
        filtreDiv.className = 'col-md-3';
        
        let inputHtml = '';
        const inputId = `${config.containerId}-filtre-${id}`;
        
        if (type === 'select') {
            inputHtml = `
                <select id="${inputId}" class="form-select" ${multiple ? 'multiple' : ''}>
                    <option value="">Tous les ${label}</option>
                    ${options.map(opt => 
                        `<option value="${opt.value}">${opt.label || opt.value}</option>`
                    ).join('')}
                </select>
            `;
        } else if (type === 'range') {
            inputHtml = `
                <div class="d-flex align-items-center">
                    <input type="number" id="${inputId}-min" class="form-control me-2" 
                           placeholder="Min" step="any">
                    <span class="mx-2">-</span>
                    <input type="number" id="${inputId}-max" class="form-control ms-2" 
                           placeholder="Max" step="any">
                </div>
            `;
        } else if (type === 'text') {
            inputHtml = `
                <input type="text" id="${inputId}" class="form-control" 
                       placeholder="Entrez une valeur...">
            `;
        }
        
        filtreDiv.innerHTML = `
            <div class="mb-3">
                <label for="${inputId}" class="form-label">${label}</label>
                ${inputHtml}
            </div>
        `;
        
        filtresContainer.appendChild(filtreDiv);
        
        // Configurer les écouteurs d'événements
        if (type === 'select') {
            const select = document.getElementById(inputId);
            if (select) {
                select.addEventListener('change', () => appliquerFiltres());
            }
        } else if (type === 'range') {
            const inputMin = document.getElementById(`${inputId}-min`);
            const inputMax = document.getElementById(`${inputId}-max`);
            
            if (inputMin && inputMax) {
                const debouncedFilter = debounce(() => appliquerFiltres(), 500);
                inputMin.addEventListener('input', debouncedFilter);
                inputMax.addEventListener('input', debouncedFilter);
            }
        } else if (type === 'text') {
            const input = document.getElementById(inputId);
            if (input) {
                const debouncedFilter = debounce(() => appliquerFiltres(), 500);
                input.addEventListener('input', debouncedFilter);
            }
        }
    }

    /**
     * Applique les filtres actuels et déclenche le callback
     * @private
     */
    function appliquerFiltres() {
        if (!container) return;
        
        const nouveauxFiltres = {};
        
        // Récupérer les valeurs des filtres
        container.querySelectorAll('select, input[type="text"], input[type="number"]').forEach(input => {
            const idMatch = input.id.match(new RegExp(`${config.containerId}-filtre-(.+?)(?:-(min|max))?$`));
            if (!idMatch) return;
            
            const id = idMatch[1];
            const type = idMatch[2];
            
            if (input.tagName === 'SELECT') {
                if (input.multiple) {
                    const selected = Array.from(input.selectedOptions).map(opt => opt.value).filter(Boolean);
                    if (selected.length > 0) {
                        nouveauxFiltres[id] = selected;
                    }
                } else if (input.value) {
                    nouveauxFiltres[id] = [input.value];
                }
            } else if (input.type === 'number' || input.type === 'text') {
                if (type === 'min' || type === 'max') {
                    if (input.value) {
                        if (!nouveauxFiltres[id]) nouveauxFiltres[id] = {};
                        nouveauxFiltres[id][type] = parseFloat(input.value) || 0;
                    }
                } else if (input.value) {
                    nouveauxFiltres[id] = input.value;
                }
            }
        });
        
        // Ajouter la recherche globale
        const rechercheInput = document.getElementById(`${config.containerId}-recherche`);
        if (rechercheInput && rechercheInput.value.trim()) {
            nouveauxFiltres._recherche = rechercheInput.value.trim().toLowerCase();
        }
        
        // Mettre à jour l'état et déclencher le callback
        filtresActifs = nouveauxFiltres;
        if (typeof config.onFilterChange === 'function') {
            config.onFilterChange(filtresActifs);
        }
    }
    
    /**
     * Fonction utilitaire pour le debounce
     * @private
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialisation
    initContainer();
    
    // Configurer la recherche
    const rechercheInput = document.getElementById(`${config.containerId}-recherche`);
    const btnRecherche = document.getElementById(`${config.containerId}-btn-recherche`);
    
    if (rechercheInput && btnRecherche) {
        const effectuerRecherche = () => appliquerFiltres();
        
        btnRecherche.addEventListener('click', effectuerRecherche);
        rechercheInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                effectuerRecherche();
            }
        });
    }
    
    // Interface publique
    return {
        /**
         * Ajoute un filtre au conteneur
         * @param {string} id - Identifiant du filtre
         * @param {string} label - Libellé du filtre
         * @param {string} [type='select'] - Type de filtre (select, range, text)
         * @param {boolean} [multiple=false] - Si true, permet la sélection multiple
         * @param {Array} [options=[]] - Options pour les listes déroulantes
         * @returns {Object} L'instance courante pour le chaînage
         */
        ajouterFiltre(id, label, type = 'select', multiple = false, options = []) {
            ajouterFiltre(id, label, type, multiple, options);
            return this;
        },
        
        /**
         * Retourne les filtres actifs
         * @returns {Object} Les filtres actifs
         */
        getFiltres() {
            return { ...filtresActifs };
        },
        
        /**
         * Réinitialise tous les filtres
         * @returns {Object} L'instance courante pour le chaînage
         */
        reinitialiserFiltres() {
            if (!container) return this;
            
            container.querySelectorAll('select, input[type="text"], input[type="number"]').forEach(input => {
                if (input.multiple) {
                    // Pour les selects multiples
                    Array.from(input.options).forEach(option => {
                        option.selected = false;
                    });
                } else if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            
            appliquerFiltres();
            return this;
        },
        
        /**
         * Détruit l'instance et nettoie les écouteurs d'événements
         */
        detruire() {
            if (container) {
                container.innerHTML = '';
                container.remove();
                container = null;
            }
        }
    };
}

// Exporter pour utilisation avec les modules ES6
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { creerFiltres };
    }
} catch (e) {
    // Ne rien faire si l'environnement ne supporte pas les modules CommonJS
}

// Exposer la fonction globalement si on est dans un navigateur
if (typeof window !== 'undefined') {
    window.creerFiltres = creerFiltres;
}
