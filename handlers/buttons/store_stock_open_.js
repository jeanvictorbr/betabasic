const db = require('../../database.js');
const stockControl = require('../../ui/store/stockControl.js'); // Vamos criar este UI abaixo

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_stock_open_',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        // Extrai o ID do produto: store_stock_open_123
        const productId = interaction.customId.split('_')[3];

        // Busca dados atualizados do produto único
        const res = await db.query('SELECT * FROM store_products WHERE id = $1', [productId]);
        
        if (res.rows.length === 0) {
            return interaction.followUp({ content: '❌ Produto não encontrado.', ephemeral: true });
        }

        const product = res.rows[0];
        const payload = await stockControl(product);

        await interaction.editReply({
            embeds: payload.embeds,
            components: payload.components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};