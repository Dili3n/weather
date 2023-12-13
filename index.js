const axios = require('axios');
const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const app = express();
const IP = require('ip');

const PORT = 8080;

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.3',
        info: {
            title: 'Weather Local API',
            version: '1.0.0',
        },
    },
    apis: [
        'index.js',
    ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/swagger-temperature', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

async function getCoordinates() {
    const url_ip = "https://api.ipify.org/?format=json";
    const response = await axios.get(url_ip);
    const ip = response.data.ip;
    const url_geo = "https://ipinfo.io/"+ ip + "/json";
    const response_geo = await axios.get(url_geo);
    let coordinates = response_geo.data.loc.split(",");
    coordinates[2] = response_geo.data.city;
    return coordinates;

}


app.listen(
    PORT,
    () => console.log(`It\'s alive!\nhttps://localhost:${PORT}`)
)

// Connect the frontend from /dist
app.use(express.static('dist'));
app.use(cors());


app.get('/ip', (req, res) => {
    const ipAddress = IP.address();
    res.send(ipAddress)
})


/**
 * @swagger
 * /temperature:
 *  get:
 *     description: Use to request your local temperature
 *     responses:
 *      200:
 *         description: A successful response
 */
app.get('/temperature', async(req, res) => {
    let coo = await getCoordinates();
    const latitude = coo[0];
    const longitude = coo[1];
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + latitude + "&longitude=" + longitude + "&current=temperature_2m,precipitation,cloudcover,is_day,windspeed_10m";
    const response = await axios.get(url);
    const temp = response.data.current.temperature_2m;
    res.status(200).send({'temperature': temp, 'latitude': latitude, 'longitude': longitude, 'windspeed': response.data.current.windspeed_10m, 'is_day': response.data.current.is_day, 'precipitation': response.data.current.precipitation, 'cloudcover': response.data.current.cloudcover, 'city': coo[2]});
});
