// Substitua em: ui/store/manageStockSelectMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Gera o menu de seleção com paginação numérica inteligente.
 */
module.exports = function generateManageStockSelectMenu(products, currentPage, totalPages, isSearch = false, searchQuery = null) {
    // Garante arrays e números válidos
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
        // Botão "Anterior" (só aparece se não for a pág 1)
        if (currentPage > 0) {
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_page_${currentPage - 1}`)
                    .setEmoji('⬅️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        // Lógica da Janela Deslizante (Mostra até 3 números: Anterior, Atual, Próximo)
        // Ex: Pág 5 de 10 -> Mostra [4] [5] [6]
        let startPage = Math.max(0, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        // Ajuste para garantir que sempre mostre botões suficientes nas pontas
        if (currentPage === 0) endPage = Math.min(totalPages - 1, 2); // Se tá na 1, mostra 1, 2, 3
        if (currentPage === totalPages - 1) startPage = Math.max(0, totalPages - 3); // Se tá na última, mostra antepenúltima...

        for (let i = startPage; i <= endPage; i++) {
            const isCurrent = i === currentPage;
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_page_${i}`)
                    .setLabel(`${i + 1}`) // Mostra número humano (1-based)
                    .setStyle(isCurrent ? ButtonStyle.Success : ButtonStyle.Secondary) // Atual é verde
                    .setDisabled(isCurrent) // Desativa o botão da página atual
            );
        }

        // Botão "Próximo" (só aparece se não for a última pág)
        if (currentPage < totalPages - 1) {
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_page_${currentPage + 1}`)
                    .setEmoji('➡️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
    }

    // --- 3. Botões de Controle (Pesquisa e Voltar) ---
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
    
    // Adiciona row de paginação se tiver botões (e não for busca)
    if (paginationButtons.length > 0) {
        rows.push(new ActionRowBuilder().addComponents(paginationButtons));
    }
    
    // Adiciona row de controle
    rows.push(new ActionRowBuilder().addComponents(controlButtons));

    // --- 5. Retorno V2 ---
    // Adicionamos um timestamp no footer para o Admin ver que atualizou
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