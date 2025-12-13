// handlers/selects/aut_role_system_interact.js
const { PermissionsBitField } = require('discord.js');

module.exports = {
    customId: 'aut_role_system_interact',
    async execute(interaction) {
        // Usa deferReply para ter tempo de processar sem travar
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const selectedRoleIds = interaction.values; // Apenas o que o usuário CLICOU

        const added = [];
        const removed = [];
        const errors = [];

        try {
            // Lógica de TOGGLE (Interruptor)
            // Só olhamos para o que foi selecionado. O que não foi, o bot ignora.
            
            for (const roleId of selectedRoleIds) {
                const role = interaction.guild.roles.cache.get(roleId);
                
                // Se o cargo não existe mais, pula
                if (!role) continue;

                // VERIFICAÇÃO INTELIGENTE
                if (member.roles.cache.has(roleId)) {
                    // Se JÁ TEM o cargo -> REMOVE
                    try {
                        await member.roles.remove(role);
                        removed.push(role.name);
                    } catch (e) {
                        errors.push(role.name);
                    }
                } else {
                    // Se NÃO TEM o cargo -> ADICIONA
                    try {
                        await member.roles.add(role);
                        added.push(role.name);
                    } catch (e) {
                        errors.push(role.name);
                    }
                }
            }

            // Monta o texto de resposta
            let responseText = '';
            
            if (added.length > 0) responseText += `✅ **Você recebeu:** ${added.join(', ')}\n`;
            if (removed.length > 0) responseText += `🗑️ **Você removeu:** ${removed.join(', ')}\n`;
            
            if (added.length === 0 && removed.length === 0) {
                responseText = 'ℹ️ Nenhuma alteração foi feita.';
            }

            if (errors.length > 0) {
                responseText += `\n⚠️ **Erro ao alterar:** ${errors.join(', ')} (Verifique as permissões do Bot)`;
            }

            // Envia a resposta atualizada
            await interaction.editReply({ content: responseText, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao processar sua solicitação.', ephemeral: true });
        }
    }
};