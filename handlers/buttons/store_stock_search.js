module.exports = {
    customId: 'store_stock_search',
    async execute(interaction) {
        await interaction.showModal({
            custom_id: 'modal_store_stock_search',
            title: '🔍 Pesquisar Produto',
            components: [{
                type: 1,
                components: [{
                    type: 4, custom_id: 'search_query', label: 'Nome do produto',
                    style: 1, min_length: 1, max_length: 100, required: true,
                    placeholder: 'Ex: Vip Ouro'
                }]
            }]
        });
    }
};