// File: config/ferrariVehicles.js
const { parseKK } = require('../utils/rpCurrency.js');

const vehicleData = {
    "Carros": [
        { name: "Fusca", bruto: parseKK("300"), caixa: parseKK("150") },
        { name: "Opala", bruto: parseKK("1.800"), caixa: parseKK("900") }, // 1800 e 900
        { name: "Gol", bruto: parseKK("3K"), caixa: parseKK("1.5K") },
        { name: "Saveiro", bruto: parseKK("60K"), caixa: parseKK("30K") },
        { name: "Jetta", bruto: parseKK("21K"), caixa: parseKK("10.5K") },
        { name: "Corolla", bruto: parseKK("45K"), caixa: parseKK("22.5K") },
        { name: "Golf GTI", bruto: parseKK("45K"), caixa: parseKK("22.5K") },
        { name: "Volvo XC90", bruto: parseKK("45K"), caixa: parseKK("22.5K") },
        { name: "Hillux", bruto: parseKK("120K"), caixa: parseKK("60K") },
        { name: "BMW Z4", bruto: parseKK("30K"), caixa: parseKK("15K") },
        { name: "Dodge", bruto: parseKK("36K"), caixa: parseKK("18K") },
        { name: "BMW X6", bruto: parseKK("120K"), caixa: parseKK("60K") },
        { name: "BMW i8", bruto: parseKK("120K"), caixa: parseKK("60K") },
        { name: "Nissan GT-R35", bruto: parseKK("270K"), caixa: parseKK("135K") },
        { name: "UTV", bruto: parseKK("4.8KK"), caixa: parseKK("2.4KK") },
        { name: "Huracan", bruto: parseKK("390K"), caixa: parseKK("195K") },
        { name: "Ferrari EVO", bruto: parseKK("750K"), caixa: parseKK("375K") }
    ],
    "Carros Premium": [
        { name: "Audi RS5", bruto: parseKK("45K"), caixa: parseKK("22.5K") },
        { name: "Mustang GT", bruto: parseKK("45K"), caixa: parseKK("22.5K") },
        { name: "Corvette", bruto: parseKK("45K"), caixa: parseKK("22.5K") },
        { name: "Civic Type-R", bruto: parseKK("180K"), caixa: parseKK("90K") },
        { name: "Lancer Evo", bruto: parseKK("270K"), caixa: parseKK("135K") },
        { name: "BMW M8", bruto: parseKK("120K"), caixa: parseKK("60K") },
        { name: "AMG G65", bruto: parseKK("390K"), caixa: parseKK("195K") },
        { name: "Honda NSX", bruto: parseKK("390K"), caixa: parseKK("195K") },
        { name: "Amarok", bruto: parseKK("150K"), caixa: parseKK("75K") },
        { name: "Audi R8", bruto: parseKK("360K"), caixa: parseKK("180K") },
        { name: "Audi RS6", bruto: parseKK("330K"), caixa: parseKK("165K") },
        { name: "Velar", bruto: parseKK("270K"), caixa: parseKK("135K") },
        { name: "BMW M4", bruto: parseKK("600K"), caixa: parseKK("300K") },
        { name: "Urus", bruto: parseKK("390K"), caixa: parseKK("195K") },
        { name: "Nissan 370z", bruto: parseKK("480K"), caixa: parseKK("240K") },
        { name: "Subaru", bruto: parseKK("480K"), caixa: parseKK("240K") },
        { name: "Mazda RX7", bruto: parseKK("330K"), caixa: parseKK("165K") },
        { name: "Nissan Silvia", bruto: parseKK("330K"), caixa: parseKK("165K") },
        { name: "McLaren 675LT", bruto: parseKK("240K"), caixa: parseKK("120K") },
        { name: "Skyline GT-R34", bruto: parseKK("390K"), caixa: parseKK("195K") },
        { name: "Toyota Supra", bruto: parseKK("390K"), caixa: parseKK("195K") },
        { name: "Porsche 911", bruto: parseKK("360K"), caixa: parseKK("180K") },
        { name: "Nissan GT-35LB", bruto: parseKK("360K"), caixa: parseKK("180K") },
        { name: "Lamborghini SVJ", bruto: parseKK("300K"), caixa: parseKK("150K") },
        { name: "AMG GT63s", bruto: parseKK("450K"), caixa: parseKK("225K") },
        { name: "Bugatti Chiron", bruto: parseKK("900K"), caixa: parseKK("450K") },
        { name: "Huracan STO", bruto: parseKK("1.2KK"), caixa: parseKK("600K") },
        { name: "AMG ONE", bruto: parseKK("750K"), caixa: parseKK("375K") },
        { name: "Audi Q8", bruto: parseKK("3.3KK"), caixa: parseKK("1.65KK") },
        { name: "Jaguar F-Type", bruto: parseKK("3.6KK"), caixa: parseKK("1.8KK") }
    ],
    "Motos": [
        { name: "Yamaha XT660", bruto: parseKK("6K"), caixa: parseKK("3K") },
        { name: "Harley Davidson", bruto: parseKK("60K"), caixa: parseKK("30K") },
        { name: "Yamaha XJ6", bruto: parseKK("15K"), caixa: parseKK("7.5K") },
        { name: "Honda PCX", bruto: parseKK("7.5K"), caixa: parseKK("3.75K") },
        { name: "Honda CB1000", bruto: parseKK("24K"), caixa: parseKK("12K") },
        { name: "BMW S1000", bruto: parseKK("300K"), caixa: parseKK("150K") },
        { name: "BMW R1250", bruto: parseKK("480K"), caixa: parseKK("240K") }
    ],
    "Utilitarios": [
        { name: "Baratinha", bruto: parseKK("360K"), caixa: parseKK("180K") },
        { name: "Deluxe", bruto: parseKK("450K"), caixa: parseKK("225K") },
        { name: "Volatus", bruto: parseKK("1.11KK"), caixa: parseKK("555K") },
        { name: "AMG X-Class", bruto: parseKK("600K"), caixa: parseKK("300K") },
        { name: "Kombi", bruto: parseKK("900K"), caixa: parseKK("450K") },
        { name: "Brickade", bruto: parseKK("2.1KK"), caixa: parseKK("1.05KK") },
        { name: "BMW R1250 Util", bruto: parseKK("1.5KK"), caixa: parseKK("750K") }
    ]
};

module.exports = vehicleData;