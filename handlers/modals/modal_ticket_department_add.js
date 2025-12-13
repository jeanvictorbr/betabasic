// handlers/modals/modal_ticket_department_add.js
const generateRoleSelector = require('../../ui/ticketRoleSelector.js');

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        // 1. Captura os dados do formulário
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // 2. Carrega TODOS os cargos do servidor para a grade
        // Removemos o @everyone (id igual ao guild.id) e cargos de bots (managed)
        const allRoles = interaction.guild.roles.cache
            .filter(r => r.id !== interaction.guild.id && !r.managed) 
            .sort((a, b) => b.position - a.position) // Ordena por hierarquia
            .map(r => ({ name: r.name, id: r.id }));

        // 3. Salva no cache temporário
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        
        interaction.client.tempDeptData.set(tempId, { 
            name, 
            description, 
            emoji,
            availableRoles: allRoles, // Lista completa
            selectedIds: [], // Começa vazio
            currentPage: 0 // Página 0
        });

        // 4. Gera a NOVA UI de Botões (Substituindo o antigo Select Menu)
        const payload = generateRoleSelector(name, allRoles, [], 0);

        // 5. Envia a resposta (Grade de botões)
        await interaction.reply(payload);
    }
};