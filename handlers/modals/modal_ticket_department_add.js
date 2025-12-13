// handlers/modals/modal_ticket_department_add.js
const generateRoleSelector = require('../../ui/ticketRoleSelector.js');

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // 1. Pega todos os cargos do servidor, exceto @everyone e bots (opcional)
        // Ordenamos por posição para ficar organizado
        const allRoles = interaction.guild.roles.cache
            .filter(r => r.id !== interaction.guild.id && !r.managed) 
            .sort((a, b) => b.position - a.position)
            .map(r => ({ name: r.name, id: r.id }));

        // 2. Salva no cache temporário
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        
        interaction.client.tempDeptData.set(tempId, { 
            name, 
            description, 
            emoji,
            availableRoles: allRoles, // Guardamos a lista para navegar
            selectedIds: [], // Começa vazio
            currentPage: 0
        });

        // 3. Gera a UI
        const payload = generateRoleSelector(name, allRoles, [], 0);

        await interaction.reply(payload);
    }
};