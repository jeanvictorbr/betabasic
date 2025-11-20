const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'aut_oauth_manage_members',
    async execute(interaction) {
        await loadMembersPage(interaction, 1);
    }
};

// Função auxiliar para carregar páginas (pode ser exportada se usar em outros botões de paginação)
async function loadMembersPage(interaction, page) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const authUrl = process.env.AUTH_SYSTEM_URL;
    
    if (!authUrl) return interaction.followUp({ content: "⚠️ URL do Auth System não configurada.", ephemeral: true });

    try {
        // Busca usuarios na API do Auth System
        const response = await axios.get(`${authUrl}/api/users`, {
            params: { guild_id: guildId, page: page, limit: 10 }
        });

        const { users, total, totalPages } = response.data;

        if (total === 0) {
            return interaction.editReply({
                content: "🚫 Nenhum membro verificado encontrado originário deste servidor.",
                components: [], embeds: []
            });
        }

        // Filtra para não mostrar o próprio usuário que está mexendo (anti-self-transfer kkk)
        const filteredUsers = users.filter(u => u.id !== interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`👥 Gerenciamento de Membros (${total} Total)`)
            .setDescription(`Lista de usuários que se verificaram através deste servidor.\nSelecione um usuário abaixo para **Forçar Entrada (Transferir)**.`)
            .setFooter({ text: `Página ${page} de ${totalPages}` })
            .setColor('#5865F2');

        // Cria o menu de seleção com os usuários da página
        const options = filteredUsers.map(user => ({
            label: user.username,
            description: `ID: ${user.id} - Verificado em: ${new Date(user.updated_at).toLocaleDateString()}`,
            value: `transfer_${user.id}`,
            emoji: '👤'
        }));

        const rows = [];
        
        if (options.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('oauth_select_user_transfer')
                .setPlaceholder('Selecione um membro para puxar...')
                .addOptions(options);
            rows.push(new ActionRowBuilder().addComponents(selectMenu));
        } else {
            embed.setDescription("Nenhum usuário disponível nesta página (você foi filtrado).");
        }

        // Botões de Paginação
        const navRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`oauth_page_${page - 1}`).setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
            new ButtonBuilder().setCustomId('oauth_refresh_list').setLabel('🔄 Atualizar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`oauth_page_${page + 1}`).setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages)
        );
        rows.push(navRow);

        await interaction.editReply({ embeds: [embed], components: rows });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: "❌ Erro ao conectar com o Banco de Dados de Auth.", components: [] });
    }
}