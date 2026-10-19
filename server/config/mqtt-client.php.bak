<?php

return [
    'connections' => [
        'default' => [
            'host' => env('MQTT_HOST', '127.0.0.1'),
            'port' => env('MQTT_PORT', 1883),
            'protocol' => \PhpMqtt\Client\MqttClient::MQTT_3_1_1,
            'username' => env('MQTT_USERNAME'),
            'password' => env('MQTT_PASSWORD'),
            'client_id' => null,
            'use_clean_session' => true,
            'connect_timeout' => 60,
            'keep_alive_interval' => 10,
            'last_will' => [
                'topic' => null,
                'message' => null,
                'quality_of_service' => 0,
                'retain' => false,
            ],
            'qos' => 0,
            'retain' => false,
        ],
    ],
    'default_connection' => 'default',
];

?>