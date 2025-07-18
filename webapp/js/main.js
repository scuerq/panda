// main.js : gestion de l'upload AJAX et affichage Tabulator
$(function() {
    $('#uploadForm').on('submit', function(e) {
        e.preventDefault();
        const fileInput = $('#fileInput')[0];
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        // Désactiver le bouton pendant l'upload
        const btn = $(this).find('button[type="submit"]');
        btn.prop('disabled', true).text('Chargement...');

        $.ajax({
            url: 'api/upload.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Lecture locale du fichier pour extraction et affichage
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        try {
                            const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
                            const sheetName = workbook.SheetNames[0];
                            const sheet = workbook.Sheets[sheetName];
                            const data = XLSX.utils.sheet_to_json(sheet, {header:1});
                            if (data.length === 0) {
                                alert('Aucune donnée trouvée dans le fichier.');
                                return;
                            }
                            const headers = data[0];
                            const rows = data.slice(1).map(row => {
                                const obj = {};
                                headers.forEach((h, i) => obj[h || `Col${i+1}`] = row[i]);
                                return obj;
                            });
                            const columns = headers.map((h, i) => ({title: h || `Col${i+1}`, field: h || `Col${i+1}`}));
                            new Tabulator("#tabulator-table", {
                                data: rows,
                                columns: columns,
                                layout: "fitDataStretch",
                                responsiveLayout: true,
                                pagination: true,
                                paginationSize: 20,
                            });
                        } catch (err) {
                            alert('Erreur lors de la lecture du fichier : ' + err.message);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert(response.error || 'Erreur inconnue lors de l\'upload.');
                }
            },
            error: function(xhr) {
                alert('Erreur serveur : ' + (xhr.responseJSON?.error || xhr.statusText));
            },
            complete: function() {
                btn.prop('disabled', false).text('Extraire et afficher');
            }
        });
    });
});
