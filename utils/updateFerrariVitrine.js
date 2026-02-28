// File: utils/updateFerrariVitrine.js
const db = require('../database.js');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { formatKK } = require('./rpCurrency.js');

module.exports = async (client, guildId) => {
    try {
        // 1. Busca configurações gerais da loja (para Título, Descrição e Imagem)
        const guildRes = await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
        const settings = guildRes.rows[0];
        
        // Se não tiver configurações básicas, a gente não faz nada
        if (!settings) return;

        // 2. Busca TODAS as vitrines que o bot postou nesse servidor
        const vitrinesTrackingRes = await db.query('SELECT * FROM ferrari_vitrines_tracking WHERE guild_id = $1', [guildId]);
        
        // Se o bot ainda não postou nenhuma vitrine pelo comando novo, ignora
        if (vitrinesTrackingRes.rows.length === 0) return;

        // 3. Loop de atualização: Passa por cada mensagem postada e atualiza com sua categoria
        for (const tracker of vitrinesTrackingRes.rows) {
            try {
                const { category, channel_id, message_id } = tracker;

                // Tenta achar o canal e a mensagem no Discord
                const channel = await client.channels.fetch(channel_id).catch(() => null);
                if (!channel) continue;
                const message = await channel.messages.fetch(message_id).catch(() => null);
                if (!message) continue; // Se o staff apagou a mensagem na mão, a gente ignora

                // 4. Busca os veículos no banco baseados na categoria daquela mensagem específica
                let query = 'SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0';
                let params = [guildId];

                if (category !== 'Todos') {
                    query += ' AND category = $2';
                    params.push(category);
                }
                query += ' ORDER BY id ASC LIMIT 25';

                const res = await db.query(query, params);

                // 5. Monta o Visual atualizado da Vitrine
                let title = settings.ferrari_vitrine_title || '🚘 Centro Comercial | Estoque Imediato';
                if (category !== 'Todos') title += ` - ${category}`;

                const desc = settings.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega!';
                const image = settings.ferrari_vitrine_image || null;

                // Cor padrão Azul Indigo
                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(res.rows.length === 0 ? `❌ O estoque de **${category}** esgotou no momento. Volte mais tarde!` : desc)
                    .setColor('#3b82f6');

                if (image && image.startsWith('http')) embed.setImage(image);

                let components = [];

                if (res.rows.length > 0) {
                    let msgFields = '';
                    res.rows.forEach((prod, index) => {
                        msgFields += `**${index + 1}. ${prod.name}**\n└ 📦 Unidades: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
                    });
                    embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

                    // Escolhe o emoji baseado na categoria
                    let emojiIcon = '🚘';
                    if (category === 'Motos') emojiIcon = '🏍️';
                    if (category === 'Utilitários') emojiIcon = '🚐';

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('svit_select')
                        .setPlaceholder(`🛒 Selecione a opção (${category})...`)
                        .addOptions(res.rows.map(prod => ({
                            label: prod.name,
                            description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`,
                            value: prod.id.toString(),
                            emoji: emojiIcon
                        })));

                    components = [new ActionRowBuilder().addComponents(selectMenu)];
                }

                // 6. Edita a mensagem da vitrine específica
                await message.edit({ embeds: [embed], components: components }).catch(()=>{});

            } catch (innerErr) {
                console.error(`[Update Vitrine] Falha ao atualizar a vitrine de ${tracker.category}:`, innerErr);
            }
        }

        // 7. 👇 A MÁGICA DO WEBSOCKET AQUI 👇
        // Dispara um sinal para todos os sites conectados recarregarem a lista de carros!
        if (client.io) {
            client.io.emit('estoque_atualizado');
            console.log('[WebSocket] Sinal de atualização enviado para o site!');
        }

    } catch (e) {
        console.error('[Update Vitrine] Erro geral ao atualizar vitrines:', e);
    }
};