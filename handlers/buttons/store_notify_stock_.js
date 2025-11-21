// Arquivo: handlers/buttons/store_notify_stock_.js
const db = require('../../database.js');
const { EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'store_notify_stock_',
    execute: async (interaction) => {
        const productId = interaction.customId.split('_').pop();

        try {
            await db.query(
                `INSERT INTO store_stock_notifications (guild_id, user_id, product_id) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (user_id, product_id) DO NOTHING`,
                [interaction.guild.id, interaction.user.id, productId]
            );

            await interaction.reply({
                content: '✅ **Notificação Ativada!**\nEu vou te enviar uma mensagem no privado assim que o administrador adicionar estoque para este produto.',
                flags: EPHEMERAL_FLAG
            });
        } catch (error) {
            console.error('[Store Notify] Erro:', error);
            await interaction.reply({
                content: '❌ Erro ao ativar notificação.',
                flags: EPHEMERAL_FLAG
            });
        }
    }
};