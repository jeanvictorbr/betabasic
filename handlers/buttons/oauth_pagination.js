const manageMembers = require('./aut_oauth_manage_members.js'); // Importa a função do arquivo principal

// Precisamos exportar a função loadMembersPage do outro arquivo para usar aqui.
// Vá no arquivo aut_oauth_manage_members.js e no final adicione: 
// module.exports.loadMembersPage = loadMembersPage; 
// Mas como o módulo exports já foi definido, o ideal é que a função esteja em um util ou recarregada aqui.

// SOLUÇÃO MAIS SIMPLES: Copiar a logica ou redirecionar.
// Mas para facilitar, vou assumir que você vai editar o aut_oauth_manage_members.js

module.exports = {
    check: (id) => id.startsWith('oauth_page_'),
    async execute(interaction) {
        const page = parseInt(interaction.customId.split('_')[2]);
        if (isNaN(page)) return; // Botão do meio (contador)
        
        // Requer o arquivo original para chamar a função de carga
        // Nota: Isso exige que o arquivo original exporte a função.
        // Se der erro de "is not a function", me avise que fazemos um arquivo utils separado.
        const manager = require('./aut_oauth_manage_members.js');
        if (manager.loadMembersPage) {
            await manager.loadMembersPage(interaction, page);
        } else {
            await interaction.reply({ content: "Erro de navegação. Tente reabrir o menu.", ephemeral: true });
        }
    }
};