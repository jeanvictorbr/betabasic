// File: utils/updateFerrariVitrine.js
const db = require('../database.js');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { formatKK } = require('./rpCurrency.js');

module.exports = async (client, guildId) => {
    try {
        console.log(`[Update Vitrine] 🔄 Iniciando atualização para a Guild: ${guildId}`);

        const guildRes = await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
        const settings = guildRes.rows[0];
        if (!settings) {
            console.log(`[Update Vitrine] ❌ Configurações da guilda não encontradas no banco.`);
            return;
        }

        const vitrinesTrackingRes = await db.query('SELECT * FROM ferrari_vitrines_tracking WHERE guild_id = $1', [guildId]);
        
        if (vitrinesTrackingRes.rows.length === 0) {
            console.log(`[Update Vitrine] ⚠️ Nenhuma vitrine registrada na tabela de tracking. Você já usou o comando /vitrinestock novo?`);
            return;
        }

        console.log(`[Update Vitrine] 📊 Foram encontradas ${vitrinesTrackingRes.rows.length} vitrine(s) para atualizar.`);

        for (const tracker of vitrinesTrackingRes.rows) {
            try {
                const { category, channel_id, message_id } = tracker;
                console.log(`[Update Vitrine] 🔎 Processando Categoria: ${category}`);

                const channel = await client.channels.fetch(channel_id).catch(() => null);
                if (!channel) {
                    console.log(`[Update Vitrine] ❌ Canal ${channel_id} não encontrado. O Bot tem permissão para ver o canal?`);
                    continue;
                }

                const message = await channel.messages.fetch(message_id).catch(() => null);
                if (!message) {
                    console.log(`[Update Vitrine] ❌ Mensagem ${message_id} não encontrada no canal. Alguém apagou a vitrine manualmente?`);
                    continue; 
                }

                let query = 'SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0';
                let params = [guildId];

                if (category !== 'Todos') {
                    query += ' AND category = $2';
                    params.push(category);
                }
                query += ' ORDER BY id ASC LIMIT 25';

                const res = await db.query(query, params);
                console.log(`[Update Vitrine] 📦 O Banco retornou ${res.rows.length} veículo(s) ativo(s) para a categoria ${category}.`);

                let title = settings.ferrari_vitrine_title || '🚘 Centro Comercial | Estoque Imediato';
                if (category !== 'Todos') title += ` - ${category}`;

                const desc = settings.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega!';
                const image = settings.ferrari_vitrine_image || null;

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
                    
                    // Prevenção de erro do Discord (Não permite field vazio ou maior que 1024 char)
                    if (msgFields.length > 1024) msgFields = msgFields.substring(0, 1021) + '...';
                    if (msgFields === '') msgFields = 'Nenhum veículo disponível.';
                    
                    embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

                    let emojiIcon = '🚘';
                    if (category === 'Motos') emojiIcon = '🏍️';
                    if (category === 'Utilitários') emojiIcon = '🚐';

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('svit_select')
                        .setPlaceholder(`🛒 Selecione a opção (${category})...`)
                        .addOptions(res.rows.map(prod => ({
                            label: prod.name.substring(0, 99), // Previne crash se o nome for gigante
                            description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`.substring(0, 99),
                            value: prod.id.toString(),
                            emoji: emojiIcon
                        })));

                    components = [new ActionRowBuilder().addComponents(selectMenu)];
                }

                // AQUI TIREI O CATCH SILENCIOSO PRA VER O ERRO REAL
                await message.edit({ embeds: [embed], components: components });
                console.log(`[Update Vitrine] ✅ Vitrine do Discord [${category}] atualizada com sucesso!`);

            } catch (innerErr) {
                console.error(`[Update Vitrine] ❌ ERRO CRÍTICO no Discord ao atualizar a vitrine de ${tracker.category}:`, innerErr.message);
            }
        }

        if (client.io) {
            client.io.emit('estoque_atualizado');
            console.log('[WebSocket] Sinal de atualização enviado para o site!');
        }

    } catch (e) {
        console.error('[Update Vitrine] ❌ Erro geral ao atualizar vitrines:', e.message);
    }
};