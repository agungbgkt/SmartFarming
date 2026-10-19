import { useEffect, useRef } from "react";
import { getPusher } from "../services/realtime";

export default function useChannelEvent(channelName, eventName, handler){
    const handleRef = useRef(handler); // handlerRef: handler dibuat ulang di setiap render. Kalau dimasukkan ke dependency useEffect, komponen akan berlangganan ulang terus-menerus. Dengan ref, langganan cukup dibuat sekali dan tetap memanggil versi handler terbaru.

    useEffect(() => {
        handleRef.current = handler;
    });

    useEffect(() => {
        if (!channelName) return;

        const channel = getPusher().subscribe(`private-${channelName}`);
        const listener = (data) => handleRef.current(data);

        channel.bind(eventName, listener);
        return () => channel.unbind(eventName, listener);
    }, [channelName, eventName]);
}