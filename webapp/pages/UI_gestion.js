// UI_gestion.js - Gestion des opérations XLSB (upload, affichage, suppression)
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileupload');
  const uploadBtn = document.getElementById('btnUploadXLSB');
  const tableBody = document.getElementById('operations-table').getElementsByTagName('tbody')[0];
  const selectedFilesList = document.getElementById('selectedFilesList');
  const dropzone = document.getElementById('dropzone');

  // Gestion de la dépose de fichiers
  dropzone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  // Gestion de la sélection des fichiers
  fileInput.addEventListener('change', function(e) {
    const files = e.target.files;
    if (!files.length) {
      selectedFilesList.innerHTML = '';
      uploadBtn.disabled = true;
      return;
    }

    // Filtrer uniquement les fichiers XLSB
    const validFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.xlsb'));
    if (validFiles.length === 0) {
      alert('Aucun fichier XLSB valide sélectionné.');
      selectedFilesList.innerHTML = '';
      uploadBtn.disabled = true;
      return;
    }

    // Afficher la liste des fichiers valides
    selectedFilesList.innerHTML = '';
    validFiles.forEach(file => {
      const li = document.createElement('li');
      li.textContent = file.name;
      selectedFilesList.appendChild(li);
    });
    
    // Activer/désactiver le bouton d'upload
    uploadBtn.disabled = validFiles.length === 0;
  });

  function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.xlsb'));
    if (validFiles.length === 0) {
      alert('Veuillez sélectionner des fichiers XLSB uniquement.');
      return;
    }
    
    selectedFilesList.innerHTML = '';
    validFiles.forEach(file => {
      const li = document.createElement('li');
      li.className = 'mb-1';
      li.textContent = file.name;
      selectedFilesList.appendChild(li);
    });
  }
  if (!tableBody) {
    console.error('Élément tbody non trouvé');
    return;
  }
  const resultDiv = document.getElementById('upload-result');
  const searchInput = document.getElementById('search-nom-operation');
  const autocompleteList = document.getElementById('autocomplete-list');

  // Liste des noms d'opérations pour l'autocomplétion
  let operationNames = [];
  let currentSuggestion = '';

  // Fonction pour mettre à jour le champ de recherche avec la suggestion
  function updateSearchInput(text, suggestion) {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    
    // Texte saisi en gras
    const typedText = document.createElement('span');
    typedText.textContent = text;
    typedText.style.fontWeight = 'bold';
    span.appendChild(typedText);
    
    // Suggestion en gris
    if (suggestion && suggestion !== text) {
      const suggestionText = document.createElement('span');
      suggestionText.textContent = suggestion.substring(text.length);
      suggestionText.style.color = '#666';
      span.appendChild(suggestionText);
    }
    
    searchInput.innerHTML = '';
    searchInput.appendChild(span);
    searchInput.value = text;
  }

  // Fonction pour trouver la meilleure suggestion
  function findBestMatch(text) {
    if (!text) return '';
    
    const filteredNames = operationNames
      .filter(name => name.toLowerCase().startsWith(text.toLowerCase()));
    
    return filteredNames[0] || '';
  }

  // Fonction pour filtrer le tableau
  function filterTable(searchText) {
    if (!searchText) return chargerOperations();

    fetch('../api/lire_bdd.php', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(response => response.json())
    .then(data => {
      const operations = data.operations;
      tableBody.innerHTML = '';
      
      operations.forEach((op, idx) => {
        const operationName = op.identif[0]['Nom de l\'opération'] || '';
        if (operationName.toLowerCase().includes(searchText.toLowerCase())) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${operationName}</td>
            <td>${op.identif[0]['Numéro'] || ''}</td>
            <td>${op.identif[0]['Stat Société'] || ''}</td>
            <td>
              <button class="btn btn-sm btn-primary" data-idx="${idx}" data-action="edit">Modifier</button>
              <button class="btn btn-sm btn-danger" data-idx="${idx}" data-action="delete">Supprimer</button>
            </td>
          `;
          tableBody.appendChild(row);
        }
      });

      // Ajouter les gestionnaires d'événements aux boutons
      document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = this.getAttribute('data-idx');
          if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            supprimer_operation_par_index(idx);
            filterTable(searchText);
          }
        });
      });
      document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = this.getAttribute('data-idx');
          window.location.href = `tableau_editable.html?idx=${idx}`;
        });
      });
    });
  }

  // Événement pour la recherche
  searchInput.addEventListener('input', function(e) {
    const searchText = e.target.value;
    const suggestion = findBestMatch(searchText);
    currentSuggestion = suggestion;
    updateSearchInput(searchText, suggestion);
    filterTable(searchText);
  });

  // Événement pour accepter la suggestion avec Tab
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (currentSuggestion) {
        searchInput.value = currentSuggestion;
        updateSearchInput(currentSuggestion, '');
        filterTable(currentSuggestion);
      }
    }
  });

  // Charger les noms d'opérations pour l'autocomplétion
  function loadOperationNames() {
    fetch('../api/lire_bdd.php', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(response => response.json())
    .then(data => {
      operationNames = data.operations.map(op => op.identif[0]['Nom de l\'opération'] || '');
    });
  }

  // Charger les noms d'opérations au chargement de la page
  loadOperationNames();

  // Upload XLSB (plusieurs fichiers)
  uploadBtn.addEventListener('click', async function() {
    if (!fileInput.files.length) {
      resultDiv.innerHTML = '<div class="alert alert-warning">Veuillez sélectionner au moins un fichier XLSB.</div>';
      return;
    }
    
    // Affichage du message et de la barre de progression
    resultDiv.innerHTML = `
      <div class="text-info d-flex align-items-center">
        <span id="upload-status">Upload en cours...</span>
        <div class="progress ms-3 flex-grow-1" style="height: 18px; min-width:120px; max-width:250px;">
          <div id="upload-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
        </div>
        <span id="upload-progress-text" class="ms-2 small">0%</span>
      </div>
    `;

    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-progress-text');
    const statusText = document.getElementById('upload-status');

    try {
      let totalFiles = fileInput.files.length;
      let processedFiles = 0;

      for (const file of fileInput.files) {
        processedFiles++;
        statusText.textContent = `Upload en cours... (${processedFiles}/${totalFiles})`;

        // Créer un FormData pour chaque fichier
        const formData = new FormData();
        formData.append('file', file);

        // Récupérer les données et les envoyer
        const data = await consolidation_data(file);
        await uploader_fichier_json(data);

        // Mettre à jour la progression
        const progress = (processedFiles / totalFiles) * 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';

        // Petite pause pour voir la progression
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Afficher un message de succès
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          <i class="bi bi-check-circle me-2"></i>
          ${totalFiles} fichier(s) ont été uploadés avec succès !
        </div>
      `;
      
      // Recharger les opérations
      chargerOperations();

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      resultDiv.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-circle me-2"></i>
          Une erreur est survenue lors de l\'upload : ${error.message}
        </div>
      `;
    }
  });

  // Fonction pour supprimer une opération
  async function supprimer_operation_par_index(idx) {
    try {
      // Charger la base de données
      const response = await fetch('../api/lire_bdd.php', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la lecture de la base');
      }

      const bdd = await response.json();
      
      // Vérifier que l'index est valide
      if (!Array.isArray(bdd.operations) || idx < 0 || idx >= bdd.operations.length) {
        throw new Error('Index invalide');
      }

      // Supprimer l'opération
      bdd.operations.splice(idx, 1);

      // Sauvegarder la base modifiée
      const saveResponse = await fetch('../api/save_bdd.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(bdd)
      });

      if (!saveResponse.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      return { success: true, message: 'Opération supprimée avec succès' };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  function chargerOperations() {
    // Fonction pour charger et afficher les opérations
    const timestamp = Date.now();
    fetch(`../api/lire_bdd.php?timestamp=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      return response.json();
    })
    .then(data => {
      const operations = data.operations || [];
      tableBody.innerHTML = '';
      
      operations.forEach((op, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${op.identif[0]['Nom de l\'opération'] || ''}</td>
          <td>${op.identif[0]['Numéro'] || ''}</td>
          <td>${op.identif[0]['Stat Société'] || ''}</td>
          <td>
            <button class="btn btn-sm btn-primary" data-idx="${idx}" data-action="edit">Modifier</button>
            <button class="btn btn-sm btn-danger" data-idx="${idx}" data-action="delete">Supprimer</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Ajouter les gestionnaires d'événements après avoir créé tous les éléments
      document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async function() {
          const idx = this.getAttribute('data-idx');
          if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            try {
              await supprimer_operation_par_index(idx);
              chargerOperations();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              alert('Erreur lors de la suppression de l\'opération');
            }
          }
        });
      });

      document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = this.getAttribute('data-idx');
          window.location.href = `tableau_editable.html?idx=${idx}`;
        });
      });
    })
    .catch(error => {
      console.error('Erreur:', error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger">
            Une erreur est survenue lors du chargement des opérations
          </td>
        </tr>
      `;
    });
  }

    // Initialisation
  chargerOperations();
});

// --- Mode édition autonome (tableau_editable.html) ---
if (window.location.pathname.endsWith('tableau_editable.html')) {
  // Fonction pour générer le tableau éditable croisé
  async function afficherTableauEditable(idx = 0) {
    const response = await fetch('../api/lire_bdd.php', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const bdd = await response.json();
    const op = bdd.operations[idx];
    if (!op) {
      document.getElementById('editable-table-container').innerHTML = '<div class="alert alert-warning">Aucune opération à éditer.</div>';
      return;
    }
    // Données par onglet
    const tabData = {
      identif: op.identif || [],
      prp: op.prp || [],
      loyer: op.loyer || [],
      financement: op.financement || [],
      synthese: op.synthese || []
    };
    // Onglet à éditer (par défaut identif, ou via select)
    const tab = window.currentTab || 'identif';
    // Générer le tableau croisé
    function makeEditableTable(data, tab) {
      if (!Array.isArray(data) || data.length === 0) return '<div class="text-muted">Aucune donnée</div>';
      const id2s = Array.from(new Set(data.map(row => row.id2).filter(Boolean))).sort((a,b)=>a-b);
      const allKeys = Array.from(new Set(data.flatMap(row => Object.keys(row).filter(k => k !== 'id2'))));
      let html = '<div style="max-height:400px;overflow-y:auto;overflow-x:auto;"><table class="table table-bordered table-sm align-middle mb-0 editable-resizable-table" style="min-width:600px;">';
      html += '<thead><tr>';
      html += '<th style="position:relative;min-width:120px;">Nom du champ<div class="col-resizer" style="position:absolute;right:0;top:0;width:6px;height:100%;cursor:col-resize;z-index:2;"></div></th>';
      id2s.forEach(function(id2) {
        html += '<th style="position:relative;min-width:120px;">' + id2 + '<div class="col-resizer" style="position:absolute;right:0;top:0;width:6px;height:100%;cursor:col-resize;z-index:2;"></div></th>';
      });
      html += '</tr></thead><tbody>';
      allKeys.forEach(function(key) {
        html += '<tr><td class="bg-light fw-bold">' + key + '</td>';
        id2s.forEach(function(id2, colIdx) {
          var row = data.find(function(r) { return r.id2 == id2; });
          var val = row && key in row ? row[key] : '';
          html += '<td><input type="text" class="form-control form-control-sm" data-tab="' + tab + '" data-id2="' + id2 + '" data-key="' + key + '" value="' + val + '"></td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    }
    // Afficher le tableau dans le conteneur
    document.getElementById('editable-table-container').innerHTML = makeEditableTable(tabData[tab], tab);
    // Activer le redimensionnement des colonnes
    setTimeout(() => {
      document.querySelectorAll('.editable-resizable-table').forEach(table => {
        const ths = table.querySelectorAll('th');
        ths.forEach((th, i) => {
          const resizer = th.querySelector('.col-resizer');
          if (!resizer) return;
          let startX, startWidth;
          resizer.onmousedown = function(e) {
            startX = e.pageX;
            startWidth = th.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.onmousemove = function(e2) {
              const newWidth = Math.max(60, startWidth + (e2.pageX - startX));
              th.style.width = newWidth + 'px';
              table.querySelectorAll('tr').forEach(row => {
                if (row.children[i]) row.children[i].style.width = newWidth + 'px';
              });
            };
            document.onmouseup = function() {
              document.body.style.cursor = '';
              document.onmousemove = null;
              document.onmouseup = null;
            };
            e.preventDefault();
          };
        });
      });
    }, 100);
    
  }
  
}
