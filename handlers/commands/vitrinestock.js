const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = async (interaction, guildSettings) => {
    // 1. Pega a categoria selecionada no comando
    const categoria = interaction.options.getString('categoria');

    // 2. Monta a busca no banco dependendo da categoria
    let query = 'SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0';
    let params = [interaction.guildId];

    if (categoria !== 'Todos') {
        query += ' AND category = $2';
        params.push(categoria);
    }
    query += ' ORDER BY id ASC LIMIT 25';

    const res = await db.query(query, params);
    
    if (res.rows.length === 0) return interaction.reply({ content: `❌ Nenhum produto da categoria **${categoria}** em estoque.`, ephemeral: true });

    // 3. Monta o Visual da Vitrine
    let title = guildSettings?.ferrari_vitrine_title || '🚘 Centro Comercial | Estoque Imediato';
    if (categoria !== 'Todos') title += ` - ${categoria}`; 

    const desc = guildSettings?.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega!';
    const image = guildSettings?.ferrari_vitrine_image || null;

    // Atualizado para a cor azul do seu site
    const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor('#3b82f6');
    if (image && image.startsWith('http')) embed.setImage(image);

    let msgFields = '';
    res.rows.forEach((prod, index) => {
        msgFields += `**${index + 1}. ${prod.name}**\n└ 📦 Unidades: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
    });
    embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

    // Escolhe o emoji baseado na categoria
    let emojiIcon = '🚘';
    if (categoria === 'Motos') emojiIcon = '🏍️';
    if (categoria === 'Utilitários') emojiIcon = '🚐';

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('svit_select')
        .setPlaceholder(`🛒 Selecione a opção (${categoria})...`)
        .addOptions(res.rows.map(prod => ({
            label: prod.name,
            description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`,
            value: prod.id.toString(),
            emoji: emojiIcon
        })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // 4. Envia a mensagem
    const sentMsg = await interaction.channel.send({ embeds: [embed], components: [row] });

    // 5. MÁGICA: Tabela independente para salvar múltiplas vitrines!
    await db.query(`
        CREATE TABLE IF NOT EXISTS ferrari_vitrines_tracking (
            guild_id VARCHAR(50),
            category VARCHAR(50),
            channel_id VARCHAR(50),
            message_id VARCHAR(50),
            PRIMARY KEY (guild_id, category)
        )
    `).catch(() => {});

    // Salva ou Atualiza a mensagem DESSA categoria específica
    await db.query(`
        INSERT INTO ferrari_vitrines_tracking (guild_id, category, channel_id, message_id) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id, category) 
        DO UPDATE SET channel_id = EXCLUDED.channel_id, message_id = EXCLUDED.message_id
    `, [interaction.guildId, categoria, interaction.channelId, sentMsg.id]);

    await interaction.reply({ content: `✅ Vitrine de **${categoria}** enviada e vinculada com sucesso!`, ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(()=>{}), 5000);
};