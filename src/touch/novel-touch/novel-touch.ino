/* novel.global, the touch screen: a LilyGO T-Display-S3 (touch) beside a printer, on its side.
   Every slip sent to that printer waits here with the irukandji, the same creature as the site: its box bell, its eye of dots,
   four tentacles of beads in the current. Its heading and code wait beside it. One press prints it: the slip feeds out of the
   bell as the printer prints it, then the jellyfish jets away. Hold it and it is squashed, slowly, until it pops; a current sweeps
   the pieces away and a fish eats them. Either way it stays away a while.
   The screen stays awake: the jellyfish drifts continuously like a creature in a tiny underwater window. After Wi-Fi joins,
   novel.global's code peeks in for ten seconds every thirty, then slips away again.
   One flat blue, chalk lines and dots smoothed at their edges, the site's own type: no shading, which a small screen only bands.

   Board: ESP32S3 Dev Module, USB CDC On Boot enabled, PSRAM OPI. Libraries: GFX Library for Arduino (moononournation),
   ArduinoJson (bblanchon). Everything else is the ESP32's own.
   Wi-Fi and the three NG_ lines can be typed here, or set from a phone. Setup never comes from the screen, which people play with:
   hold the BOOT button three seconds (or switch it on with nothing set yet) and it opens its own Wi-Fi, NOVEL TOUCH, with a
   code to scan and a page to set them. Where it can't find a Wi-Fi it knows, it keeps looking and says so; it never opens setup itself.
   Its type: Archivo Narrow (SemiBold) and Departure Mono, both under the SIL Open Font License 1.1, drawn into the tables at the end. */
#include <WiFi.h>
#include <esp_wifi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Arduino_GFX_Library.h>
#include "mbedtls/base64.h"

#define WIFI_SSID  "your wi-fi"
#define WIFI_PASS  "its password"
#define NG_HOST    "novel.global"
#define NG_PRINTER "printer id"
#define NG_TOKEN   "touch token"
#define NG_BUZZ    -1   // a small vibration motor on a free pin (43 or 44) for a felt tap; -1 for none
#define NG_VERSION "31 Oct 13"   // shown on the setup and joining screens, to know which sketch is on the board
#define NG_AUTOPRINT 30  // seconds a slip waits before it prints by itself; 0: never, every slip waits for a press (the screen as the approval)
#define NG_CODE    "888" // the three numbers for the hidden menu (hold, hold again, then these)
#define NG_TURN    1    // which way up: 1, or 3 to turn the picture round (the USB socket on the other side)

/* the T-Display-S3's own wiring */
#define PIN_POWER 15
#define PIN_BL    38
#define TP_SDA    18
#define TP_SCL    17
#define TP_RST    21
#define TP_ADDR   0x15
#define KEY_A     14   // the side button: a press, like the screen
#define KEY_BOOT  0    // BOOT: held three seconds, setup (never the screen, so people playing with it can't change it)

const int W = 320, H = 170;
/* the kinds that functions below take, named before any function: Arduino lists every function's heading above the first one */
struct Part { float x, y, vx, vy, rot, vr, s; float px[6], py[6]; uint8_t n, kind; bool on; };   // kind: 0 a bead, 1 a piece of bell or tentacle (a short line), 2 the eye, 3 a bubble
enum Mode { CONNECTING, SETUP, ASLEEP, AWAKE, ARRIVE, HELD, SQUISH, PRINTING, BURST, QUIET, QRUP, CODE, MENU, SETS, LINK, INFO, OFFQ };
struct Glyph { uint16_t off; uint8_t w, h; int8_t xo, yo; uint8_t adv; };   // one letter: where its 4-bit coverage starts, its size, where it sits, how far on
struct Font { const uint8_t *bits; const Glyph *g; uint8_t lh, asc; };
extern const Font HEAD, BODY, MONO;
Arduino_DataBus *bus = new Arduino_ESP32PAR8Q(7, 6, 8, 9, 39, 40, 41, 42, 45, 46, 47, 48);
Arduino_GFX *tft = new Arduino_ST7789(bus, 5, NG_TURN, true, 170, 320, 35, 0, 35, 0);
Arduino_Canvas *g = new Arduino_Canvas(W, H, tft);

/* ───────── what it knows: the Wi-Fis (up to five, kept), the site, the printer, the token ───────── */
Preferences prefs;
bool cfgSleep = false, cfgTouch = true; int cfgScene = 0;   // sleep when idle; 0 day and night in turn, 1 always day, 2 always night; a touch prints or squashes
String host, printerId, token, nets[5], passes[5]; int nNets = 0, ways[5];
bool real(const char *s) { return s && *s && strcmp(s, "your wi-fi") && strcmp(s, "printer id") && strcmp(s, "touch token"); }
void loadCfg() {
  prefs.begin("ngtouch", false);
  host = prefs.getString("host", NG_HOST); printerId = prefs.getString("prn", real(NG_PRINTER) ? NG_PRINTER : ""); token = prefs.getString("tok", real(NG_TOKEN) ? NG_TOKEN : "");
  nNets = prefs.getInt("n", 0); if (nNets > 5) nNets = 5;
  cfgSleep = prefs.getBool("slp", false); cfgScene = prefs.getInt("scn", 0); cfgTouch = prefs.getBool("tch", true);
  for (int i = 0; i < nNets; i++) { nets[i] = prefs.getString(("s" + String(i)).c_str(), ""); passes[i] = prefs.getString(("p" + String(i)).c_str(), ""); ways[i] = prefs.getInt(("w" + String(i)).c_str(), 0); }
  /* the sketch's own Wi-Fi only until the list is set from a phone (even to none); then never again, so a forgotten one stays forgotten */
  if (real(WIFI_SSID) && nNets == 0 && !prefs.getBool("set", false)) { bool have = false; for (int i = 0; i < nNets; i++) if (nets[i] == WIFI_SSID) have = true; if (!have) { nets[nNets] = WIFI_SSID; passes[nNets++] = WIFI_PASS; } }
}
void saveNets() { prefs.putInt("n", nNets); for (int i = 0; i < nNets; i++) { prefs.putString(("s" + String(i)).c_str(), nets[i]); prefs.putString(("p" + String(i)).c_str(), passes[i]); prefs.putInt(("w" + String(i)).c_str(), 0); ways[i] = 0; } }

/* ───────── touch: the CST816, read straight off the wire ─────────
   Kept awake and from resetting itself mid-hold (its own defaults: asleep after 2 s, reset after 5 s held),
   as in CST816_TouchLib (github.com/mjdonders/CST816_TouchLib, public domain) */
void tpWrite(uint8_t reg, uint8_t v) { Wire.beginTransmission(TP_ADDR); Wire.write(reg); Wire.write(v); Wire.endTransmission(); }
bool touched() {
  Wire.beginTransmission(TP_ADDR); Wire.write(0x02); if (Wire.endTransmission(false)) return false;
  if (Wire.requestFrom((uint8_t)TP_ADDR, (uint8_t)1) != 1) return false;
  return (Wire.read() & 0x0F) != 0;
}
void buzz(int ms) { if (NG_BUZZ < 0) return; digitalWrite(NG_BUZZ, HIGH); delay(ms); digitalWrite(NG_BUZZ, LOW); }

/* ───────── the server, on its own core so the creature never stutters: what is held; print or squash one ───────── */
struct Slip { String job, code, say, life, wish[4], img; int n = 0; bool paper = true; };   // paper false: a line for the radios alone, nothing printed
struct Seen { Slip first; int waiting = 0, printing = 0; unsigned ver = 0; } seen, net;   // net: written by the server task; seen: the loop's copy
SemaphoreHandle_t lock;
String askJob, askWhat; volatile bool setupOn = false; volatile int netErr = 1;   // 0 fine, 1 no Wi-Fi, 2 no answer, 3 token refused
/* one secure connection to the site, kept open between asks (the handshake is the slow part, and the part that failed as -1) */
WiFiClientSecure tls; bool tlsSet = false;
WiFiClientSecure &site() { if (!tlsSet) { tls.setInsecure(); tls.setHandshakeTimeout(12); tlsSet = true; } return tls; }
void poll() {
  WiFiClientSecure &c = site(); HTTPClient h; h.setReuse(true);
  h.setConnectTimeout(6000);
  h.setTimeout(6000);         // bound a stalled status poll; the next poll can retry
  String ss = WiFi.SSID(), q = "", vq = "", vs = NG_VERSION; for (unsigned i = 0; i < vs.length(); i++) { char ch = vs[i]; if (isalnum((unsigned char)ch) || ch == ' ') vq += ch == ' ' ? '+' : ch; } for (unsigned i = 0; i < ss.length() && i < 40; i++) { char ch = ss[i]; if (isalnum((unsigned char)ch)) q += ch; else { char b[4]; snprintf(b, 4, "%%%02X", (unsigned char)ch); q += b; } }
  if (!h.begin(c, String("https://") + host + "/api/touch/" + printerId + "?net=" + q + "&rssi=" + WiFi.RSSI() + "&v=" + vq)) { netErr = 2; return; }
  h.addHeader("authorization", String("Bearer ") + token); int code = h.GET();
  if (code != 200) { h.end(); netErr = code == 401 ? 3 : 2; return; }
  String got = h.getString(); h.end(); JsonDocument d; if (deserializeJson(d, got)) { netErr = 2; return; }
  Seen s; JsonArray held = d["held"].as<JsonArray>(); s.waiting = d["waiting"] | (int)held.size(); s.printing = d["printing"] | 0;
  if (held.size()) { JsonObject f = held[0]; s.first.job = f["job"].as<String>(); s.first.code = f["code"].as<String>(); s.first.say = f["say"].as<String>(); s.first.life = f["life"].as<String>(); s.first.paper = f["paper"] | true;
    s.first.img = f["img"] | "";
    for (JsonVariant v : f["wish"].as<JsonArray>()) if (s.first.n < 4) s.first.wish[s.first.n++] = v.as<String>(); }
  xSemaphoreTake(lock, portMAX_DELAY); s.ver = net.ver + 1; net = s; xSemaphoreGive(lock); netErr = 0;
}
volatile int actCode = 0;   // HTTP result for the last action: 200 accepted; anything else, not
volatile bool actionPending = false, actionFinished = false;
int act(const String &job, const String &what) {
  WiFiClientSecure &c = site(); HTTPClient h; h.setReuse(true);
  h.setConnectTimeout(8000);
  h.setTimeout(9000);
  if (!h.begin(c, String("https://") + host + "/api/touch/" + printerId + "/" + job)) return -100;
  h.addHeader("authorization", String("Bearer ") + token); h.addHeader("content-type", "application/json");
  int code = h.POST(String("{\"action\":\"") + what + "\"}"); h.end(); return code;
}
/* joining: every Wi-Fi it knows that it can see, strongest first, each in turn. A Wi-Fi that turns it away is asked again a
   different way, not the same way harder. Most often it is "authentication expired" (reason 2), the router not finishing letting
   it in. On this board (the T-Display-S3) the commonest cause is its own radio at full power: the supply dips and the antenna
   swamps the reply, and the handshake runs out. Four ways, in turn:
     0  a plain join, as the first sketch did
     1  low power (8.5 dBm): the known cure for this board
     2  low power, to the strongest transmitter of that name, by its own address and channel (a mesh can hand it a far one)
     3  a pause first, so the router forgets the last time it was let in (it can still be holding it), then low power,
        WPA2 alone and no protected management frames (routers that also offer WPA3 can stall the handshake here)
   The way that worked is kept for that Wi-Fi and tried first next time. Each failure is kept with its reason, for the screen to say.
   Still turned away after every way, twice over, the radio itself is restarted (at most three times running) */
String trying, whyNot; int tryNext = 0, tryRssi = 0; volatile int lastReason = 0;
uint8_t bss[5][6]; int chans[5];
const char *WAYS[4] = {"plain", "low power", "low power, nearest point", "after a pause"};
RTC_DATA_ATTR int radioRestarts = 0; int failRounds = 0;
bool joinWay(int k, int way, bool seenIt) {
  WiFi.setAutoReconnect(false); WiFi.disconnect(false, true); vTaskDelay(pdMS_TO_TICKS(500));
  if (way == 3) for (int i = 0; i < 60 && !setupOn; i++) vTaskDelay(pdMS_TO_TICKS(250));   // 15 s for the router to let go
  wifi_power_t pw = way >= 1 ? WIFI_POWER_8_5dBm : WIFI_POWER_19_5dBm;
  WiFi.mode(WIFI_STA); WiFi.setSleep(false); WiFi.setTxPower(pw);
  lastReason = 0;
  if ((way == 2 || way == 3) && seenIt) WiFi.begin(nets[k].c_str(), passes[k].c_str(), chans[k], bss[k]); else WiFi.begin(nets[k].c_str(), passes[k].c_str());
  WiFi.setTxPower(pw);   // again once started: some cores set the power only on a running radio
  if (way >= 3) { wifi_config_t cf; if (esp_wifi_get_config(WIFI_IF_STA, &cf) == ESP_OK) { esp_wifi_disconnect(); cf.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK; cf.sta.pmf_cfg.capable = false; cf.sta.pmf_cfg.required = false; esp_wifi_set_config(WIFI_IF_STA, &cf); esp_wifi_connect(); } }
  /* up to 20 s for a weak signal; but once it has been turned away, 4 s more and the next way is tried */
  unsigned long t0 = millis(), failAt = 0;
  while (millis() - t0 < 20000 && WiFi.status() != WL_CONNECTED && !setupOn) { vTaskDelay(pdMS_TO_TICKS(250)); if (lastReason && !failAt) failAt = millis(); if (failAt && millis() - failAt > 4000) break; }
  return WiFi.status() == WL_CONNECTED;
}
String reasonWords(int r) {
  if (r == 15 || r == 202 || r == 204) return "wrong password?"; if (r == 201) return "not found";
  if (r == 2) return "the router didn't finish letting it in (code 2)"; if (r == 203) return "the router refused it (full, or blocking?)";
  if (r == 210 || r == 211) return "its security type isn't supported"; return String("no join (code ") + r + ")";
}
void join() {
  /* the order: those it can see first, strongest first; then those it can't, in case the scan missed them */
  WiFi.setAutoReconnect(false); WiFi.disconnect(); vTaskDelay(pdMS_TO_TICKS(400));
  int n = WiFi.scanNetworks(), rs[5], order[5]; bool vis[5];
  for (int tries = 0; n < 0 && tries < 3; tries++) { vTaskDelay(pdMS_TO_TICKS(1500)); n = WiFi.scanNetworks(); }
  for (int k = 0; k < nNets; k++) { vis[k] = false; rs[k] = -1000; order[k] = k;
    for (int i = 0; i < n; i++) if (WiFi.SSID(i) == nets[k] && WiFi.RSSI(i) > rs[k]) { rs[k] = WiFi.RSSI(i); vis[k] = true; memcpy(bss[k], WiFi.BSSID(i), 6); chans[k] = WiFi.channel(i); } }
  if (n > 0) WiFi.scanDelete();
  for (int i = 0; i < nNets; i++) for (int j = i + 1; j < nNets; j++) { int a = order[i], b = order[j];
    if ((vis[b] && !vis[a]) || (vis[a] == vis[b] && rs[b] > rs[a])) { order[i] = b; order[j] = a; } }
  int k = order[tryNext % nNets]; xSemaphoreTake(lock, portMAX_DELAY); trying = nets[k]; xSemaphoreGive(lock); tryRssi = vis[k] ? rs[k] : 0;
  /* the way that worked last first, then each of the others; a password refused is not asked again three more ways */
  int first = ways[k] % 4, r = 0;
  for (int w = 0; w < 4 && !setupOn; w++) { int way = (first + w) % 4; if (way == 2 && !vis[k]) continue;
    xSemaphoreTake(lock, portMAX_DELAY); trying = way ? nets[k] + " · " + WAYS[way] : nets[k]; xSemaphoreGive(lock);
    if (joinWay(k, way, vis[k])) { failRounds = 0; radioRestarts = 0; if (way != ways[k]) { ways[k] = way; prefs.putInt(("w" + String(k)).c_str(), way); } return; }
    r = lastReason; if (r == 15 || r == 202 || r == 204 || r == 201) break; }
  if (!setupOn) {
    String why = nets[k] + ": " + reasonWords(r) + (vis[k] ? String(", ") + tryRssi + " dBm" : String(", not in its scan of ") + n) + (tryRssi && tryRssi < -78 ? " (too weak here)" : "");
    xSemaphoreTake(lock, portMAX_DELAY); whyNot = why; xSemaphoreGive(lock);
    WiFi.setAutoReconnect(false); WiFi.disconnect(); tryNext++;
    /* every Wi-Fi it knows, every way, twice over, and still out: the radio started afresh, as unplugging it would */
    if (++failRounds >= 2 * (nNets ? nNets : 1) && radioRestarts < 3) { radioRestarts++; xSemaphoreTake(lock, portMAX_DELAY); whyNot = why + " - restarting the radio"; xSemaphoreGive(lock); vTaskDelay(pdMS_TO_TICKS(2500)); ESP.restart(); }
  }
}
void netTask(void *) {
  unsigned long last = 0;
  for (;;) {
    if (setupOn) { vTaskDelay(pdMS_TO_TICKS(400)); continue; }
    if (WiFi.status() != WL_CONNECTED) { netErr = 1; if (nNets) join(); vTaskDelay(pdMS_TO_TICKS(400)); continue; }
    String job, what; xSemaphoreTake(lock, portMAX_DELAY); job = askJob; what = askWhat; askJob = ""; xSemaphoreGive(lock);
    if (job.length()) { int c = act(job, what); for (int i = 0; i < 4 && c != 200 && c != 400 && c != 401; i++) { site().stop(); vTaskDelay(pdMS_TO_TICKS(600 + 400 * i)); c = act(job, what); }
      if (c == 200) { xSemaphoreTake(lock, portMAX_DELAY); if (net.first.job == job) { net.first = Slip(); if (net.waiting > 0) net.waiting--; if (what == "print") net.printing++; net.ver++; } xSemaphoreGive(lock); }
      actCode = c; actionPending = false; actionFinished = true; last = 0; }   // three tries; the result is handled by the display loop
    if (printerId.length() && millis() - last >= 2000) { last = millis(); poll(); }  // discover new jobs about four times faster
    vTaskDelay(pdMS_TO_TICKS(120));
  }
}
void ask(const String &job, const char *what) { actCode = 0; actionPending = true; actionFinished = false; xSemaphoreTake(lock, portMAX_DELAY); askJob = job; askWhat = what; xSemaphoreGive(lock); }

/* ───────── drawing, straight into the frame: one flat blueprint blue, chalk lines and dots smoothed at their edges, nothing shaded ─────────
   A small screen bands every gradient and every glow; so light here is made of dots and thin lines, as on the site's paper */
