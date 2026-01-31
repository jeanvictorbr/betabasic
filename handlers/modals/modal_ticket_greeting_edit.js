// handlers/modals/modal_ticket_greeting_edit.js
const db = require('../../database.js');
const generateGreetingMenu = require('../../ui/ticketsGreetingMenu.js'); // Seu arquivo de UI
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_ticket_greeting_edit',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        // 1. Pega o ID da mensagem que estamos editando (se você passou isso no customId do modal)
        // Se o customId for apenas 'modal_ticket_greeting_edit', assumimos que é uma criação ou edição global.
        // Mas o ideal seria 'modal_ticket_greeting_edit_<ID>'
        
        const newMessage = interaction.fields.getTextInputValue('input_greeting_message');

        // AQUI ESTÁ O PULO DO GATO:
        // Se o seu sistema suporta múltiplas mensagens, você tem que dar UPDATE na tabela de mensagens, não na guild_settings.
        // Mas como não sei o nome da sua tabela de mensagens, vou manter o update na guild_settings por enquanto.
        
        await db.query(
            'UPDATE guild_settings SET tickets_greeting_message = $1 WHERE guild_id = $2',
            [newMessage, interaction.guild.id]
        );

        // 2. Busca as configurações
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        
        // 3. AGORA A CORREÇÃO REAL:
        // Vamos buscar as mensagens exatamente como o seu botão original faz.
        // Tente descobrir qual é a tabela real. Se for 'ticket_greetings', use isso:
        
        let messages = [];
        try {
            // Tenta buscar da tabela de mensagens múltiplas se ela existir
            const result = await db.query('SELECT * FROM ticket_greetings WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id]);
            messages = result.rows;
        } catch (error) {
            // Se der erro (tabela não existe), voltamos para o modo "mensagem única"
            if (settings.tickets_greeting_message) {
                messages = [{
                    id: 'GLOBAL',
                    message: settings.tickets_greeting_message,
                    is_active: settings.tickets_greeting_enabled
                }];
            }
        }

        // 4. Gera o menu
        await interaction.editReply({
            components: generateGreetingMenu(settings, messages),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};