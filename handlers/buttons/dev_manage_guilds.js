// handlers/buttons/dev_manage_guilds.js
const devPanelUtils = require('../../utils/devPanelUtils.js');
const getAndPrepareGuildData = devPanelUtils.getAndPrepareGuildData;
const generateDevGuildsMenu = require('../../ui/devPanel/devGuildsMenu.js');
const { Routes } = require('discord.js'); // Necessário para a rota manual

// Flags manuais para garantir que o Discord.js não as remova
const V2_FLAG = 1 << 15; // 32768
const EPHEMERAL_FLAG = 1 << 6; // 64
const FINAL_FLAGS = V2_FLAG | EPHEMERAL_FLAG; // 32832

module.exports = {
    customId: 'dev_manage_guilds',
    async execute(interaction) {
        // Validação de segurança da função utilitária
        if (typeof getAndPrepareGuildData !== 'function') {
            console.error('ERRO CRÍTICO: getAndPrepareGuildData não é uma função!');
            return interaction.reply({ content: '❌ Erro interno: Utilitário não carregado.', ephemeral: true });
        }

        // Defere a interação se ainda não foi
        if (!interaction.deferred && !interaction.replied) {
             await interaction.deferUpdate();
        }
        
        try {
            // Busca os dados (pode demorar um pouco)
            const { allGuildData, totals } = await getAndPrepareGuildData(interaction.client);
            
            const menuPayload = generateDevGuildsMenu(allGuildData, 0, totals, 'default');

            // --- CORREÇÃO DO ERRO 50035 (FORÇANDO O ENVIO DA FLAG V2) ---
            // Usamos o REST direto para evitar que o Discord.js sanitize a flag V2
            await interaction.client.rest.patch(
                Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
                {
                    body: {
                        components: menuPayload, // O Array [{ type: 17, ... }]
                        flags: FINAL_FLAGS // Força 32832
                    }
                }
            );

        } catch (error) {
            console.error('Erro em dev_manage_guilds:', error);
            
            // Tenta enviar o erro usando a mesma técnica segura
            try {
                await interaction.client.rest.patch(
                    Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
                    {
                        body: {
                            components: [{
                                type: 17,
                                components: [{ type: 10, content: `❌ **Erro:** ${error.message}` }]
                            }],
                            flags: FINAL_FLAGS
                        }
                    }
                );
            } catch (e) {
                console.error("Falha ao enviar mensagem de erro:", e);
            }
        }
    }
};