const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'dev_flow_add_item',
    async execute(interaction) {
        // Lista de Features do Sistema (Você pode adicionar mais aqui)
        const features = [
            { label: 'Módulo Automações', value: 'AUTOMATIONS', description: 'Forms, Sorteios, Voz, Purge', emoji: '🤖' },
            { label: 'Visuais Personalizados', value: 'CUSTOM_VISUALS', description: 'Cores, Imagens de Welcome/Leave', emoji: '🎨' },
            { label: 'IA Assistente', value: 'AI_ASSISTANT', description: 'Respostas inteligentes em Tickets/Chat', emoji: '🧠' },
            { label: 'Loja Premium', value: 'STORE_PREMIUM', description: 'Sem taxas, logs avançados', emoji: '🛒' },
            { label: 'Moderação Avançada', value: 'ADVANCED_MOD', description: 'Guardian AI, Auditoria', emoji: '🛡️' }
        ];

        const select = new StringSelectMenuBuilder()
            .setCustomId('dev_flow_select_feature')
            .setPlaceholder('Selecione a funcionalidade que será vendida')
            .addOptions(features);

        await interaction.reply({
            content: "🛠️ **Passo 1/2:** Qual funcionalidade este produto vai liberar?",
            components: [new ActionRowBuilder().addComponents(select)],
            ephemeral: true
        });
    }
};