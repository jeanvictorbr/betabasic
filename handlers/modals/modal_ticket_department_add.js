// handlers/modals/modal_ticket_department_add.js
const generateRoleSelector = require('../../ui/ticketRoleSelector.js'); // <--- CHAMA A NOVA UI DE BOTÕES

module.exports = {
    customId: 'modal_ticket_department_add',
    async execute(interaction) {
        // 1. Pega os dados digitados no Modal
        const name = interaction.fields.getTextInputValue('input_dept_name');
        const description = interaction.fields.getTextInputValue('input_dept_desc');
        const emoji = interaction.fields.getTextInputValue('input_dept_emoji') || '';

        // 2. Carrega a lista de cargos do servidor para criar os botões
        const allRoles = interaction.guild.roles.cache
            .filter(r => r.id !== interaction.guild.id && !r.managed) // Filtra @everyone e bots
            .sort((a, b) => b.position - a.position)
            .map(r => ({ name: r.name, id: r.id }));

        // 3. Salva no cache temporário para usar nos botões de navegação
        const tempId = interaction.user.id;
        interaction.client.tempDeptData = interaction.client.tempDeptData || new Map();
        
        interaction.client.tempDeptData.set(tempId, { 
            name, 
            description, 
            emoji,
            availableRoles: allRoles,
            selectedIds: [], // Começa vazio
            currentPage: 0
        });

        // 4. Gera a UI de Grade de Botões (V2)
        const payload = generateRoleSelector(name, allRoles, [], 0);

        // 5. Envia a resposta substituindo qualquer coisa anterior
        await interaction.reply(payload);
    }
};