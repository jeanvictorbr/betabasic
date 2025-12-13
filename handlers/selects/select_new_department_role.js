// handlers/selects/select_new_department_role.js
const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'select_new_department_role',
    async execute(interaction) {
        const tempData = interaction.client.tempDeptData?.get(interaction.user.id);
        
        if (!tempData) {
            return interaction.update({ content: '❌ Tempo esgotado. Comece novamente.', components: [], embeds: [] });
        }

        // [CORREÇÃO] Pega TODOS os valores selecionados
        const roleIds = interaction.values; 
        // Converte para JSON para salvar no banco (ex: '["123","456"]')
        const rolesJson = JSON.stringify(roleIds);

        try {
            // Salva no banco
            await db.query(
                `INSERT INTO ticket_departments (guild_id, name, description, emoji, role_id) VALUES ($1, $2, $3, $4, $5)`,
                [interaction.guild.id, tempData.name, tempData.description, tempData.emoji, rolesJson]
            );

            interaction.client.tempDeptData.delete(interaction.user.id);

            // [CORREÇÃO DO ERRO DE API]
            // Em vez de tentar renderizar o menu inteiro de novo (que buga o ephemeral),
            // mostramos apenas um sucesso limpo. O usuário pode reabrir o menu depois.
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Departamento Criado!')
                .setDescription(`**${tempData.name}** foi configurado com sucesso.`)
                .addFields(
                    { name: 'Cargos Vinculados', value: roleIds.map(r => `<@&${r}>`).join(', ') }
                )
                .setColor('Green');

            await interaction.update({ 
                content: '', 
                embeds: [successEmbed], 
                components: [] 
            });

        } catch (error) {
            console.error('[Ticket Dept] Erro:', error);
            // Tenta avisar do erro de forma segura
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao salvar no banco.', ephemeral: true });
            }
        }
    }
};