// File: handlers/selects/util_cb_confirm_send.js
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'util_cb_confirm_send',
    execute: async (interaction) => {
        const channelId = interaction.values[0];
        const draftContainer = interaction.client.containerDrafts?.get(interaction.user.id);

        if (!draftContainer) {
            return interaction.update({ content: "❌ Container expirado.", components: [] });
        }

        try {
            const channel = await interaction.guild.channels.fetch(channelId);
            
            // Prepara a mensagem final para o canal
            // O container V2 (Type 9) é enviado como um componente dentro do body
            const finalMessage = {
                type: 17,
                body: {
                    type: 1,
                    flags: V2_FLAG,
                    components: [ draftContainer ] // Envia apenas o container criado
                }
            };
            
            // ATENÇÃO: Para enviar uma mensagem V2 nova, usamos o endpoint de criar mensagem normal,
            // mas passando as flags V2 se a lib suportar, ou construindo o payload raw.
            // O Discord.js v14 ainda não tem suporte nativo para `channel.send({ type: 17 })`.
            // Workaround: Usar a API raw via REST se necessário, ou enviar como mensagem normal se o container for compatível.
            
            // SE O DISCORD AINDA NÃO SUPORTAR ENVIAR TYPE 17 via BOT em CANAL DE TEXTO (apenas via interação):
            // Nós enviamos como uma mensagem com componentes.
            
            // Tentativa via API Raw (mais seguro para V2):
            await interaction.client.rest.post(`/channels/${channelId}/messages`, {
                body: {
                    flags: V2_FLAG, // Importante
                    components: [ draftContainer ] // O Container Type 9 vai aqui
                }
            });

            interaction.client.containerDrafts.delete(interaction.user.id);

            await interaction.update({ 
                content: `✅ Container enviado para ${channel}!`, 
                components: [] 
            });

        } catch (error) {
            console.error(error);
            await interaction.update({ content: `❌ Erro ao enviar: ${error.message}`, components: [] });
        }
    }
};