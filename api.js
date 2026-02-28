const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./database.js'); 
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { formatKK } = require('./utils/rpCurrency.js');
const url = require('url');

// 🔴 MÁGICA SEGURA: Importa o atualizador uma vez só no topo
const updateVitrine = require('./utils/updateFerrariVitrine.js');

module.exports = (client) => {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' })); 

    // 🕵️ SNIFFER SÊNIOR
    app.use((req, res, next) => {
        console.log(`[API MESTRE] 🚨 Alvo Detectado: ${req.method} ${req.originalUrl}`);
        next();
    });

    const expressServer = http.createServer(app);
    const io = new Server(expressServer, { cors: { origin: '*' } });
    
    client.io = io; 

    io.on('connection', (socket) => {
        console.log(`[WebSocket] 🌐 Cliente Web Conectado: ${socket.id}`);
    });

    app.get('/', (req, res) => res.send('✅ API KODA OPERANTE'));

    app.get(['/api/produtos/:guildId', '/produtos/:guildId'], async (req, res) => {
        try {
            const { guildId } = req.params;
            const result = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC', [guildId]);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: 'Erro ao buscar produtos' });
        }
    });

    // 🔴 Rota Web Atualização (Mantida por segurança)
    app.post(['/api/vitrine/update', '/vitrine/update'], async (req, res) => {
        try {
            const { guildId } = req.body;
            if (guildId) {
                await updateVitrine(client, guildId);
                io.emit('estoque_atualizado'); 
            }
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Erro' });
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

            const perm = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ];
            if (staffRoleId) perm.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

            const cartChannel = await guild.channels.create({ name: `🛒・web-${userName}`, type: ChannelType.GuildText, permissionOverwrites: perm });

            const cartPanelEmbed = new EmbedBuilder()
                .setTitle(`Pedido Web: ${product.name}`)
                .setDescription('Sua reserva foi feita pelo Site! Efetue o pagamento com a Staff.')
                .addFields(
                    { name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true },
                    { name: 'Estoque Restante', value: product.quantity.toString(), inline: true }
                ).setColor('#3b82f6');

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

    app.post('/mp-webhook', async (req, res) => {
        res.sendStatus(200);
        try {
            const data = req.body;
            if (data && data.type === 'payment' && data.data && data.data.id) {
                const { approvePurchase } = require('./utils/approvePurchase');
                await approvePurchase(data.data.id, client);
            }
        } catch (error) {}
    });

    app.get('/cloudflow-oauth', async (req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const code = parsedUrl.query.code;
        const state = parsedUrl.query.state;
        if (!code || !state) return res.status(400).send('Falhou.');
        try {
            const [guildId, userId] = state.split('_');
            const { exchangeOAuthCode } = require('./utils/guildBlueprintManager');
            const success = await exchangeOAuthCode(guildId, userId, code);
            if (success) {
                try {
                    const { updateCloudflowShowcase } = require('./utils/updateCloudflowShowcase');
                    await updateCloudflowShowcase(client, guildId);
                } catch(e){}
                res.send('<html><body style="background:#2b2d31;color:#57F287;text-align:center;margin-top:20%;"><h1>✅ Verificado!</h1><p>Pode fechar a aba.</p></body></html>');
            } else { res.status(500).send('Erro.'); }
        } catch (e) { res.status(500).send('Erro interno.'); }
    });

    expressServer.listen(process.env.PORT || 8080, '0.0.0.0', () => console.log(`[API MESTRE] 🚀 Express + Socket.io Rodando na porta ${process.env.PORT || 8080}`));

    async function setupDatabase() {
        try {
            await db.query(`CREATE TABLE IF NOT EXISTS web_cart_requests (id SERIAL PRIMARY KEY, user_id VARCHAR(50) NOT NULL, product_id INTEGER NOT NULL, guild_id VARCHAR(50) NOT NULL, status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            await db.query(`ALTER TABLE web_cart_requests ADD COLUMN channel_url VARCHAR(255)`).catch(() => {});
            await db.query(`CREATE TABLE IF NOT EXISTS bot_sync_tasks (id SERIAL PRIMARY KEY, guild_id VARCHAR(50), task VARCHAR(50))`).catch(()=>{});
        } catch (err) {}
    }
    setupDatabase();

    // ==========================================
    // 🔄 LOOP DE ATUALIZAÇÃO SÊNIOR (LENDO O BANCO)
    // ==========================================
    setInterval(async () => {
        try {
            const syncReqs = await db.query("SELECT * FROM bot_sync_tasks LIMIT 5");
            
            for (const task of syncReqs.rows) {
                // 1. Rasga o bilhete primeiro pra não repetir
                await db.query("DELETE FROM bot_sync_tasks WHERE id = $1", [task.id]);
                
                if (task.task === 'update_vitrine') {
                    console.log(`[SYNC DB] 🔄 Lendo bilhete para a Guild ${task.guild_id}... Iniciando Atualização!`);
                    try {
                        // 2. Chama a atualização de forma limpa
                        await updateVitrine(client, task.guild_id);
                        console.log(`[SYNC DB] ✅ Vitrines do Discord atualizadas com sucesso!`);
                    } catch (updateErr) {
                        // 🔴 SE DEU ERRO, AGORA ELE GRITA!
                        console.error(`[SYNC DB] ❌ Falha CRÍTICA ao atualizar mensagem no Discord:`, updateErr);
                    }
                }
            }
        } catch (error) {
            console.error(`[SYNC DB] ❌ Erro ao ler a tabela de tarefas:`, error);
        }
    }, 2000); 

    // LOOP DE CARRINHOS (SITE -> DISCORD)
    setInterval(async () => {
        try {
            const pendingReqs = await db.query("SELECT * FROM web_cart_requests WHERE status = 'pending' LIMIT 5");
            for (const req of pendingReqs.rows) {
                const { id, user_id, product_id, guild_id } = req;
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

                    const perm = [{ id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: user_id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }];
                    if (staffRoleId) perm.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

                    const cartChannel = await guild.channels.create({ name: `🛒・web-${userName}`, type: ChannelType.GuildText, permissionOverwrites: perm });

                    if (product.welcome_message || product.image_data) {
                        const welcomeOptions = {};
                        if (product.welcome_message) welcomeOptions.content = product.welcome_message;
                        if (product.image_data) welcomeOptions.files = [new AttachmentBuilder(Buffer.from(product.image_data, 'base64'), { name: 'produto.png' })];
                        await cartChannel.send(welcomeOptions).catch(()=>{});
                    }

                    const embed = new EmbedBuilder().setTitle(`Pedido: ${product.name}`).setDescription('Reserva feita pelo Site! Efetue o pagamento com a Staff para liberação.').addFields({ name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true }, { name: 'Cliente', value: `<@${user_id}>`, inline: true }).setColor('#3b82f6');
                    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'), new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar (Staff)').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger));

                    await cartChannel.send({ content: `||<@${user_id}> ${staffRoleId ? `<@&${staffRoleId}>` : ''}||`, embeds: [embed], components: [row] });
                    const channelUrl = `https://discord.com/channels/${guild.id}/${cartChannel.id}`;
                    
                    const updateResult = await db.query("UPDATE web_cart_requests SET status = 'completed', channel_url = $1 WHERE id = $2 RETURNING id", [channelUrl, id]);
                    if (updateResult.rowCount > 0) io.emit(`pedido_pronto_${id}`, { url: channelUrl }); 
                } catch (innerErr) {
                    await db.query("UPDATE web_cart_requests SET status = 'failed' WHERE id = $1", [id]);
                    io.emit(`pedido_erro_${id}`, { error: innerErr.message });
                }
            }
        } catch (error) {}
    }, 2000); 
};