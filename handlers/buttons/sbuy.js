const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = {
    customId: 'sbuy_',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const productId = parseInt(interaction.customId.replace('sbuy_', ''));
        
        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND quantity > 0', [productId]);
        const product = res.rows[0];

        if (!product) {
            return interaction.editReply('❌ Este produto esgotou ou não existe mais!');
        }

        const categoryInfo = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('carrinhos'));
        
        try {
            // Cria um canal privado (Carrinho/Ticket de Compra)
            const cartChannel = await interaction.guild.channels.create({
                name: `compra-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryInfo ? categoryInfo.id : null,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.editReply(`🛒 Seu carrinho foi aberto em: <#${cartChannel.id}>`);

            // Manda a famosa "Mensagem de Saudação" que o cliente pediu
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Pedido: ${product.name}`)
                .setDescription(product.welcome_message || `Obrigado por se interessar pelo **${product.name}**! Nossa equipe já vai te atender.`)
                .addFields(
                    { name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true },
                    { name: 'Estoque Restante', value: product.quantity.toString(), inline: true }
                )
                .setColor('#FF0000');

            await cartChannel.send({ content: `||<@${interaction.user.id}>||`, embeds: [welcomeEmbed] });

        } catch (e) {
            console.error('[Stock Store] Erro ao criar carrinho:', e);
            await interaction.editReply('❌ Não consegui abrir o carrinho. Verifique minhas permissões.');
        }
    }
};