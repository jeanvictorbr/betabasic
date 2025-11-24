// Novo Arquivo: handlers/buttons/store_manage_stock_page_.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock_page_', // O 'index.js' detecta IDs que começam com isso
    async execute(interaction) {
        await interaction.deferUpdate();

        // 1. Descobre qual página o usuário quer (extrai do ID do botão)
        // Ex: store_manage_stock_page_1 -> page = 1
        const page = parseInt(interaction.customId.split('_').pop());

        // 2. Busca os produtos novamente
        const products = (await db.query('SELECT id, name FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

        // 3. Configuração da Paginação
        const ITEMS_PER_PAGE = 25;
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        // Validação simples para não sair dos limites
        const safePage = Math.max(0, Math.min(page, totalPages - 1));

        // 4. Fatia os produtos
        const displayedProducts = products.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

        const options = displayedProducts.map(p => ({
            label: p.name.substring(0, 100),
            description: `ID do Produto: ${p.id}`,
            value: p.id.toString(),
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`Selecione um produto (Página ${safePage + 1}/${totalPages})`)
            .addOptions(options);

        // 5. Botões de Navegação
        const navigationRow = new ActionRowBuilder();
        
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${safePage - 1}`)
                .setLabel('◀️ Anterior')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(safePage === 0) // Desativa se for a primeira
        );

        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_products')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${safePage + 1}`)
                .setLabel('Próxima ▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(safePage >= totalPages - 1) // Desativa se for a última
        );

        // 6. Atualiza a mensagem
        await interaction.editReply({
            components: [
                { type: 17, components: [{ type: 10, content: `> **Gerenciamento de Estoque**\n> Exibindo produtos **${safePage * ITEMS_PER_PAGE + 1}** a **${Math.min((safePage + 1) * ITEMS_PER_PAGE, products.length)}** de **${products.length}**.` }] },
                new ActionRowBuilder().addComponents(selectMenu), 
                navigationRow
            ],
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};