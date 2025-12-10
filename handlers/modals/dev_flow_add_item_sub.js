const db = require('../../database.js');
const V2_FLAG = 1 << 15;

module.exports = {
    customId: 'dev_flow_add_item_sub',
    async execute(interaction) {
        const name = interaction.fields.getTextInputValue('name');
        const feature = interaction.fields.getTextInputValue('feature');
        const price = parseInt(interaction.fields.getTextInputValue('price'));
        const days = parseInt(interaction.fields.getTextInputValue('days'));
        const emoji = interaction.fields.getTextInputValue('emoji') || '📦';

        if (isNaN(price) || isNaN(days)) return interaction.reply({ content: "Preço e Dias devem ser números.", ephemeral: true });

        await db.query(`
            INSERT INTO flow_shop_items (name, feature_key, price, duration_days, emoji)
            VALUES ($1, $2, $3, $4, $5)
        `, [name, feature, price, days, emoji]);

        // Feedback V2
        await interaction.reply({
            components: [{ type: 10, content: `✅ **Item Adicionado!**\n📦 ${name}\n🔑 ${feature}\n💰 ${price} FC\n⏳ ${days} dias`, style: 1 }],
            flags: V2_FLAG,
            ephemeral: true
        });
    }
};