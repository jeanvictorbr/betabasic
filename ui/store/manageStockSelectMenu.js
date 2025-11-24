// Substitua em: ui/store/manageStockSelectMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Gera o menu de seleção com paginação numérica inteligente e correção de IDs duplicados.
 */
module.exports = function generateManageStockSelectMenu(products, currentPage, totalPages, isSearch = false, searchQuery = null) {
    // Validação básica
    if (!products || !Array.isArray(products)) products = [];
    currentPage = parseInt(currentPage) || 0;
    totalPages = parseInt(totalPages) || 1;

    // --- 1. Construir as opções do Menu (Produtos) ---
    const options = products.map(p => {
        let priceFormatted = "R$ 0,00";
        try {
            priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } catch (e) { priceFormatted = `R$ ${p.price}`; }
        
        return {
            label: p.name ? p.name.substring(0, 100) : 'Produto Sem Nome',
            description: `ID: ${p.id} | 💰 ${priceFormatted}`,
            value: p.id.toString(),
            emoji: '📦'
        };
    });

    let placeholderText = `📖 Página ${currentPage + 1} de ${totalPages} - Selecione...`;
    
    if (options.length === 0) {
        options.push({
            label: 'Nenhum produto encontrado',
            description: 'A lista está vazia nesta página.',
            value: 'no_result',
            emoji: '🚫'
        });
        placeholderText = "🚫 Nenhum produto aqui";
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_store_manage_stock')
        .setPlaceholder(isSearch ? `🔎 Busca: "${searchQuery}"` : placeholderText)
        .addOptions(options)
        .setDisabled(options[0].value === 'no_result');

    // --- 2. Construir Botões de Paginação (Lógica Numérica) ---
    const paginationButtons = [];

    if (!isSearch && totalPages > 1) {
        // Botão "Anterior" (Seta)
        // OBS: Adicionamos '_arrow' ao ID para não colidir com o botão numérico da mesma página
        if (currentPage > 0) {
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_page_${currentPage - 1}_arrow`) 
                    .setEmoji('⬅️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        // Lógica da Janela Deslizante (Números)
        let startPage = Math.max(0, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        // Ajuste fino para sempre mostrar 3 botões quando possível
        if (currentPage === 0) endPage = Math.min(totalPages - 1, 2); 
        if (currentPage === totalPages - 1) startPage = Math.max(0, totalPages - 3); 

        for (let i = startPage; i <= endPage; i++) {
            const isCurrent = i === currentPage;
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_page_${i}`) // ID padrão numérico
                    .setLabel(`${i + 1}`) 
                    .setStyle(isCurrent ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(isCurrent)
            );
        }

        // Botão "Próximo" (Seta)
        // OBS: Adicionamos '_arrow' ao ID para garantir unicidade
        if (currentPage < totalPages - 1) {
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_page_${currentPage + 1}_arrow`)
                    .setEmoji('➡️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
    }

    // --- 3. Botões de Controle ---
    const controlButtons = [
        new ButtonBuilder()
            .setCustomId('store_manage_stock_search')
            .setLabel('Pesquisar Nome')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('store_manage_products')
            .setLabel('Voltar')
            .setStyle(ButtonStyle.Danger)
    ];

    // --- 4. Montagem das Rows ---
    const rows = [new ActionRowBuilder().addComponents(selectMenu)];
    
    if (paginationButtons.length > 0) {
        rows.push(new ActionRowBuilder().addComponents(paginationButtons));
    }
    
    rows.push(new ActionRowBuilder().addComponents(controlButtons));

    // --- 5. Retorno V2 ---
    const time = new Date().toLocaleTimeString('pt-BR');
    
    return [
        {
            type: 17,
            components: [
                { 
                    type: 10, 
                    content: isSearch 
                        ? `> **🔍 Resultados da Busca:** \`${searchQuery}\``
                        : `> **📦 Gerenciar Estoque Real**\n> Selecione o produto para adicionar keys/itens.\n> \n> 🏷️ **Página Atual:** ${currentPage + 1} / ${totalPages}\n> 🕒 *Atualizado às ${time}*` 
                }
            ]
        },
        ...rows
    ];
};