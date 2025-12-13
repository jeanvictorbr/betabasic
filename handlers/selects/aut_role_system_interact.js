// handlers/selects/aut_role_system_interact.js
const { PermissionsBitField } = require('discord.js');

module.exports = {
    customId: 'aut_role_system_interact',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const selectedRoleIds = interaction.values; // Lista de IDs que o usuário MARCOU

        // Recupera TODOS os IDs possíveis deste menu (para saber quais remover)
        // O interaction.component.options tem todas as opções disponíveis no menu
        const allPossibleRoleIds = interaction.component.options.map(opt => opt.value);

        const added = [];
        const removed = [];

        try {
            // Lógica de Sincronização:
            // 1. Se está selecionado -> Adiciona
            // 2. Se NÃO está selecionado mas faz parte do menu -> Remove
            
            for (const roleId of allPossibleRoleIds) {
                if (selectedRoleIds.includes(roleId)) {
                    // Usuário quer este cargo
                    if (!member.roles.cache.has(roleId)) {
                        await member.roles.add(roleId).catch(() => null);
                        added.push(`<@&${roleId}>`);
                    }
                } else {
                    // Usuário NÃO quer este cargo (desmarcou ou não marcou)
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId).catch(() => null);
                        removed.push(`<@&${roleId}>`);
                    }
                }
            }

            let response = '✅ **Cargos Atualizados!**\n';
            if (added.length > 0) response += `📥 **Adicionados:** ${added.join(', ')}\n`;
            if (removed.length > 0) response += `📤 **Removidos:** ${removed.join(', ')}\n`;
            if (added.length === 0 && removed.length === 0) response = 'ℹ️ Nenhuma alteração feita nos seus cargos.';

            await interaction.editReply({ content: response, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Erro ao atualizar cargos. Verifique se o bot tem permissão (meu cargo deve ser maior que os que estou tentando dar).', ephemeral: true });
        }
    }
};