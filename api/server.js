const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('../database.js');
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { formatKK } = require('../utils/rpCurrency.js');
const url = require('url'); // Importado para as rotas antigas

// Importa as funções originais do Koda
const { approvePurchase } = require('../utils/approvePurchase');
const { updateCloudflowShowcase } = require('../utils/updateCloudflowShowcase');

module.exports = (client) => {
    const app = express();
    app.use(cors()); 

    // O Mercado Pago envia JSON cru às vezes, então o Express precisa lidar com isso antes do limit 10mb
    app.use(express.json({ limit: '10mb' })); 

    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: '*' } });
    client.io = io; // Salva o WebSocket no client do Discord

    io.on('connection', (socket) => {
        console.log(`[WebSocket] 🌐 Cliente Web Conectado: ${socket.id}`);
    });

    // ==========================================
    // 🔴 ROTAS NOVAS (FERRARI MOTORS WEB)
    // ==========================================

    app.get('/api/produtos/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const result = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC', [guildId]);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: 'Erro ao buscar produtos' });
        }
    });

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
            res.status(500).json({ error: 'Erro interno no servidor' });
        }
    });

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

    app.post('/api/admin/add', async (req, res) => {
        try {
            const { guildId, name, welcome_message, image_data, quantity, price_kk } = req.body;
            await db.query(
                'INSERT INTO ferrari_stock_products (guild_id, name, welcome_message, image_data, quantity, price_kk) VALUES ($1, $2, $3, $4, $5, $6)',
                [guildId, name, welcome_message, image_data, quantity, price_kk]
            );
            
            const updateVitrine = require('../utils/updateFerrariVitrine.js');
            await updateVitrine(client, guildId);
            io.emit('estoque_atualizado'); 

            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erro ao adicionar produto.' });
        }
    });

    // ==========================================
    // 🟢 ROTAS LEGADAS DO KODA V2 (TRANSFERIDAS DO INDEX.JS)
    // ==========================================

    // Rota do Webhook do Mercado Pago
    app.post('/mp-webhook', async (req, res) => {
        // Responder rápido para o MP não dar timeout
        res.sendStatus(200);

        try {
            const data = req.body;
            console.log("Recebido Webhook do Mercado Pago:", data);
            
            if (data && data.type === 'payment' && data.data && data.data.id) {
                const paymentId = data.data.id;
                console.log(`Processando pagamento ID: ${paymentId}`);
                await approvePurchase(paymentId, client);
            }
        } catch (error) {
            console.error("Erro ao processar webhook do MP:", error);
        }
    });

    // Rota do OAuth do Cloudflow
    app.get('/cloudflow-oauth', async (req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const code = parsedUrl.query.code;
        const state = parsedUrl.query.state;

        if (!code || !state) {
            return res.status(400).send('Dados inválidos. Autorização falhou.');
        }

        try {
            const [guildId, userId] = state.split('_');
            
            if (!guildId || !userId) {
                return res.status(400).send('State inválido.');
            }

            const { exchangeOAuthCode } = require('../utils/guildBlueprintManager');
            const success = await exchangeOAuthCode(guildId, userId, code);

            if (success) {
                // Tenta atualizar a showcase se existir
                try {
                     await updateCloudflowShowcase(client, guildId);
                } catch(e) {
                     console.error("Erro ao atualizar showcase após oauth:", e);
                }
                res.send(`
                    <html>
                    <head>
                        <title>CloudFlow - Sucesso</title>
                        <style>
                            body { font-family: sans-serif; background-color: #2b2d31; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                            .box { background-color: #313338; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            h1 { color: #57F287; }
                            p { color: #B5BAC1; }
                        </style>
                    </head>
                    <body>
                        <div class="box">
                            <h1>✅ Verificado com Sucesso!</h1>
                            <p>Sua conta foi vinculada ao CloudFlow da BasicFlow.</p>
                            <p>Você já pode fechar esta janela e voltar para o Discord.</p>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                 res.status(500).send('Erro ao processar o código de autorização. Tente novamente no Discord.');
            }

        } catch (error) {
             console.error("Erro no callback OAuth do Cloudflow:", error);
             res.status(500).send('Erro interno ao processar a requisição.');
        }
    });

    // ==========================================
    // INICIAR O SERVIDOR UNIFICADO
    // ==========================================
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`[API Unificada] 🚀 Webhooks, OAuth e App Web rodando na porta ${PORT}`);
    });
};