const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
const port = 3001;

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    license: {
        owner: process.env.REACT_APP_LICENSE_OWNER,
        type: process.env.REACT_APP_LICENSE_TYPE,
        entity_type: process.env.REACT_APP_ENTITY_TYPE,
        hubspot_id: process.env.REACT_APP_HUBSPOT_ID
    },
    cloud_org_id: process.env.REACT_APP_CLOUD_ORG_ID,
    is_cloud_deployment: process.env.REACT_APP_IS_CLOUD_DEPLOYMENT === 'true',
    heap_app_id: process.env.REACT_APP_HEAP_APP_ID,
    user_email: process.env.REACT_APP_USER_EMAIL,
    version: process.env.REACT_APP_VERSION
};

const handleProperties = (buttonName) => {
    const properties = {
        license_id: config.license.owner,
        license_type: config.license.type,
        app_version: config.version
    };

    if (buttonName) {
        properties.button_name = buttonName;
    } else {
        properties.event_name = 'periodic-event';
    }

    if (config.license.entity_type === 'contact' || config.is_cloud_deployment) {
        properties.hubspot_contact_id = config.license.hubspot_id;
    } else if (config.license.entity_type === 'company') {
        properties.hubspot_company_id = config.license.hubspot_id;
    }

    if (config.is_cloud_deployment) {
        properties.cloud_org_id = config.cloud_org_id;
    }

    return properties;
};

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

app.post('/api/button', (req, res) => {
    const { userId, buttonName } = req.body;
    const sessionId = req.headers['x-tyk-heap-session-id'];
    console.log('Received request:', req.body, 'Session ID:', sessionId);

    const properties = handleProperties(buttonName);

    // Send Heap server-side event
    axios.post('https://heapanalytics.com/api/track', {
        app_id: config.heap_app_id,
        identity: userId,
        event: 'server-side-event',
        properties: properties,
        session_id: sessionId
    })
        .then(() => {
            res.status(200).json({ message: 'Event tracked successfully' });
        })
        .catch((error) => {
            console.error('Error tracking event:', error);
            res.status(500).json({ message: 'Error tracking event' });
        });
});

// Function to send periodic events to Heap
const sendPeriodicEvent = () => {
    const properties = handleProperties(null);

    // Send Heap periodic event
    axios.post('https://heapanalytics.com/api/track', {
        app_id: config.heap_app_id,
        identity: config.license.owner,
        event: 'usage_reporting_event',
        properties: properties
    })
        .then(() => {
            console.log('Periodic event tracked successfully');
        })
        .catch((error) => {
            console.error('Error tracking periodic event:', error);
        });
};

// Schedule the periodic event every 10 seconds (10000 milliseconds)
setInterval(sendPeriodicEvent, 10000);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
