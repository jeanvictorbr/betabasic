// handlers/modals/modal_ticket_department_add.js
const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        // Recupera os dados temporários do modal (Nome, Descrição, Emoji)
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // Salva temporariamente no client ou passa via cache (aqui simplificado para passar via Select)
        // Para simplificar, vamos salvar um registro temporário ou usar cache. 
        // Como o select é a próxima etapa, vamos armazenar os dados no cache do cliente para recuperar no próximo passo.
        
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        interaction.client.tempDeptData.set(tempId, { name, description, emoji });

        const select = new RoleSelectMenuBuilder()
            .setCustomId('select_new_department_role')
            .setPlaceholder('Selecione os cargos responsáveis (Admin/Suporte)')
            .setMinValues(1)
            .setMaxValues(10); // [MODIFICADO] Permite até 10 cargos

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: `✨ Configurando departamento **${name}**.\nAgora, selecione quais cargos poderão **ver e responder** os tickets desta categoria:`,
            components: [row],
            ephemeral: true
        });
    }
};