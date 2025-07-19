/**
 * Module pour ajouter des tableaux interactifs à une page
 * @module add_tableaux
 */

/**
 * Crée un tableau de données interactif avec DataTables
 * @param {Object} options - Options de configuration
 * @param {string} options.containerId - ID du conteneur parent
 * @param {string} [options.title='Tableau de données'] - Titre du tableau
 * @param {Array} options.columns - Configuration des colonnes (format DataTables)
 * @param {Array|Function} options.data - Données du tableau ou fonction pour les récupérer
 * @param {Object} [options.dataTablesOptions={}] - Options supplémentaires pour DataTables
 * @param {Function} [options.onRowClick=null] - Callback appelé au clic sur une ligne
 * @returns {Object} Interface publique avec méthodes pour gérer le tableau
 */
function creerTableau(options = {}) {
    // Vérifier les paramètres obligatoires
    if (!options.containerId) {
        console.error('L\'ID du conteneur est obligatoire');
        return null;
    }

    // Configuration par défaut
    const config = {
        title: 'Tableau de données',
        columns: [],
        data: [],
        dataTablesOptions: {},
        onRowClick: null,
        ...options
    };

    // Références aux éléments du DOM
    let container = null;
    let table = null;
    let dataTable = null;
    let isLoading = false;

    /**
     * Initialise le conteneur du tableau
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
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="${config.containerId}-refresh">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="${config.containerId}-table" class="table table-striped table-hover w-100">
                        <thead></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer text-muted" id="${config.containerId}-status">
                Prêt
            </div>
        `;
        
        // Initialiser le tableau DataTable
        initDataTable();
    }

    /**
     * Initialise le tableau DataTable
     * @private
     */
    function initDataTable() {
        if (!container) return;
        
        const tableElement = document.getElementById(`${config.containerId}-table`);
        if (!tableElement) return;
        
        // Options par défaut pour DataTables
        const defaultOptions = {
            responsive: true,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Tous']],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/fr-FR.json'
            },
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            buttons: [
                {
                    extend: 'copy',
                    text: '<i class="bi bi-clipboard"></i> Copier',
                    className: 'btn btn-light btn-sm',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'excel',
                    text: '<i class="bi bi-file-earmark-excel"></i> Excel',
                    className: 'btn btn-light btn-sm',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'pdf',
                    text: '<i class="bi bi-file-pdf"></i> PDF',
                    className: 'btn btn-light btn-sm',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'print',
                    text: '<i class="bi bi-printer"></i> Imprimer',
                    className: 'btn btn-light btn-sm',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'colvis',
                    text: '<i class="bi bi-layout-three-columns"></i> Colonnes',
                    className: 'btn btn-light btn-sm'
                }
            ]
        };
        
        // Fusionner avec les options personnalisées
        const dtOptions = {
            ...defaultOptions,
            ...config.dataTablesOptions,
            columns: config.columns,
            data: Array.isArray(config.data) ? config.data : []
        };
        
        // Initialiser DataTable
        dataTable = $(tableElement).DataTable(dtOptions);
        
        // Configurer le clic sur les lignes
        if (typeof config.onRowClick === 'function') {
            $(tableElement).on('click', 'tr', function() {
                const rowData = dataTable.row(this).data();
                if (rowData) {
                    config.onRowClick(rowData, dataTable.row(this));
                }
            });
        }
        
        // Configurer le bouton de rafraîchissement
        const refreshBtn = document.getElementById(`${config.containerId}-refresh`);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => rafraichirDonnees());
        }
        
        // Charger les données si nécessaire
        if (typeof config.data === 'function') {
            rafraichirDonnees();
        }
    }
    
    /**
     * Rafraîchit les données du tableau
     * @private
     */
    async function rafraichirDonnees() {
        if (isLoading || typeof config.data !== 'function') return;
        
        try {
            isLoading = true;
            updateStatus('Chargement des données...');
            
            // Récupérer les données de manière asynchrone
            const donnees = await Promise.resolve(config.data());
            
            // Mettre à jour le tableau
            if (dataTable) {
                dataTable.clear();
                
                if (Array.isArray(donnees) && donnees.length > 0) {
                    dataTable.rows.add(donnees).draw();
                    updateStatus(`${donnees.length} éléments chargés`);
                } else {
                    updateStatus('Aucune donnée disponible');
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            updateStatus('Erreur lors du chargement des données', 'text-danger');
        } finally {
            isLoading = false;
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
         * Rafraîchit les données du tableau
         * @returns {Promise} Promesse résolue lorsque les données sont chargées
         */
        rafraichirDonnees() {
            return rafraichirDonnees();
        },
        
        /**
         * Retourne l'instance DataTable
         * @returns {DataTable} Instance DataTable
         */
        getDataTable() {
            return dataTable;
        },
        
        /**
         * Met à jour les données du tableau
         * @param {Array} nouvellesDonnees - Nouvelles données à afficher
         */
        setDonnees(nouvellesDonnees) {
            if (!dataTable) return;
            
            dataTable.clear();
            
            if (Array.isArray(nouvellesDonnees) && nouvellesDonnees.length > 0) {
                dataTable.rows.add(nouvellesDonnees).draw();
                updateStatus(`${nouvellesDonnees.length} éléments affichés`);
            } else {
                dataTable.draw();
                updateStatus('Aucune donnée disponible');
            }
        },
        
        /**
         * Applique des filtres personnalisés au tableau
         * @param {Function} filtre - Fonction de filtrage (reçoit une ligne, retourne true/false)
         */
        filtrer(filtre) {
            if (!dataTable) return;
            
            $.fn.dataTable.ext.search = []; // Réinitialiser les filtres existants
            
            if (typeof filtre === 'function') {
                $.fn.dataTable.ext.search.push(
                    function(settings, data, dataIndex) {
                        const rowData = dataTable.row(dataIndex).data();
                        return filtre(rowData);
                    }
                );
            }
            
            dataTable.draw();
        },
        
        /**
         * Détruit le tableau et nettoie les ressources
         */
        detruire() {
            if (dataTable) {
                dataTable.destroy();
                dataTable = null;
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
        module.exports = { creerTableau };
    }
} catch (e) {
    // Ne rien faire si l'environnement ne supporte pas les modules CommonJS
}

// Exposer la fonction globalement si on est dans un navigateur
if (typeof window !== 'undefined') {
    window.creerTableau = creerTableau;
}
