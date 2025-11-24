const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock_page_', 
    async execute(interaction) {
        // Tenta deferir, se falhar, ignora (evita erro "Unknown Interaction")
        try { await interaction.deferUpdate(); } catch (e) {}

        try {
            // 1. Extrai a página desejada do ID
            const parts = interaction.customId.split('_');
            let page = parseInt(parts[parts.length - 1]);
            if (isNaN(page)) page = 0;

            // 2. Busca TODOS os produtos ordenados
            const products = (await db.query('SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

            // 3. Configuração da Paginação
            const ITEMS_PER_PAGE = 25;
            const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
            
            // Garante que a página seja válida
            const safePage = Math.max(0, Math.min(page, totalPages - 1));

            // 4. Fatia os produtos (Pega os próximos 25)
            const start = safePage * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const displayedProducts = products.slice(start, end);

            if (displayedProducts.length === 0) {
                return interaction.followUp({ content: "⚠️ Página vazia.", flags: EPHEMERAL_FLAG });
            }

            // 5. Monta as opções do Menu
            const options = displayedProducts.map(p => {
                const priceVal = parseFloat(p.price);
                const priceFormatted = isNaN(priceVal) ? "0,00" : priceVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                return {
                    label: p.name.substring(0, 100),
                    description: `💰 ${priceFormatted} | ID: ${p.id}`,
                    value: p.id.toString(),
                    emoji: { name: "📦" }
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_store_manage_stock')
                .setPlaceholder(`📦 Página ${safePage + 1}/${totalPages}`)
                .addOptions(options);

            // 6. Botões de Navegação
            const navigationRow = new ActionRowBuilder();
            navigationRow.addComponents(
                new ButtonBuilder().setCustomId('store_manage_stock_search').setLabel('🔍 Pesquisar').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`store_manage_stock_page_${safePage - 1}`).setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(safePage === 0),
                new ButtonBuilder().setCustomId('store_manage_products').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`store_manage_stock_page_${safePage + 1}`).setLabel('▶️').setStyle(ButtonStyle.Primary).setDisabled(safePage >= totalPages - 1)
            );

            // 7. Monta o Embed (Visual Padrão que NÃO FALHA)
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('📦 Gerenciamento de Estoque')
                .setDescription(`Selecione um produto abaixo para gerenciar.\n\n📊 **Total:** \`${products.length}\` produtos\n📄 **Página:** \`${safePage + 1}/${totalPages}\``);

            // 8. Atualiza a mensagem (Remove conteúdo V2 antigo se houver)
            await interaction.editReply({
                content: null, // Limpa texto solto
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(selectMenu), 
                    navigationRow
                ]
            });

        } catch (error) {
            console.error('Erro na paginação:', error);
            await interaction.followUp({ content: '❌ Erro ao mudar de página.', flags: EPHEMERAL_FLAG });
        }
    }
};