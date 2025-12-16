const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Registre sua fonte se tiver (opcional, mas recomendado)
// registerFont(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });

// Função auxiliar para carregar imagens com tratamento de erro
async function loadIcon(url) {
    try {
        return await loadImage(url);
    } catch (e) {
        return null; // Retorna null se falhar para não quebrar tudo
    }
}

// URLs dos Ícones (Substitua por links seus ou assets locais se preferir)
const ICONS = {
    COIN: 'https://cdn-icons-png.flaticon.com/512/2454/2454269.png', // Exemplo Moeda Dourada
    REP: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',  // Exemplo Estrela
    ACTIVE: 'https://cdn-icons-png.flaticon.com/512/2983/2983967.png' // Exemplo Raio
};

async function generateProfileCard(user, userData) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO (Background)
    // Se tiver imagem de fundo personalizada:
    // const background = await loadImage(userData.backgroundUrl || './assets/default_bg.png');
    // ctx.drawImage(background, 0, 0, 800, 450);
    
    // Fundo Gradiente Moderno (Caso não tenha imagem)
    const grd = ctx.createLinearGradient(0, 0, 800, 450);
    grd.addColorStop(0, '#1a2a40');
    grd.addColorStop(1, '#0f1724');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 800, 450);

    // Efeito de "pattern" (opcional - pontilhados)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let i=0; i<800; i+=20) {
        for(let j=0; j<450; j+=20) {
            if((i+j)%40 === 0) ctx.fillRect(i, j, 2, 2);
        }
    }

    // 2. AVATAR (Lado Esquerdo)
    const avatarSize = 180;
    const avatarX = 50;
    const avatarY = 80;

    // Sombra do Avatar
    ctx.save();
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Corte circular para o Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {
        // Fallback se falhar
        ctx.fillStyle = '#3498db';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Borda do Avatar
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.stroke();

    // 3. TEXTOS (Nome e Bio)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px "Sans-serif"'; // Use "Poppins" se registrou
    ctx.fillText(user.username, 270, 100);

    ctx.fillStyle = '#8fa3bf';
    ctx.font = '20px "Sans-serif"';
    ctx.fillText(`@${user.tag}`, 270, 130);

    // Bio (com quebra de linha simples se precisar, aqui simplificado)
    ctx.fillStyle = '#cbd5e0';
    ctx.font = 'italic 18px "Sans-serif"';
    // Desenha uma linha decorativa
    ctx.fillRect(270, 145, 3, 25); 
    ctx.fillText(userData.bio || 'Sem biografia definida.', 280, 165);

    // 4. ESTATÍSTICAS (Stats) - Aqui corrigimos os emojis feios
    const iconSize = 35;
    const statY = 220;
    
    // Carregar ícones
    const coinImg = await loadIcon(ICONS.COIN);
    const repImg = await loadIcon(ICONS.REP);
    const activeImg = await loadIcon(ICONS.ACTIVE);

    // Box 1: Reputação
    drawStatBox(ctx, 270, statY, repImg, 'Reputação', userData.reputacao || 0, '#f1c40f');
    
    // Box 2: Atividade
    drawStatBox(ctx, 430, statY, activeImg, 'Atividade', userData.atividade || '0h', '#2ecc71');

    // Box 3: Dinheiro (Moedas) - Destaque no topo direito ou na grade
    drawMoneyBadge(ctx, 600, 60, coinImg, userData.money || 0);


    // 5. BADGES / ELOGIOS (A Parte que não aparecia)
    // O segredo é desenhar ISSO por último para ficar em cima de tudo
    if (userData.badges && userData.badges.length > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        // Fundo da área de badges
        roundRect(ctx, 270, 320, 480, 80, 15, true, false); 
        
        ctx.fillStyle = '#8fa3bf';
        ctx.font = '12px "Sans-serif"';
        ctx.fillText('CONQUISTAS & ELOGIOS:', 285, 340);

        let badgeX = 285;
        const badgeY = 355;
        
        for (const badge of userData.badges) {
            // Desenha o círculo do badge
            ctx.beginPath();
            ctx.arc(badgeX + 16, badgeY + 16, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#34495e';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Tenta desenhar o ícone do badge (se for emoji texto, usa fillText, se for imagem, drawImage)
            // Assumindo que seus badges salvos no banco sejam Emojis texto por enquanto:
            ctx.font = '22px "Sans-serif"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFF';
            ctx.fillText(badge.icon || '🏅', badgeX + 16, badgeY + 18); // Centralizado
            
            // Reseta alinhamento
            ctx.textAlign = 'start'; 
            ctx.textBaseline = 'alphabetic';

            badgeX += 45; // Espaçamento
        }
    }

    return canvas.toBuffer();
}

// Função auxiliar para desenhar caixas de stats bonitas
function drawStatBox(ctx, x, y, iconImage, label, value, color) {
    // Fundo do box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, x, y, 140, 70, 10, true, false);
    
    // Ícone
    if (iconImage) {
        ctx.drawImage(iconImage, x + 10, y + 15, 40, 40);
    } else {
        // Fallback se a imagem não carregar
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 30, y + 35, 15, 0, Math.PI*2);
        ctx.fill();
    }

    // Texto Valor
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px "Sans-serif"';
    ctx.fillText(value, x + 60, y + 35);

    // Texto Label
    ctx.fillStyle = color;
    ctx.font = '12px "Sans-serif"';
    ctx.fillText(label.toUpperCase(), x + 60, y + 55);
}

function drawMoneyBadge(ctx, x, y, iconImage, value) {
    ctx.fillStyle = '#f39c12';
    // Desenha um "pill" shape
    roundRect(ctx, x, y, 150, 40, 20, true, false);
    
    if (iconImage) {
        ctx.drawImage(iconImage, x + 10, y + 5, 30, 30);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillText('$', x + 15, y + 25);
    }

    ctx.fillStyle = '#1a2a40';
    ctx.font = 'bold 22px "Sans-serif"';
    ctx.fillText(value, x + 50, y + 28);
}

// Função utilitária para retângulo arredondado (que já deve ter no seu código)
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') stroke = true;
  if (typeof radius === 'undefined') radius = 5;
  if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
  else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

module.exports = { generateProfileCard };