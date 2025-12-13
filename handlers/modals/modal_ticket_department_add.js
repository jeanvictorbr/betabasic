// handlers/modals/modal_ticket_department_add.js
const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // Salva no cache
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        interaction.client.tempDeptData.set(tempId, { name, description, emoji });

        // [CORREÇÃO] Habilita múltipla seleção (1 até 10 cargos)
        const select = new RoleSelectMenuBuilder()
            .setCustomId('select_new_department_role')
            .setPlaceholder('Selecione os cargos responsáveis (Admin/Suporte)')
            .setMinValues(1)
            .setMaxValues(10); 

        const row = new ActionRowBuilder().addComponents(select);

        // Removemos flags V2 aqui se estiverem conflitando, usando reply padrão
        await interaction.reply({
            content: `✨ Configurando departamento **${name}**.\nAgora, selecione quais cargos poderão **ver e responder** os tickets desta categoria (você pode escolher mais de um):`,
            components: [row],
            ephemeral: true
        });
    }
};