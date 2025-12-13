// handlers/modals/modal_ticket_department_add.js
const { ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // Salva dados temporários
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        interaction.client.tempDeptData.set(tempId, { name, description, emoji });

        // CONSTRUÇÃO MANUAL DO COMPONENTE PARA GARANTIR FUNCIONAMENTO
        // Type 1 = Action Row
        // Type 6 = Role Select Menu
        const componentRow = {
            type: 1, 
            components: [
                {
                    type: 6, // ROLE SELECT MENU
                    custom_id: 'select_new_department_role',
                    placeholder: 'Selecione os cargos responsáveis (Máx 25)',
                    min_values: 1,
                    max_values: 25 // <--- FORÇA A SELEÇÃO MÚLTIPLA
                }
            ]
        };

        // Resposta V2 pura para evitar erros de compatibilidade
        await interaction.reply({
            content: `✨ Configurando departamento **${name}**.\nAgora, selecione quais cargos poderão **ver e responder** os tickets:`,
            components: [componentRow],
            ephemeral: true
        });
    }
};