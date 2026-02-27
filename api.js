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

    app.post(['/api/vitrine/update', '/vitrine/update'], async (req, res) => {
        try {
            const { guildId } = req.body;
            if (guildId) {
                const updateVitrine = require('./utils/updateFerrariVitrine.js');
                await updateVitrine(client, guildId);
                io.emit('estoque_atualizado'); 
            }
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Erro' });
        }
    });

    expressServer.listen(process.env.PORT || 8080, '0.0.0.0', () => console.log(`[API MESTRE] 🚀 Express + Socket.io Rodando`));

    // ==========================================
    // 🔄 LOOP DE FILA (Assíncrono) - CRIA CARRINHO E ANOTA NO DB
    // ==========================================
    console.log("[WebQueue] 🔄 Iniciando monitoramento de pedidos via Banco de Dados...");

    // 🔴 FORÇAR CRIAÇÃO DA TABELA PELO BOT (Garante que os dois estejam lendo o mesmo caderno)
    db.query(`CREATE TABLE IF NOT EXISTS web_cart_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        product_id INTEGER NOT NULL,
        guild_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        channel_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).then(() => {
        console.log("[WebQueue] ✅ Tabela de pedidos sincronizada com sucesso!");
    }).catch(err => {
        console.error("[WebQueue] ❌ Erro ao criar tabela:", err.message);
    });

    setInterval(async () => {
        try {
            // Buscando pedidos
            const pendingReqs = await db.query("SELECT * FROM web_cart_requests WHERE status = 'pending' LIMIT 5");
            
            if (pendingReqs.rows.length > 0) {
                console.log(`[WebQueue] 🛒 Encontrado(s) ${pendingReqs.rows.length} pedido(s) pendente(s)! Processando...`);
            }

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

                    // 1. Cria o Canal
                    const cartChannel = await guild.channels.create({ 
                        name: `🛒・web-${userName}`, 
                        type: ChannelType.GuildText, 
                        permissionOverwrites: perm 
                    });

                    // 2. Manda a mensagem
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

                    // 3. SALVA O LINK NO BANCO E AVISA
                    const channelUrl = `https://discord.com/channels/${guild.id}/${cartChannel.id}`;
                    
                    const updateResult = await db.query(
                        "UPDATE web_cart_requests SET status = 'completed', channel_url = $1 WHERE id = $2 RETURNING id", 
                        [channelUrl, id]
                    );

                    if (updateResult.rowCount > 0) {
                        console.log(`[WebQueue] ✅ Carrinho Salvo no Banco com sucesso! ID da transação: ${id}`);
                        io.emit(`pedido_pronto_${id}`, { url: channelUrl }); 
                    } else {
                        console.log(`[WebQueue] ❌ ERRO MISTÉRIO: Não conseguiu salvar o link no Banco para o ID ${id}`);
                    }

                } catch (innerErr) {
                    await db.query("UPDATE web_cart_requests SET status = 'failed' WHERE id = $1", [id]);
                    console.error(`[WebQueue] ❌ Erro ao criar o canal do pedido ${id}:`, innerErr.message);
                    io.emit(`pedido_erro_${id}`, { error: innerErr.message });
                }
            }
        } catch (error) {
            // AGORA ELE VAI GRITAR O ERRO DO BANCO SE DER M*RDA!
            console.error("[WebQueue] ❌ ERRO CRÍTICO NO LOOP DO BANCO DE DADOS:", error.message);
        }
    }, 2000); 
};