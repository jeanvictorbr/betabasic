const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock',
    async execute(interaction) {
        // Se for um botão, usamos deferUpdate. Se for comando (raro aqui), deferReply.
        if (interaction.isButton()) await interaction.deferUpdate();
        else await interaction.deferReply({ flags: V2_FLAG | EPHEMERAL_FLAG });
        
        // 1. Busca produtos (Incluindo o PREÇO agora)
        const products = (await db.query('SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

        if (products.length === 0) {
             return interaction.editReply({
                components: [{ type: 17, components: [{ type: 10, content: "❌ Nenhum produto encontrado." }] }],
                flags: V2_FLAG | EPHEMERAL_FLAG
            });
        }

        // 2. Configuração da Paginação
        const page = 0;
        const ITEMS_PER_PAGE = 25;
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        // 3. Fatia os produtos
        const displayedProducts = products.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

        // 4. Cria o Menu com EMOJI e PREÇO
        const options = displayedProducts.map(p => {
            const priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return {
                label: `${p.name.substring(0, 80)}`, // Nome
                description: `💰 ${priceFormatted} | ID: ${p.id}`, // Preço e ID na descrição
                value: p.id.toString(),
                emoji: { name: "📦" } // Emoji fixo para ficar bonito
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`📦 Selecione um produto (Pág ${page + 1}/${totalPages})`)
            .addOptions(options);

        // 5. Botões de Navegação + PESQUISA
        const navigationRow = new ActionRowBuilder();
        
        // Botão Pesquisar (Novo)
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_stock_search')
                .setLabel('🔍 Pesquisar')
                .setStyle(ButtonStyle.Success)
        );

        // Botão Anterior
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${page - 1}`)
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
        );

        // Botão Cancelar
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_products')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        // Botão Próximo
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${page + 1}`)
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(totalPages <= 1)
        );

        await interaction.editReply({
            components: [
                { type: 17, components: [{ type: 10, content: `> **Gerenciamento de Estoque**\n> Selecione um produto abaixo para gerenciar seu estoque.\n> *Total de Produtos:* \`${products.length}\`` }] },
                new ActionRowBuilder().addComponents(selectMenu), 
                navigationRow
            ],
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};