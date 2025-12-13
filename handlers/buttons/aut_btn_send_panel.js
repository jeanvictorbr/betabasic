// handlers/buttons/aut_btn_send_panel.js
const { StringSelectMenuBuilder, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'aut_btn_send_panel', // Este ID deve estar no botão "Enviar Painel" do menu de gerenciamento
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Pega o ID do painel que está sendo editado (normalmente salvo na session ou passado via select anterior)
        // Aqui assumo que você tem uma lógica para saber qual painel está editando. 
        // Se não tiver, precisamos capturar do interaction.message ou de uma variavel global temporaria.
        // Vou usar um hack comum: pegar o ID do painel do footer da embed de gerenciamento se possível, 
        // ou você deve garantir que o botão de enviar tenha o ID 'aut_btn_send_panel_IDDOBANCO'
        
        let panelId = interaction.customId.split('_')[4]; // Se o ID for aut_btn_send_panel_123
        
        // Se o ID não veio no botão, tenta pegar do menu de seleção anterior (mais complexo).
        // Vamos assumir que você ajustará o botão de enviar para ter o ID.
        // Se estiver usando o fluxo do aut_button_roles_menu, o select 'aut_btn_sel_' salva o ID.
        
        // [MODO DE SEGURANÇA] Pega o último painel editado/criado se não tiver ID
        if (!panelId) {
             const last = await db.query('SELECT panel_id FROM button_role_panels WHERE guild_id = $1 ORDER BY panel_id DESC LIMIT 1', [interaction.guild.id]);
             if (last.rows.length > 0) panelId = last.rows[0].panel_id;
        }

        const panel = (await db.query('SELECT * FROM button_role_panels WHERE panel_id = $1', [panelId])).rows[0];

        if (!panel || !panel.roles_data || panel.roles_data.length === 0) {
            return interaction.editReply('❌ Este painel não existe ou não tem cargos configurados.');
        }

        // Constrói o Embed
        const embed = {
            title: panel.title,
            description: panel.description || 'Selecione seus cargos abaixo:',
            color: 0x2B2D31,
            image: panel.image_url ? { url: panel.image_url } : null,
            footer: { text: 'Sistema de Auto-Cargos • BasicFlow' }
        };

        // --- AQUI ESTÁ A MÁGICA: CRIA O SELECT MENU ---
        const options = panel.roles_data.map(role => ({
            label: role.label || 'Cargo',
            value: role.role_id, // O valor é o ID do cargo
            description: 'Clique para adicionar/remover',
            emoji: role.emoji || '🔸'
        })).slice(0, 25); // Garante max 25

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('aut_role_system_interact') // ID fixo que o bot vai ouvir
            .setPlaceholder('▼ Selecione seus cargos aqui...')
            .setMinValues(0) // Permite limpar tudo
            .setMaxValues(options.length) // Permite selecionar TODOS
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply('✅ Painel enviado com sucesso neste canal!');
    }
};