#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include "secrets.h"

// ---------- Pin sensor AHT (I2C) ----------
#define SDA_PIN 16
#define SCL_PIN 17

// ---------- Identitas perangkat ----------
// DEVICE_CODE harus sama persis dengan kolom device_code di tabel devices (Neon)
const char* DEVICE_CODE = "ESP32-001";
// CLIENT_ID harus unik per perangkat di broker
const char* CLIENT_ID   = "esp32-kandang-01";

// ---------- Broker EMQX ----------
const char* MQTT_HOST = "g8df1161.ala.asia-southeast1.emqxsl.com";
const int   MQTT_PORT = 8883;

// Interval kirim data (milidetik)
const int SEND_EVERY_MIN = 15; // kirim di menit 00, 15, 30, 45
int lastSentKey = -1; // penanda agar tidak kirim dua kali di menit yang sama
bool firstSendDone = false; // kirim sekali saat pertama menyala

// ---------- Sertifikat CA EMQX ----------
// Ganti dengan isi file emqxsl-ca.crt (buka dengan Notepad, salin semuanya)
const char* CA_CERT = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUxMjAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI
2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx
1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQ
q2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz
tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ
vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY
1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4
NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG
Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFXGU7Aj64GxJUTFy8bJZ91
8rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/iyK5S9kJRaTe
pLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl
MrY=
-----END CERTIFICATE-----
)EOF";

WiFiClientSecure net;
PubSubClient mqtt(net);
Adafruit_AHTX0 aht;

char topicPublish[64];
bool sensorOk = false;

void connectWiFi() {
  Serial.printf("Menyambung WiFi %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 30000) {   // gagal 30 detik: restart
      Serial.println("\nWiFi gagal, restart...");
      ESP.restart();
    }
  }
  Serial.printf("\nWiFi OK, IP: %s\n", WiFi.localIP().toString().c_str());
}

// TLS butuh jam yang benar untuk memeriksa masa berlaku sertifikat
void syncTime() {
  Serial.print("Sinkron waktu NTP");
  configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com");  // WIB
  time_t now = time(nullptr);
  unsigned long start = millis();
  while (now < 1700000000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    if (millis() - start > 30000) {
      Serial.println("\nNTP gagal, restart...");
      ESP.restart();
    }
  }
  Serial.println(" OK");
}

void connectMqtt() {
  while (!mqtt.connected()) {
    Serial.print("Menyambung MQTT...");
    if (mqtt.connect(CLIENT_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println("terhubung");
    } else {
      // rc -2: TLS/TCP gagal (cek CA, jam, host) | rc 5: username/password salah
      Serial.printf("gagal rc=%d, ulang 5 detik\n", mqtt.state());
      delay(5000);
      if (WiFi.status() != WL_CONNECTED) connectWiFi();
    }
  }
}

void sendReading() {
  if (!sensorOk) {
    sensorOk = aht.begin(&Wire);
    if (!sensorOk) {
      Serial.println("AHT belum terdeteksi, dilewati");
      return;
    }
  }

  sensors_event_t hum, temp;
  aht.getEvent(&hum, &temp);

  if (isnan(temp.temperature) || isnan(hum.relative_humidity)) {
    Serial.println("Pembacaan AHT tidak valid, dilewati");
    return;
  }

  char payload[100];
  snprintf(payload, sizeof(payload),
           "{\"temperature\":%.1f,\"humidity\":%.1f}",
           temp.temperature, hum.relative_humidity);

  bool ok = mqtt.publish(topicPublish, payload);
  Serial.printf("publish %s -> %s : %s\n", ok ? "OK" : "GAGAL", topicPublish, payload);
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin(SDA_PIN, SCL_PIN);
  sensorOk = aht.begin(&Wire);
  Serial.println(sensorOk ? "AHT terdeteksi" : "AHT TIDAK terdeteksi, cek kabel");

  connectWiFi();
  syncTime();

  net.setCACert(CA_CERT);
  // Untuk tes sementara bila sertifikat bermasalah, ganti baris di atas dengan:
  // net.setInsecure();

  snprintf(topicPublish, sizeof(topicPublish), "kandang/%s/data", DEVICE_CODE);
  Serial.printf("Topik publish: %s\n", topicPublish);

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setKeepAlive(30);
  mqtt.setBufferSize(256);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  struct tm t;
  if (!getLocalTime(&t, 0)) return;   // waktu belum siap

  // Kirim sekali saat pertama menyala (untuk cek koneksi), tanpa menunggu menit 00/15/30/45
  if (!firstSendDone) {
    firstSendDone = true;
    sendReading();
  }

  // Kirim di menit kelipatan 15
  if (t.tm_min % SEND_EVERY_MIN == 0) {
    int key = t.tm_yday * 1440 + t.tm_hour * 60 + t.tm_min;
    if (key != lastSentKey) {
      lastSentKey = key;
      sendReading();
    }
  }

  delay(200);
}