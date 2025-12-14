// config/lavalink.js
module.exports = [
    {
        name: 'AjieBlogs Public (SSL)',
        url: 'lava-v4.ajieblogs.eu.org:443',
        auth: 'https://ajieblogs.eu.org',
        secure: true
    },
    {
        name: 'Komo Public',
        url: 'lava.komo.id:80', // Porta 80 é comum para não-SSL
        auth: 'komodroid',
        secure: false
    },
    {
        name: 'Public Lavalink Vol.1',
        url: 'lavalink.volunteers.gq:80',
        auth: 'volunteers',
        secure: false
    }
];