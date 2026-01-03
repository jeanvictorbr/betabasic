// File: handlers/buttons/util_eb_start.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            // Define o embed inicial
            const initialEmbed = {
                title: "Novo Container",
                description: "Edite este container usando os botões abaixo.",
                color: 0x5865F2,
                footer: { text: "Criado com BasicFlow" }
            };

            // Gera o payload (Objeto de mensagem padrão)
            const payload = embedBuilderPanel(initialEmbed);

            // IMPORTANTE: Ao usar update() aqui sem flags, o Discord substitui a mensagem V2 anterior
            // por esta mensagem padrão que suporta Embeds.
            await interaction.update(payload);
        } catch (error) {
            console.error("Erro ao iniciar editor:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "❌ Erro ao abrir o editor.", ephemeral: true });
            }
        }
    }
};