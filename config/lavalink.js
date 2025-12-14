// config/lavalink.js
module.exports = [
    // Node 1: Kieron Lavalink (Geralmente estável)
    {
        name: 'Kieron Public Node',
        url: 'lava.kieron.top:2333',
        auth: 'youshallnotpass',
        secure: false // http/ws (não SSL)
    },
    // Node 2: Shirayuki (Backup 1)
    {
        name: 'Shirayuki Public',
        url: 'lava.link:80', // Porta padrão HTTP
        auth: '1234567812345678', // Senha comum em nodes públicos
        secure: false
    },
    // Node 3: NodeLink (Backup 2 - SSL)
    {
        name: 'NodeLink Public',
        url: 'lavalink.nodelink.net:443',
        auth: 'youshallnotpass',
        secure: true // https/wss
    }
];