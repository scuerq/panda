// Variables globales
let tableauSynthese = null;
let graphiqueSynthese = null;
let donneesBrutes = null;

// Formater les nombres avec séparateurs de milliers
function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) return '';
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

// Formater les valeurs monétaires
function formatMoney(value, symbol = '€', decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) return '';
    return `${formatNumber(value, decimals)} ${symbol}`.trim();
}

// Charger les données depuis l'API
async function chargerDonnees() {
    try {
        const response = await fetch('../api/lire_bdd.php');
        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }
        const data = await response.json();
        console.log('Données chargées avec succès:', data);
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        throw error;
    }
}

// Initialiser le tableau de synthèse
async function initialiserTableauSynthese() {
    try {
        // Afficher l'indicateur de chargement
        document.getElementById('tableau-synthese').innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></div>';
        
        // Charger les données
        const bddData = await chargerDonnees();
        console.log('Données brutes chargées:', bddData);
        if (!bddData) {
            throw new Error('Aucune donnée chargée depuis l\'API');
        }
        donneesBrutes = bddData;
        
        // Créer le tableau de synthèse
        const dfSynthese = await creer_table_synthese_1(bddData);
        console.log('Résultat de creer_table_synthese_1:', dfSynthese);
        
        if (!dfSynthese || !dfSynthese.columns || !dfSynthese.values) {
            throw new Error('Format de données invalide retourné par creer_table_synthese_1');
        }
        
        // Convertir le DataFrame en tableau d'objets
        const donneesTableau = [];
        for (let i = 0; i < dfSynthese.index.length; i++) {
            const ligne = {};
            dfSynthese.columns.forEach((col, j) => {
                ligne[col] = dfSynthese.values[i][j];
            });
            donneesTableau.push(ligne);
        }
        
        console.log('Données converties pour le tableau:', donneesTableau);
        
        if (!donneesTableau || donneesTableau.length === 0) {
            throw new Error('Aucune donnée valide après conversion');
        }
        
        // Configuration des colonnes
        const colonnes = [
            { 
                title: 'Stat Société', 
                data: 'Stat Société',
                className: 'fw-bold'
            },
            { 
                title: 'Nombre', 
                data: 'id2_count',
                className: 'text-end',
                render: (data) => formatNumber(data, 0)
            },
            { 
                title: 'Logements', 
                data: 'Equivalent logements_sum',
                className: 'text-end',
                render: (data) => formatNumber(data, 1)
            },
            { 
                title: 'Surface (m²)', 
                data: 'Nbre de M² SHab_sum',
                className: 'text-end',
                render: (data) => formatNumber(data, 0)
            },
            { 
                title: 'Total (€)', 
                data: 'Total_sum',
                className: 'text-end',
                render: (data) => formatMoney(data, '€', 0)
            },
            { 
                title: 'Loyers bruts (€)', 
                data: 'Loyers bruts_sum',
                className: 'text-end',
                render: (data) => formatMoney(data, '€', 0)
            },
            { 
                title: 'Subventions (€)', 
                data: 'Subventions_sum',
                className: 'text-end',
                render: (data) => formatMoney(data, '€', 0)
            },
            { 
                title: 'EBE / Loyers (%)', 
                data: 'EBE / Loyers potentiels Cumulés_mean',
                className: 'text-center',
                render: (data) => data ? `${(data * 100).toFixed(1)}%` : 'N/A'
            },
            { 
                title: 'Service Dette / Loyers (%)', 
                data: 'Service de la Dette / Loyers potentiels Cumulés_mean',
                className: 'text-center',
                render: (data) => data ? `${(data * 100).toFixed(1)}%` : 'N/A'
            }
        ];
        
        // Initialiser le tableau
        tableauSynthese = creerTableau({
            containerId: 'tableau-synthese',
            title: 'Synthèse des opérations',
            columns: colonnes,
            data: donneesTableau,
            dataTablesOptions: {
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'csv', 'excel', 'pdf', 'print',
                    {
                        extend: 'colvis',
                        text: 'Colonnes',
                        columns: ':not(.no-export)'
                    }
                ],
                order: [[0, 'asc']],
                pageLength: 25,
                responsive: true,
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/fr-FR.json'
                }
            },
            onRowClick: (rowData) => {
                // Mettre à jour le graphique avec la ligne sélectionnée
                mettreAJourGraphique([rowData]);
            }
        });
        
        // Initialiser le graphique
        mettreAJourGraphique(donneesTableau);
        
        // Initialiser les filtres
        initialiserFiltres(donneesTableau);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du tableau de synthèse:', error);
        document.getElementById('tableau-synthese').innerHTML = `
            <div class="alert alert-danger" role="alert">
                Erreur lors du chargement des données. Veuillez rafraîchir la page.
            </div>
        `;
    }
}

