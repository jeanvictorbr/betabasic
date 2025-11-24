module.exports = (products, page = 0, totalPages = 1) => {
    const PRODUCTS_PER_PAGE = 3;
    const start = page * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    const currentProducts = products.slice(start, end);

    const components = [];

    // Cabeçalho (Simulado com botão desativado se necessário, ou apenas os itens)
    // Vamos direto aos produtos para economizar espaço (máx 5 linhas)

    if (currentProducts.length === 0) {
        components.push({
            type: 1,
            components: [{
                type: 2, style: 2, label: '🚫 Nenhum produto encontrado.', custom_id: 'noop_empty', disabled: true
            }]
        });
    }

    currentProducts.forEach(product => {
        // Formata o preço
        const price = parseFloat(product.price).toFixed(2).replace('.', ',');
        const stock = product.stock || 0;
        
        // Cria uma linha para cada produto
        components.push({
            type: 1,
            components: [
                // Botão VISUAL (Info do produto) - Estilo Secondary (Cinza) e Desativado
                {
                    type: 2,
                    style: 2, 
                    label: `${product.name} | R$ ${price} | Stock: ${stock}`,
                    custom_id: `info_${product.id}`,
                    disabled: true,
                    emoji: { name: '🏷️' }
                },
                // Botão AÇÃO (Gerir Estoque) - Estilo Primary (Blurple)
                {
                    type: 2,
                    style: 1,
                    label: 'Estoque',
                    custom_id: `store_open_stock_panel_${product.id}`,
                    emoji: { name: '📦' }
                },
                // Botão AÇÃO (Editar) - Estilo Secondary
                {
                    type: 2,
                    style: 2,
                    label: '',
                    custom_id: `store_edit_product_${product.id}`,
                    emoji: { name: '✏️' }
                }
            ]
        });
    });

    // Adiciona linhas vazias para manter o layout fixo se houver menos de 3 produtos (opcional, mas bom para UX)
    // Omitido para simplificar, o Discord ajusta altura automaticamente.

    // Linha de Navegação (Sempre na última linha possível)
    const navRow = {
        type: 1,
        components: [
            {
                type: 2, style: 2, label: '◀', custom_id: `store_products_page_${page - 1}`, disabled: page === 0
            },
            {
                type: 2, style: 2, label: `${page + 1}/${totalPages}`, custom_id: 'noop_page', disabled: true
            },
            {
                type: 2, style: 2, label: '▶', custom_id: `store_products_page_${page + 1}`, disabled: page >= totalPages - 1
            },
            {
                type: 2, style: 3, label: 'Novo Produto', custom_id: 'store_add_product', emoji: { name: '➕' }
            }
        ]
    };
    
    // Se tivermos 5 linhas de produtos, a navegação falharia (limite é 5). 
    // Como limitamos a 3 produtos, teremos no máximo 3 linhas de produtos + 1 navegação = 4 linhas. Seguro.
    components.push(navRow);

    return {
        // NÃO enviamos embeds nem content para evitar o erro 50035 com V2_FLAG
        components: components
    };
};