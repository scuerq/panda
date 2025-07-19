/**
 * Module pour ajouter des graphiques interactifs à une page
 * @module add_graphiques
 */

/**
 * Crée un graphique interactif avec Chart.js
 * @param {Object} options - Options de configuration
 * @param {string} options.containerId - ID du conteneur parent
 * @param {string} [options.title='Graphique'] - Titre du graphique
 * @param {string} [options.type='bar'] - Type de graphique (bar, line, pie, doughnut, etc.)
 * @param {Object} [options.data={}] - Données du graphique (format Chart.js)
 * @param {Object} [options.options={}] - Options du graphique (format Chart.js)
 * @param {Function} [options.onClick=null] - Callback appelé au clic sur un élément du graphique
 * @returns {Object} Interface publique avec méthodes pour gérer le graphique
 */
function creerGraphique(options = {}) {
    // Vérifier les paramètres obligatoires
    if (!options.containerId) {
        console.error('L\'ID du conteneur est obligatoire');
        return null;
    }

    // Configuration par défaut
    const config = {
        title: 'Graphique',
        type: 'bar',
        data: {},
        options: {},
        onClick: null,
        ...options
    };

    // Références aux éléments du DOM
    let container = null;
    let canvas = null;
    let chart = null;
    let isLoading = false;

    /**
     * Initialise le conteneur du graphique
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
            document.body.appendChild(container);
        }
        
        // Vider et recréer le contenu du conteneur
        container.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">${config.title}</h5>
                <div class="btn-group">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                                id="${config.containerId}-menu" data-bs-toggle="dropdown" 
                                aria-expanded="false">
                            <i class="bi bi-gear"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="${config.containerId}-menu">
                            <li><a class="dropdown-item" href="#" data-action="export-png">
                                <i class="bi bi-download me-2"></i>Exporter en PNG
                            </a></li>
                            <li><a class="dropdown-item" href="#" data-action="export-jpeg">
                                <i class="bi bi-download me-2"></i>Exporter en JPEG
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" data-action="refresh">
                                <i class="bi bi-arrow-clockwise me-2"></i>Rafraîchir
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="card-body position-relative" style="min-height: 300px;">
                <div id="${config.containerId}-loading" class="position-absolute top-50 start-50 translate-middle">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                </div>
                <canvas id="${config.containerId}-canvas"></canvas>
            </div>
            <div class="card-footer text-muted" id="${config.containerId}-status">
                Prêt
            </div>
        `;
        
        // Initialiser le graphique
        initChart();
        
        // Configurer les événements
        setupEvents();
    }

    /**
     * Initialise le graphique Chart.js
     * @private
     */
    function initChart() {
        if (!container) return;
        
        const canvasElement = document.getElementById(`${config.containerId}-canvas`);
        if (!canvasElement) return;
        
        canvas = canvasElement;
        
        // Options par défaut pour Chart.js
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: config.title
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0 && typeof config.onClick === 'function') {
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    const index = element.index;
                    const dataset = chart.data.datasets[datasetIndex];
                    const label = chart.data.labels ? chart.data.labels[index] : null;
                    const value = dataset.data[index];
                    
                    config.onClick({
                        event,
                        element,
                        datasetIndex,
                        index,
                        dataset,
                        label,
                        value,
                        chart
                    });
                }
            }
        };
        
        // Fusionner avec les options personnalisées
        const chartOptions = {
            ...defaultOptions,
            ...config.options,
            plugins: {
                ...defaultOptions.plugins,
                ...(config.options.plugins || {})
            }
        };
        
        // Créer le graphique
        chart = new Chart(canvas, {
            type: config.type,
            data: config.data,
            options: chartOptions
        });
        
        // Masquer le loader
        const loadingElement = document.getElementById(`${config.containerId}-loading`);
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    /**
     * Configure les événements du graphique
     * @private
     */
    function setupEvents() {
        // Gérer les clics sur le menu déroulant
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            e.preventDefault();
            const action = target.getAttribute('data-action');
            
            switch (action) {
                case 'export-png':
                    exporterImage('image/png');
                    break;
                    
                case 'export-jpeg':
                    exporterImage('image/jpeg');
                    break;
                    
                case 'refresh':
                    rafraichirDonnees();
                    break;
            }
        });
    }
    
    /**
     * Exporte le graphique en image
     * @param {string} format - Format d'export (image/png, image/jpeg, etc.)
     * @private
     */
    function exporterImage(format) {
        if (!chart) return;
        
        const link = document.createElement('a');
        link.download = `${config.title.replace(/\s+/g, '_')}.${format.split('/')[1]}`;
        link.href = chart.toBase64Image(format);
        link.click();
    }
    
    /**
     * Rafraîchit les données du graphique
     * @private
     */
    async function rafraichirDonnees() {
        if (isLoading || typeof config.data !== 'function') return;
        
        try {
            isLoading = true;
            updateStatus('Chargement des données...');
            
            // Afficher le loader
            const loadingElement = document.getElementById(`${config.containerId}-loading`);
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }
            
            // Récupérer les données de manière asynchrone
            const nouvellesDonnees = await Promise.resolve(config.data());
            
            // Mettre à jour le graphique
            if (chart) {
                // Mettre à jour les données
                if (nouvellesDonnees.labels) {
                    chart.data.labels = nouvellesDonnees.labels;
                }
                
                if (nouvellesDonnees.datasets) {
                    chart.data.datasets = nouvellesDonnees.datasets;
                }
                
                // Mettre à jour les options si fournies
                if (nouvellesDonnees.options) {
                    Object.assign(chart.options, nouvellesDonnees.options);
                }
                
                // Mettre à jour l'affichage
                chart.update();
                
                updateStatus('Données mises à jour');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            updateStatus('Erreur lors du chargement des données', 'text-danger');
        } finally {
            isLoading = false;
            
            // Masquer le loader
            const loadingElement = document.getElementById(`${config.containerId}-loading`);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }
    
    /**
     * Met à jour le message de statut
     * @param {string} message - Message à afficher
     * @param {string} [classe='text-muted'] - Classe CSS à appliquer
     * @private
     */
    function updateStatus(message, classe = 'text-muted') {
        const statusElement = document.getElementById(`${config.containerId}-status`);
        if (statusElement) {
            statusElement.className = `card-footer ${classe}`;
            statusElement.textContent = message;
        }
    }

    // Initialisation
    initContainer();
    
    // Interface publique
    return {
        /**
         * Rafraîchit les données du graphique
         * @returns {Promise} Promesse résolue lorsque les données sont chargées
         */
        rafraichirDonnees() {
            return rafraichirDonnees();
        },
        
        /**
         * Retourne l'instance Chart.js
         * @returns {Chart} Instance Chart.js
         */
        getChart() {
            return chart;
        },
        
        /**
         * Met à jour les données du graphique
         * @param {Object} nouvellesDonnees - Nouvelles données (format Chart.js)
         */
        setDonnees(nouvellesDonnees) {
            if (!chart) return;
            
            // Mettre à jour les données
            if (nouvellesDonnees.labels) {
                chart.data.labels = nouvellesDonnees.labels;
            }
            
            if (nouvellesDonnees.datasets) {
                chart.data.datasets = nouvellesDonnees.datasets;
            }
            
            // Mettre à jour les options si fournies
            if (nouvellesDonnees.options) {
                Object.assign(chart.options, nouvellesDonnees.options);
            }
            
            // Mettre à jour l'affichage
            chart.update();
            updateStatus('Données mises à jour');
        },
        
        /**
         * Change le type de graphique
         * @param {string} nouveauType - Nouveau type de graphique
         */
        changerType(nouveauType) {
            if (!chart) return;
            
            chart.config.type = nouveauType;
            chart.update();
        },
        
        /**
         * Exporte le graphique en image
         * @param {string} [format='image/png'] - Format d'export (image/png, image/jpeg, etc.)
         */
        exporterImage(format = 'image/png') {
            exporterImage(format);
        },
        
        /**
         * Détruit le graphique et nettoie les ressources
         */
        detruire() {
            if (chart) {
                chart.destroy();
                chart = null;
            }
            
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
        module.exports = { creerGraphique };
    }
} catch (e) {
    // Ne rien faire si l'environnement ne supporte pas les modules CommonJS
}

// Exposer la fonction globalement si on est dans un navigateur
if (typeof window !== 'undefined') {
    window.creerGraphique = creerGraphique;
}
