const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('../database.js');
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { formatKK } = require('../utils/rpCurrency.js');

module.exports = (client) => {
    const app = express();
    app.use(cors()); // Permite o site se conectar
    app.use(express.json());

    const server = http.createServer(app);
    
    // Inicia o WebSocket
    const io = new Server(server, { cors: { origin: '*' } });
    
    // Salva o IO dentro do client do Discord para usarmos em outros arquivos!
    client.io = io;

    io.on('connection', (socket) => {
        console.log(`[WebSocket] 🌐 Novo cliente conectado no Site: ${socket.id}`);
    });

    // 🔴 ROTA 1: O site pede a lista de carros para montar a vitrine web
    app.get('/api/produtos/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const result = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC', [guildId]);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: 'Erro ao buscar produtos' });
        }
    });

    // 🔴 ROTA 2: O cliente clica em "Comprar" no site. O site manda um POST pra cá criar o carrinho.
    app.post('/api/criar-carrinho', async (req, res) => {
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

            // Monta as Permissões
            const permissionOverwrites = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ];
            if (staffRoleId) {
                permissionOverwrites.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
            }

            // CRIA O CANAL MÁGICO NO DISCORD
            const cartChannel = await guild.channels.create({
                name: `🛒・web-${userName}`,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites
            });

            // Envia o Painel da Staff
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

            // Manda a foto e detalhes por baixo
            const welcomeOptions = {};
            if (product.welcome_message && product.welcome_message.trim() !== '') welcomeOptions.content = product.welcome_message;
            if (product.image_data) welcomeOptions.files = [new AttachmentBuilder(Buffer.from(product.image_data, 'base64'), { name: 'produto.png' })];
            if (welcomeOptions.content || welcomeOptions.files) await cartChannel.send(welcomeOptions);

            // RETORNA O DEEP LINK PRO SITE REDIRECIONAR O CLIENTE!
            res.json({ success: true, url: `https://discord.com/channels/${guild.id}/${cartChannel.id}` });

        } catch (e) {
            console.error('[API] Erro ao criar carrinho web:', e);
            res.status(500).json({ error: 'Erro interno no servidor' });
        }
    });
    // 🔴 ROTA 3: Verifica se o usuário é STAFF no servidor
    app.get('/api/admin/check/:guildId/:userId', async (req, res) => {
        try {
            const { guildId, userId } = req.params;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.json({ isAdmin: false });

            const setRes = await db.query('SELECT ferrari_staff_role FROM guild_settings WHERE guild_id = $1', [guildId]);
            const staffRoleId = setRes.rows[0]?.ferrari_staff_role;
            if (!staffRoleId) return res.json({ isAdmin: false });

            const member = await guild.members.fetch(userId).catch(()=>null);
            if (!member) return res.json({ isAdmin: false });

            const isAdmin = member.roles.cache.has(staffRoleId) || member.permissions.has(PermissionsBitField.Flags.Administrator);
            res.json({ isAdmin });
        } catch (e) {
            res.status(500).json({ isAdmin: false });
        }
    });

    // 🔴 ROTA 4: Adiciona carro pelo Site
    app.post('/api/admin/add', async (req, res) => {
        try {
            const { guildId, name, welcome_message, image_data, quantity, price_kk } = req.body;
            await db.query(
                'INSERT INTO ferrari_stock_products (guild_id, name, welcome_message, image_data, quantity, price_kk) VALUES ($1, $2, $3, $4, $5, $6)',
                [guildId, name, welcome_message, image_data, quantity, price_kk]
            );
            
            const updateVitrine = require('../utils/updateFerrariVitrine.js');
            await updateVitrine(client, guildId); // Atualiza no Discord
            io.emit('estoque_atualizado'); // Atualiza os sites

            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erro ao adicionar produto.' });
        }
    });

    // 🔴 ROTA 5: Deleta carro pelo Site
    app.delete('/api/admin/remove/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { guildId } = req.body;
            await db.query('DELETE FROM ferrari_stock_products WHERE id = $1', [id]);
            
            const updateVitrine = require('../utils/updateFerrariVitrine.js');
            await updateVitrine(client, guildId);
            io.emit('estoque_atualizado');

            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Erro ao deletar.' });
        }
    });

    // Roda na porta 3000 (ou a porta que o Discloud/Host te der)
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`[API] 🚀 Servidor Web & WebSocket rodando na porta ${PORT}`);
    });
};
