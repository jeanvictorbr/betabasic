// handlers/buttons/aut_mass_execute_final.js
const startMassRoleTask = require('../../utils/massRoleTask.js');

module.exports = {
    customId: 'aut_mass_execute_final',
    async execute(interaction) {
        const cacheKey = `mass_role_${interaction.user.id}_${interaction.guild.id}`;
        const data = interaction.client.massRoleCache?.get(cacheKey);

        if (!data) {
            return interaction.update({ content: '❌ Erro: Dados não encontrados. Tente novamente.', components: [], embeds: [] });
        }

        await interaction.update({ 
            content: '✅ **Processo Iniciado!**\nO bot está aplicando os cargos em segundo plano. Você será notificado no canal de logs (se configurado) ou pode acompanhar pelos cargos aparecendo.', 
            components: [], 
            embeds: [] 
        });

        // Chama a função utilitária com o filtro
        startMassRoleTask(interaction.guild, {
            action: 'add',
            roleId: data.roleToAdd,
            filterRoles: data.filterRoles, // Array de IDs ou vazio
            initiatorId: interaction.user.id
        });

        // Limpa o cache
        interaction.client.massRoleCache.delete(cacheKey);
    }
};