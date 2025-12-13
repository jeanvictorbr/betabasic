// handlers/selects/select_new_department_role.js
const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'select_new_department_role',
    async execute(interaction) {
        const tempData = interaction.client.tempDeptData?.get(interaction.user.id);
        
        if (!tempData) {
            return interaction.update({ content: '❌ Tempo esgotado ou erro nos dados. Comece novamente.', components: [], embeds: [] });
        }

        // Pega todos os cargos selecionados
        const roleIds = interaction.values; 
        const rolesJson = JSON.stringify(roleIds);

        try {
            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, tempData.name, tempData.description, tempData.emoji, rolesJson]
            );

            interaction.client.tempDeptData.delete(interaction.user.id);

            // [CORREÇÃO DO ERRO API]
            // Em vez de recarregar o menu complexo, mostramos um resumo do sucesso.
            // O usuário pode usar /configurar novamente se quiser ver a lista atualizada.
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Departamento Salvo!')
                .setDescription(`O departamento **${tempData.name}** foi criado com sucesso.`)
                .addFields(
                    { name: 'Cargos Vinculados', value: roleIds.map(r => `<@&${r}>`).join(', ') }
                )
                .setColor('Green');
            
            await interaction.update({
                content: '',
                embeds: [successEmbed],
                components: [] // Remove o menu de seleção para finalizar
            });

        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao salvar no banco de dados.', ephemeral: true });
            }
        }
    }
};