// handlers/selects/aut_role_system_interact.js
const { PermissionsBitField } = require('discord.js');

module.exports = {
    customId: 'aut_role_system_interact',
    async execute(interaction) {
        // Resposta Efêmera Instantânea para não travar
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const selectedRoleIds = interaction.values; // O que o usuário MARCOU (Check)
        
        // Pega todas as opções disponíveis no menu para saber o que ele DESMARCOU
        const allOptions = interaction.component.options;
        const allRoleIdsInMenu = allOptions.map(opt => opt.value);

        const added = [];
        const removed = [];
        const errors = [];

        try {
            // Lógica de Sincronização
            for (const roleId of allRoleIdsInMenu) {
                const role = interaction.guild.roles.cache.get(roleId);
                
                // Pula se o cargo não existir mais no servidor
                if (!role) continue;

                if (selectedRoleIds.includes(roleId)) {
                    // --- USUÁRIO MARCOU (QUER O CARGO) ---
                    if (!member.roles.cache.has(roleId)) {
                        try {
                            await member.roles.add(role);
                            added.push(role.name);
                        } catch (e) {
                            errors.push(role.name);
                        }
                    }
                } else {
                    // --- USUÁRIO DESMARCOU (QUER REMOVER) ---
                    if (member.roles.cache.has(roleId)) {
                        try {
                            await member.roles.remove(role);
                            removed.push(role.name);
                        } catch (e) {
                            errors.push(role.name);
                        }
                    }
                }
            }

            // Monta a resposta final
            let responseText = '';
            
            if (added.length > 0) responseText += `✅ **Adicionados:** ${added.join(', ')}\n`;
            if (removed.length > 0) responseText += `🗑️ **Removidos:** ${removed.join(', ')}\n`;
            
            if (added.length === 0 && removed.length === 0) {
                responseText = 'ℹ️ Seus cargos já estão sincronizados com a seleção.';
            }

            if (errors.length > 0) {
                responseText += `\n⚠️ **Falha ao alterar:** ${errors.join(', ')} (Verifique minhas permissões)`;
            }

            await interaction.editReply({ content: responseText, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao processar seus cargos.', ephemeral: true });
        }
    }
};