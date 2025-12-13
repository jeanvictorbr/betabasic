// handlers/selects/select_new_department_role.js
const db = require('../../database.js');
const getTicketsMenu = require('../../ui/ticketsMenu.js'); 

module.exports = {
    customId: 'select_new_department_role',
    async execute(interaction) {
        const tempData = interaction.client.tempDeptData?.get(interaction.user.id);
        
        if (!tempData) {
            return interaction.update({ content: '❌ Tempo esgotado ou erro nos dados. Comece novamente.', components: [] });
        }

        const roleIds = interaction.values; // Agora é um array de IDs
        const rolesJson = JSON.stringify(roleIds);

        try {
            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, tempData.name, tempData.description, tempData.emoji, rolesJson]
            );

            interaction.client.tempDeptData.delete(interaction.user.id);

            // Atualiza o menu principal
            const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0];
            const departments = (await db.query('SELECT * FROM ticket_departments WHERE guild_id = $1', [interaction.guild.id])).rows;
            
            const ui = getTicketsMenu(settings, departments);

            // [CORREÇÃO CRÍTICA]
            // Se 'ui' já traz tudo configurado, passamos ele direto.
            // Se precisamos enviar uma mensagem de sucesso, é melhor usar followUp ou editar o content DENTRO do objeto ui se possível.
            // Aqui vamos reconstruir o objeto de update para evitar conflito de flags.
            
            await interaction.update({
                content: `✅ **Departamento Criado!**\nCargos vinculados: ${roleIds.map(r => `<@&${r}>`).join(', ')}`, // Mostra feedback no content
                embeds: ui.embeds,
                components: ui.components,
                // Removemos flags manuais para deixar o discord gerenciar ou as que vêm do ui
            });

        } catch (error) {
            console.error(error);
            // Em caso de erro, tenta enviar uma mensagem efêmera nova se o update falhar
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao salvar no banco de dados.', ephemeral: true });
            }
        }
    }
};