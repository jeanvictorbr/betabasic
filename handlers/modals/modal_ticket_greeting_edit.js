// handlers/modals/modal_ticket_greeting_edit.js
const db = require('../../database.js');
const generateGreetingMenu = require('../../ui/ticketsGreetingMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_ticket_greeting_edit',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        // 1. Pega o novo texto digitado
        const newMessage = interaction.fields.getTextInputValue('input_greeting_message');

        // 2. Salva no banco (Sistema de Mensagem Única)
        await db.query(
            'UPDATE guild_settings SET tickets_greeting_message = $1 WHERE guild_id = $2',
            [newMessage, interaction.guild.id]
        );

        // 3. Busca as configurações atualizadas
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        
        // 4. --- O TRUQUE (ADAPTER) ---
        // Criamos uma lista "virtual" contendo a mensagem única do banco.
        // Assim o seu menu (que espera uma lista) funciona perfeitamente sem crashar.
        const messagesAdapter = [];
        
        if (settings.tickets_greeting_message) {
            messagesAdapter.push({
                id: 'PADRAO', // ID Fictício
                message: settings.tickets_greeting_message,
                is_active: settings.tickets_greeting_enabled // Usa o status global
            });
        }

        // 5. Gera o menu passando settings e a nossa lista adaptada
        await interaction.editReply({
            components: generateGreetingMenu(settings, messagesAdapter),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};