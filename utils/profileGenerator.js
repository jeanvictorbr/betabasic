const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Tenta registrar a fonte (opcional)
try {
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), { family: 'Poppins', weight: 'regular' });
} catch (e) { }

const ICONS = {
    // Novos ícones PNG bonitos
    ROLES: 'https://cdn-icons-png.flaticon.com/512/10628/10628960.png', // Ícone de Crachá/Cargos
    REP: 'https://cdn-icons-png.flaticon.com/512/10479/10479862.png',  // Estrela 3D
    TIME: 'https://cdn-icons-png.flaticon.com/512/10479/10479929.png', // Relógio 3D
    HEART: 'https://cdn-icons-png.flaticon.com/512/9466/9466004.png'   // Coração Fofo
};

function formatTime(ms) {
    if (!ms) return "0h";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h`; 
}

// Helper para desenhar retângulos arredondados
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
    else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) { radius[side] = radius[side] || defaultRadius[side]; }
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

async function generateProfileCard(targetUser, memberData) {
    const canvas = createCanvas(900, 500);
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO ---
    let background;
    try {
        if (memberData.social?.background_url) {
            background = await loadImage(memberData.social.background_url);
        } else {
            const grd = ctx.createLinearGradient(0, 0, 900, 500);
            grd.addColorStop(0, '#101010');
            grd.addColorStop(1, '#232526');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 900, 500);
        }
        if (background) ctx.drawImage(background, 0, 0, 900, 500);
    } catch (e) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 900, 500);
    }

    // Overlay Escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    roundRect(ctx, 20, 20, 860, 460, 25, true, false);

    // --- 2. AVATAR ---
    const avatarSize = 160;
    const avatarX = 60;
    const avatarY = 60;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    
    try {
        const avatar = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();
    
    // Borda Avatar
    ctx.strokeStyle = memberData.highestRoleColor || '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.stroke();

    // --- 3. TAG CARGO + MEMBRO DESDE ---
    const roleName = memberData.highestRoleName || 'Membro';
    ctx.font = 'bold 18px "Poppins", sans-serif';
    const roleWidth = ctx.measureText(roleName).width + 30;
    const roleX = avatarX + (avatarSize / 2) - (roleWidth / 2);
    const roleY = avatarY + avatarSize + 20;

    // Etiqueta do Cargo
    ctx.fillStyle = memberData.highestRoleColor || '#555';
    roundRect(ctx, roleX, roleY, roleWidth, 30, 10, true, false);
    ctx.fillStyle = '#ffffff'; 
    ctx.textAlign = 'center';
    ctx.fillText(roleName.toUpperCase(), roleX + (roleWidth / 2), roleY + 21);
    ctx.textAlign = 'left';

    // Data de entrada
    const joinedDate = memberData.joinedAt ? new Date(memberData.joinedAt).toLocaleDateString('pt-BR') : '??/??';
    ctx.fillStyle = '#888';
    ctx.font = '14px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Desde: ${joinedDate}`, avatarX + (avatarSize / 2), roleY + 55);
    ctx.textAlign = 'left';

    // --- 4. TEXTOS (Cabeçalho) ---
    const textStartX = 280;
    
    // Nome Display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Poppins", sans-serif';
    const displayName = targetUser.globalName || targetUser.username;
    ctx.fillText(displayName, textStartX, 100);

    // Username (@)
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '24px "Poppins", sans-serif';
    ctx.fillText(`@${targetUser.username}`, textStartX, 135);

    // Ícone da Guild
    if (memberData.guildIconUrl) {
        try {
            const guildIcon = await loadImage(memberData.guildIconUrl);
            const gIconSize = 60;
            const gIconX = 790;
            const gIconY = 50;
            ctx.save();
            ctx.beginPath();
            ctx.arc(gIconX + gIconSize/2, gIconY + gIconSize/2, gIconSize/2, 0, Math.PI*2);
            ctx.clip();
            ctx.drawImage(guildIcon, gIconX, gIconY, gIconSize, gIconSize);
            ctx.restore();
        } catch (e) {}
    }

    // Bio
    ctx.fillStyle = '#cccccc';
    ctx.font = 'italic 18px "Poppins", sans-serif';
    const bio = memberData.social?.bio || "Digite /social bio para alterar esta mensagem...";
    wrapText(ctx, bio, textStartX, 180, 500, 25);

    // --- 5. STATS (Substituindo Saldo por Cargos) ---
    const statsY = 300;
    const boxWidth = 160;
    const spacing = 20;

    const iconRole = await loadImage(ICONS.ROLES).catch(()=>null);
    const iconRep = await loadImage(ICONS.REP).catch(()=>null);
    const iconTime = await loadImage(ICONS.TIME).catch(()=>null);

    // Box 1: Cargos
    drawModernStatBox(ctx, iconRole, 'Cargos', `${memberData.roleCount || 0}`, textStartX, statsY, '#9b59b6');
    // Box 2: Reputação
    drawModernStatBox(ctx, iconRep, 'Reputação', `${memberData.social?.reputation || 0}`, textStartX + boxWidth + spacing, statsY, '#f1c40f');
    // Box 3: Tempo Online
    drawModernStatBox(ctx, iconTime, 'Online', formatTime(memberData.ponto?.total_ms || 0), textStartX + (boxWidth + spacing) * 2, statsY, '#3498db');

    // --- 6. ÚLTIMO ELOGIO (Novo Layout Fofo) ---
    const badgeAreaY = 400;
    
    // Fundo da área
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, textStartX, badgeAreaY, 520, 60, 15, true, false);

    const iconHeart = await loadImage(ICONS.HEART).catch(()=>null);
    
    // Desenha o Coração
    if (iconHeart) {
        ctx.drawImage(iconHeart, textStartX + 15, badgeAreaY + 10, 40, 40);
    }

    // Título
    ctx.fillStyle = '#ff6b81'; // Cor rosa/avermelhada
    ctx.font = 'bold 12px "Poppins", sans-serif';
    ctx.fillText("ÚLTIMO ELOGIO DE:", textStartX + 70, badgeAreaY + 20);

    // Dados do Último Elogio
    const lastRep = memberData.lastRepUser; // Objeto { user: UserObject, date: Date }
    
    if (lastRep && lastRep.user) {
        // Avatar de quem enviou (Pequeno círculo)
        const senderAvatarSize = 30;
        const senderX = textStartX + 70;
        const senderY = badgeAreaY + 26;

        ctx.save();
        ctx.beginPath();
        ctx.arc(senderX + senderAvatarSize/2, senderY + senderAvatarSize/2, senderAvatarSize/2, 0, Math.PI*2);
        ctx.clip();
        try {
            const sAvatar = await loadImage(lastRep.user.displayAvatarURL({ extension: 'png' }));
            ctx.drawImage(sAvatar, senderX, senderY, senderAvatarSize, senderAvatarSize);
        } catch(e) {
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
        ctx.restore();

        // Nome e Data
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Poppins", sans-serif';
        ctx.fillText(lastRep.user.username, senderX + 40, senderY + 20);
        
        ctx.fillStyle = '#777';
        ctx.font = '12px "Poppins", sans-serif';
        const dateStr = new Date(lastRep.date).toLocaleDateString('pt-BR');
        ctx.fillText(` em ${dateStr}`, senderX + 40 + ctx.measureText(lastRep.user.username).width + 5, senderY + 20);

    } else {
        // Se ninguém elogiou ainda
        ctx.fillStyle = '#888';
        ctx.font = 'italic 14px "Poppins", sans-serif';
        ctx.fillText("Ninguém enviou amor ainda... 😢", textStartX + 70, badgeAreaY + 40);
    }

    return canvas.toBuffer();
}

function drawModernStatBox(ctx, icon, label, value, x, y, color) {
    const grd = ctx.createLinearGradient(x, y, x + 160, y + 80);
    grd.addColorStop(0, 'rgba(255,255,255,0.05)');
    grd.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = grd;
    roundRect(ctx, x, y, 160, 80, 15, true, false);

    // Indicador lateral
    ctx.fillStyle = color;
    roundRect(ctx, x, y + 20, 4, 40, 2, true, false);

    if (icon) {
        ctx.drawImage(icon, x + 15, y + 20, 40, 40);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Poppins", sans-serif';
    ctx.fillText(value, x + 65, y + 35);

    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Poppins", sans-serif';
    ctx.fillText(label.toUpperCase(), x + 65, y + 55);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let linesDrawn = 0;
    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            if(linesDrawn < 3) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                linesDrawn++;
            } else {
                line += "...";
                break;
            }
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

module.exports = { generateProfileCard };