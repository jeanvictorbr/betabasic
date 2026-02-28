const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js');

module.exports = {
    // 🔴 O underline no final é obrigatório pra ele ler as categorias dinâmicas
    customId: 'modal_fstk_add_', 
    execute: async (interaction, guildSettings) => {
        await interaction.deferReply({ ephemeral: true });

        // O Bot "lembra" a categoria que estava escondida no ID
        const safeCat = interaction.customId.replace('modal_fstk_add_', '');
        const categoria = safeCat.replace(/-/g, ' '); 

        const nome = interaction.fields.getTextInputValue('v_name');
        const preco = interaction.fields.getTextInputValue('v_price');
        const quantidade = interaction.fields.getTextInputValue('v_qty');

        // 1. Salva no Banco de Dados
        await db.query(
            'INSERT INTO ferrari_stock_products (guild_id, name, category, price_kk, quantity) VALUES ($1, $2, $3, $4, $5)',
            [interaction.guildId, nome, categoria, preco, quantidade]
        );

        // 2. Atualiza Vitrines do Discord na hora e avisa o Site
        try {
            await updateVitrine(interaction.client, interaction.guildId);
            if (interaction.client.io) interaction.client.io.emit('estoque_atualizado');
        } catch(e) {}

        // 3. Sistema de Logs no Canal OFICIAL da sua loja!
        const logChannelId = guildSettings?.ferrari_log_channel; 
        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            if (logChannel) {
                const logEmbed = new EmbedBuilder().setTitle('📦 Novo Veículo Cadastrado').setColor('#2ECC71')
                    .addFields(
                        { name: 'Veículo', value: nome, inline: true },
                        { name: 'Categoria', value: categoria, inline: true },
                        { name: 'Estoque/Preço', value: `${quantidade} unid. / R$ ${preco}`, inline: false },
                        { name: 'Staff', value: `<@${interaction.user.id}>`, inline: true }
                    ).setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(()=>{});
            }
        }

        await interaction.editReply({ content: `✅ O veículo **${nome}** foi adicionado com sucesso em **${categoria}** e as vitrines já atualizaram!` });
    }
};