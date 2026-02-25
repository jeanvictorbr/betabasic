const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js'); // Importamos o motor

module.exports = {
    customId: 'svit_select',
    async execute(interaction, guildSettings) {
        await interaction.deferReply({ ephemeral: true });
        const productId = interaction.values[0];
        
        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND quantity > 0', [productId]);
        const product = res.rows[0];

        // Reseta o Menu de Seleção visualmente atualizando a vitrine principal
        updateVitrine(interaction.client, interaction.guildId);

        if (!product) return interaction.editReply('❌ Este produto esgotou ou não existe mais!');

        const staffRoleId = guildSettings?.ferrari_staff_role;
        if (!staffRoleId) return interaction.editReply('❌ O cargo Staff não foi configurado. Peça ao admin para usar /ferrari-config');

        try {
            const cartChannel = await interaction.guild.channels.create({
                name: `🛒・compra-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.editReply(`🛒 Seu carrinho foi aberto: <#${cartChannel.id}>`);

            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Pedido: ${product.name}`)
                .setDescription(product.welcome_message || `Obrigado! Nossa equipe já vai te atender.`)
                .addFields(
                    { name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true },
                    { name: 'Estoque Restante', value: product.quantity.toString(), inline: true }
                ).setColor('#2ECC71');

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'),
                new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar Compra (Staff)').setStyle(ButtonStyle.Primary).setEmoji('✅'),
                new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar (Staff)').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            await cartChannel.send({ content: `||<@${interaction.user.id}> | <@&${staffRoleId}>||`, embeds: [welcomeEmbed], components: [actionRow] });

        } catch (e) {
            console.error(e);
            await interaction.editReply('❌ Não consegui abrir o carrinho. Verifique minhas permissões.');
        }
    }
};