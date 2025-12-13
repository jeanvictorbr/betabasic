const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'aut_btn_send_panel_',
    async execute(interaction) {
        const panelId = interaction.customId.split('_')[4]; // aut_btn_send_panel_ID
        const panel = (await db.query('SELECT * FROM button_role_panels WHERE panel_id = $1', [panelId])).rows[0];

        if (!panel.roles_data || panel.roles_data.length === 0) {
            return interaction.reply({ content: '❌ Adicione pelo menos um cargo antes de enviar.', ephemeral: true });
        }

        const embed = {
            title: panel.title,
            description: panel.description,
            color: 0x2B2D31,
            image: panel.image_url ? { url: panel.image_url } : null,
            footer: { text: 'Sistema de Auto-Cargos' }
        };

        const options = panel.roles_data.slice(0, 25).map(r => ({
            label: r.label,
            value: r.role_id,
            emoji: r.emoji
        }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId('aut_role_system_interact') // O ID REAL que dá cargos
            .setPlaceholder('▼ Clique para selecionar seus cargos')
            .setMinValues(0)
            .setMaxValues(options.length)
            .addOptions(options);

        await interaction.channel.send({ 
            embeds: [embed], 
            components: [new ActionRowBuilder().addComponents(menu)] 
        });

        await interaction.reply({ content: '✅ Painel enviado com sucesso!', ephemeral: true });
    }
};