const uint16_t SEA = 0x1A31;                      // #1B468C: the site's blueprint blue, a touch brighter for a backlit screen
const uint16_t INK = 0xF79D, PAPER = 0xF79D, PAPERINK = 0x10A5;   // chalk; the slip's paper; thermal black with a blue cast
uint16_t *FB = nullptr;
int clampi(int v, int a, int b) { return v < a ? a : v > b ? b : v; }
void blendPx(int x, int y, uint16_t c, float a) {
  if ((unsigned)x >= (unsigned)W || (unsigned)y >= (unsigned)H || a <= 0.01f) return; uint16_t &d = FB[y * W + x];
  if (a >= 0.99f) { d = c; return; } int k = (int)(a * 256);
  int r0 = d >> 11, g0 = (d >> 5) & 63, b0 = d & 31, r1 = c >> 11, g1 = (c >> 5) & 63, b1 = c & 31;
  d = (uint16_t)(((r0 + (((r1 - r0) * k) >> 8)) << 11) | ((g0 + (((g1 - g0) * k) >> 8)) << 5) | (b0 + (((b1 - b0) * k) >> 8)));
}
/* a line of a given width, its edges smoothed; butt ends, so a path of them reads as one stroke */
void seg(float x0, float y0, float x1, float y1, float w, uint16_t c, float a, bool caps) {
  float r = w * 0.5f; int xa = clampi((int)floorf(fminf(x0, x1) - r - 1), 0, W - 1), xb = clampi((int)ceilf(fmaxf(x0, x1) + r + 1), 0, W - 1);
  int ya = clampi((int)floorf(fminf(y0, y1) - r - 1), 0, H - 1), yb = clampi((int)ceilf(fmaxf(y0, y1) + r + 1), 0, H - 1);
  if (xa > xb || ya > yb || (xb - xa) * (yb - ya) > 30000) return;
  float dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy; if (L2 < 1e-4f) { L2 = 1e-4f; caps = true; }
  for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) {
    float t = ((x - x0) * dx + (y - y0) * dy) / L2; if (!caps && (t < 0 || t >= 1)) continue; t = fminf(1, fmaxf(0, t));
    float ex = x - (x0 + t * dx), ey = y - (y0 + t * dy), cov = r + 0.5f - sqrtf(ex * ex + ey * ey); if (cov > 0) blendPx(x, y, c, a * fminf(1, cov)); }
}
void dotA(float cx, float cy, float r, uint16_t c, float a) {
  int xa = clampi((int)floorf(cx - r - 1), 0, W - 1), xb = clampi((int)ceilf(cx + r + 1), 0, W - 1), ya = clampi((int)floorf(cy - r - 1), 0, H - 1), yb = clampi((int)ceilf(cy + r + 1), 0, H - 1);
  if (cx < -r - 2 || cx > W + r + 2 || cy < -r - 2 || cy > H + r + 2) return;
  for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) { float dx = x - cx, dy = y - cy, cov = r + 0.5f - sqrtf(dx * dx + dy * dy); if (cov > 0) blendPx(x, y, c, a * fminf(1, cov)); }
}
void ring(float cx, float cy, float R, float w, uint16_t c, float a) {   // row by row, only the band of the ring is visited
  float o = R + w / 2 + 1, in = fmaxf(0, R - w / 2 - 1);
  for (int y = clampi((int)floorf(cy - o), 0, H - 1); y <= clampi((int)ceilf(cy + o), 0, H - 1); y++) {
    float dy = y - cy; if (fabsf(dy) > o) continue; float xo = sqrtf(o * o - dy * dy), xi = fabsf(dy) < in ? sqrtf(in * in - dy * dy) : 0;
    for (int side = -1; side <= 1; side += 2) for (int x = (int)floorf(cx + (side < 0 ? -xo : xi)); x <= (int)ceilf(cx + (side < 0 ? -xi : xo)); x++) {
      if ((unsigned)x >= (unsigned)W) continue; float dx = x - cx, cov = w / 2 + 0.5f - fabsf(sqrtf(dx * dx + dy * dy) - R); if (cov > 0) blendPx(x, y, c, a * fminf(1, cov)); } }
}
float rnd1() { return (random(-1000, 1001)) / 1000.0f; }
float hashf(int i) { uint32_t h = (uint32_t)i * 2654435761u; h ^= h >> 13; h *= 0x5bd1e995; h ^= h >> 15; return (h & 0xFFFF) / 65535.0f; }

/* ───────── type: the site's own, Archivo Narrow for what is said, Departure Mono for the small labels; smoothed, never scaled ───────── */
int textW(const Font &f, const char *s, int track) { int w = 0; for (; *s; s++) if (*s >= 32 && *s < 127) w += f.g[*s - 32].adv + track; return w; }
int text(const Font &f, const char *s, int x, int y, uint16_t c, float a, int track) {   // y is the baseline
  for (; *s; s++) { if (*s < 32 || *s > 126) continue; const Glyph &gl = f.g[*s - 32];
    for (int j = 0; j < gl.h; j++) for (int i = 0; i < gl.w; i++) { int n = gl.off + j * gl.w + i; int v = (f.bits[n >> 1] >> ((n & 1) ? 0 : 4)) & 15; if (v) blendPx(x + gl.xo + i, y + gl.yo + j, c, a * v / 15.0f); }
    x += gl.adv + track; }
  return x;
}
/* words wrapped to a width; the last line that fits ends in an ellipsis if more is left. Returns the next baseline */
int para(const Font &f, const String &s, int x, int y, int w, int lh, int maxLines, uint16_t c, float a) {
  String rest = s; rest.trim(); int lines = 0;
  while (rest.length() && lines < maxLines) {
    int fit = 0, lastSpace = -1, width = 0;
    for (int i = 0; i < (int)rest.length(); i++) {
      char ch = rest[i];
      if (ch < 32 || ch > 126) break;
      width += f.g[ch - 32].adv;
      if (width > w) break;
      fit = i + 1;
      if (ch == ' ') lastSpace = i;
    }
    if (fit == 0) fit = 1;  // even an unusually wide first glyph must make progress
    int cut = fit;
    if (fit < (int)rest.length() && lastSpace >= 0) cut = lastSpace;
    if (cut <= 0) cut = fit; // long words without spaces wrap at a character boundary
    String ln = rest.substring(0, cut); ln.trim();
    rest = rest.substring(cut); rest.trim();
    if (lines == maxLines - 1 && rest.length()) {
      while (ln.length() && textW(f, (ln + "...").c_str(), 0) > w) ln = ln.substring(0, ln.length() - 1);
      ln += "...";
    }
    text(f, ln.c_str(), x, y, c, a, 0); y += lh; lines++;
  }
  return y;
}

/* ───────── the camera: where it looks, how close, a hand holding it underwater ───────── */
struct Cam { float x, y, z; } cam = {W / 2, H / 2, 1}, camT = {W / 2, H / 2, 1};
float shake = 0, shx = 0, shy = 0;   // a jolt, when it pops
float PX(float x) { return (x - cam.x) * cam.z + W / 2 + shx; }
float PY(float y) { return (y - cam.y) * cam.z + H / 2 + shy; }

/* ───────── the irukandji, drawn as the site draws it ───────── */
struct Jelly { float x = W / 2, y = 20, bw = 96, a = 0, sq = 0, jit = 0, len = 1, run = -1, look = 0, tp = 0, rate = 1, glow = 0; int eye = 0; bool cue = false; } J;
// eye: 0 open, 1 squeezed shut (> <), 2 asleep, 3 wide
float tX[4][44], tY[4][44]; const int NT = 44, NR = 48;
float bellX[NR], bellY[NR], bTop, bBot, bW, eyeX, eyeY, pupR;
float pulse(float t) { float p = fmodf(t, 3.6f) / 3.6f; return p < 0.28f ? sinf(p / 0.28f * PI / 2) : cosf((p - 0.28f) / 0.72f * PI / 2); }
/* Rotate only the creature's own geometry; the sea, QR, copy and printer UI stay upright. */
bool jellyRollEnabled = true;
float jellyPX(float x, float y, float cx, float cy, float a) { float dx = x - cx, dy = y - cy; return PX(cx + dx * cosf(a) - dy * sinf(a)); }
float jellyPY(float x, float y, float cx, float cy, float a) { float dx = x - cx, dy = y - cy; return PY(cy + dx * sinf(a) + dy * cosf(a)); }
void drawJelly(float t) {
  if (J.a <= 0.02f) return;
  float z = cam.z, p = pulse(J.tp), sq = J.sq, bw = J.bw, bh = bw * 0.58f, A = J.a;
  float w = bw * (1 - 0.07f * p) / 2 * (1 + 0.55f * sq), h = bh * (1 + 0.045f * p) * (1 - 0.72f * sq);
  /* Deterministic, continuous micro-motion: never randomise the body position frame-to-frame. */
  float jx = J.jit * (sinf(t * 17.0f) * 0.34f + sinf(t * 9.3f) * 0.18f),
        jy = J.jit * 0.6f * (sinf(t * 13.1f + 0.7f) * 0.28f + sinf(t * 6.7f) * 0.16f),
        cx = J.x + jx, top = J.y + jy + (bh - h) * (0.3f + 0.7f * sq), bot = top + h;
  /* A slow, continuous full turn: upright, upside-down, and back without a pose reset. */
  float roll = jellyRollEnabled ? (2.0f * PI * (0.5f - 0.5f * cosf(t * 0.11f)) + 0.16f * sinf(t * 0.47f)) : 0.0f;
  float rollCx = cx, rollCy = top + h * 0.42f;
  bTop = top; bBot = bot; bW = w;
  /* its light: not a glow but a scatter of fine dots round the bell, thinning outward and breathing with it, like the site's paper grain */
  for (int i = 0; i < 70; i++) { float u = hashf(i) * 2 * PI, rr = 0.62f + powf(hashf(i + 97), 0.7f) * 0.9f, k = 1 - (rr - 0.62f) / 0.9f;
    float tw = 0.5f + 0.5f * sinf(t * (0.6f + hashf(i + 7)) + i);
    dotA(jellyPX(cx + cosf(u) * bw * rr, top + h * 0.5f + sinf(u) * bw * rr * 0.8f, rollCx, rollCy, roll), jellyPY(cx + cosf(u) * bw * rr, top + h * 0.5f + sinf(u) * bw * rr * 0.8f, rollCx, rollCy, roll), 0.55f * z, INK, A * (0.07f + 0.16f * k) * (0.55f + 0.45f * tw) * (1 + 0.5f * p + J.glow * 0.6f)); }
  /* the tentacles: from the bell's foot, swaying in the current, beads of stinging cells along them; a light runs down them as it prints */
  float Lt = bw * 2.2f * J.len, writhe = 1 + 1.4f * fmaxf(0, sq);
  for (int i = 0; i < 4; i++) {
    float rx = cx + (i - 1.5f) / 1.5f * w * 0.82f, ry = bot - 1;
    for (int j = 0; j < NT; j++) { float s = j / (NT - 1.0f), env = fminf(1, s * 5) * sinf(PI * (0.15f + 0.85f * s));
      float drift = env * (sinf(s * (11 + i * 1.5f) - t * 1.3f + i * 1.7f) * 2.4f * writhe + (sinf(t * 0.66f + i * 3.3f + s * 2.2f) * 0.6f + sinf(t * 0.5f + i + s * 3) * 0.4f) * 14 + J.look * s * 10);
      float naturalX = rx + (i - 1.5f) * s * bw * 0.14f + drift;
      /* Outer tentacles curl to the bezel and lightly hold it; inner ones reach toward the corners. */
      float gu = fmaxf(0.0f, fminf(1.0f, (s - 0.68f) / 0.32f));
      float grip = gu * gu * (3.0f - 2.0f * gu);
      /* Each strand has its own tide: grip, release, curl and reach are deliberately out of phase. */
      float tide = 0.5f + 0.5f * sinf(t * (0.16f + i * 0.013f) + i * 2.2f);
      float release = fmaxf(0.0f, sinf(t * 0.23f + i * 2.1f + 0.8f));
      float edgeX = (i < 2) ? 4.0f + 13.0f * tide : (W - 4.0f - 13.0f * tide);
      float edgeY = 12.0f + (i % 2) * 20.0f + sinf(t * 0.37f + i * 1.9f) * 9.0f;
      float freeGrip = grip * (0.30f + 0.70f * tide) * (1.0f - 0.72f * release);
      float curl = sinf(s * 10.0f + t * 0.9f + i * 2.7f) * s * s * 12.0f;
      tX[i][j] = (naturalX + curl) * (1.0f - freeGrip) + edgeX * freeGrip;
      tY[i][j] = (ry + s * Lt + env * sinf(t * 0.54f + i * 7.1f + s * 3) * 4) * (1.0f - freeGrip) + edgeY * freeGrip;
      /* The distal tip lifts away from the bezel in a slow wave, then catches it again. */
      tY[i][j] -= release * s * s * 24.0f;
    }
    for (int j = 1; j < NT; j++) { float s = j / (NT - 1.0f); seg(jellyPX(tX[i][j - 1], tY[i][j - 1], rollCx, rollCy, roll), jellyPY(tX[i][j - 1], tY[i][j - 1], rollCx, rollCy, roll), jellyPX(tX[i][j], tY[i][j], rollCx, rollCy, roll), jellyPY(tX[i][j], tY[i][j], rollCx, rollCy, roll), (1.1f - 0.6f * s) * z, INK, A * (0.62f - 0.3f * s), false); }
    for (int j = 4; j < NT - 1; j += 3) { float tw = 0.5f + 0.5f * sinf(t * 2.2f - j * 0.5f + i), run = J.run >= 0 ? fmaxf(0, 1 - fabsf(J.run - (float)j / NT) * 8) : 0;
      dotA(jellyPX(tX[i][j], tY[i][j], rollCx, rollCy, roll), jellyPY(tX[i][j], tY[i][j], rollCx, rollCy, roll), ((j % 9 == 4) ? 1.5f : 0.9f) * z * (1 + run * 0.7f), INK, A * fminf(1, 0.32f + 0.22f * tw + run * 0.6f)); }
  }
  /* the bell: a box with a soft dome, its foot drawn up a little; a faint second pass, as a hand would */
  for (int i = 0; i < NR; i++) { float u = (float)i / NR, X, Y;
    if (u < 0.8f) { float an = PI * (1 - u / 0.8f), ca = cosf(an), sa = fmaxf(0, sinf(an)); X = cx + powf(fabsf(ca), 0.55f) * (ca < 0 ? -1 : 1) * w; Y = bot - powf(sa, 0.42f) * h * (0.94f + 0.06f * sa); }
    else { float s2 = (u - 0.8f) / 0.2f; X = cx + w - 2 * w * s2; Y = bot - sinf(s2 * PI) * h * 0.09f; }
    bellX[i] = X; bellY[i] = Y; }
  for (int i = 0; i < NR; i++) { int k = (i + 1) % NR; seg(jellyPX(bellX[i], bellY[i], rollCx, rollCy, roll), jellyPY(bellX[i], bellY[i], rollCx, rollCy, roll), jellyPX(bellX[k], bellY[k], rollCx, rollCy, roll), jellyPY(bellX[k], bellY[k], rollCx, rollCy, roll), 1.3f * z, INK, A * 0.95f, false); }
  for (int i = 0; i < NR; i++) { int k = (i + 1) % NR; seg(jellyPX(bellX[i] + 1.2f, bellY[i] + 0.8f, rollCx, rollCy, roll), jellyPY(bellX[i] + 1.2f, bellY[i] + 0.8f, rollCx, rollCy, roll), jellyPX(bellX[k] + 1.2f, bellY[k] + 0.8f, rollCx, rollCy, roll), jellyPY(bellX[k] + 1.2f, bellY[k] + 0.8f, rollCx, rollCy, roll), 0.6f * z, INK, A * 0.22f, false); }
  /* the eye that notices, in dots; it blinks; squeezed it shuts tight; asleep it is a line */
  float bk = fminf(1, fabsf(fmodf(t + 2.2f, 7.3f) - 0.14f) / 0.14f), eh = (bot - top) * 0.27f * fmaxf(0.08f, bk), ew = w * 0.74f, ex = cx + J.look * ew * 0.16f, ey = top + (bot - top) * 0.5f;
  eyeX = ex; eyeY = ey; pupR = (bot - top) * 0.27f * 0.95f;
  if (J.eye == 1) {        // > <
    float a2 = ew * 0.42f, b = (bot - top) * 0.2f;
    seg(jellyPX(ex - a2 * 1.4f, ey - b, rollCx, rollCy, roll), jellyPY(ex - a2 * 1.4f, ey - b, rollCx, rollCy, roll), jellyPX(ex - a2 * 0.5f, ey, rollCx, rollCy, roll), jellyPY(ex - a2 * 0.5f, ey, rollCx, rollCy, roll), 1.5f * z, INK, A, true); seg(jellyPX(ex - a2 * 0.5f, ey, rollCx, rollCy, roll), jellyPY(ex - a2 * 0.5f, ey, rollCx, rollCy, roll), jellyPX(ex - a2 * 1.4f, ey + b, rollCx, rollCy, roll), jellyPY(ex - a2 * 1.4f, ey + b, rollCx, rollCy, roll), 1.5f * z, INK, A, true);
    seg(jellyPX(ex + a2 * 1.4f, ey - b, rollCx, rollCy, roll), jellyPY(ex + a2 * 1.4f, ey - b, rollCx, rollCy, roll), jellyPX(ex + a2 * 0.5f, ey, rollCx, rollCy, roll), jellyPY(ex + a2 * 0.5f, ey, rollCx, rollCy, roll), 1.5f * z, INK, A, true); seg(jellyPX(ex + a2 * 0.5f, ey, rollCx, rollCy, roll), jellyPY(ex + a2 * 0.5f, ey, rollCx, rollCy, roll), jellyPX(ex + a2 * 1.4f, ey + b, rollCx, rollCy, roll), jellyPY(ex + a2 * 1.4f, ey + b, rollCx, rollCy, roll), 1.5f * z, INK, A, true);
  } else if (J.eye == 2) {  // asleep: the lid's line, gently curved
    for (int k = 0; k < 14; k++) { float u = k / 13.0f * 2 - 1; dotA(jellyPX(ex + u * ew, ey + (1 - u * u) * eh * 0.5f + 1, rollCx, rollCy, roll), jellyPY(ex + u * ew, ey + (1 - u * u) * eh * 0.5f + 1, rollCx, rollCy, roll), 0.8f * z, INK, 0.7f * A); }
  } else {
    for (int j = 0; j < 30; j++) { float u = j / 30.0f * 2 * PI, cu = cosf(u), su = sinf(u); dotA(jellyPX(ex + cu * ew, ey + su * eh * (0.35f + 0.65f * fabsf(su)), rollCx, rollCy, roll), jellyPY(ex + cu * ew, ey + su * eh * (0.35f + 0.65f * fabsf(su)), rollCx, rollCy, roll), 0.85f * z, INK, (0.62f + 0.18f * sinf(t * 1.75f)) * A); }
    float pr = pupR * fmaxf(0.08f, bk) * (1 + 0.04f * sinf(t * 1.75f)) * (J.eye == 3 ? 1.25f : 1), px = ex + J.look * ew * 0.1f;
    dotA(jellyPX(px, ey, rollCx, rollCy, roll), jellyPY(px, ey, rollCx, rollCy, roll), pr * (0.42f + 0.1f * J.glow) * z, INK, 0.95f * A);
    ring(jellyPX(px, ey, rollCx, rollCy, roll), jellyPY(px, ey, rollCx, rollCy, roll), pr * z, 0.9f * z, INK, 0.85f * A);
    if (J.glow > 0) ring(jellyPX(px, ey, rollCx, rollCy, roll), jellyPY(px, ey, rollCx, rollCy, roll), pr * (1.35f + 0.25f * J.glow) * z, 0.7f, INK, 0.25f * J.glow * A);   // waiting: a second ring breathes round the pupil
  }
  const float F[4] = {-0.62f, -0.22f, 0.22f, 0.62f}; for (int k = 0; k < 4; k++) dotA(jellyPX(cx + F[k] * w, bot - bh * 0.1f, rollCx, rollCy, roll), jellyPY(cx + F[k] * w, bot - bh * 0.1f, rollCx, rollCy, roll), 1.3f * z, INK, 0.85f * A);
  /* waiting for a touch: now and then one thin ring goes out from it, and fades */
  if (J.cue) { float rk = fmodf(t, 4.5f) / 2.2f; if (rk < 1) ring(jellyPX(cx, top + h * 0.6f, rollCx, rollCy, roll), jellyPY(cx, top + h * 0.6f, rollCx, rollCy, roll), (bw * 0.75f + rk * bw * 0.55f) * z, 1, INK, 0.32f * (1 - rk) * (1 - rk)); }
}

