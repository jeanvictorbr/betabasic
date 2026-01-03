// File: handlers/buttons/util_eb_start.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            const initialEmbed = {
                title: "Título do Novo Container",
                description: "Clique nos botões abaixo para começar a editar este conteúdo.",
                color: 0x5865F2, 
                footer: { text: "Criado via BasicFlow Builder" }
            };
            
            const payload = embedBuilderPanel(initialEmbed);
            // ✅ CORREÇÃO: Enviar apenas o body
            await interaction.update(payload.body);
        } catch (error) {
            console.error("Erro ao iniciar builder:", error);
            if (!interaction.replied) await interaction.reply({ content: "❌ Erro ao abrir o builder.", ephemeral: true });
        }
    }
};