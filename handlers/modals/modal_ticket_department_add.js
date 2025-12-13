const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // Salva no cache temporário
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        interaction.client.tempDeptData.set(tempId, { name, description, emoji });

        // CRIAÇÃO DO MENU DE SELEÇÃO
        const select = new RoleSelectMenuBuilder()
            .setCustomId('select_new_department_role')
            .setPlaceholder('Selecione os cargos (Pode marcar vários)')
            .setMinValues(1)
            .setMaxValues(25); // <--- ISSO PERMITE SELECIONAR VÁRIOS

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: `✨ Configurando departamento **${name}**.\nAgora, selecione quais cargos poderão **ver e responder** os tickets desta categoria:`,
            components: [row],
            ephemeral: true
        });
    }
};