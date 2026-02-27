// Arquivo: api.js (No projeto do BOT)
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./database.js'); 

module.exports = (client) => {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' })); 

    const expressServer = http.createServer(app);
    const io = new Server(expressServer, { cors: { origin: '*' } });
    client.io = io; 

    app.get('/', (req, res) => res.send('✅ API KODA OPERANTE'));

    // 🟢 ROTA QUE O SITE USA PARA MANDAR O BOT ATUALIZAR A VITRINE NO DISCORD
    app.post(['/api/vitrine/update', '/vitrine/update'], async (req, res) => {
        try {
            const { guildId } = req.body;
            if (guildId) {
                const updateVitrine = require('./utils/updateFerrariVitrine.js');
                await updateVitrine(client, guildId);
                client.io.emit('estoque_atualizado'); 
            }
            res.json({ success: true });
        } catch (e) {
            console.error('[API] Erro ao atualizar vitrine:', e);
            res.status(500).json({ error: 'Erro' });
        }
    });

   // 🟢 ROTA DO CARRINHO DE COMPRAS BLINDADA
    app.post(['/api/criar-carrinho', '/criar-carrinho'], async (req, res) => {
        const { userId, productId, guildId } = req.body;
        
        console.log(`[API] 🛒 Recebido pedido de carrinho de ${userId} para o produto ${productId}`);

        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                console.log("[API] ❌ Erro: Servidor não encontrado.");
                return res.status(404).json({ error: 'Servidor não encontrado' });
            }

            const prodRes = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND quantity > 0', [productId]);
            const product = prodRes.rows[0];
            if (!product) {
                 console.log("[API] ❌ Erro: Produto esgotado ou inexistente.");
                 return res.status(400).json({ error: 'Esgotado.' });
            }

            const setRes = await db.query('SELECT ferrari_staff_role FROM guild_settings WHERE guild_id = $1', [guildId]);
            const staffRoleId = setRes.rows[0]?.ferrari_staff_role;

            const user = await client.users.fetch(userId).catch(()=>null);
            const userName = user ? user.username : 'cliente';

            const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
            const { formatKK } = require('./utils/rpCurrency.js');

            const perm = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ];
            if (staffRoleId) perm.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

            console.log(`[API] 🛠️ Criando canal de carrinho para ${userName}...`);
            
            const cartChannel = await guild.channels.create({ 
                name: `🛒・web-${userName}`, 
                type: ChannelType.GuildText, 
                permissionOverwrites: perm 
            });

            const embed = new EmbedBuilder()
                .setTitle(`Pedido: ${product.name}`)
                .setDescription('Reserva feita pelo Site! Pague com a Staff.')
                .addFields({ name: 'Valor', value: formatKK(Number(product.price_kk)), inline: true })
                .setColor('#3b82f6'); // Azul para combinar com o novo tema

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'),
                new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
            );

            await cartChannel.send({ content: `||<@${userId}>||`, embeds: [embed], components: [row] });
            
            if (product.image_data) {
                await cartChannel.send({ files: [new AttachmentBuilder(Buffer.from(product.image_data, 'base64'), { name: 'carro.png' })] });
            }

            console.log(`[API] ✅ Canal de carrinho criado com sucesso: ${cartChannel.name}`);
            res.json({ success: true, url: `https://discord.com/channels/${guild.id}/${cartChannel.id}` });
            
        } catch (e) {
            console.error('[API] ❌ Erro Crítico ao criar carrinho:', e);
            res.status(500).json({ error: 'Erro interno ao criar canal' });
        }
    });

    expressServer.listen(process.env.PORT || 8080, '0.0.0.0', () => console.log(`[API MESTRE] 🚀 Rodando`));
};