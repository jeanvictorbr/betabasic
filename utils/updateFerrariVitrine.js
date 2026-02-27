// File: utils/updateFerrariVitrine.js
const db = require('../database.js');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { formatKK } = require('./rpCurrency.js');

module.exports = async (client, guildId) => {
    try {
        // Busca configurações da vitrine
        const guildRes = await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
        const settings = guildRes.rows[0];

        if (!settings || !settings.ferrari_vitrine_channel || !settings.ferrari_vitrine_msg) return;

        // Busca o canal e a mensagem
        const channel = await client.channels.fetch(settings.ferrari_vitrine_channel).catch(() => null);
        if (!channel) return;
        const message = await channel.messages.fetch(settings.ferrari_vitrine_msg).catch(() => null);
        if (!message) return; // Se apagaram a mensagem, a gente ignora

        // Busca o estoque atualizado (Apenas com quantidade > 0)
        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC LIMIT 25', [guildId]);

        const title = settings.ferrari_vitrine_title || '🚘 Loja Premium | Estoque Imediato';
        const desc = settings.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega!';
        const image = settings.ferrari_vitrine_image || null;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(res.rows.length === 0 ? '❌ Nosso estoque esgotou no momento. Volte mais tarde!' : desc)
            .setColor('#2b2d31');

        if (image && image.startsWith('http')) embed.setImage(image);

        let components = [];

        if (res.rows.length > 0) {
            let msgFields = '';
            res.rows.forEach((prod, index) => {
                msgFields += `**${index + 1}. ${prod.name}**\n└ 📦 Unidades: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
            });
            embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('svit_select')
                .setPlaceholder('🛒 Selecione o veículo que deseja comprar...')
                .addOptions(res.rows.map(prod => ({
                    label: prod.name,
                    description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`,
                    value: prod.id.toString(),
                    emoji: '🚘'
                })));

            components = [new ActionRowBuilder().addComponents(selectMenu)];
        }

        // Edita a mensagem da vitrine viva!
        await message.edit({ embeds: [embed], components: components });
// 👇 A MÁGICA DO WEBSOCKET AQUI 👇
        // Dispara um sinal para todos os sites conectados recarregarem a lista de carros!
        if (client.io) {
            client.io.emit('estoque_atualizado');
            console.log('[WebSocket] Sinal de atualização enviado para o site!');
        }
    } catch (e) {
        console.error('[Update Vitrine] Erro ao atualizar vitrine:', e);
    }
};