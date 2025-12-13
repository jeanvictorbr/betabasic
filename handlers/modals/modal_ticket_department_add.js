// handlers/modals/modal_ticket_department_add.js
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

        // [CORREÇÃO VISUAL] 
        // setMaxValues(25) faz o menu virar a "caixinha preta" de múltipla escolha.
        const select = new RoleSelectMenuBuilder()
            .setCustomId('select_new_department_role')
            .setPlaceholder('Selecione os cargos (Pode marcar vários)')
            .setMinValues(1)
            .setMaxValues(25); // Máximo permitido pelo Discord

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: `✨ Configurando departamento **${name}**.\nAgora, selecione quais cargos poderão **ver e responder** os tickets desta categoria:`,
            components: [row],
            ephemeral: true
        });
    }
};