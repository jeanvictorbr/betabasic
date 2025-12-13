// handlers/buttons/tkt_role_toggle_.js
const generateRoleSelector = require('../../ui/ticketRoleSelector.js');

module.exports = {
    // O ID vem como 'tkt_role_toggle_123456789'
    customId: 'tkt_role_toggle_',
    async execute(interaction) {
        const tempId = interaction.user.id;
        const data = interaction.client.tempDeptData?.get(tempId);

        if (!data) {
            return interaction.update({ content: '❌ Sessão expirada. Use /configurar novamente.', components: [], embeds: [] });
        }

        // Extrai o ID do cargo clicado
        const roleId = interaction.customId.replace('tkt_role_toggle_', '');

        // Lógica de Toggle (Adiciona ou Remove)
        if (data.selectedIds.includes(roleId)) {
            data.selectedIds = data.selectedIds.filter(id => id !== roleId);
        } else {
            // Limite de segurança (opcional, ex: max 25 cargos)
            if (data.selectedIds.length >= 25) {
                return interaction.reply({ content: '⚠️ Você atingiu o limite de cargos selecionados.', ephemeral: true });
            }
            data.selectedIds.push(roleId);
        }

        // Atualiza o cache
        interaction.client.tempDeptData.set(tempId, data);

        // Regenera a UI com o novo estado
        const payload = generateRoleSelector(
            data.name, 
            data.availableRoles, 
            data.selectedIds, 
            data.currentPage
        );

        await interaction.update(payload);
    }
};