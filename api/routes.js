
// Arquivo: api/routes.js
const express = require('express');
const router = express.Router();
const db = require('../database.js');
const { PermissionsBitField } = require('discord.js');

// Middleware simples de autenticação (Simulado por enquanto)
// Na produção, você validaria o Token do usuário aqui
const checkAuth = async (req, res, next) => {
    // Para testar na Bolt, vamos permitir tudo por enquanto.
    // Depois implementaremos a validação do Token JWT do Discord.
    next();
};

// 1. Rota de Estatísticas Gerais do Servidor
router.get('/guilds/:guildId/stats', checkAuth, async (req, res) => {
    const { guildId } = req.params;
    const client = req.client; // O client do Discord será passado no index.js

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Servidor não encontrado ou bot não está nele.' });

    // Pega dados do Banco de Dados
    const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId])).rows[0];
    const ticketsCount = (await db.query('SELECT COUNT(*) FROM tickets WHERE guild_id = $1', [guildId])).rows[0].count;
    const salesTotal = (await db.query('SELECT SUM(total_amount) FROM store_sales_log WHERE guild_id = $1', [guildId])).rows[0].sum || 0;

    res.json({
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        onlineCount: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
        databaseStats: {
            ticketsOpened: parseInt(ticketsCount),
            totalSales: parseFloat(salesTotal),
            isPremium: await require('../utils/featureCheck.js')(guildId, 'PREMIUM_GUILD') // Exemplo
        },
        modules: {
            store: settings?.store_enabled || false,
            tickets: !!settings?.tickets_category,
            guardian: settings?.guardian_ai_enabled || false
        }
    });
});

// 2. Rota para Listar Produtos da Loja
router.get('/guilds/:guildId/store/products', checkAuth, async (req, res) => {
    const { guildId } = req.params;
    try {
        const products = (await db.query('SELECT * FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [guildId])).rows;
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Rota para Listar Usuários do Ranking (Ponto)
router.get('/guilds/:guildId/ponto/ranking', checkAuth, async (req, res) => {
    const { guildId } = req.params;
    try {
        const ranking = (await db.query('SELECT * FROM ponto_leaderboard WHERE guild_id = $1 ORDER BY total_ms DESC LIMIT 10', [guildId])).rows;
        
        // Enriquecer com nomes do Discord
        const enriched = await Promise.all(ranking.map(async (entry) => {
            const user = await req.client.users.fetch(entry.user_id).catch(() => null);
            return {
                ...entry,
                username: user ? user.username : 'Desconhecido',
                avatar: user ? user.displayAvatarURL() : null
            };
        }));

        res.json(enriched);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;// Rota para listar os servidores que o usuário administra (e o bot está presente)
router.get('/users/:userId/guilds', async (req, res) => {
    const { userId } = req.params;
    const client = req.client;

    try {
        const userGuilds = [];

        // Varre todos os servidores onde o BOT está
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                // Tenta buscar o membro no servidor
                const member = await guild.members.fetch(userId).catch(() => null);
                
                // Se o membro existe e tem permissão de Administrador
                if (member && member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    userGuilds.push({
                        id: guild.id,
                        name: guild.name,
                        icon: guild.iconURL(),
                        memberCount: guild.memberCount
                    });
                }
            } catch (err) {
                continue; // Ignora erros de permissão
            }
        }

        res.json(userGuilds);
    } catch (error) {
        console.error('Erro ao buscar guilds do usuário:', error);
        res.status(500).json({ error: 'Erro interno ao buscar servidores.' });
    }
});