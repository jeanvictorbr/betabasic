// handlers/selects/select_new_department_role.js
const db = require('../../database.js');
const getTicketsMenu = require('../../ui/ticketsMenu.js'); // Certifique-se de que o caminho está certo

module.exports = {
    customId: 'select_new_department_role',
    async execute(interaction) {
        const tempData = interaction.client.tempDeptData?.get(interaction.user.id);
        
        if (!tempData) {
            return interaction.update({ content: '❌ Tempo esgotado ou erro nos dados. Comece novamente.', components: [] });
        }

        // [MODIFICADO] Pega todos os IDs selecionados e transforma em string JSON
        const roleIds = interaction.values; 
        const rolesJson = JSON.stringify(roleIds);

        try {
            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, tempData.name, tempData.description, tempData.emoji, rolesJson]
            );

            // Limpa cache
            interaction.client.tempDeptData.delete(interaction.user.id);

            // Atualiza o menu principal
            const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0];
            const departments = (await db.query('SELECT * FROM ticket_departments WHERE guild_id = $1', [interaction.guild.id])).rows;
            const ui = getTicketsMenu(settings, departments);

            await interaction.update({ content: '✅ Departamento criado com sucesso!', ...ui });

        } catch (error) {
            console.error(error);
            await interaction.update({ content: '❌ Erro ao salvar no banco de dados.', components: [] });
        }
    }
};