/* ───────── the sea: flat; marine snow rising, some near, some far ───────── */
struct Flake { float x, y, r, a, ph; } snow[30];
float current = 0;
unsigned long sceneStartMs = 0;
bool isNightScene() { if (cfgScene == 1) return false; if (cfgScene == 2) return true; unsigned long cycle = (millis() - sceneStartMs) % 420000UL; return cycle >= 300000UL; }
void drawSea(float t, float dt) {
  bool night = isNightScene();
  const uint16_t seaColor = night ? 0x0820 : SEA;  // deep ink-blue at night
  for (int i = 0; i < W * H; i++) FB[i] = seaColor;
  for (int i = 0; i < 30; i++) { Flake &f = snow[i];
    f.y -= dt * (2 + f.r * 3); f.x += sinf(t * 0.2f + f.ph) * 0.08f + current * dt * (40 + f.r * 30);
    if (f.y < -4) { f.y = H + 4; f.x = random(W); } if (f.x > W + 4) f.x = -4; if (f.x < -4) f.x = W + 4;
    dotA(f.x, f.y, f.r * (0.7f + 0.3f * cam.z), night ? 0x07E0 : INK, f.a * (0.6f + 0.4f * sinf(t * 0.7f + f.ph))); }
  if (night) {
    /* Bermuda fire-worms: independent, slow drifting chains of fluorescent goo that flare, bead and break apart. */
    for (int w = 0; w < 5; w++) {
      float phase = t * (0.10f + 0.018f * w) + w * 1.71f;
      float headX = fmodf(phase * 36.0f + w * 71.0f, W + 90.0f) - 45.0f;
      float headY = 18.0f + w * 29.0f + sinf(t * 0.31f + w * 2.4f) * 13.0f;
      float flare = 0.35f + 0.65f * (0.5f + 0.5f * sinf(t * (1.3f + w * 0.11f) + w));
      for (int n = 0; n < 10; n++) {
        float u = n / 9.0f, wx = headX - u * (20.0f + 12.0f * sinf(phase * 1.4f)),
              wy = headY + sinf(phase * 2.0f - u * 5.2f + n * 0.21f) * (2.0f + 5.0f * u);
        dotA(wx, wy, (n == 0 ? 2.0f : 0.8f + 1.1f * (1.0f - u)), 0x07E0, flare * (0.20f + 0.72f * (1.0f - u)));
        if (n) seg(wx, wy, wx + 2.0f, wy - 1.0f, 0.7f, 0x07E0, flare * 0.28f, true);
      }
      /* A few sparks peel away from each worm and dissolve like glowing gel. */
      for (int q = 0; q < 3; q++) { float sx = headX - fmodf(t * (7.0f + q * 2.0f) + w * 11 + q * 13, 28.0f); float sy = headY + sinf(t * 0.9f + q * 2.0f + w) * 10.0f; dotA(sx, sy, 0.7f, 0x07E0, flare * 0.34f); }
    }
  }
}

/* ───────── what is left after a squash: pieces, swept by a current, and a fish ───────── */
Part parts[60]; int nParts = 0;
void addPart(Part p) { if (nParts < 60) { p.on = true; parts[nParts++] = p; } }
struct Fish { float x, y, chomp; bool on; } fish;
void burstFrom(float bx, float by) {
  nParts = 0;
  for (int a = 0; a < 8; a++) { Part p = {}; p.kind = 1; p.n = 6; float sx = 0, sy = 0; for (int k = 0; k < 6; k++) { int i = (a * 6 + k) % NR; p.px[k] = bellX[i]; p.py[k] = bellY[i]; sx += bellX[i]; sy += bellY[i]; }
    sx /= 6; sy /= 6; for (int k = 0; k < 6; k++) { p.px[k] -= sx; p.py[k] -= sy; } p.x = sx; p.y = sy;
    float dx = sx - bx, dy = sy - by, l = fmaxf(1, sqrtf(dx * dx + dy * dy)), v = 70 + random(80); p.vx = dx / l * v; p.vy = dy / l * v - 50; p.vr = rnd1() * 6; addPart(p); }
  for (int i = 0; i < 4; i++) for (int s = 0; s < 3; s++) { Part p = {}; p.kind = 1; p.n = 6; int j0 = 3 + s * 12; float sx = 0, sy = 0;
    for (int k = 0; k < 6; k++) { int j = clampi(j0 + k * 2, 0, NT - 1); p.px[k] = tX[i][j]; p.py[k] = tY[i][j]; sx += p.px[k]; sy += p.py[k]; }
    sx /= 6; sy /= 6; for (int k = 0; k < 6; k++) { p.px[k] -= sx; p.py[k] -= sy; } p.x = sx; p.y = sy; p.vx = rnd1() * 60; p.vy = rnd1() * 40; p.vr = rnd1() * 4; addPart(p); }
  for (int k = 0; k < 18; k++) { Part p = {}; p.kind = 0; p.s = random(2) ? 1.5f : 0.9f; int i = random(4), j = 4 + random(NT - 5); p.x = tX[i][j]; p.y = tY[i][j]; p.vx = rnd1() * 90; p.vy = rnd1() * 90 - 30; addPart(p); }
  Part e = {}; e.kind = 2; e.x = eyeX; e.y = eyeY; e.s = pupR; e.vx = rnd1() * 40; e.vy = -90; e.vr = 5; addPart(e);
  fish = {-60, by, 0, false};
}
void stepParts(float k, float dt) {
  current = k < 0.6f ? 0 : fminf(1, (k - 0.6f) / 0.6f);
  for (int i = 0; i < nParts; i++) { Part &p = parts[i]; if (!p.on) continue;
    float drag = expf(-1.6f * dt); p.vx *= drag; p.vy *= drag;
    p.vx += current * 260 * dt; p.vy += (p.kind == 3 ? -40 : sinf(k * 3 + p.x * 0.05f) * 26) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.x > W + 40 || p.y < -40) p.on = false; }
  /* the fish: in from the left once the current runs, chasing what is nearest, eating it */
  if (k > 0.9f && !fish.on && fish.x < 0) { fish.on = true; }
  if (fish.on) {
    float ty = fish.y, best = 1e9; for (int i = 0; i < nParts; i++) if (parts[i].on && parts[i].kind != 3 && parts[i].x > fish.x - 4) { float d = parts[i].x - fish.x; if (d < best) { best = d; ty = parts[i].y; } }
    fish.x += 185 * dt; fish.y += (ty - fish.y) * fminf(1, 3 * dt); fish.chomp = fmaxf(0, fish.chomp - dt * 3);
    float mx = fish.x + 22, my = fish.y;
    for (int i = 0; i < nParts; i++) { Part &p = parts[i]; if (!p.on || p.kind == 3) continue; float dx = p.x - mx, dy = p.y - my;
      if (dx * dx + dy * dy < 15 * 15) { p.on = false; fish.chomp = 1; Part b = {}; b.kind = 3; b.x = mx; b.y = my - 4; b.s = 1.5f + random(2); b.vx = 20; b.vy = -20; addPart(b); buzz(4); } }
    if (fish.x > W + 60) fish.on = false;
  }
}
void drawParts(float k) {
  if (current > 0) for (int i = 0; i < 6; i++) { float y = 20 + i * 26 + sinf(k * 1.3f + i) * 5;   // the current, as fine lines going by
    for (int d = 0; d < 4; d++) { float xs = fmodf(k * 260 + d * 92 + i * 31, W + 80) - 40; seg(xs, y, xs + 18, y + sinf(xs * 0.05f) * 1.2f, 0.8f, INK, 0.2f * current, true); } }
  for (int i = 0; i < nParts; i++) { Part &p = parts[i]; if (!p.on) continue;
    float X = PX(p.x), Y = PY(p.y);
    if (p.kind == 0) dotA(X, Y, p.s, INK, 0.85f);
    else if (p.kind == 3) ring(X, Y, p.s, 0.8f, INK, 0.6f);
    else if (p.kind == 2) {  // the eye, rolled out: its ring, and an X where the pupil was
      ring(X, Y, p.s, 1, INK, 0.9f); float c = cosf(p.rot), s = sinf(p.rot), r = p.s * 0.55f;
      seg(X - r * c + r * s, Y - r * s - r * c, X + r * c - r * s, Y + r * s + r * c, 1.4f, INK, 0.95f, true); seg(X - r * c - r * s, Y - r * s + r * c, X + r * c + r * s, Y + r * s - r * c, 1.4f, INK, 0.95f, true);
    } else { float c = cosf(p.rot), s = sinf(p.rot);
      for (int k2 = 1; k2 < p.n; k2++) seg(X + p.px[k2 - 1] * c - p.py[k2 - 1] * s, Y + p.px[k2 - 1] * s + p.py[k2 - 1] * c, X + p.px[k2] * c - p.py[k2] * s, Y + p.px[k2] * s + p.py[k2] * c, 1.3f, INK, 0.9f, k2 == 1 || k2 == p.n - 1); }
  }
  if (fish.on) {  // a fish in one line: its body, its mouth opening, its tail beating, an eye
    float x = PX(fish.x), y = PY(fish.y), m = 0.18f + 0.5f * fish.chomp * (0.5f + 0.5f * sinf(k * 40)), wag = sinf(k * 14) * 4;
    float lx = 0, ly = 0; for (int i = 0; i <= 24; i++) { float u = m + (2 * PI - 2 * m) * i / 24.0f, X = x + cosf(u) * 20, Y = y + sinf(u) * 10 * (1 - 0.15f * cosf(u));
      if (i) seg(lx, ly, X, Y, 1.3f, INK, 0.95f, false); lx = X; ly = Y; }
    seg(x + cosf(m) * 20, y + sinf(m) * 10, x + 12, y, 1.2f, INK, 0.95f, true); seg(x + 12, y, x + cosf(-m) * 20, y + sinf(-m) * 10, 1.2f, INK, 0.95f, true);
    seg(x - 20, y, x - 32, y - 9 + wag, 1.2f, INK, 0.95f, true); seg(x - 32, y - 9 + wag, x - 32, y + 9 + wag, 1.2f, INK, 0.95f, true); seg(x - 32, y + 9 + wag, x - 20, y, 1.2f, INK, 0.95f, true);
    dotA(x + 9, y - 3, 1.6f, INK, 1); for (int i = 0; i < 4; i++) dotA(x + 2 + sinf(i * 0.6f) * 2, y - 5 + i * 3, 0.5f, INK, 0.7f);
  }
}

/* ───────── codes to scan, built in: novel.global, and the setup Wi-Fi (NOVEL TOUCH, password novelglobal) ───────── */
const uint32_t QR_SITE[25] = { 0x01FD017F, 0x01056F41, 0x0174B05D, 0x0174755D, 0x0175CE5D, 0x01052041, 0x01FD557F, 0x00011100, 0x01A5C0ED, 0x0089280D, 0x000515CD, 0x0076B8A7, 0x01D68B49,
  0x011DEB3A, 0x00D357F6, 0x01193421, 0x01FF8C7C, 0x01513700, 0x01D51B7F, 0x00911341, 0x00BF385D, 0x01F6F55D, 0x00D7B95D, 0x00520041, 0x01FE517F };
const uint32_t QR_JOIN[29] = { 0x1FCE717F, 0x10521641, 0x174B395D, 0x1754745D, 0x174C5A5D, 0x10515D41, 0x1FD5557F, 0x00198200, 0x149552C5, 0x0477ED0B, 0x143DD66A, 0x1055510D, 0x114B4DF3, 0x0495EB35,
  0x121ED065, 0x0B41D29C, 0x0C5DEDF1, 0x020FBE32, 0x171D87F3, 0x18712904, 0x11F12C4F, 0x0D139D00, 0x1358E37F, 0x03194241, 0x0DF9F65D, 0x122BDE5D, 0x1951B55D, 0x0225B841, 0x15B0FF7F };
void drawQR(const uint32_t *q, int n, int cx, int cy, int m) {   // chalk plate, blueprint modules, two modules of quiet round them
  int s = (n + 4) * m, x0 = cx - s / 2, y0 = cy - s / 2;
  g->fillRect(x0, y0, s, s, INK);
  for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) if (q[r] >> c & 1) g->fillRect(x0 + (2 + c) * m, y0 + (2 + r) * m, m, m, SEA);
}

/* ───────── the setup Wi-Fi and its page ───────── */
WebServer web(80); DNSServer dns; String apPass, scanOpts;
String between(const String &s0, const char *key) { String s = s0; s.replace("\xE2\x80\x9C", "\""); s.replace("\xE2\x80\x9D", "\""); int i = s.indexOf(key); if (i < 0) return ""; int a = s.indexOf('"', i), b = s.indexOf('"', a + 1); return a < 0 || b < 0 ? "" : s.substring(a + 1, b); }
String esc(String s) { s.replace("&", "&amp;"); s.replace("<", "&lt;"); s.replace("\"", "&quot;"); return s; }
const char *PAGE_HEAD = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><title>novel.global touch</title>"
  "<style>body{background:#17457F;color:#F4F1E8;font:16px/1.4 -apple-system,system-ui,sans-serif;margin:0;padding:22px;max-width:520px}"
  "input,select,textarea{width:100%;box-sizing:border-box;font:16px ui-monospace,monospace;padding:10px;margin:4px 0 14px;border:1.5px solid #F4F1E8;border-radius:8px;background:#0E2F6E;color:#F4F1E8}"
  "button{font:600 17px system-ui;padding:12px 26px;border-radius:30px;border:0;background:#F4F1E8;color:#17457F}label{font-size:13px;opacity:.8}h1{font-weight:500;font-size:20px}</style>";
/* the Wi-Fis it can see, strongest first, each once; the ones it knows marked. Scanning can clash with its own search for a
   known Wi-Fi, so it waits for that and tries again */
void scanNets() {
  int n = WIFI_SCAN_FAILED;
  for (int tries = 0; tries < 5 && n < 0; tries++) {
    n = WiFi.scanNetworks(true);   // in the background, then waited for, so a scan already running is not a failure
    unsigned long s0 = millis(); while ((n = WiFi.scanComplete()) == WIFI_SCAN_RUNNING && millis() - s0 < 9000) delay(100);
    if (n < 0) { WiFi.scanDelete(); delay(600); }
  }
  scanOpts = ""; String seenNames = "|";
  for (int pass = 0; pass < 2; pass++) for (int i = 0; i < n && i < 30; i++) {
    String s = WiFi.SSID(i); if (!s.length() || seenNames.indexOf("|" + s + "|") >= 0) continue;
    bool known = false; for (int k = 0; k < nNets; k++) if (nets[k] == s) known = true;
    if ((pass == 0) != known) continue;   // known ones first
    seenNames += s + "|"; scanOpts += "<option value=\"" + esc(s) + "\">" + esc(s) + (known ? " (known)" : "") + "  " + String(WiFi.RSSI(i)) + " dBm" + (WiFi.RSSI(i) < -80 ? " weak" : "") + "</option>";
  }
  if (n > 0) WiFi.scanDelete();
}
void pageRoot() {
  String s = PAGE_HEAD; s += "<h1>novel.global &middot; touch</h1>";
  s += "<p style='opacity:.7;font-size:13px'>" + (printerId.length() ? esc(printerId) : String("no printer")) + "</p>";
  s += "<form method=post action=/save><label>Wi-Fi</label><select name=s><option value=''>-</option>" + scanOpts + "</select>";
  s += "<p style='margin:-6px 0 14px;font-size:13px'><a style='color:#F4F1E8' href=/scan>scan again</a></p>";
  s += "<label>or its name</label><input name=s2 autocomplete=off autocapitalize=none><label>password</label><input name=p type=password>";
  s += "<label>approval page lines</label><textarea name=ng rows=3></textarea>";
  if (nNets) { s += "<label>forget</label><div style='margin:6px 0 16px'>"; for (int i = 0; i < nNets; i++) s += "<div><input type=checkbox name=f" + String(i) + " style='width:auto;margin-right:8px'>" + esc(nets[i]) + "</div>"; s += "</div>"; }
  s += "<button>Save</button></form>";
  s += "<form method=post action=/done style='margin-top:18px'><button style='background:none;color:#F4F1E8;border:1.5px solid #F4F1E8'>Close</button></form>";
  web.send(200, "text/html", s);
}
void pageScan() { scanNets(); web.sendHeader("Location", "/"); web.send(302, "text/plain", ""); }
void bye(const String &what) { web.send(200, "text/html", String(PAGE_HEAD) + "<h1>" + what + "</h1>"); delay(1500); ESP.restart(); }
void pageSave() {
  String ss = web.arg("s2").length() ? web.arg("s2") : web.arg("s"), pp = web.arg("p"), ng = web.arg("ng"); ss.trim();
  if (ss.length() && !pp.length()) for (int i = 0; i < nNets; i++) if (nets[i] == ss) pp = passes[i];   // a known one chosen again keeps its password
  String kn[5], kp[5]; int k = 0; if (ss.length()) { kn[k] = ss; kp[k++] = pp; }
  for (int i = 0; i < nNets && k < 5; i++) if (!web.hasArg("f" + String(i)) && nets[i] != ss) { kn[k] = nets[i]; kp[k++] = passes[i]; }
  nNets = k; for (int i = 0; i < k; i++) { nets[i] = kn[i]; passes[i] = kp[i]; } saveNets(); prefs.putBool("set", true);
  WiFi.disconnect(false, true);   // and the radio's own memory of the last one wiped, so nothing joins it by itself
  String h2 = between(ng, "NG_HOST"), p2 = between(ng, "NG_PRINTER"), t2 = between(ng, "NG_TOKEN");
  if (h2.length()) prefs.putString("host", h2); if (p2.length()) prefs.putString("prn", p2); if (t2.length()) prefs.putString("tok", t2);
  bye(ss.length() ? "Joining " + esc(ss) + "&hellip;" : String("Saved"));
}
float setupAt = 0;
void startSetup(float t) {
  setupOn = true; setupAt = t; WiFi.disconnect(); delay(200); WiFi.mode(WIFI_AP_STA);
  apPass = "novelglobal"; WiFi.softAP("NOVEL TOUCH", apPass.c_str());   // fixed, so its code can be shown on the screen; open only by hand or at power-on
  scanNets();
  dns.start(53, "*", WiFi.softAPIP()); web.on("/", HTTP_GET, pageRoot); web.on("/save", HTTP_POST, pageSave); web.on("/scan", HTTP_GET, pageScan);
  web.on("/done", HTTP_POST, []() { bye("Back to the jellyfish"); });
  web.onNotFound([]() { web.sendHeader("Location", "http://192.168.4.1/"); web.send(302, "text/plain", ""); }); web.begin();
}

/* ───────── what it is doing ───────── */
Mode mode = CONNECTING;
float modeAt = 0, springAt = -9, springFrom = 0, nextTick = 0; int awakeKind = 0;
Slip slip; String printLines[12]; int nPrint = 0;
void go(Mode m, float t) { mode = m; modeAt = t; if (m == ARRIVE) { slip = seen.first; buzz(15); } }
const float HELD_X = 74, HELD_Y = 18, HELD_BW = 92, HOLD_FULL = 2.7f, COL = 126;
void prepPrint() {   // the slip as it comes out: its heading wrapped to the paper, its lines, its code
  nPrint = 0; String all[6] = {slip.say, slip.wish[0], slip.wish[1], slip.wish[2], slip.wish[3], slip.code};
  for (int a = 0; a < 6 && nPrint < 12; a++) { String r = all[a]; r.trim(); while (r.length() && nPrint < 12) { int cut = (int)r.length() <= 12 ? (int)r.length() : r.lastIndexOf(' ', 12); if (cut <= 0) cut = min((int)r.length(), 12);
      printLines[nPrint++] = r.substring(0, cut); r = r.substring(cut); r.trim(); } }
}
float ease(float k) { k = fminf(1, fmaxf(0, k)); return k < 0.5f ? 4 * k * k * k : 1 - powf(-2 * k + 2, 3) / 2; }
void counts() {
  if (!seen.waiting && !seen.printing) return;
  String s = seen.waiting ? String(seen.waiting) + " waiting" : String(""); if (seen.printing) s += String(s.length() ? "  " : "") + String(seen.printing) + " printing";
  text(MONO, s.c_str(), W - 10 - textW(MONO, s.c_str(), 0), 15, INK, 0.5f, 0);
}

