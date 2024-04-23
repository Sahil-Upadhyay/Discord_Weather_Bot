const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const axios = require('axios');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const WEATHER_API_KEY = process.env.WEATHER_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function fetchWeather(city) {
    const url = `${WEATHER_API_URL}?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}

function displayWeather(data) {
    const name = data.name;
    const icon = data.weather[0].icon;
    const description = data.weather[0].description;
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const speed = data.wind.speed;

    return {
        name: name,
        icon: icon,
        description: description,
        temp: temp,
        humidity: humidity,
        speed: speed
    };
}

client.on('ready', () => {
    client.guilds.cache.forEach(guild => {
        guild.commands.create(new SlashCommandBuilder()
            .setName('weather')
            .setDescription('Get the weather of a city')
            .addStringOption(option =>
                option.setName('city')
                    .setDescription('The city to get the weather for')
                    .setRequired(true)
            )
        );
    });
});

client.on('interactionCreate', async (interaction) => {
    console.log('Interaction received:', interaction);
    if (!interaction.isCommand()) return;

    const { options } = interaction;

    if (interaction.commandName === 'weather') {
        const city = options.getString('city');
        try {
            const weatherData = await fetchWeather(city, WEATHER_API_KEY);
            const displayedWeather = displayWeather(weatherData);

            const weatherEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Weather in ${displayedWeather.name}`)
                .setDescription(displayedWeather.description)
                .addFields({ name: 'Temperature', value: `${displayedWeather.temp}°C`, inline: true })
                .addFields({ name: 'Humidity', value: `${displayedWeather.humidity}%`, inline: true })
                .addFields({ name: 'Wind Speed', value: `${displayedWeather.speed} km/hr`, inline: true })
                .setThumbnail(`https://openweathermap.org/img/wn/${displayedWeather.icon}.png`)

                await interaction.reply({ content: `` , embeds: [weatherEmbed] });
        } catch (error) {
            console.error('Error fetching weather:', error);
            await interaction.reply('There was an error fetching the weather data.');
        }
    }
});

client.login(process.env.ACCESS_TOKEN);