// Crie em: handlers/modals/modal_ticket_greeting_edit.js
const db = require('../../database.js');
const generateGreetingMenu = require('../../ui/ticketsGreetingMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_ticket_greeting_edit',
    async execute(interaction) {
        await interaction.deferUpdate();
        const newMessage = interaction.fields.getTextInputValue('input_greeting_message');

        // 1. Atualiza a mensagem no banco
        await db.query(
            'UPDATE guild_settings SET tickets_greeting_message = $1 WHERE guild_id = $2',
            [newMessage, interaction.guild.id]
        );

        // 2. Busca as configurações atualizadas
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        
        // 3. (CORREÇÃO) Busca as categorias para o menu poder ser gerado corretamente
        const categories = (await db.query('SELECT * FROM ticket_categories WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

        // 4. Gera o menu passando settings E categories
        await interaction.editReply({
            components: generateGreetingMenu(settings, categories),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};