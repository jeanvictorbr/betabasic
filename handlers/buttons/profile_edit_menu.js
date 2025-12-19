module.exports = {
    customId: 'profile_edit_menu',
    async execute(interaction) {
        // Menu de Seleção para o Tema
        const themeSelect = {
            type: 1,
            components: [{
                type: 3, // String Select Menu
                custom_id: 'profile_theme_select',
                placeholder: '🎨 Escolha um Tema Visual',
                options: [
                    { label: 'Koda Padrão (Blurple)', value: '#5865F2', description: 'O clássico tema Discord.', emoji: { name: '🧢' } },
                    { label: 'Sunset Orange', value: '#FF5733', description: 'Um laranja vibrante.', emoji: { name: '🌅' } },
                    { label: 'Midnight Purple', value: '#6A0DAD', description: 'Roxo escuro e misterioso.', emoji: { name: '🔮' } },
                    { label: 'Forest Green', value: '#2ECC71', description: 'Verde natureza.', emoji: { name: '🌲' } },
                    { label: 'Crimson Red', value: '#C70039', description: 'Vermelho intenso.', emoji: { name: '🩸' } },
                    { label: 'Tema Próprio (Imagem + Cor)', value: 'custom_theme', description: 'Defina sua própria imagem de fundo.', emoji: { name: '🖼️' } }
                ]
            }]
        };

        // Botão para Editar Bio
        const bioButton = {
            type: 1,
            components: [{
                type: 2,
                style: 1, // Primary
                label: '📝 Editar Bio / Sobre Mim',
                custom_id: 'profile_edit_bio_btn'
            }]
        };

        await interaction.reply({
            content: '⚙️ **Painel de Edição do Perfil**\nEscolha o que deseja alterar abaixo:',
            components: [themeSelect, bioButton],
            ephemeral: true
        });
    }
};