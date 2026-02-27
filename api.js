// Arquivo: api.js (No projeto do BOT)
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./database.js'); 
const url = require('url');

module.exports = (client) => {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' })); 
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    const expressServer = http.createServer(app);
    const io = new Server(expressServer, { cors: { origin: '*' } });

    client.io = io; 

    io.on('connection', (socket) => {
        console.log(`[WebSocket] 🌐 Cliente Web Conectado: ${socket.id}`);
    });

    // Rota de Teste Base
    app.get('/', (req, res) => res.send('✅ API KODA OPERANTE'));

    // 🔴 ROTAS BLINDADAS (Array para evitar o 404 da Discloud)

    app.post(['/api/criar-carrinho', '/criar-carrinho'], async (req, res) => {
        console.log("[API] Recebeu pedido de carrinho:", req.body);
        const { userId, productId, guildId } = req.body;
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.status(404).json({ error: 'Servidor Discord não encontrado.' });

            const prodRes = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND quantity > 0', [productId]);
            const product = prodRes.rows[0];
            if (!product) return res.status(400).json({ error: 'Produto esgotado.' });

            const setRes = await db.query('SELECT ferrari_staff_role FROM guild_settings WHERE guild_id = $1', [guildId]);
            const staffRoleId = setRes.rows[0]?.ferrari_staff_role;

            const user = await client.users.fetch(userId).catch(()=>null);
            const userName = user ? user.username : 'cliente-web';

            const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
            const { formatKK } = require('./utils/rpCurrency.js');

            const permissionOverwrites = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ];
            if (staffRoleId) permissionOverwrites.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

            const cartChannel = await guild.channels.create({
                name: `🛒・web-${userName}`,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites
            });

            const cartPanelEmbed = new EmbedBuilder()
                .setTitle(`Pedido Web: ${product.name}`)
                .setDescription('Sua reserva foi feita pelo Site! Efetue o pagamento com a Staff.')
                .addFields(
                    { name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true },
                    { name: 'Estoque Restante', value: product.quantity.toString(), inline: true }
                ).setColor('#FF0000');

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'),
                new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar Compra').setStyle(ButtonStyle.Primary).setEmoji('✅'),
                new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            await cartChannel.send({ content: `||<@${userId}> | ${staffRoleId ? `<@&${staffRoleId}>` : '@here'}||`, embeds: [cartPanelEmbed], components: [actionRow] });

            const welcomeOptions = {};
            if (product.welcome_message && product.welcome_message.trim() !== '') welcomeOptions.content = product.welcome_message;
            if (product.image_data) welcomeOptions.files = [new AttachmentBuilder(Buffer.from(product.image_data, 'base64'), { name: 'produto.png' })];
            if (welcomeOptions.content || welcomeOptions.files) await cartChannel.send(welcomeOptions);

            res.json({ success: true, url: `https://discord.com/channels/${guild.id}/${cartChannel.id}` });
        } catch (e) {
            console.error('[API] Erro ao criar carrinho:', e);
            res.status(500).json({ error: 'Erro interno' });
        }
    });

    app.get(['/api/admin/check/:guildId/:userId', '/admin/check/:guildId/:userId'], async (req, res) => {
        try {
            const { guildId, userId } = req.params;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.json({ isAdmin: false });

            const { PermissionsBitField } = require('discord.js');
            const member = await guild.members.fetch(userId).catch(()=>null);
            if (!member) return res.json({ isAdmin: false });

            if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return res.json({ isAdmin: true });
            }

            const setRes = await db.query('SELECT ferrari_staff_role FROM guild_settings WHERE guild_id = $1', [guildId]);
            const staffRoleId = setRes.rows[0]?.ferrari_staff_role;
            if (staffRoleId && member.roles.cache.has(staffRoleId)) {
                return res.json({ isAdmin: true });
            }
            res.json({ isAdmin: false });
        } catch (e) {
            res.status(500).json({ isAdmin: false });
        }
    });

// 🟢 ADICIONAR VEÍCULO
    app.post(['/api/admin/add', '/admin/add'], async (req, res) => {
        try {
            const { guildId, name, welcome_message, image_data, quantity, price_kk } = req.body;
            await db.query(
                'INSERT INTO ferrari_stock_products (guild_id, name, welcome_message, image_data, quantity, price_kk) VALUES ($1, $2, $3, $4, $5, $6)',
                [guildId, name, welcome_message, image_data, quantity, price_kk]
            );
            
            const updateVitrine = require('./utils/updateFerrariVitrine.js');
            await updateVitrine(client, guildId);
            client.io.emit('estoque_atualizado'); 
            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erro ao adicionar' });
        }
    });

    // 🟡 EDITAR VEÍCULO (NOVA FEATURE!)
    app.put(['/api/admin/edit/:guildId/:id', '/admin/edit/:guildId/:id'], async (req, res) => {
        try {
            const { guildId, id } = req.params;
            const { name, welcome_message, image_data, quantity, price_kk } = req.body;
            
            if (image_data) {
                // Se mandou imagem nova, atualiza tudo
                await db.query(
                    'UPDATE ferrari_stock_products SET name = $1, welcome_message = $2, image_data = $3, quantity = $4, price_kk = $5 WHERE id = $6 AND guild_id = $7',
                    [name, welcome_message, image_data, quantity, price_kk, id, guildId]
                );
            } else {
                // Se não mandou imagem, atualiza só os textos e valores
                await db.query(
                    'UPDATE ferrari_stock_products SET name = $1, welcome_message = $2, quantity = $3, price_kk = $4 WHERE id = $5 AND guild_id = $6',
                    [name, welcome_message, quantity, price_kk, id, guildId]
                );
            }
            
            const updateVitrine = require('./utils/updateFerrariVitrine.js');
            await updateVitrine(client, guildId);
            client.io.emit('estoque_atualizado'); 
            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erro ao editar' });
        }
    });

    // 🔴 DELETAR VEÍCULO (Corrigido para burlar o firewall da Discloud)
    app.delete(['/api/admin/remove/:guildId/:id', '/admin/remove/:guildId/:id'], async (req, res) => {
        try {
            const { guildId, id } = req.params;
            await db.query('DELETE FROM ferrari_stock_products WHERE id = $1 AND guild_id = $2', [id, guildId]);
            
            const updateVitrine = require('./utils/updateFerrariVitrine.js');
            await updateVitrine(client, guildId);
            client.io.emit('estoque_atualizado');
            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erro ao deletar' });
        }
    });

    const PORT = process.env.PORT || 8080;
    expressServer.listen(PORT, '0.0.0.0', () => {
        console.log(`[API MESTRE] 🚀 Rodando na porta ${PORT}`);
    });
};