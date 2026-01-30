// handlers/modals/modal_ticket_greeting_edit.js
const db = require('../../database.js');
const generateGreetingMenu = require('../../ui/ticketsGreetingMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_ticket_greeting_edit',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        // Pega o texto digitado no modal
        const newMessage = interaction.fields.getTextInputValue('input_greeting_message');

        // 1. Atualiza a mensagem na tabela guild_settings
        await db.query(
            'UPDATE guild_settings SET tickets_greeting_message = $1 WHERE guild_id = $2',
            [newMessage, interaction.guild.id]
        );

        // 2. Busca as configurações atualizadas para redesenhar o menu
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        
        // 3. (CORREÇÃO) Como você não tem a tabela 'ticket_categories', passamos um array vazio []
        // Isso evita o erro de "relation does not exist" E evita o erro de "undefined filter"
        const categories = []; 
        
        // Se um dia você criar uma tabela de departamentos, você muda a linha acima para:
        // const categories = (await db.query('SELECT * FROM nome_da_sua_tabela WHERE guild_id = $1', [interaction.guild.id])).rows;

        // 4. Gera o menu passando settings e o array vazio
        await interaction.editReply({
            components: generateGreetingMenu(settings, categories),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};