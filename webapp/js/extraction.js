// extraction.js : module d'extraction de données XLSB avec xlsx.full.min.js

/**
 * Lit un fichier XLSB (File ou ArrayBuffer) et retourne le workbook
 * @param {File|ArrayBuffer|Uint8Array} file - Fichier XLSB à lire
 * @returns {Promise<object>} - Promise résolue avec le workbook XLSX
 */
function readXlsbFile(file) {
    return new Promise((resolve, reject) => {
        if (file instanceof File) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
                    resolve(workbook);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = function(err) {
                reject(err);
            };
            reader.readAsArrayBuffer(file);
        } else if (file instanceof ArrayBuffer || file instanceof Uint8Array) {
            try {
                const workbook = XLSX.read(new Uint8Array(file), {type: 'array'});
                resolve(workbook);
            } catch (err) {
                reject(err);
            }
        } else {
            reject(new Error('Type de fichier non supporté'));
        }
    });
}

// Export pour usage dans d'autres scripts
window.readXlsbFile = readXlsbFile;

/**
 * Extrait les identifiants du fichier XLSB selon la logique décrite
 * @param {File|ArrayBuffer|Uint8Array} file - Fichier XLSB à lire
 * @returns {Promise<Array<object>>} - Liste des objets extraits
 */
async function extraire_identif(file) {
    const workbook = await readXlsbFile(file);
    const sheet = workbook.Sheets["Identif"];
    if (!sheet) return [];

    // Plage F57:J57
    const startCol = XLSX.utils.decode_col("F");
    const endCol = XLSX.utils.decode_col("J");
    const row = 57;
    const results = [];

    for (let col = startCol; col <= endCol; col++) {
        const cellAddr = {c: col, r: row - 1}; // XLSX is 0-based
        const cellRef = XLSX.utils.encode_cell(cellAddr);
        let cell = sheet[cellRef];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
            const id = file.name || file.path || "";
            const id2 = (col - startCol + 1);
            const clef = `${id}&_${id2}`;
            const produit = cell.v;

            // Nom de champs
            const nomChamps = [];

            // Valeur de champs
            const valeurChamps = [];

            nomChamps.push(`id`);
            nomChamps.push(`id2`);
            nomChamps.push(`clef`);
            nomChamps.push(`produit`);

            valeurChamps.push(id);
            valeurChamps.push(id2);
            valeurChamps.push(clef);
            valeurChamps.push(produit);

            // C59, C61, C62, C66, C67
            ["C59", "C61", "C62", "C66", "C67"].forEach(ref => {
                let cellVal = sheet[ref];
                let val = sheet[XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + 2 + id2, r: XLSX.utils.decode_cell(ref).r})];
                nomChamps.push(cellVal ? cellVal.v : null);
                valeurChamps.push(val ? val.v : null);
            });

            // C7:C21
            for (let r = 7; r <= 21; r++) {
                let ref = `C${r}`;
                let ref2=`D${r}`;
                let cellVal = sheet[ref];
                let val= sheet[ref2];
                nomChamps.push(cellVal ? cellVal.v : null);
                valeurChamps.push(val ? val.v : null);
            }
            //M19
            let x = `M19`;
            let y = `O19`;
            let cellx = sheet[x];
            let valy = sheet[y];
            nomChamps.push(cellx ? cellx.v : null);
            valeurChamps.push(valy ? valy.v : null);

            //M22
            let refM22 = `M22`;
            let ref2M22= `O22`;
            let cellM22 = sheet[refM22];
            let valM22= sheet[ref2M22];
            nomChamps.push(cellM22 ? cellM22.v : null);
            valeurChamps.push(valM22 ? valM22.v : null);
            
            //C25
            let refC25 = `C25`;
            let refD25= `D25`;
            let cellC25 = sheet[refC25];
            let valD25= sheet[refD25];
            nomChamps.push(cellC25 ? cellC25.v : null);
            valeurChamps.push(valD25 ? valD25.v : null);

            const transposed = {};
            nomChamps.forEach((champ, idx) => {
                transposed[champ] = valeurChamps[idx];
            });
            results.push(transposed);
        
           
        }

      
    }
    return results;
}

/**
 * Extrait les données de synthèse du fichier XLSB depuis la feuille "Fiche_Synthèse"
 * @param {File|ArrayBuffer|Uint8Array} file - Fichier XLSB à lire
 * @returns {Promise<Array<object>>} - Liste des objets extraits
 */
