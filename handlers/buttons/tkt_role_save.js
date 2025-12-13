// handlers/buttons/tkt_role_save.js
const db = require('../../database.js');
const generateSuccessUI = require('../../ui/ticketDepartmentSuccess.js'); // Usando o arquivo que criamos antes

module.exports = {
    customId: 'tkt_role_save',
    async execute(interaction) {
        const data = interaction.client.tempDeptData?.get(interaction.user.id);

        if (!data) return interaction.update({ content: '❌ Erro: Dados não encontrados.', components: [] });

        if (data.selectedIds.length === 0) {
            return interaction.reply({ content: '⚠️ Selecione pelo menos um cargo antes de salvar.', ephemeral: true });
        }

        try {
            // Prepara o JSONB
            const rolesJson = JSON.stringify(data.selectedIds);

            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, data.name, data.description, data.emoji, rolesJson]
            );

            interaction.client.tempDeptData.delete(interaction.user.id);

            // Usa a UI de sucesso limpa (sem content)
            const payload = generateSuccessUI(data.name, data.selectedIds);
            
            await interaction.update(payload);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Erro fatal ao salvar no banco.', ephemeral: true });
        }
    }
};