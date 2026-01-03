// File: handlers/buttons/config_open_utilities.js
const utilitiesMenu = require('../../ui/utilities/utilitiesMenu.js');

module.exports = {
    customId: 'config_open_utilities',
    execute: async (interaction) => {
        await interaction.update(utilitiesMenu());
    }
};