async function extraire_synthese(file) {
    const workbook = await readXlsbFile(file);
    const sheet = workbook.Sheets["Fiche_Synthèse"];
    if (!sheet) return [];

    // Exemple : extraction de la plage G4:K4
    const startCol = XLSX.utils.decode_col("G");
    const endCol = XLSX.utils.decode_col("K");
    const row = 4;
    const results = [];

    for (let col = startCol; col <= endCol; col++) {
        const cellAddr = {c: col, r: row - 1};
        const cellRef = XLSX.utils.encode_cell(cellAddr);
        const cell = sheet[cellRef];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
            const id = file.name || file.path || "";
            const id2 = (col - startCol + 1);
            const clef = `${id}&_${id2}`;
            const produit = cell.v;

            const nomChamps = ["id", "id2", "clef", "produit"];
            const valeurChamps = [id, id2, clef, produit];

            // F19:F28
            for (let r = 19; r <= 28; r++) {
                const ref = `F${r}`;
                const cell = sheet[ref];
                nomChamps.push(cell ? cell.v : null);
                const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + id2, r: XLSX.utils.decode_cell(ref).r});
                const val = sheet[valRef];
                valeurChamps.push(val ? val.v : null);
            }
            // F31:F34
            for (let r = 31; r <= 34; r++) {
                const ref = `F${r}`;
                const cell = sheet[ref];
                nomChamps.push(cell ? cell.v : null);
                const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + id2, r: XLSX.utils.decode_cell(ref).r});
                const val = sheet[valRef];
                valeurChamps.push(val ? val.v : null);
            }
            // F87:F89
            for (let r = 87; r <= 89; r++) {
                const ref = `F${r}`;
                const cell = sheet[ref];
                nomChamps.push(cell ? cell.v : null);
                const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + id2, r: XLSX.utils.decode_cell(ref).r});
                const val = sheet[valRef];
                valeurChamps.push(val ? val.v : null);
            }
            // D136:D139
            for (let r = 136; r <= 139; r++) {
                const ref = `D${r}`;
                const cell = sheet[ref];
                nomChamps.push(cell ? cell.v : null);
                const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + 2 + id2, r: XLSX.utils.decode_cell(ref).r});
                const val = sheet[valRef];
                valeurChamps.push(val ? val.v : null);
            }

            // D144:D146
            for (let r = 144; r <= 146; r++) {
                const ref = `D${r}`;
                const cell = sheet[ref];
                nomChamps.push(cell ? cell.v : null);
                const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + 2 + id2, r: XLSX.utils.decode_cell(ref).r});
                const val = sheet[valRef];
                valeurChamps.push(val ? val.v : null);
            }

            const transposed = {};
            nomChamps.forEach((champ, idx) => {
                transposed[champ] = valeurChamps[idx];
            });
            results.push(transposed);
        }
    }
    // Effectuer la jointure après la boucle
    const identif = await extraire_identif(file);
    const joined = join_table(results, identif, 'clef');
    return joined;
}



/**
 * Extrait les données de synthèse du fichier XLSB depuis la feuille "Fiche_Synthèse"
 * @param {File|ArrayBuffer|Uint8Array} file - Fichier XLSB à lire
 * @returns {Promise<Array<object>>} - Liste des objets extraits
 */
async function extraire_loyer(file) {
    const workbook = await readXlsbFile(file);
    const sheet = workbook.Sheets["LoyersEtCharges"];
    if (!sheet) return [];

  
    const results = [];
    

    // plage C16:T55
    for (let r = 16; r <= 55; r++) {
        const result = {};


        ref = `C${r}`;
        cell = sheet[ref];
        nomChamps=cell ? 'produit' : null;
        if (cell && cell.v === 0) break;
        valeurChamps=(cell ? cell.v : null);
        result[nomChamps] = valeurChamps;

        ref = `D${r}`;
        cell = sheet[ref];
        nomChamps=cell ? 'typologie' : null;
        valeurChamps=cell ? cell.v : null;
        result[nomChamps]=valeurChamps;

        for (let c= 4; c <= 20; c++) {
                ref = XLSX.utils.encode_cell({c: c, r: 14});
                const cell = sheet[ref];
                nomChamps = cell ? cell.v : null;
                const valRef = XLSX.utils.encode_cell({c: c, r: r-1});
                const val = sheet[valRef];
                valeurChamps = val ? val.v : null;
                result[nomChamps] = valeurChamps;

        }

        results.push(result);
    }
    
    // Effectuer la jointure après la boucle
    const identif = await extraire_identif(file);
    const joined = join_table(results, identif, 'produit');
    return joined;
}

