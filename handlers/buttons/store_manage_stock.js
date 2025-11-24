const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock',
    async execute(interaction) {
        if (interaction.isButton()) await interaction.deferUpdate();
        else await interaction.deferReply({ flags: EPHEMERAL_FLAG });
        
        const products = (await db.query('SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

        if (products.length === 0) {
             return interaction.editReply({
                content: '❌ **Nenhum produto encontrado.** Adicione produtos na loja primeiro.',
                components: []
            });
        }

        // Configuração Paginação
        const page = 0;
        const ITEMS_PER_PAGE = 25;
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        const displayedProducts = products.slice(0, ITEMS_PER_PAGE);

        const options = displayedProducts.map(p => {
            const priceVal = parseFloat(p.price);
            const priceFormatted = isNaN(priceVal) ? "R$ 0,00" : priceVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            return {
                label: p.name.substring(0, 100),
                description: `💰 ${priceFormatted} | ID: ${p.id}`,
                value: p.id.toString(),
                emoji: { name: "📦" }
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`📦 Selecione um produto (Pág ${page + 1}/${totalPages})`)
            .addOptions(options);

        const navigationRow = new ActionRowBuilder();
        
        navigationRow.addComponents(
            new ButtonBuilder().setCustomId('store_manage_stock_search').setLabel('🔍 Pesquisar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`store_manage_stock_page_${page - 1}`).setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(true),
            new ButtonBuilder().setCustomId('store_manage_products').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`store_manage_stock_page_${page + 1}`).setLabel('▶️').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
        );

        // Embed em vez de V2 (Resolve o crash)
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('📦 Gerenciamento de Estoque')
            .setDescription(`Selecione um produto abaixo para adicionar ou remover estoque.\n\n📊 **Total de Produtos:** \`${products.length}\`\n📄 **Página:** \`${page + 1}/${totalPages}\``)
            .setFooter({ text: 'Use os botões para navegar ou pesquisar.' });

        await interaction.editReply({
            content: null, // Limpa conteúdo anterior
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(selectMenu), 
                navigationRow
            ]
        });
    }
};