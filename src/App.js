import React, { useEffect, useState, useMemo } from 'react';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import './App.css';

const API_URL = 'http://localhost:3001/api/button';

const App = () => {
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const config = useMemo(() => ({
        license: {
            owner: process.env.REACT_APP_LICENSE_OWNER,
            type: process.env.REACT_APP_LICENSE_TYPE,
            entity_type: process.env.REACT_APP_ENTITY_TYPE,
            hubspot_id: process.env.REACT_APP_HUBSPOT_ID
        },
        CLOUD_ORG_ID: process.env.REACT_APP_CLOUD_ORG_ID,
        IS_CLOUD_DEPLOYMENT: process.env.REACT_APP_IS_CLOUD_DEPLOYMENT === 'true',
        HEAP_APP_ID: process.env.REACT_APP_HEAP_APP_ID,
        USER_EMAIL: process.env.REACT_APP_USER_EMAIL
    }), []);

    useEffect(() => {
        // Check if window.heap is available
        if (window.heap) {
            const userId = Base64.stringify(sha256(config.USER_EMAIL));
            window.heap.identify(userId);

            window.heap.addUserProperties({
                license_id: config.license.owner,
                license_type: config.license.type,
            });

            window.heap.addEventProperties({
                license_id: config.license.owner,
                license_type: config.license.type,
            });

            if (config.license.entity_type === 'contact' || config.IS_CLOUD_DEPLOYMENT) {
                window.heap.addUserProperties({
                    hubspot_contact_id: config.license.hubspot_id,
                });

                window.heap.addEventProperties({
                    hubspot_contact_id: config.license.hubspot_id,
                });
            } else if (config.license.entity_type === 'company') {
                window.heap.addUserProperties({
                    hubspot_company_id: config.license.hubspot_id,
                });

                window.heap.addEventProperties({
                    hubspot_company_id: config.license.hubspot_id,
                });
            }

            if (config.IS_CLOUD_DEPLOYMENT) {
                window.heap.addUserProperties({
                    cloud_org_id: config.CLOUD_ORG_ID,
                });

                window.heap.addEventProperties({
                    cloud_org_id: config.CLOUD_ORG_ID,
                });
            }
        } else {
            console.error('Heap is not loaded');
        }
    }, [config]);

    const handleButtonClick = async (buttonName) => {
        if (buttonName === 'Test client-side event') {
            try {
                window.heap.track('client_side_event', {
                    'button_name': buttonName,
                });
                setMessage('A custom client-side event is sent successfully');
                setMessageType('success');
            } catch (error) {
                setMessage('Sending a custom client-side event failed');
                setMessageType('error');
            }
        } else if (buttonName === 'Test server-side event') {
            const userId = Base64.stringify(sha256(config.USER_EMAIL));
            await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tyk-heap-session-id': window.heap.getSessionId(),
                },
                body: JSON.stringify({ userId, buttonName }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    setMessage('A custom server-side event is sent successfully');
                    setMessageType('success');
                })
                .catch(error => {
                    setMessage('Sending a custom server-side event failed');
                    setMessageType('error');
                });
        }

        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    return (
        <div className="App">
            <h1>This is Heap test</h1>
            <p>
                This PoC records client-side and server-side events using Heap. Open Live datafeed in Heap and click on each button to see how it works.
            </p>
            <button onClick={() => handleButtonClick('Test client-side event')}>Test client-side event</button>
            <button onClick={() => handleButtonClick('Test server-side event')}>Test server-side event</button>
            {message && (
                <div className={`message ${messageType}`}>
                    <span className="message-content">{message}</span>
                    <div className="close-container">
                        <button className="close" onClick={() => setMessage('')}></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
