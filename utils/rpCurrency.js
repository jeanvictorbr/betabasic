// File: utils/rpCurrency.js

// Converte String (ex: "1.5KK", "300", "3K") para Número Real (ex: 1500000, 300, 3000)
function parseKK(valueString) {
    if (!valueString) return 0;
    let val = valueString.toUpperCase().trim();
    if (val.includes('KK')) {
        return parseFloat(val.replace('KK', '')) * 1000000;
    } else if (val.includes('K')) {
        return parseFloat(val.replace('K', '')) * 1000;
    }
    return parseFloat(val);
}

// Converte Número Real para String Bonita do RP (ex: 1500000 -> "1.5KK")
function formatKK(number) {
    if (number >= 1000000) {
        return (number / 1000000).toLocaleString('pt-BR') + 'KK';
    } else if (number >= 1000) {
        return (number / 1000).toLocaleString('pt-BR') + 'K';
    }
    return number.toLocaleString('pt-BR');
}

module.exports = { parseKK, formatKK };