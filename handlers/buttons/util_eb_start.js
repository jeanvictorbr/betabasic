// File: handlers/buttons/util_eb_start.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            const initialEmbed = {
                title: "Novo Container",
                description: "Edite este container usando os botões abaixo.",
                color: 0x5865F2,
                footer: { text: "Criado com BasicFlow" }
            };

            const payload = embedBuilderPanel(initialEmbed);

            // ✅ CORREÇÃO DEFINITIVA:
            // Usamos .reply() em vez de .update().
            // Motivo: Não é possível converter uma mensagem V2 (o menu) em uma mensagem 
            // padrão (que suporta embeds) via edição. Criamos uma nova mensagem.
            await interaction.reply({ 
                ...payload, 
                ephemeral: true 
            });

        } catch (error) {
            console.error("Erro ao iniciar editor:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "❌ Erro crítico ao abrir o editor.", ephemeral: true });
            }
        }
    }
};