void setup() {
  pinMode(PIN_POWER, OUTPUT); digitalWrite(PIN_POWER, HIGH);
  pinMode(KEY_A, INPUT_PULLUP); pinMode(KEY_BOOT, INPUT_PULLUP); if (NG_BUZZ >= 0) { pinMode(NG_BUZZ, OUTPUT); digitalWrite(NG_BUZZ, LOW); }
  pinMode(TP_RST, OUTPUT); digitalWrite(TP_RST, LOW); delay(20); digitalWrite(TP_RST, HIGH); delay(100);
  Wire.begin(TP_SDA, TP_SCL);
  tpWrite(0xFE, 0xFF);   // never asleep, so every read is answered
  tpWrite(0xFB, 0);      // no reset after a touch with no gesture
  tpWrite(0xFC, 0);      // nor after a long hold
  g->begin(); FB = g->getFramebuffer(); pinMode(PIN_BL, OUTPUT); analogWrite(PIN_BL, 255);
  randomSeed(esp_random()); sceneStartMs = millis();
  for (int i = 0; i < 30; i++) snow[i] = {(float)random(W), (float)random(H), i % 4 ? 0.45f + random(40) / 100.0f : 0.9f + random(50) / 100.0f, 0.12f + random(100) / 400.0f, random(628) / 100.0f};
  loadCfg(); lock = xSemaphoreCreateMutex();
  /* the ESP32 keeps the last Wi-Fi it joined and quietly rejoins it at start, fighting the choice below: that memory is wiped,
     and reconnecting is left to join() alone */
  WiFi.persistent(false); WiFi.setHostname("novel-touch"); WiFi.mode(WIFI_STA); WiFi.disconnect(false, true); WiFi.setAutoReconnect(false); WiFi.setSleep(false);
  /* Australia's channels, 1 to 13 (the chip's default can leave 12 and 13 unseen), and any security a router offers */
  { wifi_country_t cc; memset(&cc, 0, sizeof cc); memcpy(cc.cc, "AU", 3); cc.schan = 1; cc.nchan = 13; cc.max_tx_power = 20; cc.policy = WIFI_COUNTRY_POLICY_MANUAL; esp_wifi_set_country(&cc); }
  WiFi.setMinSecurity(WIFI_AUTH_WEP);
  WiFi.onEvent([](WiFiEvent_t e, WiFiEventInfo_t info) { if (e == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) lastReason = info.wifi_sta_disconnected.reason; });
  bool keyHeld = digitalRead(KEY_A) == LOW;   // the side button held while it is switched on: setup, and only then
  xTaskCreatePinnedToCore(netTask, "net", 16384, NULL, 1, NULL, 0);
  if (keyHeld || !nNets) startSetup(0);   // only with no Wi-Fi at all; a missing printer is said on the screen instead
  else go(CONNECTING, 0);
}

unsigned long downAt = 0; bool down = false; float lastT = 0, bl = 255, bootAt = -1;
bool printAwaiting = false;
/* the hidden menu: a hold shows the code; a hold on the code asks for three numbers; then settings, set-up, and turning the Pi off.
   No aiming: a tap moves to the next, a hold chooses */
int sel = 0, digits[3], nDig = 0, curDig = 0, wrongs = 0; bool holdFired = false; unsigned long lastTouchMs = 0; float menuAt = 0; String offSaid;
String autoPrintJob = ""; unsigned long jobSeenAt = 0; bool autoPrintFired = false;
uint8_t thumbBits[12 * 160]; int thumbW = 0, thumbH = 0; String thumbFor;   // the waiting print, small, one bit a dot
float fleeAt = -100.0f, fleeX = 0, fleeY = 0; bool qrWasVisible = false; unsigned long wifiReadyAt = 0;
void loop() {
  float t = millis() / 1000.0f, dt = fminf(0.05f, fmaxf(0.001f, t - lastT)); lastT = t; float k = t - modeAt;
  if (setupOn) { dns.processNextRequest(); web.handleClient(); if (mode != SETUP) go(SETUP, t); }

  /* what the server last said */
  bool fresh = false; xSemaphoreTake(lock, portMAX_DELAY); if (net.ver != seen.ver) { seen = net; fresh = true; } xSemaphoreGive(lock);
  bool has = seen.first.job.length() > 0;
  if (fresh && has) {
    if (seen.first.job != autoPrintJob) { autoPrintJob = seen.first.job; jobSeenAt = millis(); autoPrintFired = false; }
  } else if (!has) { autoPrintJob = ""; autoPrintFired = false; }
  if (fresh && has && (mode == HELD || mode == ARRIVE)) slip = seen.first;

  /* A print animation is only a confirmation after the site accepts the action.
     If it fails, leave the job visible and allow the automatic attempt to retry. */
  if (printAwaiting && actionFinished && !actionPending) {
    actionFinished = false;
    printAwaiting = false;
    if (actCode == 200) {
      if (mode != PRINTING) { prepPrint(); go(PRINTING, t); }
    } else {
      autoPrintFired = false;
      jobSeenAt = millis() - 20000UL; // retry after a short pause, not in a tight loop
      if (mode == PRINTING) go(HELD, t);
    }
  }

  /* touch: the screen or the side button, both the same; a press, or a hold */
  bool now = touched() || digitalRead(KEY_A) == LOW, tap = false, press = false; float held = 0;
  if (now && !down) {
    down = true; press = true; downAt = millis(); fleeAt = t;
    /* A little creature startled by a finger: dart away, then cautiously drift back. */
    fleeX = (J.x < W * 0.5f ? -1.0f : 1.0f) * (42.0f + random(30));
    fleeY = (J.y < H * 0.5f ? -1.0f : 1.0f) * (18.0f + random(22));
  }
  if (down) held = (millis() - downAt) / 1000.0f;
  if (!now && down) { down = false; tap = held < 0.45f; }
  bool hold = false; if (down && held > 0.9f && !holdFired) { holdFired = true; hold = true; buzz(20); } if (!down) holdFired = false;
  if (press) lastTouchMs = millis();
  /* BOOT held: a ring fills; at three seconds, setup */
  if (digitalRead(KEY_BOOT) == LOW && !setupOn) { if (bootAt < 0) bootAt = t; if (t - bootAt > 3) { bootAt = -1; startSetup(t); } } else bootAt = -1;

  /* the camera eases to where it is meant to be, and a hand holds it */
  float e = 1 - expf(-dt * 2.6f); cam.x += (camT.x - cam.x) * e; cam.y += (camT.y - cam.y) * e; cam.z += (camT.z - cam.z) * e;
  float hand = cam.z - 1; cam.x += sinf(t * 0.9f) * 0.25f * hand; cam.y += sinf(t * 0.7f) * 0.2f * hand;
  J.tp += dt * J.rate; J.cue = false; J.glow = 0; J.run = -1; J.jit = 0; J.len = 1; J.look = sinf(t * 0.37f) * 0.6f; J.eye = 0; J.rate = 1; if (mode != HELD) J.sq = 0;
  float blT = 255; bool draw = true;

  if (hold && (mode == ASLEEP || mode == AWAKE || mode == QUIET || mode == CONNECTING || (mode == HELD && !cfgTouch))) { go(QRUP, t); menuAt = t; hold = false; }
  bool menuMode = mode == QRUP || mode == CODE || mode == MENU || mode == SETS || mode == LINK || mode == INFO || mode == OFFQ;
  if (menuMode) { J.a = 0.22f; J.x = W / 2 + sinf(t * 0.2f) * 60; J.y = 70 + sinf(t * 0.3f) * 20; J.bw = 50; J.rate = 0.5f; camT = {W / 2, H / 2, 1}; if (press || hold) menuAt = t; }
  switch (mode) {
    case QRUP:   // a minute of the code to scan; a hold asks for the numbers
      if (hold) { nDig = 0; curDig = 0; go(CODE, t); } else if (t - menuAt > 60) go(ASLEEP, t);
      break;
    case CODE:   // three numbers: a tap counts on, a hold keeps it
      if (tap) curDig = (curDig + 1) % 10;
      if (hold) { digits[nDig++] = curDig; curDig = 0;
        if (nDig == 3) { String got = String(digits[0]) + digits[1] + digits[2]; nDig = 0;
          if (got == NG_CODE) { wrongs = 0; sel = 0; go(MENU, t); } else if (++wrongs >= 3) { wrongs = 0; go(ASLEEP, t); } else buzz(60); } }
      if (t - menuAt > 40) go(ASLEEP, t);
      break;
    case MENU:   // settings, set-up, turn the Pi off, back
      if (tap) sel = (sel + 1) % 4;
      if (hold) { if (sel == 0) { sel = 0; go(SETS, t); } else if (sel == 1) { sel = 0; go(LINK, t); } else if (sel == 2) { sel = 0; offSaid = ""; go(OFFQ, t); } else go(ASLEEP, t); }
      if (t - menuAt > 40) go(ASLEEP, t);
      break;
    case SETS:   // each held to change it, kept
      if (tap) sel = (sel + 1) % 4;
      if (hold) { if (sel == 0) { cfgSleep = !cfgSleep; prefs.putBool("slp", cfgSleep); } else if (sel == 1) { cfgScene = (cfgScene + 1) % 3; prefs.putInt("scn", cfgScene); } else if (sel == 2) { cfgTouch = !cfgTouch; prefs.putBool("tch", cfgTouch); } else { sel = 0; go(MENU, t); } }
      if (t - menuAt > 40) go(ASLEEP, t);
      break;
    case LINK:   // the screen's own Wi-Fi setup, or what it is linked to
      if (tap) sel = (sel + 1) % 3;
      if (hold) { if (sel == 0) startSetup(t); else if (sel == 1) go(INFO, t); else { sel = 1; go(MENU, t); } }
      if (t - menuAt > 40) go(ASLEEP, t);
      break;
    case INFO:   // a hold, or half a minute, and back
      if (hold || t - menuAt > 30) { sel = 1; go(LINK, t); }
      break;
    case OFFQ:   // turn the printer's Pi off: no, or yes; then what the site said
      if (offSaid.length()) { if (actionFinished && !actionPending) { actionFinished = false; offSaid = actCode == 200 ? "the printer is turning off" : String("not sent (") + actCode + ")"; menuAt = t; } if (t - menuAt > 8) go(ASLEEP, t); break; }
      if (tap) sel = (sel + 1) % 2;
      if (hold) { if (sel == 1) { offSaid = "asking..."; ask("off", "off"); } else { sel = 2; go(MENU, t); } }
      if (t - menuAt > 40) go(ASLEEP, t);
      break;
    case CONNECTING:   // a small jellyfish, asleep, until the Wi-Fi is joined and the site answers
      J.a = 0.86f + 0.08f * sinf(t * 0.8f); J.x = W / 2 + sinf(t * 0.27f) * 54; J.y = 58 + sinf(t * 0.61f) * 18; J.bw = 56 + 5 * sinf(t * 0.4f); J.eye = 2; J.rate = 0.6f; J.look = sinf(t * 0.33f); camT = {W / 2, H / 2, 1};
      if (WiFi.status() == WL_CONNECTED && netErr != 1) go(has && !autoPrintFired ? ARRIVE : AWAKE, t);   // it never opens setup by itself here: it keeps looking, and says what for
      break;
    case SETUP: J.a = 0; camT = {W / 2, H / 2, 1}; if (t - setupAt > 600) ESP.restart();
      { static bool let = false; if (digitalRead(KEY_BOOT) == HIGH) let = true; else if (let && t - setupAt > 1) { delay(50); ESP.restart(); } }   // BOOT let go, then pressed again: leave setup, nothing changed
      break;
    case ASLEEP:       // continuous ambient swim: never switch the creature off
      {
        float ux = t * 0.34f, uy = t * 0.57f;
        J.a = 0.82f + 0.10f * sinf(t * 0.71f);
        J.x = W * 0.50f + sinf(ux) * 62 + sinf(t * 0.17f) * 17;
        J.y = 72 + sinf(uy) * 28 + cosf(t * 0.23f) * 12;
        J.bw = 52 + 12 * (0.5f + 0.5f * sinf(t * 0.42f));
        J.eye = 0; J.rate = 0.62f; J.look = sinf(t * 0.31f) * 0.8f;
        J.glow = 0.25f + 0.25f * sinf(t * 1.1f);
        J.len = 0.86f + 0.16f * sinf(t * 0.38f);
        /* Ambient performance: scale changes, a close inspection, a slow turn, a clean exit and re-entry. */
        { float act = fmodf(t * 0.021f, 1.0f);
          float baseX = J.x, baseY = J.y;
          if (act > 0.15f && act < 0.23f) {
            float q = sinf((act - 0.15f) / 0.08f * PI);
            J.bw += 36.0f * q; J.y -= 13.0f * q; J.eye = 3;
            camT = {baseX, baseY + 18.0f, 1.0f + 0.58f * q};
          } else if (act > 0.31f && act < 0.40f) {
            float q = sinf((act - 0.31f) / 0.09f * PI);
            J.x += 48.0f * q; J.y -= 34.0f * q; J.len = 0.70f + 0.20f * q; J.look = q;
          } else if (act > 0.43f && act < 0.57f) {
            float q = sinf((act - 0.43f) / 0.14f * PI);
            J.x += sinf(q * PI) * 28.0f; J.y += q * 8.0f; J.eye = q > 0.4f ? 3 : 0;
          } else if (act > 0.62f && act < 0.68f) {
            float q = ease((act - 0.62f) / 0.06f);
            J.x = baseX + (W + 95.0f - baseX) * q;
            J.y = baseY - 18.0f * sinf(q * PI);
            J.a *= 1.0f - 0.94f * q; J.eye = 3;
          } else if (act >= 0.68f && act < 0.75f) {
            float q = ease((act - 0.68f) / 0.07f);
            J.x = -75.0f + (baseX + 75.0f) * q;
            J.y = baseY + sinf(q * PI) * 22.0f;
            J.a = fmaxf(J.a, 0.18f + 0.72f * q); J.eye = 3;
          } else if (act > 0.80f && act < 0.88f) {
            float q = sinf((act - 0.80f) / 0.08f * PI);
            J.bw *= 1.0f - 0.42f * q; J.y += 18.0f * q; J.len = 0.82f + 0.20f * q;
          }
          /* The creature's path always keeps moving, even while the camera settles. */
          if (!(act > 0.15f && act < 0.23f)) camT = {W / 2 + sinf(t * 0.16f) * 7, H / 2 + sinf(t * 0.19f) * 4, 1.0f + 0.05f * sinf(t * 0.21f)};
        }
        if (has) go(ARRIVE, t);
        else if (press) { awakeKind = (awakeKind + 1) % 3; go(AWAKE, t); }
      }
      break;
    case AWAKE: {      // playful QR-time swim; the creature never blinks out between loops
      if (has && !autoPrintFired) { go(ARRIVE, t); break; }
      float u = t * 0.55f;
      J.a = 0.88f + 0.08f * sinf(t * 0.9f);
      J.bw = 58 + 14 * (0.5f + 0.5f * sinf(t * 0.5f));
      if (awakeKind == 0) { J.x = 110 + cosf(u) * 78; J.y = 65 + sinf(u * 1.8f) * 30; camT = {W / 2, H / 2, 1}; }
      else if (awakeKind == 1) { J.x = 40 + (sinf(u * 0.7f) + 1) * 105; J.y = 42 + sinf(u * 1.2f) * 20; camT = {W / 2, H / 2, 1}; }
      else { J.x = 70 + sinf(u) * 35; J.y = 84 + sinf(u * 1.4f) * 58; camT = {W / 2, H / 2, 1}; }
      J.look = sinf(u * 0.7f);
      /* It startles, darts, and then floats back into the current. */
      if (t - fleeAt < 1.5f) { float f = 1.0f - fmaxf(0, t - fleeAt) / 1.5f; J.x += fleeX * f; J.y += fleeY * f; J.jit = 1.2f * f; J.rate = 1.8f + f; J.eye = 3; }
      if (k > 10) go(ASLEEP, t);
      break; }
    case ARRIVE:       // something to print: it swims up, the camera goes close to its eye, then draws back
      if (!has) { go(ASLEEP, t); break; }
      J.a = 1; J.x = HELD_X; J.bw = HELD_BW; J.y = 200 - ease(k / 1.8f) * (200 - HELD_Y); J.rate = 1.8f;
      if (k > 1.8f && k < 3.4f) camT = {HELD_X, HELD_Y + HELD_BW * 0.3f, 2.4f}; else camT = {W / 2, H / 2, 1};
      if (k > 4.4f) go(HELD, t);
      break;
    case HELD: {
      if (!has && !printAwaiting && !actionPending) { go(ASLEEP, t); break; }
      J.a = 1; J.x = HELD_X + sinf(t * 0.7f) * 4; J.y = HELD_Y + sinf(t * 1.1f) * 3; J.bw = HELD_BW + sinf(t * 0.9f) * 4; J.cue = true; J.glow = 0.5f + 0.5f * sinf(t * 2.4f); J.look = sinf(t * 0.8f); camT = {W / 2, H / 2, 1};
      float sk = t - springAt; J.sq = sk < 0.9f ? springFrom * expf(-5 * sk) * cosf(14 * sk) : 0;   // let go early: it springs back
      if (printAwaiting || actionPending) { /* wait for the site's response before changing the scene */ }
      else if (cfgTouch && down && held > 0.45f) { go(SQUISH, t); nextTick = 1 / 3.0f; nParts = 0; }
      else if (cfgTouch && tap) { autoPrintFired = true; printAwaiting = true; buzz(30); ask(slip.job, "print"); prepPrint(); go(PRINTING, t); }
      else if (NG_AUTOPRINT > 0 && !autoPrintFired && slip.job.length() && slip.job == autoPrintJob && millis() - jobSeenAt >= NG_AUTOPRINT * 1000UL) {
        autoPrintFired = true; printAwaiting = true; buzz(30); ask(slip.job, "print"); prepPrint(); go(PRINTING, t);
      }
      break; }
    case SQUISH: {     // held: squeezed slowly flatter, shaking harder, beads pressed out, eyes shut tight; full, it pops
      float q = fminf(1, (held - 0.45f) / HOLD_FULL); stepParts(0, dt);
      J.a = 1; J.x = HELD_X; J.y = HELD_Y; J.bw = HELD_BW; J.sq = q * q * (3 - 2 * q); J.jit = 0.4f + q * q * 4.5f; J.len = 1 - 0.55f * q; J.eye = q > 0.3f ? 1 : 3; J.rate = 1 + 3 * q;
      if (q >= nextTick && nextTick < 1) { buzz(10); nextTick += 1 / 3.0f; }
      if (q > 0.3f && random(100) < 18) { Part p = {}; p.kind = 0; p.s = 1.0f; p.x = HELD_X + (random(2) ? 1 : -1) * bW * 1.05f; p.y = bBot - 2; p.vx = (p.x > HELD_X ? 1 : -1) * (40 + random(60)); p.vy = -20 - random(40); if (nParts > 40) nParts = 0; addPart(p); }
      if (!down) { springFrom = J.sq; springAt = t; nParts = 0; go(HELD, t); }
      else if (q >= 1) { buzz(70); burstFrom(HELD_X, bTop + (bBot - bTop) * 0.5f); ask(slip.job, "squash"); go(BURST, t); }
      break; }
    case BURST:        // three seconds: the pop, the pieces, the current, the fish
      J.a = k < 0.55f ? 0.15f * (1 - k / 0.55f) : 0.18f + 0.10f * sinf(t * 1.4f);
      J.x = W + 25 - fminf(k, 1.4f) * 30; J.y = 24 + sinf(t * 1.7f) * 8; J.bw = 28; J.eye = 3; J.rate = 2.0f;
      shake = k < 0.35f ? (1 - k / 0.35f) * 4 : 0; stepParts(k, dt);
      if (k > 3.4f) { nParts = 0; fish.on = false; current = 0; go(QUIET, t); }
      break;
    case PRINTING:     // the slip feeds out of the bell as the printer prints it, is torn off, and the jellyfish jets away with the light
      if ((printAwaiting || actionPending) && k > 0.9f) { modeAt = t - 0.9f; k = 0.9f; }   // the paper waits at its first lines until the site has it
      J.a = 1; J.x = HELD_X; J.bw = HELD_BW; J.eye = 3; J.rate = 2.4f; J.run = fmodf(k * 0.9f, 1.2f); J.y = HELD_Y;
      if (k > 4.1f) { float f = k - 4.1f; J.y = HELD_Y - f * f * 220 - f * 30; J.sq = -0.3f * fabsf(sinf(f * 9)); }
      if (k > 5.4f) go(QUIET, t);
      break;
    case QUIET:        // drift back into view after the playful exit; never leave a dead screen
      J.a = 0.76f + 0.10f * sinf(t * 0.8f); J.x = W / 2 + sinf(t * 0.29f) * 68; J.y = 76 + sinf(t * 0.61f) * 32;
      J.bw = 48 + 10 * (0.5f + 0.5f * sinf(t * 0.4f)); J.eye = 0; J.rate = 0.68f; J.look = sinf(t * 0.4f); J.len = 0.9f + 0.1f * sinf(t * 0.3f);
      camT = {W / 2 + sinf(t * 0.18f) * 5, H / 2 + sinf(t * 0.2f) * 4, 1};
      if (has && !autoPrintFired) go(ARRIVE, t); else if (k > 3.0f) go(ASLEEP, t);
      break;
  }

  if (mode != SETUP && t - fleeAt >= 0 && t - fleeAt < 1.35f && mode != HELD && mode != SQUISH && mode != PRINTING && mode != BURST) {
    float f = 1.0f - (t - fleeAt) / 1.35f; J.x += fleeX * f; J.y += fleeY * f; J.jit += 1.8f * f; J.rate += 1.4f * f; J.eye = 3;
  }
  if (cfgSleep && !has && (mode == ASLEEP || mode == AWAKE || mode == QUIET) && millis() - lastTouchMs > 120000UL) { draw = false; blT = 0; }
  if (bootAt >= 0) { blT = 255; draw = true; }
  bl += (blT - bl) * fminf(1, dt * 4); analogWrite(PIN_BL, (int)bl);
  if (!draw && bl < 2) { delay(60); return; }

  /* the frame */
  shx = shake ? rnd1() * shake : 0; shy = shake ? rnd1() * shake : 0; if (mode != BURST) shake = 0;
  drawSea(t, dt);
  jellyRollEnabled = (mode == ASLEEP || mode == AWAKE || mode == CONNECTING || mode == QUIET);
  if (mode != SETUP) drawJelly(t);
  /* The public QR stays hidden until Wi-Fi is joined and the station is active.
     Each 30-second cycle gives it a different gentle entrance; once in place it stays still for scanning. */
  bool wifiReady = WiFi.status() == WL_CONNECTED && netErr != 1 && mode != CONNECTING && mode != SETUP;
  if (!wifiReady) wifiReadyAt = 0; else if (!wifiReadyAt) wifiReadyAt = millis();
  unsigned long qrCycleMs = wifiReadyAt ? (millis() - wifiReadyAt) % 30000UL : 30000UL;
  bool qrVisible = wifiReady && !has && qrCycleMs < 10000UL && !menuMode;
  if (qrVisible) {
    float entrance = fminf(1.0f, qrCycleMs / 1200.0f);
    float slide = 1.0f - ease(entrance);
    unsigned long cycleNo = millis() / 30000UL;
    int qx = 236 + (cycleNo % 3 == 0 ? 0 : cycleNo % 3 == 1 ? -7 : 7);
    int qy = 82 + (cycleNo % 2 ? -5 : 5);
    /* The QR is nudged by the passing current during entrance, then stays nearly still to scan. */
    float qrNudge = qrCycleMs < 2200UL ? sinf(t * 2.2f) * 5.0f : sinf(t * 0.55f) * 1.5f;
    qx += (int)(slide * 82.0f + qrNudge);
    qy += (int)(qrCycleMs < 2200UL ? sinf(t * 1.7f) * 3.0f : sinf(t * 0.42f) * 1.0f);
    drawQR(QR_SITE, 25, qx, qy, 4);
    if (qrCycleMs > 1200UL) text(MONO, "novel.global", qx - textW(MONO, "novel.global", 1) / 2, qy + 66, INK, 0.6f, 1);
  }
  qrWasVisible = qrVisible;
  if (mode == BURST) { drawParts(k); if (k < 0.4f) { float r = k / 0.4f; ring(PX(HELD_X), PY(48), 24 + r * 80, 1.2f, INK, 0.55f * (1 - r)); } }
  if (mode == SQUISH) drawParts(0);

  /* what waits: the print itself, small, at the right; its words beside it; its code */
  if (thumbFor != slip.job) { thumbFor = slip.job; thumbW = thumbH = 0; int c1 = slip.img.indexOf(','), c2 = c1 < 0 ? -1 : slip.img.indexOf(',', c1 + 1);
    if (c2 > 0) { int w2 = slip.img.substring(0, c1).toInt(), h2 = slip.img.substring(c1 + 1, c2).toInt(); size_t got = 0; String b = slip.img.substring(c2 + 1);
      if (w2 > 0 && w2 <= 96 && h2 > 0 && h2 <= 160 && mbedtls_base64_decode(thumbBits, sizeof(thumbBits), &got, (const unsigned char *)b.c_str(), b.length()) == 0 && got >= (size_t)((w2 + 7) / 8 * h2)) { thumbW = w2; thumbH = h2; } } }
  if (mode == HELD || mode == SQUISH || (mode == ARRIVE && k > 3.6f)) {
    float a = mode == ARRIVE ? fminf(1, (k - 3.6f) * 1.5f) : 1;
    int tw = thumbW ? thumbW + 12 : 0;
    if (thumbW && a > 0.5f) { int tx = W - thumbW - 8, ty = 8, th = min(thumbH, H - 16); g->fillRect(tx - 3, ty - 3, thumbW + 6, th + 6, PAPER); g->drawBitmap(tx, ty, thumbBits, thumbW, th, PAPERINK); }
    if (slip.say.length() || slip.life.length()) para(HEAD, slip.say.length() ? slip.say : slip.life, COL, 32, W - COL - 8 - tw, 21, 5, INK, a);
    text(MONO, slip.code.c_str(), COL, H - 12, INK, 0.75f * a, 2);
  }
  if (mode == PRINTING && !slip.paper) {  // a line for the radios: no paper, its signal going out from the bell in thin rings
    for (int i = 0; i < 3; i++) { float r = fmodf(k * 34 + i * 28, 84); ring(PX(HELD_X), PY(HELD_Y + 26), 34 + r, 1, INK, 0.5f * (1 - r / 84)); }
    text(MONO, k < 4.1f ? "to the radios" : "sent", COL, 84, INK, 0.7f, 1);
    text(MONO, slip.code.c_str(), COL, H - 12, INK, 0.75f, 2);
  }
  if (mode == PRINTING && slip.paper) {  // the paper, out of the bell's foot: each line appears as it is printed
    float feed = ease(k / 3.6f), Lp = feed * 150, y0 = bBot + 4, fall = k > 4.1f ? k - 4.1f : 0, pw = 86, x0 = HELD_X - pw / 2;
    y0 += fall * fall * 300; if (y0 < H) {
      g->fillRect(x0, y0, pw, Lp, PAPER);
      if (thumbW) { int th = min((int)Lp - 8, thumbH); if (th > 0) g->drawBitmap(HELD_X - thumbW / 2, y0 + 4, thumbBits, thumbW, th, PAPERINK); }
      else for (int i = 0; i < nPrint; i++) { float ly = y0 + 14 + i * 12; if (ly + 3 < y0 + Lp && ly < H + 10) text(MONO, printLines[i].c_str(), x0 + 6, ly, PAPERINK, 1, 0); }
      if (k > 3.6f && k < 4.3f) for (int i = 0; i < 12; i++) g->fillTriangle(x0 + i * 7.2f, y0, x0 + i * 7.2f + 7.2f, y0, x0 + i * 7.2f + 3.6f, y0 + 3, SEA);   // torn off
    }
    String lab = printAwaiting || actionPending ? String("sending") + String("...").substring(0, (int)fmodf(t * 2, 4)) : k < 4.1f ? String("printing") + String("...").substring(0, (int)fmodf(k * 2, 4)) : String("printed");
    text(MONO, lab.c_str(), COL, 84, INK, 0.7f, 1);
    text(MONO, slip.code.c_str(), COL, H - 12, INK, 0.75f, 2);
  }
  if (menuMode) {
    const char *how = "tap: next   hold: choose";
    if (mode == QRUP) { drawQR(QR_SITE, 25, W / 2, H / 2 - 6, 5); text(MONO, "novel.global", W / 2 - textW(MONO, "novel.global", 1) / 2, H - 8, INK, 0.6f, 1); }
    else if (mode == CODE) {
      for (int i = 0; i < 3; i++) { int bx = W / 2 - 66 + i * 46; ring(bx + 20, 70, 20, 1.2f, INK, i == nDig ? 0.95f : 0.35f);
        String d = i < nDig ? String("*") : i == nDig ? String(curDig) : String(""); text(HEAD, d.c_str(), bx + 20 - textW(HEAD, d.c_str(), 0) / 2, 78, INK, 1, 0); }
      text(MONO, "tap: count on   hold: keep it", W / 2 - textW(MONO, "tap: count on   hold: keep it", 0) / 2, 130, INK, 0.55f, 0);
    } else if (mode == INFO) {
      String ip = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : String("not on Wi-Fi");
      String L[6] = { String("Wi-Fi  ") + (WiFi.status() == WL_CONNECTED ? WiFi.SSID() + "  " + WiFi.RSSI() + " dBm" : String("none")), String("address  ") + ip, String("printer  ") + (printerId.length() ? printerId : String("not set")), String("site  ") + host, String("sketch  ") + NG_VERSION, String(netErr == 0 ? "linked: the site answers" : netErr == 3 ? "the screen's token was refused" : "the site does not answer") };
      for (int i = 0; i < 6; i++) text(MONO, L[i].c_str(), 18, 30 + i * 20, INK, i == 5 ? 0.95f : 0.75f, 0);
      text(MONO, "hold: back", 18, H - 8, INK, 0.45f, 0);
    } else {
      const char *M[4] = {"Settings", "Set-up", "Turn the printer off", "Back"};
      String S3[4] = { String("Sleep when idle: ") + (cfgSleep ? "on" : "off"), String("Sky: ") + (cfgScene == 0 ? "day and night" : cfgScene == 1 ? "always day" : "always night"), String("Touch prints: ") + (cfgTouch ? "on" : "off"), "Back" };
      const char *K[3] = {"Wi-Fi", "Linked", "Back"}; const char *Q[2] = {"No", "Yes, turn it off"};
      int n = mode == MENU ? 4 : mode == SETS ? 4 : mode == LINK ? 3 : 2;
      if (mode == OFFQ) text(BODY, offSaid.length() ? offSaid.c_str() : "Turn the printer's Pi off?", 24, 34, INK, 0.9f, 0);
      for (int i = 0; i < n; i++) { const char *s = mode == MENU ? M[i] : mode == SETS ? S3[i].c_str() : mode == LINK ? K[i] : Q[i]; int y = (mode == OFFQ ? 66 : 36) + i * 28;
        if (mode == OFFQ && offSaid.length()) break;
        if (i == sel) dotA(14, y - 5, 3, INK, 0.95f); text(BODY, s, 26, y, INK, i == sel ? 1.0f : 0.5f, 0); }
      if (!(mode == OFFQ && offSaid.length())) text(MONO, how, W - 12 - textW(MONO, how, 0), H - 8, INK, 0.45f, 0);
    }
  }
  if (mode == SETUP) {   // power-on only: join from a phone by scanning, or by name and password
    text(HEAD, "NOVEL TOUCH", 16, 46, INK, 1, 0);
    text(BODY, apPass.c_str(), 16, 84, INK, 0.95f, 1);
    text(MONO, "192.168.4.1", 16, 112, INK, 0.5f, 0);
    text(MONO, NG_VERSION, 16, 160, INK, 0.3f, 0);
    drawQR(QR_JOIN, 29, 246, H / 2, 4);
  }
  if (bootAt >= 0) {   // BOOT held: a ring of dots filling round the word
    float f = fminf(1, (t - bootAt) / 3); for (int i = 0; i < 40; i++) { float u = -PI / 2 + i / 40.0f * 2 * PI; dotA(W / 2 + cosf(u) * 22, H / 2 + sinf(u) * 22, 1.1f, INK, i < f * 40 ? 0.95f : 0.2f); }
    text(MONO, "setup", W / 2 - textW(MONO, "setup", 1) / 2, H / 2 + 4, INK, 0.8f, 1);
  }
  if (mode == CONNECTING && k > 6) {   // still looking: what for, and how to change it
    String trying, whyNot; xSemaphoreTake(lock, portMAX_DELAY); trying = ::trying; whyNot = ::whyNot; xSemaphoreGive(lock);
    String l1 = !printerId.length() ? String("no printer set") : WiFi.status() != WL_CONNECTED ? String("joining ") + (trying.length() ? trying : nNets ? nets[0] : String("a Wi-Fi")) + (tryRssi ? String("  ") + tryRssi + " dBm" : String("")) : String("on ") + WiFi.SSID() + String(", asking ") + host;
    text(MONO, l1.c_str(), W / 2 - textW(MONO, l1.c_str(), 0) / 2, 128, INK, 0.6f, 0);
    if (whyNot.length() && WiFi.status() != WL_CONNECTED) text(MONO, whyNot.c_str(), W / 2 - textW(MONO, whyNot.c_str(), 0) / 2, 112, INK, 0.75f, 0);
    text(MONO, "sketch " NG_VERSION, 8, H - 6, INK, 0.3f, 0);
    if (k > 20 || !printerId.length()) text(MONO, "hold BOOT for setup", W / 2 - textW(MONO, "hold BOOT for setup", 0) / 2, 146, INK, 0.4f, 0);
  }
  if (mode == HELD && actCode && actCode != 200) {   // the site did not take it: it is tried again by itself
    String r = String("trying again (") + actCode + ")"; text(MONO, r.c_str(), W - 10 - textW(MONO, r.c_str(), 0), H - 6, INK, actCode == 200 ? 0.45f : 0.85f, 0);
  }
  if (mode != SETUP && mode != ASLEEP) counts();
  if (mode != SETUP && netErr) { ring(W - 12, H - 12, 3.5f, 1, INK, 0.55f); if (netErr == 3) text(MONO, "?", W - 28, H - 8, INK, 0.7f, 0); }
  g->flush();
  delay(4);
}

