// File: handlers/buttons/config_open_utilities.js
const utilitiesMenu = require('../../ui/utilities/utilitiesMenu.js');

module.exports = {
    customId: 'config_open_utilities', // O ID deve bater EXATAMENTE com o botão
    execute: async (interaction) => {
        try {
            const payload = utilitiesMenu();
            
            // CORREÇÃO CRÍTICA:
            // O Discord.js precisa dos dados que estão DENTRO de .body
            // Passar o objeto 'payload' inteiro (com type: 17) faz o update falhar silenciosamente
            await interaction.update(payload.body);
            
        } catch (error) {
            console.error("Erro ao abrir menu de utilidades:", error);
            // Feedback visual em caso de erro real
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao carregar o menu. Verifique o console.', ephemeral: true });
            }
        }
    }
};