// Arquivo: utils/updateStoreVitrine.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database');

/**
 * Atualiza ou cria a vitrine de uma categoria específica.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @param {string|number} categoryId 
 */
async function updateStoreVitrine(client, guildId, categoryId) {
    try {
        // 1. Buscar dados da Categoria
        const catResult = await db.query('SELECT * FROM store_categories WHERE id = $1', [categoryId]);
        if (catResult.rows.length === 0) return;
        const category = catResult.rows[0];

        // 2. Validações: Se não tiver canal/mensagem configurados, para.
        if (!category.vitrine_channel_id || !category.vitrine_message_id) return;

        // 3. Buscar Produtos Ativos da Categoria
        const prodResult = await db.query(
            'SELECT * FROM store_products WHERE category_id = $1 AND is_enabled = true ORDER BY id ASC',
            [categoryId]
        );
        const products = prodResult.rows;

        // 4. Buscar o Canal e a Mensagem no Discord
        const channel = await client.channels.fetch(category.vitrine_channel_id).catch(() => null);
        if (!channel) {
            console.warn(`[Vitrine] Canal ${category.vitrine_channel_id} não encontrado.`);
            return;
        }

        const message = await channel.messages.fetch(category.vitrine_message_id).catch(() => null);
        if (!message) {
            console.warn(`[Vitrine] Mensagem ${category.vitrine_message_id} não encontrada.`);
            return;
        }

        // 5. Construir o Embed Visual
        const embed = new EmbedBuilder()
            .setTitle(category.vitrine_title || `📂 ${category.name}`)
            .setDescription(category.vitrine_desc || 'Explore nossos produtos abaixo e selecione para comprar.')
            .setColor(category.vitrine_color || '#2b2d31')
            .setFooter({ text: `Categoria ID: ${categoryId} • StoreFlow` });

        // Adiciona imagem se existir
        if (category.vitrine_image && category.vitrine_image.startsWith('http')) {
            embed.setImage(category.vitrine_image);
        }
        // Adiciona thumbnail se existir
        if (category.vitrine_thumbnail && category.vitrine_thumbnail.startsWith('http')) {
            embed.setThumbnail(category.vitrine_thumbnail);
        }

        // 6. Construir o Menu de Seleção (Produtos)
        const components = [];

        if (products.length > 0) {
            // Discord limita a 25 opções
            const options = products.slice(0, 25).map(p => {
                const price = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                return {
                    label: p.name.substring(0, 100),
                    description: `${price} - ${p.description ? p.description.substring(0, 50) : 'Sem descrição'}`,
                    value: `store_prod_${p.id}`, // Value que o handler vai ler
                    emoji: '🛒'
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`store_vitrine_select_${categoryId}`) // ID do Select
                .setPlaceholder('👇 Selecione um produto para adicionar ao carrinho...')
                .addOptions(options);

            components.push(new ActionRowBuilder().addComponents(selectMenu));
        } else {
            embed.addFields({ name: '🚫 Estoque', value: 'Nenhum produto disponível nesta categoria no momento.' });
        }

        // 7. Editar a Mensagem (Substitui o "Inicializando...")
        await message.edit({
            content: null, // Remove o texto simples
            embeds: [embed],
            components: components
        });

        console.log(`[Vitrine] Vitrine da categoria ${category.name} (${categoryId}) atualizada com sucesso.`);

    } catch (error) {
        console.error(`[Vitrine] Erro crítico ao atualizar categoria ${categoryId}:`, error);
    }
}

module.exports = updateStoreVitrine;