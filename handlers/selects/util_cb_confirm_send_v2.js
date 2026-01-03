// File: handlers/selects/util_cb_confirm_send_v2.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'util_cb_confirm_send_v2',
    execute: async (interaction) => {
        const channelId = interaction.values[0];
        const currentState = interaction.client.containerState?.get(interaction.user.id);

        if (!currentState || currentState.items.length === 0) {
            return interaction.update({ content: "❌ Nada para enviar (Container vazio).", components: [] });
        }

        try {
            const channel = await interaction.guild.channels.fetch(channelId);

            // Constrói os componentes finais para envio real
            const finalComponents = currentState.items.map(item => {
                if (item.type === 'header') return { type: 10, content: `## ${item.content}` };
                if (item.type === 'text_bar') return { type: 10, content: `> ${item.content}` };
                if (item.type === 'text_raw') return { type: 10, content: item.content };
                if (item.type === 'divider') return { type: 10, content: "─────────────────────────" };
                if (item.type === 'spacer') return { type: 10, content: " " };
                if (item.type === 'image') return { type: 10, content: item.url }; // Tenta renderizar URL
                return null;
            }).filter(c => c !== null);

            // Envia mensagem V2
            await interaction.client.rest.post(`/channels/${channelId}/messages`, {
                body: {
                    flags: V2_FLAG,
                    components: finalComponents
                }
            });

            await interaction.update({ content: `✅ Container V2 enviado para ${channel}!`, components: [] });

        } catch (error) {
            console.error(error);
            await interaction.update({ content: `❌ Erro ao enviar: ${error.message}`, components: [] });
        }
    }
};