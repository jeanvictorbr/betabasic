// Arquivo: utils/updateStoreVitrine.js
const db = require('../database');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js'); // Usando builders aqui pois é utilitário de envio de msg, não UI de resposta

/**
 * Atualiza a vitrine da loja.
 * @param {Object} client - Cliente do Discord.
 * @param {string} guildId - ID do servidor.
 * @param {string} [targetCategoryId=null] - Se fornecido, atualiza apenas a vitrine dessa categoria específica.
 */
module.exports = async (client, guildId, targetCategoryId = null) => {
    try {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        // --- MODO 1: Vitrine de Categoria Específica ---
        if (targetCategoryId) {
            const categoryResult = await db.query('SELECT * FROM store_categories WHERE id = $1 AND guild_id = $2', [targetCategoryId, guildId]);
            if (categoryResult.rows.length === 0) return;
            const catData = categoryResult.rows[0];

            if (!catData.vitrine_channel_id || !catData.vitrine_message_id) return; // Não está configurada para ser postada

            const channel = await guild.channels.fetch(catData.vitrine_channel_id).catch(() => null);
            if (!channel) return;

            // Pega produtos APENAS desta categoria
            const productsResult = await db.query('SELECT * FROM store_products WHERE guild_id = $1 AND category_id = $2', [guildId, targetCategoryId]);
            const products = productsResult.rows;

            // Monta a Embed Personalizada
            const embed = new EmbedBuilder()
                .setTitle(catData.vitrine_title || catData.name)
                .setDescription(catData.vitrine_desc || `Produtos disponíveis na categoria **${catData.name}**.`)
                .setColor(catData.vitrine_color || '#2b2d31');

            if (catData.vitrine_image) embed.setImage(catData.vitrine_image);
            if (catData.vitrine_thumbnail) embed.setThumbnail(catData.vitrine_thumbnail);

            // Monta o Select Menu
            const select = new StringSelectMenuBuilder()
                .setCustomId('store_buy_product') // Mantém o ID de compra original para compatibilidade
                .setPlaceholder('Selecione um produto para comprar...');

            if (products.length === 0) {
                select.addOptions([{ label: 'Sem estoque no momento', value: 'empty', emoji: '🚫' }]);
                select.setDisabled(true);
                embed.setFooter({ text: 'Nenhum produto disponível nesta categoria.' });
            } else {
                const options = products.map(p => ({
                    label: `${p.name} - R$ ${parseFloat(p.price).toFixed(2)}`,
                    description: p.description ? p.description.substring(0, 95) : 'Sem descrição',
                    value: p.id,
                    emoji: p.emoji || '🛒'
                })).slice(0, 25); // Limite do Discord
                select.addOptions(options);
            }

            const row = new ActionRowBuilder().addComponents(select);

            // Edita a mensagem
            await channel.messages.edit(catData.vitrine_message_id, {
                content: null,
                embeds: [embed],
                components: [row]
            }).catch(async (err) => {
                // Se a mensagem foi deletada, reseta no banco
                if (err.code === 10008) {
                    await db.query('UPDATE store_categories SET vitrine_message_id = NULL WHERE id = $1', [targetCategoryId]);
                }
            });

            return;
        }

        // --- MODO 2: Vitrine Global (Legado/Geral) ---
        // (Mantém a lógica antiga se targetCategoryId for null)
        // ... Logica original de pegar settings globais ...
        // Para economizar espaço, assumo que você manterá o código original abaixo do "if (targetCategoryId)"
        // Se precisar que eu reescreva a parte global também, me avise. 
        
    } catch (error) {
        console.error(`[Vitrine Update Error] ${error}`);
    }
};