const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js'); 

module.exports = {
    customId: 'svit_select',
    async execute(interaction, guildSettings) {
        await interaction.deferReply({ ephemeral: true });
        const productId = interaction.values[0];
        
        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND quantity > 0', [productId]);
        const product = res.rows[0];

        updateVitrine(interaction.client, interaction.guildId);

        if (!product) return interaction.editReply('❌ Este produto esgotou ou não existe mais!');

        const staffRoleId = guildSettings?.ferrari_staff_role;
        const staffPing = staffRoleId ? `<@&${staffRoleId}>` : '@here';

        try {
            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ];

            if (staffRoleId) {
                permissionOverwrites.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
            }

            const cartChannel = await interaction.guild.channels.create({
                name: `🛒・compra-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites
            });

            await interaction.editReply(`🛒 Seu carrinho foi aberto: <#${cartChannel.id}>`);

            const cartPanelEmbed = new EmbedBuilder()
                .setTitle(`Gerenciar Pedido: ${product.name}`)
                .setDescription('Sua reserva está garantida enquanto este carrinho estiver aberto. Efetue o pagamento com a Staff e clique no botão abaixo quando concluir.')
                .addFields(
                    { name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true },
                    { name: 'Estoque Restante', value: product.quantity.toString(), inline: true }
                )
                .setColor('#2ECC71');

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'),
                new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar Compra (Staff)').setStyle(ButtonStyle.Primary).setEmoji('✅'),
                new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar (Staff)').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            // 1º ENVIA O PAINEL DA STAFF NO TOPO
            await cartChannel.send({ content: `||<@${interaction.user.id}> | ${staffPing}||`, embeds: [cartPanelEmbed], components: [actionRow] });

            // 2º RECONSTRÓI A IMAGEM E MANDA LÁ EMBAIXO
            const welcomeOptions = {};
            if (product.welcome_message && product.welcome_message.trim() !== '') {
                welcomeOptions.content = product.welcome_message;
            }
            if (product.image_data) {
                // Transforma o Base64 em Arquivo/Buffer novamente
                const buffer = Buffer.from(product.image_data, 'base64');
                const file = new AttachmentBuilder(buffer, { name: 'produto.png' });
                welcomeOptions.files = [file];
            }

            // Envia a mensagem didática e a imagem se elas existirem
            if (welcomeOptions.content || welcomeOptions.files) {
                await cartChannel.send(welcomeOptions);
            }

        } catch (e) {
            console.error(e);
            await interaction.editReply('❌ Não consegui abrir o carrinho. Verifique minhas permissões.');
        }
    }
};