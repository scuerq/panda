// --- UI_gestion.js (extrait à placer dans tableau_editable.html) ---
// Lecture du paramètre idx dans l'URL
function getParamIdx() {
  const urlParams = new URLSearchParams(window.location.search);
  const idx = parseInt(urlParams.get('idx'), 10);
  return isNaN(idx) ? 0 : idx;
}

document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.endsWith('tableau_editable.html')) {
    const idx = getParamIdx();
    let currentTab = 'identif';
    // Fonction pour générer le tableau éditable croisé
    async function afficherTableauEditable(idx, tab = 'identif') {
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
        financements: op.financements || [],
        synthese: op.synthese || []
      };
      function makeEditableTable(data, tab) {
        if (!Array.isArray(data) || data.length === 0) return '<div class="text-muted">Aucune donnée</div>';
        const id2s = Array.from(new Set(data.map(row => row.id2).filter(Boolean))).sort((a,b)=>a-b);
        const allKeys = Array.from(new Set(data.flatMap(row => Object.keys(row).filter(k => k !== 'id2'))));
        if (id2s.length === 0 || allKeys.length === 0) return '<div class="text-muted">Aucune donnée</div>';
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
      document.getElementById('editable-table-container').innerHTML = makeEditableTable(tabData[tab], tab);
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
      const tbody = document.querySelector('.editable-resizable-table tbody');
      if (tbody) {
        
        // Fonction pour modifier une valeur globalement dans toute l'opération
async function modifier_valeur_globale(idx, key, newValue, tab) {
  try {
    // Charger la base
    const response = await fetch('../api/lire_bdd.php', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement de la base');
    }

    const bdd = await response.json();
    if (!bdd || !bdd.operations) {
      throw new Error('Base de données invalide');
    }

    // Vérifier l'index
    if (!bdd.operations[idx]) {
      throw new Error('Opération non trouvée');
    }

    // Modifier toutes les occurrences de la clé dans tous les tableaux
    const operation = bdd.operations[idx];
    const tables = ['identif', 'prp', 'loyer', 'financement', 'synthese'];

    tables.forEach(table => {
      if (operation[table]) {
        operation[table].forEach(row => {
          if (row[key] !== undefined) {
            row[key] = newValue;
          }
        });
      }
    });

    // Sauvegarder la base
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

    return { success: true, message: 'Modification réussie' };
  } catch (error) {
    console.error('Erreur lors de la modification:', error);
    throw error;
  }
}

        // Event 'blur' (perte de focus)
        tbody.addEventListener('blur', async function(e) {
          const input = e.target;
          if (input && input.classList.contains('form-control') && input.classList.contains('form-control-sm')) {
            const key = input.dataset.key;
            const tab = input.dataset.tab;
            const newValue = input.value;
            
            try {
              await modifier_valeur_globale(idx, key, newValue, tab);
              // Mettre à jour toutes les cellules correspondantes dans le tableau
              document.querySelectorAll(`input[data-key="${key}"][data-tab="${tab}"]`).forEach(cell => {
                cell.value = newValue;
              });
            } catch (error) {
              console.error('Erreur lors de la modification:', error);
              // Restaurer la valeur précédente en cas d'erreur
              const oldValue = input.dataset.oldValue || '';
              input.value = oldValue;
            }
          }
        }, true); // useCapture=true pour blur
      }
    }
    // Navigation onglets
    document.getElementById('tab-editable-nav').addEventListener('click', function(e) {
      const link = e.target.closest('a[data-tab]');
      if (link) {
        e.preventDefault();
        document.querySelectorAll('#tab-editable-nav .nav-link').forEach(el => el.classList.remove('active'));
        link.classList.add('active');
        currentTab = link.getAttribute('data-tab');
        afficherTableauEditable(idx, currentTab);
      }
    });
    // Initialisation
    afficherTableauEditable(idx, currentTab);
    
    // Bouton Enregistrer : sauvegarde et retourne à gestion.html
    const btnSave = document.getElementById('btn-save-table');
    if (btnSave) {
      btnSave.addEventListener('click', async function() {
        // On force le blur sur l'input actif pour déclencher la sauvegarde si besoin
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          document.activeElement.blur();
        }
        // Petite pause pour laisser le backend traiter
        await new Promise(res => setTimeout(res, 300));
        window.location.href = 'gestion.html';
      });
    }
  }
});
