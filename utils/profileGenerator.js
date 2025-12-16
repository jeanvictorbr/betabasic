const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const { formatDuration } = require('./formatDuration.js'); // Usando seu utilitário existente

// Tenta registrar fonte se tiver, senão usa padrão
try {
    // registerFont(path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf'), { family: 'Roboto' });
} catch (e) {
    console.log("Fonte personalizada não encontrada, usando padrão do sistema.");
}

async function generateProfileCard(user, member, flowData, pontoData, repData, roleTags) {
    // 1. Configuração do Canvas
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // 2. Fundo (Gradiente Dark Moderno)
    const gradient = ctx.createLinearGradient(0, 0, 800, 450);
    gradient.addColorStop(0, '#1a1c20');
    gradient.addColorStop(1, '#0f1012');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);

    // Adiciona um detalhe visual (Barra lateral colorida baseada no cargo mais alto)
    const mainRoleColor = member.displayHexColor === '#000000' ? '#7289da' : member.displayHexColor;
    ctx.fillStyle = mainRoleColor;
    ctx.fillRect(0, 0, 15, 450);

    // 3. Avatar do Usuário (Redondo com borda)
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 120, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 40, 160, 160);
        ctx.restore();

        // Borda do Avatar
        ctx.beginPath();
        ctx.arc(120, 120, 80, 0, Math.PI * 2, true);
        ctx.lineWidth = 5;
        ctx.strokeStyle = mainRoleColor;
        ctx.stroke();
    } catch (err) {
        console.error("Erro ao carregar avatar:", err);
    }

    // 4. Textos Principais
    ctx.fillStyle = '#FFFFFF';
    
    // Nome de Usuário
    ctx.font = 'bold 40px Sans';
    ctx.fillText(user.username, 230, 80);

    // Tag/Cargo Principal
    ctx.font = '25px Sans';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(member.roles.highest.name.toUpperCase(), 230, 115);

    // 5. Estatísticas (Cards Internos)
    
    // Função auxiliar para desenhar box de stats
    const drawStatBox = (x, y, icon, label, value, color) => {
        // Fundo do box
        ctx.fillStyle = '#2f3136';
        ctx.beginPath();
        ctx.roundRect(x, y, 240, 80, 10);
        ctx.fill();
        
        // Barra lateral do box
        ctx.fillStyle = color;
        ctx.fillRect(x, y + 10, 5, 60);

        // Texto
        ctx.font = 'bold 24px Sans';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + 20, y + 45);
        
        ctx.font = '16px Sans';
        ctx.fillStyle = '#BBBBBB';
        ctx.fillText(label.toUpperCase(), x + 20, y + 65);
        
        // Ícone (Texto por enquanto, pode ser imagem)
        ctx.font = '30px Sans';
        ctx.fillText(icon, x + 190, y + 50);
    };

    const coins = flowData?.balance || 0;
    const timeMs = parseInt(pontoData?.total_ms || 0);
    
    // Formata o tempo (Ex: 120h) - Simplificado para caber
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    const timeDisplay = `${hours} Horas`;

    const rep = repData?.reputation || 0;

    // Desenha os boxes
    drawStatBox(40, 250, '💰', 'FlowCoins', coins.toLocaleString(), '#f1c40f');
    drawStatBox(300, 250, '⏱️', 'Tempo Trabalhado', timeDisplay, '#2ecc71');
    drawStatBox(560, 250, '⭐', 'Reputação', rep.toLocaleString(), '#9b59b6');

    // 6. Badges / Role Tags
    // Pega as tags do banco (role_tags) que o usuário tem o cargo correspondente
    ctx.font = '20px Sans';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("CONQUISTAS & BADGES", 40, 370);
    
    let badgeX = 40;
    const badgeY = 390;

    if (roleTags && roleTags.length > 0) {
        // Desenha badges (simulando com texto/emoji, ideal seria carregar imagens)
        ctx.font = '30px Sans';
        for (const tag of roleTags) {
            ctx.fillText(tag.tag, badgeX, badgeY + 30);
            badgeX += 45;
        }
    } else {
        ctx.font = 'italic 18px Sans';
        ctx.fillStyle = '#555555';
        ctx.fillText("Nenhuma badge conquistada ainda.", 40, 410);
    }

    // 7. Footer
    ctx.font = '14px Sans';
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'right';
    ctx.fillText("BasicFlow Social System", 780, 440);

    return canvas.toBuffer();
}

module.exports = { generateProfileCard };