const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const vehicleData = require('../../config/ferrariVehicles.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = {
    customId: 'f_mod_',
    async execute(interaction, guildSettings) {
        const payload = interaction.customId.replace('f_mod_', '').split('_');
        const type = payload[0];
        const category = payload[1];
        const vehicleIndex = parseInt(payload[2]);
        
        const clientInfo = interaction.fields.getTextInputValue('client_info');
        const vehicle = vehicleData[category][vehicleIndex];

        if (!vehicle) return interaction.reply({ content: '❌ Erro ao localizar veículo na base.', ephemeral: true });

        const lucro = vehicle.bruto - vehicle.caixa;

        // O segredo está aqui: ephemeral (Invisível pra todos, menos pro usuário)
        await interaction.deferReply({ ephemeral: true });

        try {
            await db.query(`
                INSERT INTO ferrari_sales_log (guild_id, user_id, vehicle_name, category, client_info, sale_type, price_bruto, price_caixa, profit)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [interaction.guildId, interaction.user.id, vehicle.name, category, clientInfo, type, vehicle.bruto, vehicle.caixa, lucro]);

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Registro Efetuado com Sucesso!')
                .setColor('#2ECC71')
                .addFields(
                    { name: 'Tipo', value: type.toUpperCase(), inline: true },
                    { name: 'Veículo', value: vehicle.name, inline: true },
                    { name: 'Cliente', value: clientInfo, inline: true },
                    { name: '💰 Repasse Caixa', value: formatKK(vehicle.caixa), inline: true },
                    { name: '🤑 Seu Lucro', value: formatKK(lucro), inline: true }
                );

            await interaction.editReply({ embeds: [successEmbed] });

            // APAGA MENSAGEM DO USUÁRIO EM 10 SEGUNDOS (Limpeza visual)
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 10000);

            // LOG PARA A CHEFIA (Essa fica salva no canal que ele configurou)
            if (guildSettings && guildSettings.ferrari_log_channel) {
                const logChannel = await interaction.guild.channels.fetch(guildSettings.ferrari_log_channel).catch(()=>null);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setAuthor({ name: `Novo Registro de ${type.toUpperCase()}`, iconURL: interaction.user.displayAvatarURL() })
                        .setColor('#FF0000')
                        .setDescription(`**Corretor:** <@${interaction.user.id}>\n**Cliente:** ${clientInfo}\n**Veículo:** ${vehicle.name} (${category})`)
                        .addFields(
                            { name: 'Valor Bruto', value: formatKK(vehicle.bruto), inline: true },
                            { name: 'Caixa (A Receber)', value: `**${formatKK(vehicle.caixa)}**`, inline: true },
                            { name: 'Lucro Corretor', value: formatKK(lucro), inline: true }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('[Ferrari Mod] Erro ao salvar:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro crítico ao salvar sua venda no Banco.', embeds: [] });
        }
    }
};