/**
 * Extrait les données de synthèse du fichier XLSB depuis la feuille "Fiche_Synthèse"
 * @param {File|ArrayBuffer|Uint8Array} file - Fichier XLSB à lire
 * @returns {Promise<Array<object>>} - Liste des objets extraits
 */
async function extraire_prp_3(file) {
    const workbook = await readXlsbFile(file);
    const nomChamps = [];
    const valeurChamps = [];
    const results = [];
    for (let i= 1; i <= 5; i++){
        const feuille=`PRP CE SE_${i}`;
        const sheet = workbook.Sheets[feuille];
        // accès à la cellule U7 :
        const ref = `V7`;
        const cellU7 = sheet[ref];
        // Vous pouvez utiliser cellU7.v pour obtenir la valeur, si besoin
        if (cellU7.v !== "" && cellU7.v !== null && cellU7.v !== undefined) {
            nomChamps.push('produit');
            valeurChamps.push(cellU7.v);

            // D12:D15
            for (let r = 12; r <= 15; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Terrain_' + (cell2 ? cell2.v : null));
                }
            }   
            // D18:D22
            for (let r = 18; r <= 22; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                   
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Terrain_' + (cell2 ? cell2.v : null));
                }
            }
            // D25:D29
            for (let r = 25; r <= 29; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Raccordement_' + (cell2 ? cell2.v : null));
                }   
            }
            // D32:D37
            for (let r = 32; r <= 37; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Charge Foncière_' + (cell2 ? cell2.v : null));
                }
            }
            // D40:D45
            for (let r = 40; r <= 45; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Taxes et Divers_' + (cell2 ? cell2.v : null));
                }
            }
            // D48:D51
            for (let r = 48; r <= 51; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Frais Foncier_' + (cell2 ? cell2.v : null));
                }
            }
            // D54:D55
            for (let r = 54; r <= 55; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total de construction en charge foncière_' + (cell2 ? cell2.v : null));
                }
            }
            // D59:D84
            for (let r = 59; r <= 84; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total construction_' + (cell2 ? cell2.v : null));
                }
            }
            // D87:D103
            for (let r = 87; r <= 103; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                   
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Honoraires Techniques_' + (cell2 ? cell2.v : null));
                }
            }
            // D106:D113
            for (let r = 106; r <= 113; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Total Actualisation Imprevus_' + (cell2 ? cell2.v : null));
                }
            }
            // D123:D127
            for (let r = 123; r <= 127; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Autres Charges Non Immobilisees_' + (cell2 ? cell2.v : null));
                }
            }
            // D137:D143
            for (let r = 137; r <= 143; r++) {
                const ref = `J${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    
                    valeurChamps.push(cell ? cell.v : null);
                    const ref2 = `D${r}`;
                    const cell2 = sheet[ref2];
                    nomChamps.push('Complement Accession_' + (cell2 ? cell2.v : null));
                }
            }
            const transposed = {};
            nomChamps.forEach((champ, idx) => {
                transposed[champ] = valeurChamps[idx];
            });
            results.push(transposed);
        }
    }

    // Effectuer la jointure après la boucle
    const identif = await extraire_identif(file);
    const joined = join_table(results, identif, 'produit');
    return joined;
    }


/**
 * Extrait les données de synthèse du fichier XLSB depuis la feuille "Fiche_Synthèse"
 * @param {File|ArrayBuffer|Uint8Array} file - Fichier XLSB à lire
 * @returns {Promise<Array<object>>} - Liste des objets extraits
 */
async function extraire_financements(file) {
    const workbook = await readXlsbFile(file);
    const sheet = workbook.Sheets["Financement"];
    if (!sheet) return [];

    // Exemple : extraction de la plage J8:N8
    const startCol = XLSX.utils.decode_col("J");
    const endCol = XLSX.utils.decode_col("N");
    const row = 8;
    const results = [];

    for (let col = startCol; col <= endCol; col++) {
        const cellAddr = {c: col, r: row - 1};
        const cellRef = XLSX.utils.encode_cell(cellAddr);
        const cell = sheet[cellRef];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
            const id = file.name || file.path || "";
            const id2 = (col - startCol + 1);
            const clef = `${id}&_${id2}`;
            const produit = cell.v;

            const nomChamps = ["id", "id2", "clef", "produit"];
            const valeurChamps = [id, id2, clef, produit];

            // E14:E33
            for (let r = 14; r <= 33; r++) {
                const ref = `E${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    nomChamps.push('Subventions_' + (cell ? cell.v : null));
                    const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + 4 + id2, r: XLSX.utils.decode_cell(ref).r});
                    const val = sheet[valRef];
                    valeurChamps.push(val ? val.v : null);
                }
            }
            // F36:F45
            for (let r = 36; r <= 45; r++) {
                const ref = `F${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    nomChamps.push('Fonds Propres_' + (cell ? cell.v : null));
                    const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + 3 + id2, r: XLSX.utils.decode_cell(ref).r});
                    const val = sheet[valRef];
                    valeurChamps.push(val ? val.v : null);
                }
            }

            //F47:F71
            for (let r = 47; r <= 71; r++) {
                const ref = `F${r}`;
                const cell = sheet[ref];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                    nomChamps.push('Prêts_' + (cell ? cell.v : null));
                    const valRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_cell(ref).c + 3 + id2, r: XLSX.utils.decode_cell(ref).r});
                    const val = sheet[valRef];
                    valeurChamps.push(val ? val.v : null);
                }
            }
            const transposed = {};
            nomChamps.forEach((champ, idx) => {
                transposed[champ] = valeurChamps[idx];
            });
            results.push(transposed);
        }
    }
    // Effectuer la jointure après la boucle
    const identif = await extraire_identif(file);
    const joined = join_table(results, identif, 'clef');
    return joined;
}

/**
 * consolidation des données, la function renvoie un json operation à rétuliser dans le code
 *  * @returns {Promise<void>}
 */
async function consolidation_data(file) {
    const [identif, synthese, prp, financements, loyer] = await Promise.all([
        extraire_identif(file),
        extraire_synthese(file),
        extraire_prp_3(file),
        extraire_financements(file),
        extraire_loyer(file)
    ]);
    const data = {
        identif,
        synthese,
        prp,
        financements,
        loyer
    };
    const json = JSON.stringify(data, null, 2);
    localStorage.setItem('consolidation_data', json);
   return json;
}


/**
 * Exporte les données extraites dans un fichier bdd.json dans /webapp
 * @returns {Promise<void>}
 */
async function export_data(file) {
    const [identif, synthese, prp, financements, loyer] = await Promise.all([
        extraire_identif(file),
        extraire_synthese(file),
        extraire_prp_3(file),
        extraire_financements(file),
        extraire_loyer(file)
    ]);
    const data = {
        identif,
        synthese,
        prp,
        financements,
        loyer
    };
    const json = JSON.stringify(data, null, 2);

    // Appel à l'API PHP pour sauvegarder le JSON
    const response = await fetch('api/bdd_sauvegarde.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: json
    });
    if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde du fichier JSON');
    }
    return await response.json();
}

// Export pour usage dans d'autres scripts
window.export_data = export_data;

/**
 * Effectue une jointure interne (inner join) de deux tableaux d'objets sur une clé commune
 * @param {Array<object>} table1 - Premier tableau d'objets
 * @param {Array<object>} table2 - Deuxième tableau d'objets
 * @param {string} clef - Nom de la propriété utilisée pour la jointure
 * @returns {Array<object>} - Tableau d'objets fusionnés
 */
function join_table(table1, table2, clef) {
    const map2 = new Map(table2.map(obj => [obj[clef], obj]));
    return table1
        .filter(obj1 => map2.has(obj1[clef]))
        .map(obj1 => ({ ...obj1, ...map2.get(obj1[clef]) }));
}

// Export pour usage dans d'autres scripts
window.extraire_identif = extraire_identif;
window.extraire_synthese = extraire_synthese;
window.extraire_prp_3 = extraire_prp_3;
window.extraire_financements = extraire_financements;
window.extraire_loyer = extraire_loyer;
window.consolidation_data = consolidation_data;
