//fonctions qui appelle danfos.js pour structurer des tableaux necessaires aux pages

/**
 * Crée un DataFrame à partir des données bddData pour la synthèse 1
 * @returns {Promise<dfd.DataFrame>} Une promesse qui se résout avec le DataFrame créé
 */
async function creer_table_synthese_1(bddData) {
    try {
        // Vérifier que bddData est disponible
        if (typeof bddData === 'undefined' || bddData === null) {
            console.error('Erreur: bddData n\'est pas défini');
            return null;
        }

        console.log('Création du DataFrame à partir de bddData:', bddData);
        
        const dfd = window.dfd;
  
        // Aplatir les synthèses
        let flatData = [];
        for (const operation of bddData.operations) {
          if (operation.synthese && Array.isArray(operation.synthese)) {
            flatData.push(...operation.synthese);  // fusionne les tableaux
          }
        }
  
        // Créer le DataFrame
        let df = new dfd.DataFrame(flatData);
        console.log('Colonnes:', df.columns);
  
        // Groupby et agrégation
        let df_synthese = df.groupby(['Stat Société']).agg({
          'id2': ['count'],
          'Equivalent logements': ['sum'],
          'Nbre de M² SHab': ['sum'],
          'Total': ['sum'],
          'Loyers bruts': ['sum'],
          'Subventions': ['sum'],
          'EBE / Loyers potentiels Cumulés': ['mean'],
          'Service de la Dette / Loyers potentiels Cumulés': ['mean'],
          'Taux d\'Autofinancement': ['mean']
        });
  
        // Colonnes corrigées après groupby
        const col = name => df_synthese.column(name);  // alias pratique
  
        // Ajouter colonnes calculées
        df_synthese.addColumn("Prix au m²", col("Total_sum").div(col("Nbre de M² SHab_sum")));
        df_synthese.addColumn("Prix par logement", col("Total_sum").div(col("Equivalent logements_sum")));
        df_synthese.addColumn("Loyer mensuel moyen", col("Loyers bruts_sum").div(col("Equivalent logements_sum")).div(12));
        df_synthese.addColumn("Taux de subventionnement", col("Subventions_sum").div(col("Total_sum")));
  
        result=dfd.toJSON(df_synthese, { format: "row" });
        return result;
        
    } catch (error) {
        console.error('Erreur dans creer_table_synthese_1:', error);
        throw error; // Propager l'erreur pour qu'elle puisse être gérée par l'appelant
    }
}

