const db = require('../../database.js');
const generateSuccessUI = require('../../ui/ticketDepartmentCreated.js');

module.exports = {
    customId: 'select_new_department_role',
    async execute(interaction) {
        const tempData = interaction.client.tempDeptData?.get(interaction.user.id);
        
        if (!tempData) {
            // Se perder o cache, apenas avisa e remove componentes
            return interaction.update({ 
                content: '❌ Tempo esgotado ou erro nos dados. Comece novamente.', 
                components: [], 
                embeds: [] 
            });
        }

        // interaction.values retorna um ARRAY com todos os IDs selecionados
        const roleIds = interaction.values; 
        
        // Convertemos para JSON string para salvar no banco (compatível com a coluna JSONB)
        const rolesJson = JSON.stringify(roleIds);

        try {
            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, tempData.name, tempData.description, tempData.emoji, rolesJson]
            );

            // Limpa o cache temporário
            interaction.client.tempDeptData.delete(interaction.user.id);

            // Gera a resposta visual usando o arquivo UI V2 (sem content vazio)
            const payload = generateSuccessUI(tempData.name, roleIds);
            
            // Atualiza a mensagem original removendo o menu e mostrando o sucesso
            await interaction.update(payload);

        } catch (error) {
            console.error('Erro ao salvar departamento:', error);
            if (!interaction.replied) {
                // Em caso de erro, usa ephemeral
                await interaction.reply({ content: '❌ Erro interno ao salvar no banco de dados.', ephemeral: true });
            }
        }
    }
};