const manageMembers = require('./aut_oauth_manage_members.js');

module.exports = {
    // O index.js usa startsWith, então definimos o prefixo aqui
    customId: 'oauth_page_',
    
    async execute(interaction) {
        // Formato: oauth_page_NUMERO
        const parts = interaction.customId.split('_');
        const page = parseInt(parts[2]);
        
        if (isNaN(page)) return interaction.deferUpdate(); // Botão do meio (contador)
        
        // Chama a função de carga do arquivo principal
        // Se der erro aqui, verifique se você adicionou o 'module.exports.loadMembersPage' no outro arquivo
        if (manageMembers.loadMembersPage) {
            await manageMembers.loadMembersPage(interaction, page);
        } else {
            await interaction.reply({ content: "❌ Erro interno: Função de paginação não exportada.", ephemeral: true });
        }
    }
};