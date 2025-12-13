// handlers/selects/select_new_department_role.js
const db = require('../../database.js');
const generateSuccessUI = require('../../ui/ticketDepartmentCreated.js');

module.exports = {
    customId: 'select_new_department_role',
    async execute(interaction) {
        const tempData = interaction.client.tempDeptData?.get(interaction.user.id);
        
        if (!tempData) {
            // Resposta de erro simples caso perca o cache
            return interaction.update({ 
                content: '❌ Tempo esgotado ou erro nos dados. Por favor, comece o processo novamente.', 
                components: [], 
                embeds: [] 
            });
        }

        // interaction.values já é um ARRAY com os IDs dos cargos selecionados ['123', '456']
        const roleIds = interaction.values; 
        
        // Convertemos para JSON string para salvar no banco (compatível com a coluna JSONB do schema)
        const rolesJson = JSON.stringify(roleIds);

        try {
            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, tempData.name, tempData.description, tempData.emoji, rolesJson]
            );

            // Limpa o cache temporário
            interaction.client.tempDeptData.delete(interaction.user.id);

            // Gera a UI de sucesso (Objeto Puro V2)
            const payload = generateSuccessUI(tempData.name, roleIds);
            
            // Atualiza a mensagem removendo o menu e mostrando o embed
            await interaction.update(payload);

        } catch (error) {
            console.error('Erro ao salvar departamento:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro interno ao salvar no banco de dados.', ephemeral: true });
            }
        }
    }
};