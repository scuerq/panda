// Modifie la valeur d'un champ dans toutes les tables de l'opération à l'index donné
async function modifier_valeur_globale(idx, key, newValue) {
    // Charger la base
    const response = await fetch('../api/lire_bdd.php', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const bdd = await response.json();
    if (!Array.isArray(bdd.operations) || idx < 0 || idx >= bdd.operations.length) return false;
    const op = bdd.operations[idx];
    // Pour chaque table, modifier la valeur si le champ existe
    ['identif','synthese','prp','loyer','financement'].forEach(tab => {
        if (Array.isArray(op[tab])) {
            op[tab].forEach(row => {
                if (row && key in row) {
                    row[key] = newValue;
                }
            });
        }
    });
    // Sauvegarder la base modifiée
    await save_bdd(JSON.stringify(bdd, null, 2));
    return true;
}
//codes pour gerer la base de données : bdd.json.

//code ajouter_operation(data)
function ajouter_operation(data) {
    fetch('../api/lire_bdd.php')
        .then(response => response.text())
        .then(text => {
            let bdd;
            try {
                bdd = text ? JSON.parse(text) : {};
            } catch (e) {
                bdd = {};
            }
            if (!bdd || typeof bdd !== 'object') {
                bdd = {};
            }
            if (!Array.isArray(bdd.operations)) {
                bdd.operations = [];
            }
            bdd.operations.push(data);
            save_bdd(JSON.stringify(bdd, null, 2))
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde de la base de données');
            }
            console.log('Opération ajoutée avec succès');
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
}

//code pour tester si l'id est déja present dans la base bdd.json
function id_existe(id) {
    return fetch('../api/lire_bdd.php')
        .then(response => response.json())
        .then(bdd => {
            if (!Array.isArray(bdd.operations)) {
                return false;
            }
            return bdd.operations.some(op => op.identif[0].id === id);
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de l\'ID:', error);
            return false;
        });
}

//code pour uploader un fichier JSON, si id existe, demander : remplacer ou annuler
function uploader_fichier_json(file) {
   file=JSON.parse(file);
    // Si file est un objet JSON déjà parsé
    if (typeof file === 'object' && file !== null && file.identif && Array.isArray(file.identif)) {
        const data = file;
        try {
            if (data.identif[0] && data.identif[0].id) {
                id_existe(data.identif[0].id).then(existe => {
                    if (existe) {
                        const confirmation = confirm('L\'ID existe déjà. Voulez-vous remplacer l\'opération existante ?');
                        if (confirmation) {
                            supprimer_operation(data.identif[0].id).then(() => {
                                ajouter_operation(data);
                            });
                        }
                    } else {
                        ajouter_operation(data);
                    }
                });
            } else {
                console.error('Le fichier JSON doit contenir un champ "id".');
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du fichier JSON:', error);
        }
        return;
    }
    

}

function save_bdd(bdd){
    return fetch('../api/save_bdd.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: bdd
            });
}

function clean(objet) {
    const cleanKeys = obj => {
    if (Array.isArray(obj)) {
        return obj.map(cleanKeys);
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
            const cleanedKey = key.normalize("NFKD").replace(/[^\w\s\-\/\(\)]/g, "").trim();
            return [cleanedKey, cleanKeys(value)];
        })
        );
    }
    return obj;
    };

    const fileCleaned = cleanKeys(file);
    return fileCleaned;
}