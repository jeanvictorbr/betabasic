const V2_FLAG = 1 << 15;

module.exports = {
    customId: 'store_stock_search',
    async execute(interaction) {
        // Retorna o Modal (Type 9)
        return interaction.client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 9,
                data: {
                    custom_id: 'modal_store_stock_search',
                    title: 'Pesquisar Produto',
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4, // Text Input
                                    custom_id: 'search_query',
                                    style: 1, // Short
                                    label: 'Nome ou termo do produto',
                                    placeholder: 'Ex: Vip Diamante',
                                    min_length: 1,
                                    max_length: 100,
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            }
        });
    }
};