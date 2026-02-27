const db = require('./database.js'); 
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { formatKK } = require('./utils/rpCurrency.js'); // Ajuste o caminho se necessário

module.exports = (client) => {
    console.log("[WebQueue] 🔄 Iniciando monitoramento de pedidos via Banco de Dados...");

    setInterval(async () => {
        try {
            // Verifica se a tabela existe (ignora erro se não)
            const tableCheck = await db.query("SELECT to_regclass('public.web_cart_requests')");
            if (!tableCheck.rows[0].to_regclass) return;

            // Busca pedidos pendentes
            const pendingReqs = await db.query("SELECT * FROM web_cart_requests WHERE status = 'pending' LIMIT 5");
            
            for (const req of pendingReqs.rows) {
                const { id, user_id, product_id, guild_id } = req;
                
                // Marca como processando para não repetir
                await db.query("UPDATE web_cart_requests SET status = 'processing' WHERE id = $1", [id]);

                try {
                    const guild = client.guilds.cache.get(guild_id);
                    if (!guild) throw new Error("Servidor não encontrado");

                    const prodRes = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND quantity > 0', [product_id]);
                    const product = prodRes.rows[0];
                    if (!product) throw new Error("Produto esgotado");

                    const setRes = await db.query('SELECT ferrari_staff_role FROM guild_settings WHERE guild_id = $1', [guild_id]);
                    const staffRoleId = setRes.rows[0]?.ferrari_staff_role;

                    const user = await client.users.fetch(user_id).catch(()=>null);
                    const userName = user ? user.username : 'cliente';

                    const perm = [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user_id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                    ];
                    if (staffRoleId) perm.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

                    const cartChannel = await guild.channels.create({ 
                        name: `🛒・web-${userName}`, 
                        type: ChannelType.GuildText, 
                        permissionOverwrites: perm 
                    });

                    const embed = new EmbedBuilder()
                        .setTitle(`Pedido: ${product.name}`)
                        .setDescription('Reserva feita pelo Site! Pague com a Staff.')
                        .addFields({ name: 'Valor', value: formatKK(Number(product.price_kk)), inline: true })
                        .setColor('#3b82f6');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'),
                        new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
                    );

                    await cartChannel.send({ content: `||<@${user_id}>||`, embeds: [embed], components: [row] });
                    
                    if (product.image_data) {
                        await cartChannel.send({ files: [new AttachmentBuilder(Buffer.from(product.image_data, 'base64'), { name: 'carro.png' })] });
                    }

                    // Marca como concluído
                    await db.query("UPDATE web_cart_requests SET status = 'completed' WHERE id = $1", [id]);
                    console.log(`[WebQueue] ✅ Carrinho criado para ${userName}`);

                } catch (innerErr) {
                    console.error(`[WebQueue] Erro ao processar pedido ${id}:`, innerErr.message);
                    await db.query("UPDATE web_cart_requests SET status = 'failed' WHERE id = $1", [id]);
                }
            }
        } catch (error) {
            // Ignora erros de sincronia
        }
    }, 5000); // Roda a cada 5 segundos
};