// Mettre à jour le graphique
function mettreAJourGraphique(donnees) {
    if (!donnees || donnees.length === 0) {
        document.getElementById('graphique-synthese').innerHTML = '<div class="alert alert-info">Aucune donnée à afficher</div>';
        return;
    }
    
    // Préparer les données
    const labels = donnees.map(item => item['Stat Société'] || 'Sans statut');
    const datasets = [
        {
            label: 'Nombre d\'opérations',
            data: donnees.map(item => item.id2_count || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y'
        },
        {
            label: 'Total (milliers €)',
            data: donnees.map(item => (item['Total_sum'] || 0) / 1000),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1'
        }
    ];
    
    // Créer ou mettre à jour le graphique
    if (!graphiqueSynthese) {
        graphiqueSynthese = creerGraphique({
            containerId: 'graphique-synthese',
            title: 'Répartition par statut',
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Nombre d\'opérations'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        title: {
                            display: true,
                            text: 'Total (milliers €)'
                        }
                    }
                }
            }
        });
    } else {
        graphiqueSynthese.setDonnees({
            labels: labels,
            datasets: datasets
        });
    }
}

// Initialiser les filtres
function initialiserFiltres(donnees) {
    const filtresContainer = document.getElementById('filtres-container');
    if (!filtresContainer) return;
    
    // Vider le conteneur
    filtresContainer.innerHTML = '';
    
    // Vérifier que les données sont définies et non vides
    if (!donnees || !Array.isArray(donnees) || donnees.length === 0) {
        console.error('Aucune donnée valide fournie pour l\'initialisation des filtres');
        return;
    }
    
    // Créer le filtre par statut
    const statuts = [...new Set(donnees.map(item => item['Stat Société']).filter(Boolean))];
    if (statuts.length > 0) {
        const divFiltre = document.createElement('div');
        divFiltre.className = 'col-md-4';
        divFiltre.innerHTML = `
            <label for="filtre-statut" class="form-label">Statut</label>
            <select id="filtre-statut" class="form-select">
                <option value="">Tous les statuts</option>
                ${statuts.map(statut => `<option value="${statut}">${statut}</option>`).join('')}
            </select>
        `;
        filtresContainer.appendChild(divFiltre);
        
        // Gérer le changement de filtre
        document.getElementById('filtre-statut').addEventListener('change', (e) => {
            const valeur = e.target.value;
            let donneesFiltrees = [...donnees];
            
            if (valeur) {
                donneesFiltrees = donneesFiltrees.filter(item => item['Stat Société'] === valeur);
            }
            
            // Mettre à jour le tableau
            if (tableauSynthese) {
                tableauSynthese.setDonnees(donneesFiltrees);
            }
            
            // Mettre à jour le graphique
            mettreAJourGraphique(donneesFiltrees);
        });
    }
    
    // Ajouter un champ de recherche
    const divRecherche = document.createElement('div');
    divRecherche.className = 'col-md-8';
    divRecherche.innerHTML = `
        <label for="recherche-input" class="form-label">Recherche</label>
        <div class="input-group">
            <input type="text" id="recherche-input" class="form-control" placeholder="Rechercher...">
            <button class="btn btn-outline-secondary" type="button" id="btn-recherche">
                <i class="bi bi-search"></i>
            </button>
            <button class="btn btn-outline-secondary" type="button" id="btn-reinitialiser">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
        </div>
    `;
    filtresContainer.appendChild(divRecherche);
    
    // Gérer la recherche
    const rechercheInput = document.getElementById('recherche-input');
    const btnRecherche = document.getElementById('btn-recherche');
    const btnReinitialiser = document.getElementById('btn-reinitialiser');
    
    function effectuerRecherche() {
        const terme = rechercheInput.value.toLowerCase();
        if (!terme) {
            if (tableauSynthese) {
                tableauSynthese.setDonnees(donnees);
                mettreAJourGraphique(donnees);
            }
            return;
        }
        
        const resultats = donnees.filter(item => 
            Object.values(item).some(val => 
                String(val).toLowerCase().includes(terme)
            )
        );
        
        if (tableauSynthese) {
            tableauSynthese.setDonnees(resultats);
            mettreAJourGraphique(resultats);
        }
    }
    
    btnRecherche.addEventListener('click', effectuerRecherche);
    rechercheInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            effectuerRecherche();
        }
    });
    
    btnReinitialiser.addEventListener('click', () => {
        rechercheInput.value = '';
        if (tableauSynthese) {
            tableauSynthese.setDonnees(donnees);
            mettreAJourGraphique(donnees);
        }
    });
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier que les dépendances sont chargées
    if (typeof $ === 'undefined' || !$.fn.DataTable) {
        console.error('jQuery DataTables n\'est pas chargé');
        return;
    }
    
    if (typeof creerTableau === 'undefined' || typeof creerGraphique === 'undefined') {
        console.error('Les composants de tableau et de graphique ne sont pas chargés');
        return;
    }
    
    // Initialiser le tableau de synthèse
    initialiserTableauSynthese();
    
    // Gérer le bouton de rafraîchissement
    const btnRafraichir = document.getElementById('btn-rafraichir');
    if (btnRafraichir) {
        btnRafraichir.addEventListener('click', initialiserTableauSynthese);
    }
});