const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./database.js'); 
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { formatKK } = require('./utils/rpCurrency.js');

module.exports = (client) => {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' })); 

    const expressServer = http.createServer(app);
    const io = new Server(expressServer, { cors: { origin: '*' } });
    client.io = io; 

    io.on('connection', (socket) => {
        console.log(`[WebSocket] 🌐 Cliente Web Conectado: ${socket.id}`);
    });

    app.get('/', (req, res) => res.send('✅ API KODA OPERANTE'));

    // ==========================================
    // 🔴 ROTA DE ATUALIZAÇÃO (Onde o Site bate para avisar o Bot)
    // ==========================================
    app.post(['/api/vitrine/update', '/vitrine/update'], async (req, res) => {
        try {
            const { guildId } = req.body;
            if (guildId) {
                console.log(`[API MESTRE] 🔄 Site solicitou atualização da Vitrine do Discord para a Guild ${guildId}...`);
                
                // Força pegar o atualizador mais novo e limpa cache antigo
                delete require.cache[require.resolve('./utils/updateFerrariVitrine.js')];
                const updateVitrine = require('./utils/updateFerrariVitrine.js');
                
                await updateVitrine(client, guildId);
                
                // Avisa o site (socket) que terminou pra ele atualizar o Front-End
                io.emit('estoque_atualizado'); 
            }
            res.json({ success: true });
        } catch (e) {
            console.error('[API MESTRE] ❌ Erro ao atualizar vitrine:', e.message);
            res.status(500).json({ error: 'Erro ao atualizar vitrine.' });
        }
    });

    expressServer.listen(process.env.PORT || 8080, '0.0.0.0', () => console.log(`[API MESTRE] 🚀 Express + Socket.io Rodando`));

    // ==========================================
    // 🛠️ AUTO-REPARO DO BANCO DE DADOS (CARRINHOS)
    // ==========================================
    async function setupDatabase() {
        try {
            await db.query(`CREATE TABLE IF NOT EXISTS web_cart_requests (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                product_id INTEGER NOT NULL,
                guild_id VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);
            await db.query(`ALTER TABLE web_cart_requests ADD COLUMN channel_url VARCHAR(255)`).catch(() => {});
        } catch (err) {}
    }
    setupDatabase();

    // ==========================================
    // 🔄 LOOP DE FILA (CARRINHO DO SITE PRO DISCORD)
    // ==========================================
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

                    if (product.welcome_message || product.image_data) {
                        const welcomeOptions = {};
                        if (product.welcome_message) welcomeOptions.content = product.welcome_message;
                        if (product.image_data) welcomeOptions.files = [new AttachmentBuilder(Buffer.from(product.image_data, 'base64'), { name: 'produto.png' })];
                        await cartChannel.send(welcomeOptions).catch(()=>{});
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Pedido: ${product.name}`)
                        .setDescription('Reserva feita pelo Site! Efetue o pagamento com a Staff para liberação.')
                        .addFields(
                            { name: 'Valor a Pagar', value: formatKK(Number(product.price_kk)), inline: true },
                            { name: 'Cliente', value: `<@${user_id}>`, inline: true }
                        )
                        .setColor('#3b82f6');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('fc_paid').setLabel('Já Paguei').setStyle(ButtonStyle.Success).setEmoji('💸'),
                        new ButtonBuilder().setCustomId(`fc_approve_${product.id}`).setLabel('Autorizar (Staff)').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('fc_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
                    );

                    await cartChannel.send({ content: `||<@${user_id}> ${staffRoleId ? `<@&${staffRoleId}>` : ''}||`, embeds: [embed], components: [row] });

                    const channelUrl = `https://discord.com/channels/${guild.id}/${cartChannel.id}`;
                    
                    const updateResult = await db.query(
                        "UPDATE web_cart_requests SET status = 'completed', channel_url = $1 WHERE id = $2 RETURNING id", 
                        [channelUrl, id]
                    );

                    if (updateResult.rowCount > 0) {
                        io.emit(`pedido_pronto_${id}`, { url: channelUrl }); 
                    } 
                } catch (innerErr) {
                    await db.query("UPDATE web_cart_requests SET status = 'failed' WHERE id = $1", [id]);
                    io.emit(`pedido_erro_${id}`, { error: innerErr.message });
                }
            }
        } catch (error) {}
    }, 2000); 
};
// ==========================================
    // 🔄 LOOP SÊNIOR: BOT LENDO OS "BILHETES" DO SITE VIA BANCO DE DADOS
    // ==========================================
    setInterval(async () => {
        try {
            // Verifica se a tabela existe (ignora se não)
            await db.query(`CREATE TABLE IF NOT EXISTS bot_sync_tasks (id SERIAL PRIMARY KEY, guild_id VARCHAR(50), task VARCHAR(50))`).catch(()=>{});
            
            // Puxa os bilhetes que o Site deixou
            const syncReqs = await db.query("SELECT * FROM bot_sync_tasks LIMIT 5");
            
            for (const task of syncReqs.rows) {
                // Rasga o bilhete para não repetir
                await db.query("DELETE FROM bot_sync_tasks WHERE id = $1", [task.id]);
                
                if (task.task === 'update_vitrine') {
                    console.log(`[SYNC DB] 🔄 Bot leu o bilhete do Site! Atualizando Vitrine do Discord para a Guild ${task.guild_id}...`);
                    
                    // Força carregar o arquivo atualizado
                    delete require.cache[require.resolve('./utils/updateFerrariVitrine.js')];
                    const updateVitrine = require('./utils/updateFerrariVitrine.js');
                    
                    // Atualiza a mensagem no Discord na HORA!
                    await updateVitrine(client, task.guild_id);
                    
                    console.log(`[SYNC DB] ✅ Vitrine do Discord atualizada com sucesso!`);
                }
            }
        } catch (error) {
            // Ignora erros silenciosos de banco
        }
    }, 2000); // O Bot checa o banco a cada 2 segundos