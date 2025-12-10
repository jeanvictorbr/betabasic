const db = require('../../database.js');

module.exports = {
    customId: 'flow_buy_confirm_',
    async execute(interaction) {
        const itemId = interaction.customId.split('flow_buy_confirm_')[1];
        const targetGuildId = interaction.values[0];

        // 1. Transação segura
        // Deduz saldo E verifica se tem saldo na mesma query para evitar race condition
        const deduct = await db.query(`
            UPDATE flow_users 
            SET balance = balance - (SELECT price FROM flow_shop_items WHERE id = $1)
            WHERE user_id = $2 AND balance >= (SELECT price FROM flow_shop_items WHERE id = $1)
            RETURNING balance
        `, [itemId, interaction.user.id]);

        if (deduct.rowCount === 0) {
            return interaction.update({ content: "❌ Compra falhou: Saldo insuficiente ou item inválido.", components: [] });
        }

        // 2. Buscar dados do item para ativar
        const item = (await db.query('SELECT * FROM flow_shop_items WHERE id = $1', [itemId])).rows[0];
        
        // 3. Ativar Feature
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + item.duration_days);

        await db.query(`
            INSERT INTO guild_features (guild_id, feature_key, expires_at, activated_by_key)
            VALUES ($1, $2, $3, 'FLOWCOINS_SHOP')
            ON CONFLICT (guild_id, feature_key) 
            DO UPDATE SET expires_at = $3 -- Estende se já tiver
        `, [targetGuildId, item.feature_key, expiresAt]);

        // 4. Feedback
        await interaction.update({ 
            content: `✅ **Sucesso!** Você comprou **${item.name}** para o servidor selecionado.\n💰 Novo saldo: \`${deduct.rows[0].balance} FC\``, 
            components: [] 
        });
    }
};