/* ───────── the type, drawn ahead: Archivo Narrow SemiBold at 21 and 14 px, Departure Mono at 11 px (SIL Open Font License 1.1) ───────── */
const uint8_t HEAD_bits[] PROGMEM = {
  0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,
  245,0,0,0,13,212,0,255,80,15,245,15,245,95,240,255,85,255,15,245,95,240,239,68,
  254,12,242,47,192,158,0,233,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,52,247,0,0,174,8,243,0,0,
  219,11,224,0,1,248,14,176,0,255,255,255,255,0,173,250,207,186,0,11,208,159,16,0,
  31,144,220,0,13,223,237,254,208,15,255,255,255,240,0,175,7,242,0,0,220,10,224,0,
  2,249,13,176,0,5,246,31,128,0,0,2,240,0,0,0,2,240,0,0,0,91,251,129,
  0,6,255,255,255,80,13,250,242,191,208,15,248,240,57,144,12,254,241,0,0,3,239,255,
  180,0,0,23,255,255,112,2,35,243,207,224,15,248,240,111,224,12,252,245,223,176,4,239,
  255,253,32,0,40,247,64,0,0,2,240,0,0,0,2,240,0,0,1,174,234,16,0,12,
  128,0,175,255,249,0,6,208,0,14,247,127,224,1,228,0,0,255,85,255,0,154,0,0,
  14,247,127,224,62,32,0,0,175,255,249,11,112,0,0,1,174,234,21,208,1,0,0,0,
  0,1,212,77,255,178,0,0,0,138,30,248,191,160,0,0,46,36,255,22,254,0,0,10,
  112,95,240,95,240,0,4,192,3,255,55,254,0,0,212,0,14,254,255,144,0,121,0,0,
  60,254,161,0,1,158,251,48,0,0,0,191,254,254,16,0,0,63,243,63,244,0,0,5,
  255,17,255,64,0,0,63,243,127,224,0,0,0,207,255,245,0,0,0,46,255,245,0,0,
  0,29,255,255,65,255,64,8,252,26,254,79,243,0,223,96,29,255,254,0,14,246,0,47,
  255,144,0,191,193,2,255,245,0,4,255,254,255,255,209,0,3,190,253,130,207,176,15,245,
  15,245,15,245,14,244,12,242,9,224,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,1,218,0,9,243,0,63,176,0,175,96,2,255,32,6,253,0,10,249,0,12,
  247,0,14,246,0,15,245,0,14,246,0,13,247,0,10,249,0,6,253,0,2,255,32,0,
  175,96,0,63,176,0,9,243,0,1,218,95,64,0,12,209,0,6,248,0,1,254,16,0,
  191,112,0,127,176,0,79,224,0,47,242,0,31,244,0,15,245,0,31,244,0,47,242,0,
  79,240,0,127,176,0,191,112,1,254,16,6,248,0,12,209,0,95,64,0,0,111,16,5,
  199,246,209,59,255,232,19,191,254,129,93,127,109,16,6,241,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,
  80,0,0,0,255,80,0,0,0,255,80,0,0,0,255,80,0,0,0,255,80,0,15,255,
  255,255,255,13,221,255,237,221,0,0,255,80,0,0,0,255,80,0,0,0,255,80,0,0,
  0,255,80,0,13,212,0,255,80,15,245,0,63,16,8,176,0,214,0,13,221,221,15,255,
  255,0,0,0,0,0,0,0,0,0,0,0,0,13,212,0,255,80,15,245,0,0,250,0,
  63,112,6,244,0,159,32,11,224,0,235,0,47,128,5,245,0,143,32,11,224,0,236,0,
  47,144,5,246,0,143,48,10,240,0,220,0,0,2,174,252,64,0,13,255,239,243,0,111,
  225,10,250,0,175,128,4,255,0,223,96,1,255,32,239,80,0,255,64,255,80,0,255,80,
  255,80,0,255,80,239,80,0,255,64,223,96,1,255,32,175,128,4,255,0,111,225,10,250,
  0,13,255,239,243,0,2,174,252,64,0,0,41,245,0,0,140,255,245,0,0,255,255,245,
  0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,
  245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,221,
  223,254,221,208,255,255,255,255,240,3,174,236,80,0,63,254,239,246,0,191,193,10,253,0,
  239,96,6,255,0,239,80,7,254,0,0,0,29,249,0,0,0,143,242,0,0,6,255,112,
  0,0,95,250,0,0,3,239,177,0,0,29,252,16,0,0,127,226,0,0,0,223,237,221,
  221,0,255,255,255,255,0,4,190,235,64,0,79,254,239,245,0,207,176,11,252,0,255,96,
  6,255,0,68,16,6,254,0,0,0,45,248,0,0,31,255,144,0,0,29,239,228,0,0,
  0,8,254,16,85,32,1,255,64,239,96,1,255,64,191,193,8,255,32,79,254,239,248,0,
  4,190,252,96,0,0,10,247,0,0,0,14,243,0,0,0,79,224,213,0,0,159,131,245,
  0,1,239,41,245,0,5,251,14,245,0,11,243,15,245,0,79,176,15,245,0,191,48,15,
  245,0,255,255,255,255,240,221,221,223,254,208,0,0,15,245,0,0,0,15,245,0,0,0,
  15,245,0,95,255,255,251,0,95,253,221,217,0,95,240,0,0,0,95,240,0,0,0,95,
  240,0,0,0,95,247,238,145,0,95,255,239,249,0,78,243,8,255,16,0,16,2,255,64,
  102,32,0,255,80,239,112,2,255,48,175,209,9,254,0,46,255,239,246,0,3,174,252,80,
  0,1,158,236,80,0,11,255,239,244,0,79,209,11,251,0,159,128,6,254,0,207,96,1,
  51,0,239,123,253,112,0,255,255,239,248,0,255,209,9,254,16,255,112,2,255,64,223,80,
  0,255,80,191,112,2,255,48,111,209,9,254,0,12,255,239,245,0,1,157,252,80,0,255,
  255,255,255,0,221,221,222,253,0,0,0,11,245,0,0,0,95,176,0,0,0,207,64,0,
  0,4,252,0,0,0,11,245,0,0,0,47,241,0,0,0,111,176,0,0,0,175,96,0,
  0,0,239,48,0,0,2,255,16,0,0,4,255,0,0,0,5,255,0,0,0,4,190,235,
  64,0,79,254,239,244,0,207,176,27,252,0,239,96,6,254,0,239,96,6,254,0,159,194,
  44,248,0,27,255,255,177,0,45,254,239,210,0,175,176,11,250,0,239,96,6,254,0,239,
  96,6,254,0,207,176,11,251,0,79,254,239,244,0,4,206,236,64,0,2,174,235,48,0,
  46,255,239,227,0,175,209,9,251,0,239,112,2,255,16,255,80,0,255,48,239,112,3,255,
  64,175,211,27,255,80,46,255,254,255,80,3,172,179,255,64,21,80,1,255,32,79,241,3,
  254,0,31,246,9,250,0,9,255,239,227,0,0,141,236,64,0,255,80,15,245,0,221,64,
  0,0,0,0,0,0,0,0,0,0,0,0,0,221,64,15,245,0,255,80,15,245,0,255,
  80,13,212,0,0,0,0,0,0,0,0,0,0,0,0,0,13,212,0,255,80,15,245,0,
  63,16,8,176,0,214,0,0,0,0,0,52,0,0,0,58,248,0,0,59,255,229,0,75,
  255,232,16,11,255,231,16,0,15,248,16,0,0,15,254,129,0,0,3,175,255,146,0,0,
  3,175,255,146,0,0,2,175,248,0,0,0,2,151,0,0,0,0,0,15,255,255,255,255,
  13,221,221,221,221,0,0,0,0,0,0,0,0,0,0,13,221,221,221,221,15,255,255,255,
  255,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,15,231,16,0,0,12,255,231,
  16,0,0,76,255,231,16,0,0,75,255,229,0,0,0,61,248,0,0,5,207,247,0,5,
  207,254,113,6,223,253,96,0,15,253,96,0,0,13,96,0,0,0,0,0,0,0,0,0,
  58,239,215,0,3,239,254,255,160,11,252,16,127,242,14,246,0,31,245,9,163,0,47,243,
  0,0,0,191,208,0,0,10,254,48,0,0,143,227,0,0,0,239,112,0,0,0,238,80,
  0,0,0,0,0,0,0,0,221,64,0,0,0,255,80,0,0,0,255,80,0,0,0,22,
  190,254,200,32,0,0,0,61,255,237,239,255,112,0,0,63,232,32,0,22,223,96,0,13,
  210,1,174,235,49,191,32,5,243,0,207,254,253,17,232,0,186,0,63,244,63,244,8,192,
  14,80,4,204,0,255,80,94,1,242,0,0,0,15,245,3,240,47,0,0,57,188,255,80,
  62,2,240,0,95,255,255,245,4,208,47,16,13,251,49,255,80,138,0,243,0,255,96,111,
  246,46,80,13,112,12,255,238,223,255,176,0,141,0,44,253,68,238,145,0,2,249,0,0,
  0,0,0,0,0,7,251,64,0,2,48,0,0,0,8,255,254,223,248,0,0,0,0,2,
  140,239,217,32,0,0,0,0,143,249,0,0,0,0,13,255,224,0,0,0,3,252,239,64,
  0,0,0,143,154,249,0,0,0,13,245,111,224,0,0,3,254,17,255,64,0,0,143,160,
  11,249,0,0,13,246,0,127,224,0,3,255,16,2,255,64,0,143,255,255,255,249,0,13,
  255,255,255,255,224,3,255,49,17,20,255,64,143,192,0,0,13,249,13,247,0,0,0,143,
  224,15,255,255,254,180,0,15,254,221,223,255,80,15,245,0,1,207,192,15,245,0,0,111,
  224,15,245,0,0,127,192,15,245,0,4,239,80,15,255,255,255,229,0,15,254,221,223,250,
  0,15,245,0,2,223,128,15,245,0,0,127,208,15,245,0,0,111,224,15,245,0,2,223,
  192,15,254,221,223,255,64,15,255,255,254,179,0,0,2,157,254,182,0,0,78,255,223,255,
  160,1,239,177,0,127,246,7,254,16,0,10,252,11,248,0,0,6,254,14,246,0,0,1,
  51,15,245,0,0,0,0,15,245,0,0,0,0,14,246,0,0,1,34,11,249,0,0,6,
  254,7,254,16,0,10,252,1,239,177,0,111,246,0,79,255,223,255,160,0,2,157,254,182,
  0,15,255,255,235,64,0,15,254,221,255,248,0,15,245,0,24,255,80,15,245,0,0,175,
  192,15,245,0,0,63,241,15,245,0,0,31,244,15,245,0,0,15,245,15,245,0,0,15,
  244,15,245,0,0,31,243,15,245,0,0,79,241,15,245,0,0,191,176,15,245,0,25,255,
  64,15,254,221,255,247,0,15,255,255,235,64,0,15,255,255,255,255,0,255,237,221,221,208,
  15,245,0,0,0,0,255,80,0,0,0,15,245,0,0,0,0,255,80,0,0,0,15,255,
  255,255,240,0,255,237,221,221,0,15,245,0,0,0,0,255,80,0,0,0,15,245,0,0,
  0,0,255,80,0,0,0,15,254,221,221,221,0,255,255,255,255,240,15,255,255,255,248,0,
  255,237,221,221,96,15,245,0,0,0,0,255,80,0,0,0,15,245,0,0,0,0,255,80,
  0,0,0,15,255,255,255,128,0,255,237,221,214,0,15,245,0,0,0,0,255,80,0,0,
  0,15,245,0,0,0,0,255,80,0,0,0,15,245,0,0,0,0,255,80,0,0,0,0,
  2,141,238,199,16,0,3,239,254,239,253,32,1,239,178,0,61,252,0,127,225,0,0,79,
  242,11,249,0,0,1,170,48,239,96,0,0,0,0,15,245,0,125,221,221,64,255,80,8,
  255,255,245,14,246,0,0,0,255,80,191,144,0,0,47,245,7,254,16,0,8,255,80,30,
  251,32,5,239,245,0,95,255,222,255,207,80,0,58,223,234,52,245,15,245,0,0,95,240,
  15,245,0,0,95,240,15,245,0,0,95,240,15,245,0,0,95,240,15,245,0,0,95,240,
  15,245,0,0,95,240,15,255,255,255,255,240,15,254,221,221,239,240,15,245,0,0,95,240,
  15,245,0,0,95,240,15,245,0,0,95,240,15,245,0,0,95,240,15,245,0,0,95,240,
  15,245,0,0,95,240,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,
  255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,0,0,0,95,240,0,0,
  5,255,0,0,0,95,240,0,0,5,255,0,0,0,95,240,0,0,5,255,0,0,0,95,
  240,0,0,5,255,0,0,0,95,240,136,48,5,255,15,245,0,95,240,223,178,43,253,6,
  255,255,255,96,5,206,236,80,15,245,0,0,159,226,15,245,0,5,255,80,15,245,0,46,
  248,0,15,245,1,207,192,0,15,245,9,254,32,0,15,245,95,245,0,0,15,247,239,249,
  0,0,15,255,253,255,32,0,15,255,177,223,160,0,15,253,16,111,243,0,15,245,0,13,
  251,0,15,245,0,6,255,64,15,245,0,0,223,192,15,245,0,0,111,245,15,245,0,0,
  0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,
  0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,
  0,0,0,15,247,51,51,49,15,255,255,255,248,15,255,255,255,248,15,255,192,0,8,255,
  240,15,255,241,0,11,255,240,15,254,244,0,15,239,240,15,252,247,0,63,191,240,15,249,
  251,0,127,143,240,15,245,254,0,190,95,240,15,245,207,48,235,95,240,15,245,143,99,247,
  95,240,15,245,95,166,244,95,240,15,245,31,216,241,95,240,15,245,12,251,192,95,240,15,
  245,9,254,144,95,240,15,245,5,255,80,95,240,15,245,2,255,32,95,240,15,249,0,0,
  95,240,15,255,48,0,95,240,15,255,176,0,95,240,15,255,245,0,95,240,15,253,253,0,
  95,240,15,247,255,112,95,240,15,245,143,225,95,240,15,245,30,249,95,240,15,245,6,255,
  127,240,15,245,0,207,223,240,15,245,0,79,255,240,15,245,0,11,255,240,15,245,0,2,
  255,240,15,245,0,0,159,240,0,1,140,238,216,16,0,3,239,254,239,254,48,1,223,195,
  0,44,253,16,127,225,0,0,30,247,11,249,0,0,0,159,176,239,96,0,0,6,254,15,
  245,0,0,0,95,240,255,80,0,0,5,255,14,246,0,0,0,111,224,191,144,0,0,9,
  251,7,254,16,0,1,239,96,29,252,48,2,207,209,0,62,255,238,255,227,0,0,24,222,
  237,129,0,15,255,255,236,96,0,255,237,222,255,128,15,245,0,9,255,16,255,80,0,31,
  244,15,245,0,1,255,64,255,80,0,159,225,15,254,221,239,247,0,255,255,254,197,0,15,
  245,0,0,0,0,255,80,0,0,0,15,245,0,0,0,0,255,80,0,0,0,15,245,0,
  0,0,0,255,80,0,0,0,0,1,140,238,216,16,0,3,239,254,239,254,48,1,223,195,
  0,44,253,16,127,225,0,0,30,247,11,249,0,0,0,159,176,239,96,0,0,6,254,15,
  245,0,0,0,95,240,255,80,0,0,5,254,14,246,0,0,0,111,208,191,144,0,0,9,
  251,7,254,16,0,1,239,96,29,252,48,2,207,225,0,62,255,238,255,228,0,0,24,222,
  255,243,0,0,0,0,4,255,176,0,0,0,0,5,255,160,0,0,0,0,4,136,48,255,
  255,255,236,96,0,255,237,221,239,248,0,255,80,0,8,255,16,255,80,0,1,255,64,255,
  80,0,2,255,64,255,80,0,42,254,16,255,255,255,255,245,0,255,237,222,255,80,0,255,
  80,1,255,128,0,255,80,0,175,208,0,255,80,0,63,245,0,255,80,0,12,251,0,255,
  80,0,6,255,32,255,80,0,0,239,112,0,108,238,198,0,0,143,254,239,248,0,47,247,
  0,143,242,4,255,16,1,255,64,79,247,0,2,33,0,223,253,114,0,0,3,239,255,251,
  48,0,1,124,255,255,64,0,0,2,159,252,7,114,0,0,143,240,239,112,0,6,254,10,
  254,48,2,207,160,45,255,238,255,226,0,24,206,237,146,0,255,255,255,255,255,13,221,239,
  253,221,208,0,5,255,0,0,0,0,95,240,0,0,0,5,255,0,0,0,0,95,240,0,
  0,0,5,255,0,0,0,0,95,240,0,0,0,5,255,0,0,0,0,95,240,0,0,0,
  5,255,0,0,0,0,95,240,0,0,0,5,255,0,0,0,0,95,240,0,0,255,80,0,
  5,255,0,255,80,0,5,255,0,255,80,0,5,255,0,255,80,0,5,255,0,255,80,0,
  5,255,0,255,80,0,5,255,0,255,80,0,5,255,0,255,80,0,5,255,0,255,80,0,
  5,255,0,255,80,0,5,255,0,223,128,0,8,253,0,159,228,0,78,249,0,29,255,238,
  255,209,0,1,141,255,216,16,12,251,0,0,1,255,71,255,16,0,5,254,2,255,80,0,
  10,250,0,223,144,0,14,245,0,143,224,0,79,241,0,63,243,0,143,160,0,13,248,0,
  223,96,0,9,252,2,255,16,0,4,255,39,251,0,0,0,239,107,247,0,0,0,175,207,
  242,0,0,0,95,255,192,0,0,0,31,255,128,0,0,0,11,255,48,0,12,249,0,5,
  255,192,0,31,241,159,192,0,127,255,0,4,252,5,255,16,10,254,243,0,127,144,47,244,
  0,222,191,96,10,246,0,239,112,31,201,249,0,223,32,10,250,4,249,111,176,47,224,0,
  127,208,111,99,254,5,250,0,3,255,25,243,14,242,143,112,0,14,244,207,0,191,91,244,
  0,0,191,127,192,8,248,239,0,0,8,251,249,0,95,191,192,0,0,79,255,96,2,255,
  248,0,0,1,255,243,0,14,255,80,0,0,13,254,0,0,191,241,0,4,255,112,0,11,
  251,0,191,225,0,95,243,0,47,248,0,223,144,0,8,255,39,254,16,0,1,239,190,246,
  0,0,0,111,255,192,0,0,0,13,255,80,0,0,0,63,255,160,0,0,0,207,223,244,
  0,0,5,255,44,252,0,0,29,248,4,255,96,0,143,225,0,175,225,2,255,96,0,47,
  249,10,252,0,0,8,255,36,255,80,0,0,223,128,191,192,0,5,254,16,63,245,0,13,
  247,0,10,252,0,95,225,0,2,255,80,207,112,0,0,159,197,253,0,0,0,47,254,246,
  0,0,0,8,255,208,0,0,0,1,255,96,0,0,0,0,255,80,0,0,0,0,255,80,
  0,0,0,0,255,80,0,0,0,0,255,80,0,0,0,0,255,80,0,0,15,255,255,255,
  255,0,221,221,222,255,160,0,0,0,175,242,0,0,0,79,248,0,0,0,13,254,16,0,
  0,7,255,112,0,0,1,239,208,0,0,0,175,245,0,0,0,79,252,0,0,0,12,255,
  64,0,0,6,255,176,0,0,1,239,243,0,0,0,159,255,221,221,221,15,255,255,255,255,
  240,255,255,15,254,208,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,
  245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,254,208,255,255,
  220,0,10,240,0,143,48,5,246,0,47,144,0,235,0,11,224,0,143,32,5,245,0,47,
  128,0,235,0,12,224,0,159,32,6,244,0,63,112,0,250,143,255,86,223,245,0,255,80,
  15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,
  80,15,245,0,255,80,15,245,0,255,86,223,245,143,255,80,0,159,241,0,0,1,239,247,
  0,0,6,251,253,0,0,12,244,207,64,0,47,208,127,144,0,143,128,31,225,0,239,48,
  11,246,5,252,0,5,252,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,221,221,221,221,223,
  255,255,255,255,245,219,0,9,247,0,12,242,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,42,223,216,16,1,
  239,253,255,144,4,255,48,143,224,1,68,0,95,240,0,22,172,223,240,3,239,255,255,240,
  11,253,82,95,240,14,246,0,127,240,14,248,2,239,241,10,255,239,207,254,1,174,233,24,
  237,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,246,190,
  212,0,15,254,254,255,32,15,253,17,223,144,15,248,0,127,192,15,246,0,111,224,15,245,
  0,95,240,15,246,0,111,224,15,247,0,127,208,15,253,17,223,144,15,253,254,255,48,15,
  226,191,213,0,0,58,239,197,0,46,255,239,245,8,253,16,191,192,207,128,6,254,14,246,
  0,19,48,255,80,0,0,14,246,0,19,48,207,128,6,254,9,253,16,191,176,46,255,239,
  244,0,59,239,197,0,0,0,0,255,80,0,0,0,255,80,0,0,0,255,80,0,0,0,
  255,80,3,207,213,255,80,46,255,239,255,80,143,209,10,255,80,207,128,3,255,80,239,96,
  1,255,80,255,80,0,255,80,239,96,1,255,80,223,128,3,255,80,159,209,10,255,80,46,
  255,239,239,80,4,207,213,159,80,2,174,252,64,0,30,254,239,243,0,143,193,11,249,0,
  207,96,6,253,0,239,237,222,254,0,255,255,255,255,0,239,80,0,0,0,207,112,6,254,
  0,143,209,11,252,0,46,254,239,245,0,2,174,236,64,0,3,223,208,12,255,208,15,246,
  0,15,245,0,255,255,240,223,254,208,15,245,0,15,245,0,15,245,0,15,245,0,15,245,
  0,15,245,0,15,245,0,15,245,0,15,245,0,0,0,0,5,130,0,0,0,0,223,32,
  0,125,254,207,144,0,159,254,255,193,0,47,247,1,207,144,4,255,16,6,254,0,79,241,
  0,111,224,1,239,145,45,251,0,5,255,255,255,48,0,159,237,202,48,0,79,242,0,0,
  0,2,255,237,221,180,0,45,255,255,255,225,12,248,0,3,255,64,239,112,0,47,243,12,
  255,221,222,253,0,44,255,255,234,32,15,245,0,0,0,15,245,0,0,0,15,245,0,0,
  0,15,245,0,0,0,15,246,158,234,16,15,254,254,255,160,15,253,32,175,224,15,247,0,
  95,240,15,245,0,95,240,15,245,0,95,240,15,245,0,95,240,15,245,0,95,240,15,245,
  0,95,240,15,245,0,95,240,15,245,0,95,240,15,245,0,221,64,0,0,0,0,0,15,
  245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,
  15,245,0,15,245,0,221,64,0,0,0,0,0,15,245,0,255,80,15,245,0,255,80,15,
  245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,31,244,222,255,29,
  254,96,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,0,0,0,15,245,
  0,191,160,15,245,7,253,16,15,245,63,243,0,15,245,223,112,0,15,253,253,0,0,15,
  255,255,64,0,15,254,175,192,0,15,246,30,245,0,15,245,8,253,0,15,245,1,255,96,
  15,245,0,159,208,15,245,15,245,15,245,15,245,15,245,15,245,15,245,15,245,15,245,15,
  245,15,245,15,245,15,245,15,245,15,245,15,225,174,213,59,237,80,0,255,222,255,238,239,
  254,16,15,252,20,255,193,79,244,0,255,96,15,246,0,255,80,15,245,0,255,80,15,245,
  0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,
  245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,254,25,
  238,145,0,255,223,239,250,0,255,210,10,254,0,255,112,5,255,0,255,80,5,255,0,255,
  80,5,255,0,255,80,5,255,0,255,80,5,255,0,255,80,5,255,0,255,80,5,255,0,
  255,80,5,255,0,2,174,252,80,0,46,255,239,245,0,143,209,10,253,0,207,128,3,255,
  32,239,96,1,255,64,255,80,0,255,80,239,96,1,255,64,207,128,3,255,32,143,209,10,
  253,0,46,255,239,245,0,2,174,252,80,0,254,43,253,64,0,255,223,239,243,0,255,209,
  29,249,0,255,112,7,253,0,255,96,6,254,0,255,80,5,255,0,255,96,6,254,0,255,
  112,7,252,0,255,209,29,248,0,255,255,239,242,0,255,123,253,64,0,255,80,0,0,0,
  255,80,0,0,0,255,80,0,0,0,255,80,0,0,0,4,207,196,175,80,47,255,238,239,
  80,159,209,10,255,80,223,128,3,255,80,239,96,1,255,80,255,80,0,255,80,239,96,1,
  255,80,207,128,3,255,80,143,209,10,255,80,46,255,238,255,80,4,207,196,255,80,0,0,
  0,255,80,0,0,0,255,80,0,0,0,255,80,0,0,0,255,80,255,61,224,255,239,208,
  255,209,0,255,112,0,255,80,0,255,80,0,255,80,0,255,80,0,255,80,0,255,80,0,
  255,80,0,7,207,234,32,8,255,239,253,0,239,128,63,244,14,248,0,85,32,175,253,131,
  0,1,142,255,252,32,0,4,159,251,9,147,0,127,240,223,160,9,253,7,255,238,255,112,
  6,206,236,96,0,175,80,0,207,80,0,239,80,15,255,255,13,255,237,0,255,80,0,255,
  80,0,255,80,0,255,80,0,255,80,0,255,80,0,239,112,0,207,253,0,60,253,15,245,
  0,95,240,15,245,0,95,240,15,245,0,95,240,15,245,0,95,240,15,245,0,95,240,15,
  245,0,95,240,15,245,0,95,240,15,246,0,127,240,14,251,19,239,240,10,255,255,207,240,
  1,174,233,31,240,191,160,0,79,224,111,224,0,159,160,47,244,0,223,96,12,248,2,255,
  16,8,252,6,252,0,3,255,26,247,0,0,223,94,242,0,0,159,159,208,0,0,79,255,
  128,0,0,14,255,64,0,0,10,254,0,0,223,112,10,253,0,63,224,159,160,13,255,16,
  111,160,111,224,31,255,64,175,112,47,242,79,207,112,223,48,13,246,127,143,161,254,0,9,
  249,175,79,212,251,0,6,251,206,13,247,247,0,2,253,235,10,252,243,0,0,223,248,7,
  255,224,0,0,175,245,4,255,176,0,0,111,242,1,255,112,0,111,243,0,191,160,12,250,
  4,255,32,4,255,60,248,0,0,191,223,225,0,0,63,255,96,0,0,13,255,32,0,0,
  95,255,160,0,0,223,159,243,0,7,252,11,251,0,30,245,3,255,80,159,192,0,191,208,
  175,176,0,63,241,95,241,0,127,192,30,245,0,175,128,10,250,0,239,48,5,254,3,254,
  0,1,255,70,250,0,0,191,138,246,0,0,111,189,242,0,0,31,239,192,0,0,12,255,
  128,0,0,7,255,64,0,0,5,253,0,0,0,28,247,0,0,12,239,209,0,0,14,251,
  32,0,0,15,255,255,255,0,221,221,255,176,0,0,79,243,0,0,11,250,0,0,4,255,
  32,0,0,191,144,0,0,79,226,0,0,11,248,0,0,4,254,16,0,0,191,237,221,208,
  15,255,255,255,0,0,140,224,9,255,224,14,249,0,15,245,0,15,245,0,15,245,0,15,
  245,0,15,245,0,111,242,8,252,96,7,253,128,0,63,243,0,15,245,0,15,245,0,15,
  245,0,15,245,0,14,249,0,10,255,224,1,141,224,255,80,15,245,0,255,80,15,245,0,
  255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,0,255,80,15,245,
  0,255,80,15,245,0,255,80,15,245,0,255,80,125,162,0,127,253,0,4,255,64,0,255,
  80,0,255,80,0,255,80,0,255,80,0,255,80,0,207,144,0,59,232,0,92,247,0,223,
  128,0,255,80,0,255,80,0,255,80,0,255,80,4,255,64,127,254,16,125,179,0,0,0,
  0,0,1,2,172,165,16,44,14,255,255,254,255,13,81,55,206,196,2,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,
};
const Glyph HEAD_g[] PROGMEM = {
  {0,0,0,0,0,5},
  {0,5,14,0,-14,5},
  {70,7,14,0,-14,7},
  {168,10,14,0,-14,10},
  {308,10,16,0,-15,10},
  {468,15,14,0,-14,15},
  {678,13,14,0,-14,12},
  {860,4,14,0,-14,4},
  {916,6,19,0,-15,6},
  {1030,6,19,0,-15,6},
  {1144,7,14,0,-14,7},
  {1242,10,11,0,-11,10},
  {1352,5,6,0,-3,5},
  {1382,6,6,0,-6,6},
  {1418,5,3,0,-3,5},
  {1433,5,16,0,-15,5},
  {1513,10,14,0,-14,10},
  {1653,10,14,0,-14,10},
  {1793,10,14,0,-14,10},
  {1933,10,14,0,-14,10},
  {2073,10,14,0,-14,10},
  {2213,10,14,0,-14,10},
  {2353,10,14,0,-14,10},
  {2493,10,14,0,-14,10},
  {2633,10,14,0,-14,10},
  {2773,10,14,0,-14,10},
  {2913,5,11,0,-11,5},
  {2968,5,14,0,-11,5},
  {3038,10,12,0,-11,10},
  {3158,10,8,0,-8,10},
  {3238,10,12,0,-11,10},
  {3358,10,14,0,-14,10},
  {3498,17,18,0,-14,17},
  {3804,13,14,0,-14,12},
  {3986,12,14,0,-14,12},
  {4154,12,14,0,-14,12},
  {4322,12,14,0,-14,12},
  {4490,11,14,0,-14,11},
  {4644,11,14,0,-14,11},
  {4798,13,14,0,-14,13},
  {4980,12,14,0,-14,12},
  {5148,5,14,0,-14,5},
  {5218,9,14,0,-14,9},
  {5344,12,14,0,-14,12},
  {5512,10,14,0,-14,10},
  {5652,14,14,0,-14,14},
  {5848,12,14,0,-14,12},
  {6016,13,14,0,-14,13},
  {6198,11,14,0,-14,11},
  {6352,13,17,0,-14,13},
  {6573,12,14,0,-14,12},
  {6741,11,14,0,-14,11},
  {6895,11,14,0,-14,11},
  {7049,12,14,0,-14,12},
  {7217,12,14,0,-14,11},
  {7385,17,14,0,-14,16},
  {7623,12,14,0,-14,11},
  {7791,12,14,0,-14,11},
  {7959,11,14,0,-14,11},
  {8113,5,19,0,-15,5},
  {8208,5,16,0,-15,5},
  {8288,5,19,0,-15,5},
  {8383,10,14,0,-14,9},
  {8523,10,3,0,0,10},
  {8553,5,15,0,-15,0},
  {8628,10,11,0,-11,10},
  {8738,10,15,0,-15,10},
  {8888,9,11,0,-11,9},
  {8987,10,15,0,-15,10},
  {9137,10,11,0,-11,10},
  {9247,6,15,0,-15,5},
  {9337,11,17,0,-13,10},
  {9524,10,15,0,-15,10},
  {9674,5,15,0,-15,5},
  {9749,5,19,-1,-15,4},
  {9844,10,15,0,-15,9},
  {9994,4,15,0,-15,4},
  {10054,15,11,0,-11,15},
  {10219,10,11,0,-11,10},
  {10329,10,11,0,-11,10},
  {10439,10,15,0,-11,10},
  {10589,10,15,0,-11,10},
  {10739,6,11,0,-11,6},
  {10805,9,11,0,-11,9},
  {10904,6,14,0,-14,5},
  {10988,10,11,0,-11,10},
  {11098,10,11,0,-11,9},
  {11208,14,11,0,-11,13},
  {11362,10,11,0,-11,9},
  {11472,10,15,0,-11,9},
  {11622,9,11,0,-11,9},
  {11721,6,19,0,-15,6},
  {11835,5,19,0,-15,5},
  {11930,6,19,0,-15,6},
  {12044,10,8,0,-8,10},
};
const Font HEAD = { HEAD_bits, HEAD_g, 29, 22 };
const uint8_t BODY_bits[] PROGMEM = {
  15,128,15,128,15,128,15,128,15,128,15,128,15,128,0,0,5,48,15,128,15,136,240,248,
  143,14,119,224,197,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,130,
  224,1,244,108,0,95,25,176,255,255,255,3,233,95,80,63,71,225,15,255,255,240,188,79,
  148,12,115,243,0,227,126,0,0,13,0,0,94,80,9,255,250,14,157,156,13,238,32,2,
  175,246,3,29,206,13,141,174,7,255,247,0,46,32,0,13,0,5,221,80,5,192,0,220,
  205,0,211,0,15,137,240,105,0,0,234,174,29,16,0,8,255,136,112,0,0,2,34,196,
  205,144,0,0,148,219,79,96,0,42,15,144,248,0,10,32,221,143,96,4,128,5,222,177,
  0,60,250,16,0,12,216,246,0,0,233,31,112,0,12,217,226,0,0,159,245,0,0,95,
  255,57,224,13,160,205,204,0,233,2,255,128,11,231,127,247,0,43,238,155,243,15,128,248,
  14,112,197,0,0,0,0,0,0,0,0,0,0,30,16,10,160,2,245,0,127,16,11,192,
  0,218,0,14,144,0,249,0,13,160,0,188,0,7,241,0,47,80,0,170,0,2,225,136,
  0,47,48,11,144,7,240,4,244,2,246,1,248,1,248,2,246,4,244,7,241,11,160,47,
  48,137,0,36,179,6,222,193,125,236,18,75,48,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,15,128,0,0,248,0,0,15,128,0,17,249,17,15,255,255,240,68,250,
  68,0,15,128,0,0,248,0,5,48,248,8,80,193,1,17,15,255,4,68,0,0,0,0,
  0,0,5,48,248,0,241,3,224,6,176,8,128,11,96,14,48,31,16,77,0,122,0,151,
  0,197,0,113,0,1,174,213,0,127,123,225,12,176,63,80,233,1,247,15,128,15,128,248,
  0,248,14,144,31,112,203,3,245,7,247,190,16,26,237,80,0,92,128,0,255,248,0,2,
  47,128,0,0,248,0,0,15,128,0,0,248,0,0,15,128,0,0,248,0,5,95,181,80,
  255,255,255,1,174,232,0,174,122,245,14,144,31,128,149,3,246,0,0,190,16,0,143,80,
  0,127,128,0,63,144,0,11,230,85,48,255,255,248,2,191,216,0,206,106,245,12,112,31,
  128,0,22,244,0,14,247,0,0,74,243,5,48,31,112,233,1,247,10,230,175,48,26,237,
  96,0,12,176,0,1,247,192,0,127,79,0,13,152,240,4,242,143,0,201,25,241,15,255,
  255,240,68,74,244,0,0,143,0,0,8,240,8,255,255,32,143,85,81,8,240,0,0,143,
  207,144,8,247,159,64,19,1,247,7,64,15,128,218,2,246,8,247,191,16,25,237,64,0,
  174,211,7,230,220,11,160,88,14,206,227,15,229,234,15,160,173,14,128,143,12,160,173,8,
  231,233,1,174,177,15,255,255,240,85,88,249,0,0,189,16,0,79,80,0,11,192,0,2,
  246,0,0,126,16,0,11,176,0,0,217,0,0,14,128,0,2,191,231,0,190,106,245,15,
  144,31,128,204,38,245,2,255,250,0,174,89,243,14,144,31,112,233,1,247,10,231,175,48,
  43,254,112,1,174,212,0,175,170,225,14,242,47,80,255,17,247,12,246,111,128,79,252,248,
  1,51,31,112,127,18,244,4,249,174,16,8,237,80,15,128,5,48,0,0,0,0,0,0,
  0,0,5,48,15,128,15,128,5,48,0,0,0,0,0,0,0,0,5,48,15,128,8,80,
  12,16,0,0,3,80,0,42,247,1,143,230,0,238,113,0,15,195,0,0,93,250,32,0,
  7,239,80,0,1,135,0,0,0,0,17,17,17,15,255,255,240,68,68,68,1,17,17,16,
  255,255,255,4,68,68,64,0,0,0,7,16,0,0,253,96,0,2,175,196,0,0,59,247,
  0,0,127,128,6,223,145,12,251,48,0,196,0,0,0,0,0,0,26,238,112,10,248,175,
  64,235,1,248,8,80,47,112,0,11,242,0,7,246,0,0,235,0,0,10,80,0,0,83,
  0,0,15,128,0,0,75,238,199,0,0,111,199,106,251,0,47,162,190,183,246,8,241,142,
  143,125,176,203,4,80,248,174,14,144,0,15,136,240,248,4,223,248,158,14,144,221,95,138,
  192,219,14,200,251,230,9,225,143,152,233,0,79,128,0,0,0,0,159,182,106,0,0,0,
  108,238,160,0,0,31,242,0,0,6,239,112,0,0,171,203,0,0,30,120,241,0,5,243,
  63,96,0,157,0,234,0,14,216,141,224,3,255,255,255,64,142,16,1,249,13,160,0,11,
  224,15,255,254,128,15,181,106,246,15,128,1,248,15,145,23,243,15,255,255,80,15,164,74,
  226,15,128,1,247,15,128,1,248,15,181,107,244,15,255,253,96,0,92,253,112,3,252,106,
  247,10,225,0,205,13,160,0,106,15,128,0,0,15,128,0,0,13,160,0,106,10,225,0,
  205,3,252,106,247,0,92,253,112,15,255,251,48,15,181,125,243,15,128,1,234,15,128,0,
  173,15,128,0,143,15,128,0,158,15,128,0,189,15,128,2,249,15,181,125,226,15,255,251,
  48,15,255,255,240,15,181,85,80,15,128,0,0,15,145,17,16,15,255,255,128,15,164,68,
  32,15,128,0,0,15,128,0,0,15,181,85,80,15,255,255,240,15,255,255,128,251,85,83,
  15,128,0,0,249,17,16,15,255,255,0,250,68,64,15,128,0,0,248,0,0,15,128,0,
  0,248,0,0,0,59,238,179,0,63,215,125,226,10,225,0,47,112,218,0,17,33,15,144,
  95,255,128,249,1,68,248,13,160,0,47,128,174,16,6,248,3,253,120,239,128,4,207,215,
  136,15,128,0,248,15,128,0,248,15,128,0,248,15,145,17,248,15,255,255,248,15,164,68,
  248,15,128,0,248,15,128,0,248,15,128,0,248,15,128,0,248,15,128,248,15,128,248,15,
  128,248,15,128,248,15,128,248,0,0,143,0,0,143,0,0,143,0,0,143,0,0,143,0,
  0,143,4,32,143,15,144,159,12,232,236,3,206,195,15,128,3,249,0,248,0,221,16,15,
  128,159,48,0,248,79,112,0,15,158,245,0,0,255,221,192,0,15,227,111,80,0,249,0,
  236,0,15,128,7,245,0,248,0,30,192,15,128,0,0,248,0,0,15,128,0,0,248,0,
  0,15,128,0,0,248,0,0,15,128,0,0,248,0,0,15,201,153,64,255,255,248,15,248,
  0,111,240,15,251,0,159,240,15,222,0,204,240,15,175,48,249,240,15,141,99,200,240,15,
  138,167,152,240,15,135,218,104,240,15,131,252,56,240,15,128,254,8,240,15,128,204,8,240,
  15,192,0,248,15,244,0,248,15,252,0,248,15,191,80,248,15,139,192,248,15,132,245,248,
  15,128,188,248,15,128,63,248,15,128,11,248,15,128,3,248,0,59,238,179,0,46,215,125,
  226,9,225,0,30,144,218,0,0,173,15,144,0,9,240,249,0,0,159,13,160,0,10,208,
  158,16,1,233,2,237,119,222,32,3,190,235,48,15,255,253,80,15,181,108,243,15,128,2,
  247,15,128,1,248,15,145,41,244,15,255,255,128,15,164,65,0,15,128,0,0,15,128,0,
  0,15,128,0,0,0,59,238,179,0,46,215,125,226,9,225,0,30,144,218,0,0,173,15,
  144,0,9,240,249,0,0,158,13,160,0,10,208,158,16,1,233,2,237,119,222,32,3,190,
  255,64,0,0,5,251,0,0,0,4,132,15,255,254,162,0,251,85,126,176,15,128,0,158,
  0,249,17,61,192,15,255,255,227,0,250,68,251,0,15,128,10,241,0,248,0,95,96,15,
  128,0,235,0,248,0,8,241,1,158,252,80,11,231,107,244,15,144,1,231,13,230,16,0,
  4,239,234,32,0,23,207,226,3,32,6,247,14,160,1,247,10,248,107,243,1,158,252,80,
  15,255,255,255,5,91,245,85,0,8,240,0,0,8,240,0,0,8,240,0,0,8,240,0,
  0,8,240,0,0,8,240,0,0,8,240,0,0,8,240,0,15,128,0,248,15,128,0,248,
  15,128,0,248,15,128,0,248,15,128,0,248,15,128,0,248,15,128,0,248,13,160,2,246,
  8,248,108,226,1,141,236,64,205,0,1,247,143,32,5,243,63,96,10,208,14,160,14,144,
  10,224,63,64,5,244,126,16,1,248,187,0,0,189,246,0,0,127,242,0,0,63,208,0,
  219,0,143,128,11,170,224,11,251,0,231,111,32,235,224,47,67,245,31,127,21,241,15,132,
  226,244,124,0,203,107,14,122,144,8,233,144,185,214,0,95,198,8,207,48,2,255,48,95,
  224,0,14,240,3,251,0,127,80,9,242,13,208,47,128,6,246,174,16,0,206,247,0,0,
  95,224,0,0,143,243,0,2,249,235,0,9,225,127,64,63,112,30,192,190,16,7,245,190,
  16,5,244,79,96,12,192,11,208,79,64,4,245,172,0,0,205,245,0,0,79,192,0,0,
  15,128,0,0,15,128,0,0,15,128,0,0,15,128,0,15,255,255,224,85,89,248,0,0,
  190,16,0,63,128,0,10,225,0,2,247,0,0,158,16,0,47,112,0,9,246,85,80,239,
  255,255,15,251,15,180,15,128,15,128,15,128,15,128,15,128,15,128,15,128,15,128,15,128,
  15,128,15,180,15,251,227,0,182,0,137,0,91,0,62,0,15,32,12,64,10,112,7,160,
  4,192,2,240,0,113,47,248,1,95,128,0,248,0,15,128,0,248,0,15,128,0,248,0,
  15,128,0,248,0,15,128,0,248,0,15,128,21,248,2,255,128,0,207,16,2,254,96,7,
  217,192,12,132,242,47,64,231,142,0,156,0,0,0,0,0,0,0,0,0,0,0,0,17,
  17,17,31,255,255,246,68,68,68,17,16,62,64,35,0,0,0,0,0,0,0,0,0,0,
  0,0,1,190,212,0,143,108,208,5,96,159,0,43,239,240,12,231,175,0,249,10,240,13,
  215,255,96,110,196,222,15,128,0,0,248,0,0,15,128,0,0,250,206,96,15,247,191,32,
  250,2,246,15,128,15,128,248,0,248,15,160,47,96,255,123,242,15,125,230,0,26,236,32,
  158,126,176,218,9,224,248,0,16,248,0,16,218,9,224,158,126,176,27,236,32,0,0,248,
  0,0,15,128,0,0,248,1,190,143,128,159,123,248,13,160,47,128,248,0,248,15,128,15,
  128,218,2,248,9,247,191,128,27,233,184,0,158,214,0,143,121,243,13,161,47,112,255,255,
  248,15,164,68,32,218,1,231,8,247,159,48,25,237,96,2,238,7,247,8,240,15,255,11,
  245,8,240,8,240,8,240,8,240,8,240,8,240,0,0,1,231,0,125,253,193,4,250,110,
  144,8,241,9,224,5,246,44,208,0,207,254,80,6,247,65,0,7,248,85,48,4,255,255,
  244,13,160,3,248,14,214,88,246,6,239,254,144,15,128,0,0,248,0,0,15,128,0,0,
  250,206,96,15,247,221,0,250,9,240,15,128,143,0,248,8,240,15,128,143,0,248,8,240,
  15,128,143,0,248,5,48,0,15,128,248,15,128,248,15,128,248,15,128,248,0,248,0,83,
  0,0,0,248,0,248,0,248,0,248,0,248,0,248,0,248,0,248,0,248,39,247,127,193,
  15,128,0,0,248,0,0,15,128,0,0,248,9,225,15,132,245,0,249,218,0,15,239,80,
  0,255,219,0,15,149,243,0,248,13,176,15,128,127,48,248,15,128,248,15,128,248,15,128,
  248,15,128,248,15,128,248,15,124,230,158,177,15,231,223,169,245,15,160,159,18,247,15,128,
  143,1,247,15,128,143,1,247,15,128,143,1,247,15,128,143,1,247,15,128,143,1,247,15,
  124,229,0,254,125,208,15,160,159,0,248,8,240,15,128,143,0,248,8,240,15,128,143,0,
  248,8,240,1,174,213,0,159,123,242,13,160,47,96,248,0,248,15,128,15,128,218,2,246,
  9,247,191,32,26,237,80,15,125,230,0,255,123,242,15,160,47,96,248,0,248,15,128,15,
  128,250,2,246,15,247,191,32,251,206,112,15,128,0,0,248,0,0,15,128,0,0,27,232,
  200,9,247,191,128,218,2,248,15,128,15,128,248,0,248,13,160,47,128,159,123,248,1,206,
  143,128,0,0,248,0,0,15,128,0,0,248,15,142,112,255,131,15,160,0,248,0,15,128,
  0,248,0,15,128,0,248,0,3,206,211,13,214,237,15,176,87,9,253,129,0,91,251,9,
  80,175,13,214,221,3,206,196,5,240,7,240,15,255,11,245,8,240,8,240,8,240,8,240,
  7,246,2,222,15,128,143,0,248,8,240,15,128,143,0,248,8,240,15,128,143,0,249,10,
  240,13,232,239,0,110,198,240,204,0,142,8,241,12,160,63,81,246,0,233,95,32,10,216,
  208,0,111,200,0,2,255,64,0,12,240,0,218,7,244,12,154,208,175,113,245,111,29,218,
  79,35,245,250,199,224,14,159,95,154,0,189,210,253,112,8,250,14,244,0,95,112,191,16,
  143,48,219,1,234,111,48,7,253,160,0,30,242,0,2,255,80,0,157,204,0,47,101,245,
  10,224,13,192,111,48,47,81,247,6,241,12,176,157,0,143,28,144,3,245,245,0,14,191,
  16,0,175,192,0,5,248,0,0,79,48,0,92,208,0,14,211,0,0,255,255,240,85,127,
  144,0,159,32,2,249,0,9,242,0,47,144,0,159,117,80,255,255,240,4,215,0,221,48,
  15,128,0,248,0,15,128,0,248,0,95,96,15,160,0,127,96,0,248,0,15,128,0,248,
  0,14,211,0,93,112,248,15,128,248,15,128,248,15,128,248,15,128,248,15,128,248,15,128,
  248,15,128,234,0,9,246,0,15,128,0,248,0,15,128,0,248,0,13,177,0,77,128,13,
  195,0,248,0,15,128,0,248,0,143,112,14,177,0,0,0,0,8,253,82,160,197,142,251,
  1,0,19,0,0,0,0,0,0,0,0,0,0,0,
};
const Glyph BODY_g[] PROGMEM = {
  {0,0,0,0,0,3},
  {0,4,10,0,-10,4},
  {40,5,10,0,-10,5},
  {90,7,10,0,-10,6},
  {160,6,11,0,-11,6},
  {226,11,10,0,-10,10},
  {336,9,10,0,-10,8},
  {426,3,10,0,-10,3},
  {456,5,14,0,-11,4},
  {526,4,14,0,-11,4},
  {582,5,10,0,-10,4},
  {632,7,8,0,-8,7},
  {688,3,4,0,-2,3},
  {700,4,6,0,-6,4},
  {724,3,2,0,-2,3},
  {730,4,12,0,-11,3},
  {778,7,10,0,-10,6},
  {848,7,10,0,-10,6},
  {918,7,10,0,-10,6},
  {988,7,10,0,-10,6},
  {1058,7,10,0,-10,6},
  {1128,7,10,0,-10,6},
  {1198,6,10,0,-10,6},
  {1258,7,10,0,-10,6},
  {1328,7,10,0,-10,6},
  {1398,7,10,0,-10,6},
  {1468,4,8,0,-8,4},
  {1500,4,10,0,-8,4},
  {1540,7,9,0,-8,7},
  {1603,7,7,0,-7,7},
  {1652,7,9,0,-8,7},
  {1715,7,10,0,-10,7},
  {1785,11,13,0,-10,11},
  {1928,9,10,0,-10,8},
  {2018,8,10,0,-10,8},
  {2098,8,10,0,-10,8},
  {2178,8,10,0,-10,8},
  {2258,8,10,0,-10,8},
  {2338,7,10,0,-10,7},
  {2408,9,10,0,-10,9},
  {2498,8,10,0,-10,8},
  {2578,3,10,0,-10,3},
  {2608,6,10,0,-10,6},
  {2668,9,10,0,-10,8},
  {2758,7,10,0,-10,7},
  {2828,10,10,0,-10,10},
  {2928,8,10,0,-10,8},
  {3008,9,10,0,-10,9},
  {3098,8,10,0,-10,8},
  {3178,9,12,0,-10,9},
  {3286,9,10,0,-10,8},
  {3376,8,10,0,-10,8},
  {3456,8,10,0,-10,7},
  {3536,8,10,0,-10,8},
  {3616,8,10,0,-10,8},
  {3696,11,10,0,-10,11},
  {3806,8,10,0,-10,8},
  {3886,8,10,0,-10,8},
  {3966,7,10,0,-10,7},
  {4036,4,14,0,-11,4},
  {4092,4,12,0,-11,3},
  {4140,5,14,-1,-11,4},
  {4210,6,10,0,-10,6},
  {4270,7,3,0,0,6},
  {4291,3,11,0,-11,0},
  {4324,7,8,0,-8,6},
  {4380,7,11,0,-11,7},
  {4457,6,8,0,-8,6},
  {4505,7,11,0,-11,7},
  {4582,7,8,0,-8,6},
  {4638,4,11,0,-11,4},
  {4682,8,12,0,-9,7},
  {4778,7,11,0,-11,7},
  {4855,3,11,0,-11,3},
  {4888,4,14,-1,-11,3},
  {4944,7,11,0,-11,6},
  {5021,3,11,0,-11,3},
  {5054,10,8,0,-8,10},
  {5134,7,8,0,-8,7},
  {5190,7,8,0,-8,7},
  {5246,7,11,0,-8,7},
  {5323,7,11,0,-8,7},
  {5400,5,8,0,-8,4},
  {5440,6,8,0,-8,6},
  {5488,4,10,0,-10,4},
  {5528,7,8,0,-8,7},
  {5584,7,8,0,-8,6},
  {5640,9,8,0,-8,9},
  {5712,7,8,0,-8,6},
  {5768,7,11,0,-8,6},
  {5845,6,8,0,-8,6},
  {5893,5,14,0,-11,4},
  {5963,3,14,0,-11,3},
  {6005,5,14,0,-11,4},
  {6075,7,7,0,-7,7},
};
const Font BODY = { BODY_bits, BODY_g, 20, 15 };
const uint8_t MONO_bits[] PROGMEM = {
  0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,0,0,
  0,0,240,0,0,240,240,0,15,15,0,0,240,240,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,15,15,0,0,240,240,15,255,255,240,15,15,0,0,240,
  240,15,255,255,240,15,15,0,0,240,240,0,0,15,0,0,15,255,0,15,15,15,0,240,
  240,0,0,255,240,0,0,240,240,0,15,15,0,240,240,240,0,255,240,0,0,240,0,0,
  0,0,0,15,0,15,15,15,0,240,15,0,240,0,0,240,0,0,240,0,0,240,15,0,
  240,15,15,15,0,15,0,15,240,0,15,0,240,0,240,0,0,0,240,0,240,240,15,240,
  15,0,240,0,240,15,0,0,255,0,0,0,240,0,0,15,0,0,0,240,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,0,0,15,0,0,15,0,
  0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,0,240,0,0,0,
  240,0,0,0,0,0,240,0,0,0,240,0,0,0,240,0,0,15,0,0,0,240,0,0,
  15,0,0,0,240,0,0,15,0,0,15,0,0,15,0,0,0,0,0,0,0,240,0,15,
  15,15,0,15,255,0,15,15,15,0,0,240,0,0,0,0,0,0,0,0,0,0,0,0,
  0,240,0,0,15,0,0,255,255,240,0,15,0,0,0,240,0,0,0,0,0,0,240,0,
  0,15,0,0,15,0,0,0,0,0,0,15,255,0,0,0,0,0,0,0,0,0,0,0,
  0,0,240,0,0,15,0,0,0,0,240,0,0,15,0,0,15,0,0,0,240,0,0,240,
  0,0,15,0,0,15,0,0,0,240,0,0,240,0,0,15,0,0,0,0,0,0,0,255,
  240,0,240,0,240,15,0,255,0,240,240,240,15,240,15,0,240,0,240,15,0,15,0,15,
  255,0,0,15,0,0,255,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,
  15,0,0,255,255,240,0,255,240,0,240,0,240,0,0,15,0,0,15,0,0,15,0,0,
  15,0,0,15,0,0,0,255,255,240,0,255,240,0,240,0,240,0,0,15,0,0,255,0,
  0,0,15,0,0,0,240,15,0,15,0,15,255,0,0,0,255,0,0,240,240,0,240,15,
  0,240,0,240,15,0,15,0,255,255,240,0,0,15,0,0,0,240,15,255,255,0,240,0,
  0,15,0,0,0,255,255,0,0,0,15,0,0,0,240,15,0,15,0,15,255,0,0,255,
  240,0,240,0,240,15,0,0,0,255,255,0,15,0,15,0,240,0,240,15,0,15,0,15,
  255,0,15,255,255,0,0,0,240,0,0,15,0,0,15,0,0,15,0,0,15,0,0,0,
  240,0,0,15,0,0,0,255,240,0,240,0,240,15,0,15,0,15,255,0,15,0,15,0,
  240,0,240,15,0,15,0,15,255,0,0,255,240,0,240,0,240,15,0,15,0,240,0,240,
  0,255,255,0,0,0,240,15,0,15,0,15,255,0,0,15,0,0,0,240,0,0,0,0,
  0,0,0,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,0,0,0,0,0,
  0,0,15,0,0,0,240,0,0,240,0,0,0,0,0,0,0,240,0,0,240,0,0,240,
  0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,255,255,240,0,0,0,0,255,
  255,240,0,0,0,0,0,0,0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,
  0,240,0,0,240,0,0,240,0,0,15,255,0,15,0,15,0,0,0,240,0,0,240,0,
  0,240,0,0,15,0,0,0,0,0,0,15,0,0,15,255,0,15,0,15,0,0,0,240,
  0,255,15,0,240,240,240,15,15,15,0,240,240,240,0,240,240,0,0,240,0,0,240,240,
  0,240,0,240,15,0,15,0,255,255,240,15,0,15,0,240,0,240,15,0,15,0,255,255,
  0,15,0,15,0,240,0,240,15,255,240,0,240,0,240,15,0,15,0,240,0,240,15,255,
  240,0,15,255,0,15,0,15,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,
  0,240,0,255,240,0,255,255,0,15,0,15,0,240,0,240,15,0,15,0,240,0,240,15,
  0,15,0,240,0,240,15,255,240,0,255,255,240,15,0,0,0,240,0,0,15,255,240,0,
  240,0,0,15,0,0,0,240,0,0,15,255,255,0,255,255,240,15,0,0,0,240,0,0,
  15,255,240,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,15,255,0,15,0,15,
  0,240,0,0,15,0,0,0,240,15,240,15,0,15,0,240,0,240,0,255,240,0,240,0,
  240,15,0,15,0,240,0,240,15,255,255,0,240,0,240,15,0,15,0,240,0,240,15,0,
  15,0,255,255,240,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,
  240,0,15,255,255,0,0,255,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,
  0,15,0,240,0,240,0,255,240,0,240,0,240,15,0,240,0,240,240,0,15,255,0,0,
  240,15,0,15,0,240,0,240,0,240,15,0,15,0,240,0,0,15,0,0,0,240,0,0,
  15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,255,255,0,240,0,240,15,0,15,
  0,255,15,240,15,15,15,0,240,240,240,15,0,15,0,240,0,240,15,0,15,0,240,0,
  240,15,0,15,0,255,0,240,15,15,15,0,240,15,240,15,0,15,0,240,0,240,15,0,
  15,0,15,255,0,15,0,15,0,240,0,240,15,0,15,0,240,0,240,15,0,15,0,240,
  0,240,0,255,240,0,255,255,0,15,0,15,0,240,0,240,15,0,15,0,255,255,0,15,
  0,0,0,240,0,0,15,0,0,0,15,255,0,15,0,15,0,240,0,240,15,0,15,0,
  240,0,240,15,0,15,0,240,0,240,0,255,240,0,0,15,240,0,0,0,0,255,255,0,
  15,0,15,0,240,0,240,15,0,15,0,255,255,0,15,0,240,0,240,0,240,15,0,15,
  0,15,255,0,15,0,15,0,240,0,0,0,255,240,0,0,0,240,0,0,15,0,240,0,
  240,0,255,240,0,255,255,240,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,
  0,0,0,240,0,0,15,0,0,240,0,240,15,0,15,0,240,0,240,15,0,15,0,240,
  0,240,15,0,15,0,240,0,240,0,255,240,0,240,0,240,15,0,15,0,240,0,240,15,
  0,15,0,240,0,240,0,240,240,0,15,15,0,0,15,0,0,240,0,240,15,0,15,0,
  240,0,240,15,15,15,0,240,240,240,0,240,240,0,15,15,0,0,240,240,0,240,0,240,
  15,0,15,0,15,15,0,0,15,0,0,15,15,0,15,0,15,0,240,0,240,15,0,15,
  0,240,0,240,15,0,15,0,240,0,240,0,240,240,0,0,240,0,0,15,0,0,0,240,
  0,0,15,0,0,255,255,240,0,0,15,0,0,15,0,0,15,0,0,15,0,0,15,0,
  0,0,240,0,0,15,255,255,0,15,255,0,0,240,0,0,15,0,0,0,240,0,0,15,
  0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,255,240,0,0,0,0,15,
  0,0,0,240,0,0,0,240,0,0,15,0,0,0,15,0,0,0,240,0,0,0,240,0,
  0,15,0,0,0,15,0,0,0,240,0,0,0,0,15,255,0,0,0,240,0,0,15,0,
  0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,255,240,
  0,0,0,0,0,15,0,0,15,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,15,255,255,0,15,0,0,0,15,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,240,0,0,
  0,240,0,255,255,0,240,0,240,15,0,255,0,15,240,240,15,0,0,0,240,0,0,15,
  15,240,0,255,0,240,15,0,15,0,240,0,240,15,240,15,0,240,255,0,0,255,240,0,
  240,0,240,15,0,0,0,240,0,0,15,0,15,0,15,255,0,0,0,15,0,0,0,240,
  0,255,15,0,240,15,240,15,0,15,0,240,0,240,15,0,255,0,15,240,240,0,255,240,
  0,240,0,240,15,255,255,0,240,0,0,15,0,15,0,15,255,0,0,15,255,0,15,0,
  0,15,255,255,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,255,255,0,0,255,
  15,0,240,15,240,15,0,15,0,240,0,240,15,0,255,0,15,240,240,0,0,15,0,15,
  255,0,0,0,0,0,240,0,0,15,0,0,0,240,255,0,15,240,15,0,240,0,240,15,
  0,15,0,240,0,240,15,0,15,0,0,240,0,0,0,0,0,255,240,0,0,15,0,0,
  0,240,0,0,15,0,0,0,240,0,15,255,255,0,0,15,0,0,0,0,0,15,255,0,
  0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,240,15,0,0,255,0,
  0,0,0,0,15,0,0,0,240,0,0,15,0,15,0,240,15,0,15,15,0,0,255,240,
  0,15,0,240,0,240,0,240,15,255,0,0,0,240,0,0,15,0,0,0,240,0,0,15,
  0,0,0,240,0,0,15,0,0,255,255,240,15,240,240,0,240,240,240,15,15,15,0,240,
  240,240,15,15,15,0,240,240,240,15,15,240,0,255,0,240,15,0,15,0,240,0,240,15,
  0,15,0,240,0,240,0,255,240,0,240,0,240,15,0,15,0,240,0,240,15,0,15,0,
  15,255,0,15,15,240,0,255,0,240,15,0,15,0,240,0,240,15,240,15,0,240,255,0,
  15,0,0,0,240,0,0,0,0,0,0,15,240,240,15,0,255,0,240,0,240,15,0,15,
  0,240,15,240,0,255,15,0,0,0,240,0,0,15,0,0,0,0,15,240,255,0,15,240,
  0,0,240,0,0,15,0,0,0,240,0,0,255,255,0,0,255,240,0,240,0,240,0,255,
  240,0,0,0,240,15,0,15,0,15,255,0,0,240,0,0,15,0,0,15,255,255,0,15,
  0,0,0,240,0,0,15,0,0,0,240,15,0,0,255,0,15,0,15,0,240,0,240,15,
  0,15,0,240,0,240,15,0,255,0,15,240,240,15,0,15,0,240,0,240,15,0,15,0,
  15,15,0,0,240,240,0,0,240,0,15,15,15,0,240,240,240,15,15,15,0,240,240,240,
  15,15,15,0,15,15,240,15,0,15,0,15,15,0,0,15,0,0,15,15,0,15,0,15,
  0,240,0,240,15,0,15,0,240,0,240,15,0,15,0,15,15,0,0,240,240,0,0,240,
  0,0,15,0,0,255,0,0,0,0,0,0,255,255,240,0,0,240,0,0,240,0,0,240,
  0,0,240,0,0,15,255,255,0,0,255,0,0,240,0,0,15,0,0,0,240,0,15,240,
  0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,15,240,0,0,0,0,0,
  15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,
  0,240,0,0,15,0,0,0,240,0,0,0,0,0,15,240,0,0,0,240,0,0,15,0,
  0,0,240,0,0,0,255,0,0,240,0,0,15,0,0,0,240,0,0,15,0,0,255,0,
  0,0,0,0,0,240,0,0,240,240,240,0,0,240,0,0,0,0,0,0,0,0,
};
const Glyph MONO_g[] PROGMEM = {
  {0,0,0,0,0,7},
  {0,7,8,0,-8,7},
  {56,7,8,0,-8,7},
  {112,7,8,0,-8,7},
  {168,7,11,0,-9,7},
  {245,7,8,0,-8,7},
  {301,7,8,0,-8,7},
  {357,7,8,0,-8,7},
  {413,7,11,0,-9,7},
  {490,7,11,0,-9,7},
  {567,7,8,0,-8,7},
  {623,7,6,0,-6,7},
  {665,7,4,0,-2,7},
  {693,7,4,0,-4,7},
  {721,7,2,0,-2,7},
  {735,7,11,0,-9,7},
  {812,7,8,0,-8,7},
  {868,7,8,0,-8,7},
  {924,7,8,0,-8,7},
  {980,7,8,0,-8,7},
  {1036,7,8,0,-8,7},
  {1092,7,8,0,-8,7},
  {1148,7,8,0,-8,7},
  {1204,7,8,0,-8,7},
  {1260,7,8,0,-8,7},
  {1316,7,8,0,-8,7},
  {1372,7,6,0,-6,7},
  {1414,7,8,0,-6,7},
  {1470,7,7,0,-7,7},
  {1519,7,5,0,-5,7},
  {1554,7,7,0,-7,7},
  {1603,7,8,0,-8,7},
  {1659,7,8,0,-8,7},
  {1715,7,8,0,-8,7},
  {1771,7,8,0,-8,7},
  {1827,7,8,0,-8,7},
  {1883,7,8,0,-8,7},
  {1939,7,8,0,-8,7},
  {1995,7,8,0,-8,7},
  {2051,7,8,0,-8,7},
  {2107,7,8,0,-8,7},
  {2163,7,8,0,-8,7},
  {2219,7,8,0,-8,7},
  {2275,7,8,0,-8,7},
  {2331,7,8,0,-8,7},
  {2387,7,8,0,-8,7},
  {2443,7,8,0,-8,7},
  {2499,7,8,0,-8,7},
  {2555,7,8,0,-8,7},
  {2611,7,10,0,-8,7},
  {2681,7,8,0,-8,7},
  {2737,7,8,0,-8,7},
  {2793,7,8,0,-8,7},
  {2849,7,8,0,-8,7},
  {2905,7,8,0,-8,7},
  {2961,7,8,0,-8,7},
  {3017,7,8,0,-8,7},
  {3073,7,8,0,-8,7},
  {3129,7,8,0,-8,7},
  {3185,7,11,0,-9,7},
  {3262,7,11,0,-9,7},
  {3339,7,11,0,-9,7},
  {3416,7,8,0,-8,7},
  {3472,7,1,0,-1,7},
  {3479,7,9,0,-9,7},
  {3542,7,6,0,-6,7},
  {3584,7,8,0,-8,7},
  {3640,7,6,0,-6,7},
  {3682,7,8,0,-8,7},
  {3738,7,6,0,-6,7},
  {3780,7,8,0,-8,7},
  {3836,7,9,0,-6,7},
  {3899,7,8,0,-8,7},
  {3955,7,8,0,-8,7},
  {4011,7,11,0,-8,7},
  {4088,7,8,0,-8,7},
  {4144,7,8,0,-8,7},
  {4200,7,6,0,-6,7},
  {4242,7,6,0,-6,7},
  {4284,7,6,0,-6,7},
  {4326,7,9,0,-6,7},
  {4389,7,9,0,-6,7},
  {4452,7,6,0,-6,7},
  {4494,7,6,0,-6,7},
  {4536,7,8,0,-8,7},
  {4592,7,6,0,-6,7},
  {4634,7,6,0,-6,7},
  {4676,7,6,0,-6,7},
  {4718,7,6,0,-6,7},
  {4760,7,9,0,-6,7},
  {4823,7,6,0,-6,7},
  {4865,7,11,0,-9,7},
  {4942,7,11,0,-9,7},
  {5019,7,11,0,-9,7},
  {5096,7,5,0,-5,7},
};
const Font MONO = { MONO_bits, MONO_g, 14, 11 };
