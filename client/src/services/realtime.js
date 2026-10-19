import Pusher from 'pusher-js';

let pusher = null;

export function getPusher(){
    if (!pusher){
        const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
        const apiUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

        pusher = new Pusher(import.meta.env.VITE_REVERB_APP_KEY, {
            cluster: '',
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: port,
            wssPort: port,
            forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
            enabledTransports: ['ws', 'wss'],
            channelAuthorization: {
                endpoint: `${apiUrl}/broadcasting/auth`,
                transport: 'ajax',
                headersProvider: () => ({
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    Accept: 'application/json'
                }),
            },
        });
    }
    return pusher;
}

export function disconnectPusher(){
    if (pusher){
        pusher.disconnect();
        pusher = null;
    }
}