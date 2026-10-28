/* novel.global, the touch screen: a LilyGO T-Display-S3 (touch) beside a printer, on its side.
   Every slip sent to that printer waits here with the irukandji, the same creature as the site: its box bell, its eye of dots,
   four tentacles of beads in the current. Its heading and code wait beside it. One press prints it: the slip feeds out of the
   bell as the printer prints it, then the jellyfish jets away. Hold it and it is squashed, slowly, until it pops; a current sweeps
   the pieces away and a fish eats them. Either way it stays away a while.
   With nothing waiting the screen sleeps, and wakes every so often: the jellyfish swims round novel.global's code, then sleeps again.

   Board: ESP32S3 Dev Module, USB CDC On Boot enabled, PSRAM OPI. Libraries: GFX Library for Arduino (moononournation),
   ArduinoJson (bblanchon). Everything else is the ESP32's own.
   Wi-Fi and the three NG_ lines can be typed here, or set from a phone: if it cannot join a Wi-Fi it knows, or the side
   button is held for five seconds while nothing waits, it opens its own Wi-Fi, NOVEL TOUCH, and a page to set them. */
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Arduino_GFX_Library.h>

#define WIFI_SSID  "your wi-fi"
#define WIFI_PASS  "its password"
#define NG_HOST    "novel.global"
#define NG_PRINTER "printer id"
#define NG_TOKEN   "touch token"
#define NG_BUZZ    -1   // a small vibration motor on a free pin (43 or 44) for a felt tap; -1 for none
#define NG_TURN    1    // which way up: 1, or 3 to turn the picture round (the USB socket on the other side)

/* the T-Display-S3's own wiring */
#define PIN_POWER 15
#define PIN_BL    38
#define TP_SDA    18
#define TP_SCL    17
#define TP_RST    21
#define TP_ADDR   0x15
#define KEY_A     14

const int W = 320, H = 170;
Arduino_DataBus *bus = new Arduino_ESP32PAR8Q(7, 6, 8, 9, 39, 40, 41, 42, 45, 46, 47, 48);
Arduino_GFX *tft = new Arduino_ST7789(bus, 5, NG_TURN, true, 170, 320, 35, 0, 35, 0);
Arduino_Canvas *g = new Arduino_Canvas(W, H, tft);

/* ───────── what it knows: the Wi-Fis (up to five, kept), the site, the printer, the token ───────── */
Preferences prefs; WiFiMulti multi;
String host, printerId, token, nets[5], passes[5]; int nNets = 0;
bool real(const char *s) { return s && *s && strcmp(s, "your wi-fi") && strcmp(s, "printer id") && strcmp(s, "touch token"); }
void loadCfg() {
  prefs.begin("ngtouch", false);
  host = prefs.getString("host", NG_HOST); printerId = prefs.getString("prn", real(NG_PRINTER) ? NG_PRINTER : ""); token = prefs.getString("tok", real(NG_TOKEN) ? NG_TOKEN : "");
  nNets = prefs.getInt("n", 0); if (nNets > 5) nNets = 5;
  for (int i = 0; i < nNets; i++) { nets[i] = prefs.getString(("s" + String(i)).c_str(), ""); passes[i] = prefs.getString(("p" + String(i)).c_str(), ""); }
  if (real(WIFI_SSID) && nNets < 5) { bool have = false; for (int i = 0; i < nNets; i++) if (nets[i] == WIFI_SSID) have = true; if (!have) { nets[nNets] = WIFI_SSID; passes[nNets++] = WIFI_PASS; } }
  for (int i = 0; i < nNets; i++) if (nets[i].length()) multi.addAP(nets[i].c_str(), passes[i].c_str());
}
void saveNets() { prefs.putInt("n", nNets); for (int i = 0; i < nNets; i++) { prefs.putString(("s" + String(i)).c_str(), nets[i]); prefs.putString(("p" + String(i)).c_str(), passes[i]); } }

/* ───────── colour: a sea lit from above, and the chalk ink mixed into it ───────── */
struct C3 { float r, g, b; };
const C3 INKC = {244, 241, 232};
C3 seaRow[H]; uint16_t seaC[H];
int clampi(int v, int a, int b) { return v < a ? a : v > b ? b : v; }
uint16_t c565(float r, float gg, float b) { int R = clampi((int)r, 0, 255), G = clampi((int)gg, 0, 255), B = clampi((int)b, 0, 255); return ((R & 0xF8) << 8) | ((G & 0xFC) << 3) | (B >> 3); }
void seaInit() {
  const C3 a = {58, 134, 238}, m = {27, 88, 186}, z = {10, 40, 104};   // brighter than the page: a backlit screen reads deeper than it is
  for (int y = 0; y < H; y++) { float k = (float)y / (H - 1); C3 p = k < 0.45f ? C3{a.r + (m.r - a.r) * k / 0.45f, a.g + (m.g - a.g) * k / 0.45f, a.b + (m.b - a.b) * k / 0.45f}
      : C3{m.r + (z.r - m.r) * (k - 0.45f) / 0.55f, m.g + (z.g - m.g) * (k - 0.45f) / 0.55f, m.b + (z.b - m.b) * (k - 0.45f) / 0.55f};
    seaRow[y] = p; seaC[y] = c565(p.r, p.g, p.b); }
}
uint16_t ink(float a, float y) { C3 s = seaRow[clampi((int)y, 0, H - 1)]; a = fminf(1, fmaxf(0, a)); return c565(s.r + (INKC.r - s.r) * a, s.g + (INKC.g - s.g) * a, s.b + (INKC.b - s.b) * a); }
const uint16_t PAPER = 0xF79D, PAPERINK = 0x122F;   // the slip: chalk paper, blueprint ink

/* ───────── the camera: where it looks, how close, a hand holding it underwater ───────── */
struct Cam { float x, y, z; } cam = {W / 2, H / 2, 1}, camT = {W / 2, H / 2, 1};
float shake = 0, shx = 0, shy = 0;   // a jolt, when it pops
float PX(float x) { return (x - cam.x) * cam.z + W / 2 + shx; }
float PY(float y) { return (y - cam.y) * cam.z + H / 2 + shy; }

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
struct Slip { String job, code, say, life, wish[4]; int n = 0; };
struct Seen { Slip first; int waiting = 0, printing = 0; unsigned ver = 0; } seen, net;   // net: written by the server task; seen: the loop's copy
SemaphoreHandle_t lock;
String askJob, askWhat; volatile bool setupOn = false; volatile int netErr = 1;   // 0 fine, 1 no Wi-Fi, 2 no answer, 3 token refused
void poll() {
  WiFiClientSecure c; c.setInsecure(); HTTPClient h; h.setTimeout(9000);
  if (!h.begin(c, String("https://") + host + "/api/touch/" + printerId)) { netErr = 2; return; }
  h.addHeader("authorization", String("Bearer ") + token); int code = h.GET();
  if (code != 200) { h.end(); netErr = code == 401 ? 3 : 2; return; }
  String got = h.getString(); h.end(); JsonDocument d; if (deserializeJson(d, got)) { netErr = 2; return; }
  Seen s; JsonArray held = d["held"].as<JsonArray>(); s.waiting = d["waiting"] | (int)held.size(); s.printing = d["printing"] | 0;
  if (held.size()) { JsonObject f = held[0]; s.first.job = f["job"].as<String>(); s.first.code = f["code"].as<String>(); s.first.say = f["say"].as<String>(); s.first.life = f["life"].as<String>();
    for (JsonVariant v : f["wish"].as<JsonArray>()) if (s.first.n < 4) s.first.wish[s.first.n++] = v.as<String>(); }
  xSemaphoreTake(lock, portMAX_DELAY); s.ver = net.ver + 1; net = s; xSemaphoreGive(lock); netErr = 0;
}
void act(const String &job, const String &what) {
  WiFiClientSecure c; c.setInsecure(); HTTPClient h; h.setTimeout(9000);
  if (!h.begin(c, String("https://") + host + "/api/touch/" + printerId + "/" + job)) return;
  h.addHeader("authorization", String("Bearer ") + token); h.addHeader("content-type", "application/json");
  h.POST(String("{\"action\":\"") + what + "\"}"); h.end();
}
void netTask(void *) {
  unsigned long last = 0;
  for (;;) {
    if (setupOn) { vTaskDelay(pdMS_TO_TICKS(400)); continue; }
    if (WiFi.status() != WL_CONNECTED) { netErr = 1; if (nNets) multi.run(8000); vTaskDelay(pdMS_TO_TICKS(400)); continue; }
    String job, what; xSemaphoreTake(lock, portMAX_DELAY); job = askJob; what = askWhat; askJob = ""; xSemaphoreGive(lock);
    if (job.length()) { act(job, what); last = 0; }
    if (printerId.length() && millis() - last > 4000) { last = millis(); poll(); }
    vTaskDelay(pdMS_TO_TICKS(120));
  }
}
void ask(const String &job, const char *what) { xSemaphoreTake(lock, portMAX_DELAY); askJob = job; askWhat = what; xSemaphoreGive(lock); }

/* ───────── the irukandji, drawn as the site draws it ───────── */
struct Jelly { float x = W / 2, y = 20, bw = 96, a = 0, sq = 0, jit = 0, len = 1, run = -1, look = 0, tp = 0, rate = 1, glow = 0; int eye = 0; bool cue = false; } J;
// eye: 0 open, 1 squeezed shut (> <), 2 asleep, 3 wide
float tX[4][44], tY[4][44]; const int NT = 44, NR = 48;
float bellX[NR], bellY[NR], bTop, bBot, bW, eyeX, eyeY, pupR;
float pulse(float t) { float p = fmodf(t, 3.6f) / 3.6f; return p < 0.28f ? sinf(p / 0.28f * PI / 2) : cosf((p - 0.28f) / 0.72f * PI / 2); }
float rnd1() { return (random(-1000, 1001)) / 1000.0f; }
void thick(float x0, float y0, float x1, float y1, float w, uint16_t col) {
  int n = (int)(w + 0.5f); if (n <= 1) { g->drawLine(x0, y0, x1, y1, col); return; }
  float dx = x1 - x0, dy = y1 - y0, l = sqrtf(dx * dx + dy * dy); if (l < 0.01f) { g->fillCircle(x0, y0, n / 2, col); return; }
  float nx = -dy / l, ny = dx / l; for (int k = 0; k < n; k++) { float o = k - (n - 1) / 2.0f; g->drawLine(x0 + nx * o, y0 + ny * o, x1 + nx * o, y1 + ny * o, col); }
}
void dot(float x, float y, float r, float a) { if (x < -8 || x > W + 8 || y < -8 || y > H + 8) return; if (r < 0.9f) g->drawPixel(x, y, ink(a, y)); else g->fillCircle(x, y, r, ink(a, y)); }
/* the light round the bell, breathing with it: rings of ink thinning outwards, row by row so it lies on the sea's own gradient */
void glowAt(float cx, float cy, float R, float a) {
  if (a <= 0.01f || R < 2) return; const int K = 9;
  for (int y = clampi((int)(cy - R), 0, H - 1); y <= clampi((int)(cy + R), 0, H - 1); y++) {
    float dy = y - cy; for (int k = K; k >= 1; k--) { float r = R * k / K; if (fabsf(dy) >= r) continue; float hw = sqrtf(r * r - dy * dy);
      g->drawFastHLine(cx - hw, y, 2 * hw, ink(a * (1 - (k - 1) / (float)K) * 0.6f, y)); } }
}
void drawJelly(float t) {
  if (J.a <= 0.02f) return;
  float z = cam.z, p = pulse(J.tp), sq = J.sq, bw = J.bw, bh = bw * 0.58f;
  float w = bw * (1 - 0.07f * p) / 2 * (1 + 0.55f * sq), h = bh * (1 + 0.045f * p) * (1 - 0.72f * sq);
  float jx = J.jit * rnd1(), jy = J.jit * 0.6f * rnd1(), cx = J.x + jx, top = J.y + jy + (bh - h) * (0.3f + 0.7f * sq), bot = top + h;
  bTop = top; bBot = bot; bW = w;
  glowAt(PX(cx), PY(top + h * 0.5f), bw * 1.6f * z, (0.13f + 0.07f * p + J.glow * 0.1f) * J.a);
  /* the tentacles: from the bell's foot, swaying in the current, beads of stinging cells along them; a light runs down them as it prints */
  float Lt = bw * 2.2f * J.len, writhe = 1 + 1.4f * fmaxf(0, sq);
  for (int i = 0; i < 4; i++) {
    float rx = cx + (i - 1.5f) / 1.5f * w * 0.82f, ry = bot - 1;
    for (int j = 0; j < NT; j++) { float s = j / (NT - 1.0f), env = fminf(1, s * 5) * sinf(PI * (0.15f + 0.85f * s));
      tX[i][j] = rx + (i - 1.5f) * s * bw * 0.14f + env * (sinf(s * (11 + i * 1.5f) - t * 1.3f + i * 1.7f) * 2.4f * writhe + (sinf(t * 0.66f + i * 3.3f + s * 2.2f) * 0.6f + sinf(t * 0.5f + i + s * 3) * 0.4f) * 14 + J.look * s * 10);
      tY[i][j] = ry + s * Lt + env * sinf(t * 0.54f + i * 7.1f + s * 3) * 4; }
    for (int j = 1; j < NT; j++) { float s = j / (NT - 1.0f); thick(PX(tX[i][j - 1]), PY(tY[i][j - 1]), PX(tX[i][j]), PY(tY[i][j]), (1.15f - 0.75f * s) * z, ink(0.55f * J.a, PY(tY[i][j]))); }
    for (int j = 4; j < NT - 1; j += 3) { float tw = 0.5f + 0.5f * sinf(t * 2.6f - j * 0.5f + i), run = J.run >= 0 ? fmaxf(0, 1 - fabsf(J.run - (float)j / NT) * 8) : 0;
      dot(PX(tX[i][j]), PY(tY[i][j]), ((j % 9 == 4) ? 2.1f : 1.2f) * z * (1 + run * 0.8f), fminf(1, 0.3f + 0.3f * tw + run * 0.7f) * J.a); }
  }
  /* the bell: a box with a soft dome, its foot drawn up a little; a faint second pass, as a hand would */
  for (int i = 0; i < NR; i++) { float u = (float)i / NR, X, Y;
    if (u < 0.8f) { float an = PI * (1 - u / 0.8f), ca = cosf(an), sa = fmaxf(0, sinf(an)); X = cx + powf(fabsf(ca), 0.55f) * (ca < 0 ? -1 : 1) * w; Y = bot - powf(sa, 0.42f) * h * (0.94f + 0.06f * sa); }
    else { float s = (u - 0.8f) / 0.2f; X = cx + w - 2 * w * s; Y = bot - sinf(s * PI) * h * 0.09f; }
    bellX[i] = X; bellY[i] = Y; }
  glowAt(PX(cx), PY(top + h * 0.45f), w * 0.9f * z, 0.08f * J.a);
  for (int i = 0; i < NR; i++) { int k = (i + 1) % NR; thick(PX(bellX[i]), PY(bellY[i]), PX(bellX[k]), PY(bellY[k]), 1.4f * z, ink(0.95f * J.a, PY(bellY[i]))); }
  for (int i = 0; i < NR; i++) { int k = (i + 1) % NR; g->drawLine(PX(bellX[i] + 1.2f), PY(bellY[i] + 0.8f), PX(bellX[k] + 1.2f), PY(bellY[k] + 0.8f), ink(0.25f * J.a, PY(bellY[i]))); }
  /* the eye that notices, in dots; it blinks; squeezed it shuts tight; asleep it is a line */
  float bk = fminf(1, fabsf(fmodf(t + 2.2f, 7.3f) - 0.14f) / 0.14f), eh = (bot - top) * 0.27f * fmaxf(0.08f, bk), ew = w * 0.74f, ex = cx + J.look * ew * 0.16f, ey = top + (bot - top) * 0.5f;
  eyeX = ex; eyeY = ey; pupR = (bot - top) * 0.27f * 0.95f;
  if (J.eye == 1) {        // > <
    float a = ew * 0.42f, b = (bot - top) * 0.2f; uint16_t c = ink(0.95f * J.a, PY(ey));
    thick(PX(ex - a * 1.4f), PY(ey - b), PX(ex - a * 0.5f), PY(ey), 1.5f * z, c); thick(PX(ex - a * 0.5f), PY(ey), PX(ex - a * 1.4f), PY(ey + b), 1.5f * z, c);
    thick(PX(ex + a * 1.4f), PY(ey - b), PX(ex + a * 0.5f), PY(ey), 1.5f * z, c); thick(PX(ex + a * 0.5f), PY(ey), PX(ex + a * 1.4f), PY(ey + b), 1.5f * z, c);
  } else if (J.eye == 2) {  // asleep: the lid's line, gently curved
    for (int k = 0; k < 14; k++) { float u = k / 13.0f * 2 - 1; dot(PX(ex + u * ew), PY(ey + (1 - u * u) * eh * 0.5f + 1), 1.0f * z, 0.7f * J.a); }
  } else {
    for (int j = 0; j < 30; j++) { float u = j / 30.0f * 2 * PI, cu = cosf(u), su = sinf(u); dot(PX(ex + cu * ew), PY(ey + su * eh * (0.35f + 0.65f * fabsf(su))), 1.15f * z, (0.62f + 0.18f * sinf(t * 1.75f)) * J.a); }
    float pr = pupR * fmaxf(0.08f, bk) * (1 + 0.04f * sinf(t * 1.75f)) * (J.eye == 3 ? 1.25f : 1), px = ex + J.look * ew * 0.1f;
    if (J.glow > 0) glowAt(PX(px), PY(ey), pr * 2.4f * z, 0.35f * J.glow * J.a);
    dot(PX(px), PY(ey), pr * (0.42f + 0.12f * J.glow) * z, 0.95f * J.a);
    g->drawCircle(PX(px), PY(ey), pr * z, ink(0.85f * J.a, PY(ey)));
  }
  const float F[4] = {-0.62f, -0.22f, 0.22f, 0.62f}; for (int k = 0; k < 4; k++) dot(PX(cx + F[k] * w), PY(bot - bh * 0.1f), 1.7f * z, 0.85f * J.a);
  /* waiting for a touch: a ring of dots breathing round it, and now and then a ripple going out */
  if (J.cue) { float br = 0.5f + 0.5f * sinf(t * 2.6f), R = bw * 0.86f * (1 + 0.04f * br), cy = top + h * 0.6f;
    for (int k = 0; k < 32; k++) { float u = k / 32.0f * 2 * PI + t * 0.15f; dot(PX(cx + cosf(u) * R), PY(cy + sinf(u) * R * 0.9f), 1.1f * z, 0.18f + 0.32f * br); }
    float rk = fmodf(t, 5.0f) / 1.6f; if (rk < 1) g->drawCircle(PX(cx), PY(cy), (R + rk * bw * 0.6f) * z, ink(0.45f * (1 - rk), PY(cy))); }
}

/* ───────── the sea: shafts of light, marine snow rising, near flakes larger when the camera is close ───────── */
struct Flake { float x, y, r, a, ph; } snow[48];
float current = 0;
void drawSea(float t, float dt) {
  for (int y = 0; y < H; y++) g->drawFastHLine(0, y, W, seaC[y]);
  for (int i = 0; i < 4; i++) { float x0 = 30 + i * 85 + sinf(t * 0.11f + i * 2.1f) * 22, dx = 60 + sinf(t * 0.07f + i) * 20;
    for (int k = 0; k < 7; k++) g->drawLine(x0 + k, 0, x0 + k + dx, H * 0.85f, ink(0.014f + 0.01f * (k >= 2 && k <= 4), H * 0.35f)); }
  for (int i = 0; i < 48; i++) { Flake &f = snow[i];
    f.y -= dt * (3 + f.r * 4); f.x += sinf(t * 0.2f + f.ph) * 0.12f + current * dt * (40 + f.r * 30);
    if (f.y < -4) { f.y = H + 4; f.x = random(W); } if (f.x > W + 4) f.x = -4; if (f.x < -4) f.x = W + 4;
    float r = f.r * (0.6f + 0.4f * cam.z), a = f.a * (0.6f + 0.4f * sinf(t * 0.9f + f.ph)) / (cam.z > 1.5f && f.r > 1.2f ? 1.8f : 1);
    if (f.r < 0.9f) g->drawPixel(f.x, f.y, ink(a, f.y)); else g->fillCircle(f.x, f.y, r, ink(a, f.y)); }
}

/* ───────── what is left after a squash: pieces, swept by a current, and a fish ───────── */
struct Part { float x, y, vx, vy, rot, vr, s; float px[6], py[6]; uint8_t n, kind; bool on; } parts[60];
// kind: 0 a bead, 1 a piece of bell or tentacle (a short line), 2 the eye, 3 a bubble
int nParts = 0;
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
  for (int k = 0; k < 18; k++) { Part p = {}; p.kind = 0; p.s = random(2) ? 2.1f : 1.2f; int i = random(4), j = 4 + random(NT - 5); p.x = tX[i][j]; p.y = tY[i][j]; p.vx = rnd1() * 90; p.vy = rnd1() * 90 - 30; addPart(p); }
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
  if (current > 0) for (int i = 0; i < 7; i++) { float y = 14 + i * 24 + sinf(k * 1.3f + i) * 5;   // the current, as lines going by
    for (int d = 0; d < 5; d++) { float xs = fmodf(k * 260 + d * 74 + i * 31, W + 80) - 40; g->drawLine(xs, y, xs + 22, y + sinf(xs * 0.05f) * 1.5f, ink(0.28f * current, y)); } }
  for (int i = 0; i < nParts; i++) { Part &p = parts[i]; if (!p.on) continue;
    float X = PX(p.x), Y = PY(p.y);
    if (p.kind == 0) dot(X, Y, p.s, 0.85f);
    else if (p.kind == 3) g->drawCircle(X, Y, p.s, ink(0.6f, Y));
    else if (p.kind == 2) {  // the eye, rolled out: its ring, and an X where the pupil was
      g->drawCircle(X, Y, p.s, ink(0.9f, Y)); float c = cosf(p.rot), s = sinf(p.rot), r = p.s * 0.55f; uint16_t col = ink(0.95f, Y);
      thick(X - r * c + r * s, Y - r * s - r * c, X + r * c - r * s, Y + r * s + r * c, 1.6f, col); thick(X - r * c - r * s, Y - r * s + r * c, X + r * c + r * s, Y + r * s - r * c, 1.6f, col);
    } else { float c = cosf(p.rot), s = sinf(p.rot);
      for (int k2 = 1; k2 < p.n; k2++) thick(X + p.px[k2 - 1] * c - p.py[k2 - 1] * s, Y + p.px[k2 - 1] * s + p.py[k2 - 1] * c, X + p.px[k2] * c - p.py[k2] * s, Y + p.px[k2] * s + p.py[k2] * c, 1.4f, ink(0.9f, Y)); }
  }
  if (fish.on) {  // a fish in one line: its body, its mouth opening, its tail beating, an eye
    float x = PX(fish.x), y = PY(fish.y), m = 0.18f + 0.5f * fish.chomp * (0.5f + 0.5f * sinf(k * 40)), wag = sinf(k * 14) * 4; uint16_t c = ink(0.95f, y);
    float lx = 0, ly = 0; for (int i = 0; i <= 24; i++) { float u = m + (2 * PI - 2 * m) * i / 24.0f, X = x + cosf(u) * 20, Y = y + sinf(u) * 10 * (1 - 0.15f * cosf(u));
      if (i) thick(lx, ly, X, Y, 1.5f, c); lx = X; ly = Y; }
    thick(x + cosf(m) * 20, y + sinf(m) * 10, x + 12, y, 1.4f, c); thick(x + 12, y, x + cosf(-m) * 20, y + sinf(-m) * 10, 1.4f, c);
    thick(x - 20, y, x - 32, y - 9 + wag, 1.4f, c); thick(x - 32, y - 9 + wag, x - 32, y + 9 + wag, 1.4f, c); thick(x - 32, y + 9 + wag, x - 20, y, 1.4f, c);
    g->fillCircle(x + 9, y - 3, 2, c); for (int i = 0; i < 5; i++) g->drawPixel(x + 2 + sinf(i * 0.6f) * 2, y - 5 + i * 2.5f, c);
  }
}

/* ───────── novel.global's code: 25 by 25, drawn in blueprint ink on a chalk plate ───────── */
const uint32_t QR[25] = { 0x01FD017F, 0x01056F41, 0x0174B05D, 0x0174755D, 0x0175CE5D, 0x01052041, 0x01FD557F, 0x00011100, 0x01A5C0ED, 0x0089280D, 0x000515CD, 0x0076B8A7, 0x01D68B49,
  0x011DEB3A, 0x00D357F6, 0x01193421, 0x01FF8C7C, 0x01513700, 0x01D51B7F, 0x00911341, 0x00BF385D, 0x01F6F55D, 0x00D7B95D, 0x00520041, 0x01FE517F };
void drawQR(int cx, int cy, int m, float a) {
  int n = 25, q = 2, s = (n + 2 * q) * m, x0 = cx - s / 2, y0 = cy - s / 2;
  g->fillRoundRect(x0, y0, s, s, 4, ink(0.97f * a, cy));
  for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) if (QR[r] >> c & 1) g->fillRect(x0 + (q + c) * m, y0 + (q + r) * m, m, m, PAPERINK);
}

/* ───────── words ───────── */
int words(const String &s, int x, int y, int w, uint8_t size, uint16_t col, int maxLines) {
  g->setTextSize(size); g->setTextColor(col); int cw = 6 * size, lh = 9 * size, per = max(1, w / cw), lines = 0; String rest = s;
  while (rest.length() && lines < maxLines) {
    int cut = (int)rest.length() <= per ? (int)rest.length() : rest.lastIndexOf(' ', per); if (cut <= 0) cut = min((int)rest.length(), per);
    String ln = rest.substring(0, cut); rest = rest.substring(cut); rest.trim();
    if (lines == maxLines - 1 && rest.length()) ln = ln.substring(0, max(0, (int)ln.length() - 1)) + "~";
    g->setCursor(x, y + lines * lh); g->print(ln); lines++;
  }
  return y + lines * lh;
}
void counts() {
  if (!seen.waiting && !seen.printing) return;
  g->setTextSize(1); g->setTextColor(ink(0.6f, 8)); String s = String(seen.waiting) + " waiting"; if (seen.printing) s += "  " + String(seen.printing) + " printing";
  g->setCursor(W - 8 - 6 * s.length(), 6); g->print(s);
}

/* ───────── the setup Wi-Fi and its page ───────── */
WebServer web(80); DNSServer dns; String apPass, scanOpts;
String between(const String &s, const char *key) { int i = s.indexOf(key); if (i < 0) return ""; int a = s.indexOf('"', i), b = s.indexOf('"', a + 1); return a < 0 || b < 0 ? "" : s.substring(a + 1, b); }
String esc(String s) { s.replace("&", "&amp;"); s.replace("<", "&lt;"); s.replace("\"", "&quot;"); return s; }
const char *PAGE_HEAD = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><title>novel.global touch</title>"
  "<style>body{background:#17457F;color:#F4F1E8;font:16px/1.4 -apple-system,system-ui,sans-serif;margin:0;padding:22px;max-width:520px}"
  "input,select,textarea{width:100%;box-sizing:border-box;font:16px ui-monospace,monospace;padding:10px;margin:4px 0 14px;border:1.5px solid #F4F1E8;border-radius:8px;background:#0E2F6E;color:#F4F1E8}"
  "button{font:600 17px system-ui;padding:12px 26px;border-radius:30px;border:0;background:#F4F1E8;color:#17457F}label{font-size:13px;opacity:.8}h1{font-weight:500;font-size:20px}</style>";
void pageRoot() {
  String s = PAGE_HEAD; s += "<h1>novel.global · touch</h1><form method=post action=/save><label>Wi-Fi</label><select name=s>" + scanOpts + "</select>";
  s += "<label>or a Wi-Fi not listed</label><input name=s2 autocomplete=off><label>its password</label><input name=p type=password>";
  s += "<label>the three lines from the approval page (leave empty to keep them)</label><textarea name=ng rows=4 placeholder='#define NG_HOST ...'></textarea>";
  if (nNets) { s += "<label>Wi-Fis it knows (tick to forget)</label><div style='margin:6px 0 16px'>"; for (int i = 0; i < nNets; i++) s += "<div><input type=checkbox name=f" + String(i) + " style='width:auto;margin-right:8px'>" + esc(nets[i]) + "</div>"; s += "</div>"; }
  s += "<button>Join</button></form>"; web.send(200, "text/html", s);
}
void pageSave() {
  String ss = web.arg("s2").length() ? web.arg("s2") : web.arg("s"), pp = web.arg("p"), ng = web.arg("ng");
  String kn[5], kp[5]; int k = 0; if (ss.length()) { kn[k] = ss; kp[k++] = pp; }
  for (int i = 0; i < nNets && k < 5; i++) if (!web.hasArg("f" + String(i)) && nets[i] != ss) { kn[k] = nets[i]; kp[k++] = passes[i]; }
  nNets = k; for (int i = 0; i < k; i++) { nets[i] = kn[i]; passes[i] = kp[i]; } saveNets();
  String h2 = between(ng, "NG_HOST"), p2 = between(ng, "NG_PRINTER"), t2 = between(ng, "NG_TOKEN");
  if (h2.length()) prefs.putString("host", h2); if (p2.length()) prefs.putString("prn", p2); if (t2.length()) prefs.putString("tok", t2);
  web.send(200, "text/html", String(PAGE_HEAD) + "<h1>Joining " + esc(ss) + "…</h1><p>The screen restarts. Join your own Wi-Fi again.</p>");
  delay(1500); ESP.restart();
}
float setupAt = 0;
void startSetup(float t) {
  setupOn = true; setupAt = t; WiFi.disconnect(); WiFi.mode(WIFI_AP_STA);
  int n = WiFi.scanNetworks(); scanOpts = ""; for (int i = 0; i < n && i < 20; i++) { String s = WiFi.SSID(i); if (s.length() && scanOpts.indexOf(">" + esc(s) + "<") < 0) scanOpts += "<option>" + esc(s) + "</option>"; }
  apPass = String(10000000 + (esp_random() % 90000000)); WiFi.softAP("NOVEL TOUCH", apPass.c_str());
  dns.start(53, "*", WiFi.softAPIP()); web.on("/", HTTP_GET, pageRoot); web.on("/save", HTTP_POST, pageSave);
  web.onNotFound([]() { web.sendHeader("Location", "http://192.168.4.1/"); web.send(302, "text/plain", ""); }); web.begin();
}

/* ───────── what it is doing ───────── */
enum Mode { CONNECTING, SETUP, ASLEEP, AWAKE, ARRIVE, HELD, SQUISH, PRINTING, BURST, QUIET } mode = CONNECTING;
float modeAt = 0, springAt = -9, springFrom = 0, nextTick = 0; int awakeKind = 0;
Slip slip; String printLines[12]; int nPrint = 0;
void go(Mode m, float t) { mode = m; modeAt = t; if (m == ARRIVE) { slip = seen.first; buzz(15); } }
const float HELD_X = 74, HELD_Y = 18, HELD_BW = 92, HOLD_FULL = 2.7f;
void prepPrint() {   // the slip as it comes out: its heading wrapped narrow, its lines, its code
  nPrint = 0; String all[6] = {slip.say, slip.wish[0], slip.wish[1], slip.wish[2], slip.wish[3], slip.code};
  for (int a = 0; a < 6 && nPrint < 12; a++) { String r = all[a]; r.trim(); while (r.length() && nPrint < 12) { int cut = (int)r.length() <= 13 ? (int)r.length() : r.lastIndexOf(' ', 13); if (cut <= 0) cut = min((int)r.length(), 13);
      printLines[nPrint++] = r.substring(0, cut); r = r.substring(cut); r.trim(); } }
}
float ease(float k) { k = fminf(1, fmaxf(0, k)); return k < 0.5f ? 4 * k * k * k : 1 - powf(-2 * k + 2, 3) / 2; }

void setup() {
  pinMode(PIN_POWER, OUTPUT); digitalWrite(PIN_POWER, HIGH);
  pinMode(KEY_A, INPUT_PULLUP); if (NG_BUZZ >= 0) { pinMode(NG_BUZZ, OUTPUT); digitalWrite(NG_BUZZ, LOW); }
  pinMode(TP_RST, OUTPUT); digitalWrite(TP_RST, LOW); delay(20); digitalWrite(TP_RST, HIGH); delay(100);
  Wire.begin(TP_SDA, TP_SCL);
  tpWrite(0xFE, 0xFF);   // never asleep, so every read is answered
  tpWrite(0xFB, 0);      // no reset after a touch with no gesture
  tpWrite(0xFC, 0);      // nor after a long hold
  g->begin(); seaInit(); pinMode(PIN_BL, OUTPUT); analogWrite(PIN_BL, 255);
  randomSeed(esp_random());
  for (int i = 0; i < 48; i++) snow[i] = {(float)random(W), (float)random(H), i % 3 ? 0.6f : 0.9f + random(100) / 70.0f, 0.12f + random(100) / 300.0f, random(628) / 100.0f};
  loadCfg(); lock = xSemaphoreCreateMutex();
  WiFi.mode(WIFI_STA); WiFi.setHostname("novel-touch");
  bool keyHeld = digitalRead(KEY_A) == LOW;
  xTaskCreatePinnedToCore(netTask, "net", 16384, NULL, 1, NULL, 0);
  if (keyHeld || !nNets || !printerId.length()) startSetup(0);
  else go(CONNECTING, 0);
}

unsigned long downAt = 0; bool down = false; float keyAt = -1, lastT = 0, bl = 255, lastPollSeen = 0;
void loop() {
  float t = millis() / 1000.0f, dt = fminf(0.1f, t - lastT); lastT = t; float k = t - modeAt;
  if (setupOn) { dns.processNextRequest(); web.handleClient(); if (mode != SETUP) go(SETUP, t); }

  /* what the server last said */
  bool fresh = false; xSemaphoreTake(lock, portMAX_DELAY); if (net.ver != seen.ver) { seen = net; fresh = true; } xSemaphoreGive(lock);
  bool has = seen.first.job.length() > 0;
  if (fresh && has && (mode == HELD || mode == ARRIVE)) slip = seen.first;

  /* touch: the screen or the side button */
  bool now = touched() || digitalRead(KEY_A) == LOW, tap = false; float held = 0;
  if (now && !down) { down = true; downAt = millis(); }
  if (down) held = (millis() - downAt) / 1000.0f;
  if (!now && down) { down = false; tap = held < 0.45f; }
  if (digitalRead(KEY_A) == LOW) { if (keyAt < 0) keyAt = t; } else keyAt = -1;
  if (keyAt >= 0 && t - keyAt > 5 && (mode == ASLEEP || mode == AWAKE || mode == QUIET || mode == CONNECTING) && !setupOn) startSetup(t);

  /* the camera eases to where it is meant to be, and a hand holds it */
  float e = 1 - expf(-dt * 2.6f); cam.x += (camT.x - cam.x) * e; cam.y += (camT.y - cam.y) * e; cam.z += (camT.z - cam.z) * e;
  float hold = cam.z - 1; cam.x += sinf(t * 0.9f) * 0.25f * hold; cam.y += sinf(t * 0.7f) * 0.2f * hold;
  J.tp += dt * J.rate; J.cue = false; J.glow = 0; J.run = -1; J.jit = 0; J.len = 1; J.look = sinf(t * 0.37f) * 0.6f; J.eye = 0; J.rate = 1; if (mode != HELD) J.sq = 0;
  float blT = 255; bool draw = true;

  switch (mode) {
    case CONNECTING:   // a small jellyfish, asleep, until the Wi-Fi is joined
      J.a = 1; J.x = W / 2; J.y = 40 + sinf(t) * 3; J.bw = 60; J.eye = 2; J.rate = 0.5f; camT = {W / 2, H / 2, 1};
      if (WiFi.status() == WL_CONNECTED && netErr != 1) go(has ? ARRIVE : AWAKE, t);
      else if (k > 40 && !setupOn) startSetup(t);
      break;
    case SETUP: J.a = 1; J.x = 60; J.y = 30 + sinf(t) * 3; J.bw = 64; J.eye = 2; J.rate = 0.5f; camT = {W / 2, H / 2, 1}; if (t - setupAt > 600) ESP.restart(); break;
    case ASLEEP:       // nothing waiting: the screen dark half a minute
      draw = false; blT = 0; J.a = 0; if (has) go(ARRIVE, t); else if (k > 30 || tap) { awakeKind = (awakeKind + 1) % 3; go(AWAKE, t); } break;
    case AWAKE: {      // ten seconds awake: the code to scan, and the jellyfish round it
      if (has) { go(ARRIVE, t); break; }
      J.a = fminf(1, k * 1.5f) * fminf(1, (10 - k) * 1.5f); J.bw = 70;
      if (awakeKind == 0) { float u = k * 0.7f + 2.6f; J.x = 112 + cosf(u) * 84; J.y = 52 + sinf(u * 2) * 26; J.look = -cosf(u); camT = {W / 2, H / 2, 1}; }   // round the code's edge, behind it
      else if (awakeKind == 1) { J.x = -40 + k * 34; J.y = 30; J.bw = 96; camT = {80, 70, 2.3f}; if (k > 7) camT = {W / 2, H / 2, 1}; }       // close, past the camera
      else { J.x = 70; J.y = 200 - ease(k / 2.5f) * 170 + ease((k - 7.5f) / 2.5f) * 190; J.look = sinf(k * 1.4f); camT = {W / 2, H / 2, 1}; }  // up from below, a look, back down
      if (k > 10) go(ASLEEP, t);
      break; }
    case ARRIVE:       // something to print: it swims up, the camera goes close to its eye, then draws back
      if (!has) { go(ASLEEP, t); break; }
      J.a = 1; J.x = HELD_X; J.bw = HELD_BW; J.y = 200 - ease(k / 1.8f) * (200 - HELD_Y); J.rate = 1.8f;
      if (k > 1.8f && k < 3.4f) camT = {HELD_X, HELD_Y + HELD_BW * 0.3f, 2.4f}; else camT = {W / 2, H / 2, 1};
      if (k > 4.4f) go(HELD, t);
      break;
    case HELD: {
      if (!has) { go(ASLEEP, t); break; }
      J.a = 1; J.x = HELD_X; J.y = HELD_Y; J.bw = HELD_BW; J.cue = true; J.glow = 0.5f + 0.5f * sinf(t * 2.4f); camT = {W / 2, H / 2, 1};
      float sk = t - springAt; J.sq = sk < 0.9f ? springFrom * expf(-5 * sk) * cosf(14 * sk) : 0;   // let go early: it springs back
      if (down && held > 0.45f) { go(SQUISH, t); nextTick = 1 / 3.0f; nParts = 0; }
      else if (tap) { buzz(30); ask(slip.job, "print"); prepPrint(); go(PRINTING, t); }
      break; }
    case SQUISH: {     // held: squeezed slowly flatter, shaking harder, beads pressed out, eyes shut tight; full, it pops
      float q = fminf(1, (held - 0.45f) / HOLD_FULL); stepParts(0, dt);
      J.a = 1; J.x = HELD_X; J.y = HELD_Y; J.bw = HELD_BW; J.sq = q * q * (3 - 2 * q); J.jit = 0.4f + q * q * 4.5f; J.len = 1 - 0.55f * q; J.eye = q > 0.3f ? 1 : 3; J.rate = 1 + 3 * q;
      if (q >= nextTick && nextTick < 1) { buzz(10); nextTick += 1 / 3.0f; }
      if (q > 0.3f && random(100) < 18) { Part p = {}; p.kind = 0; p.s = 1.2f; p.x = HELD_X + (random(2) ? 1 : -1) * bW * 1.05f; p.y = bBot - 2; p.vx = (p.x > HELD_X ? 1 : -1) * (40 + random(60)); p.vy = -20 - random(40); if (nParts > 40) nParts = 0; addPart(p); }
      if (!down) { springFrom = J.sq; springAt = t; nParts = 0; go(HELD, t); }
      else if (q >= 1) { buzz(70); burstFrom(HELD_X, bTop + (bBot - bTop) * 0.5f); ask(slip.job, "squash"); go(BURST, t); }
      break; }
    case BURST:        // three seconds: the pop, the pieces, the current, the fish
      J.a = 0; shake = k < 0.35f ? (1 - k / 0.35f) * 5 : 0; stepParts(k, dt);
      if (k > 3.4f) { nParts = 0; fish.on = false; current = 0; go(QUIET, t); }
      break;
    case PRINTING:     // the slip feeds out of the bell as the printer prints it, is torn off, and the jellyfish jets away with the light
      J.a = 1; J.x = HELD_X; J.bw = HELD_BW; J.eye = 3; J.rate = 2.4f; J.run = fmodf(k * 0.9f, 1.2f); J.y = HELD_Y;
      if (k > 4.1f) { float f = k - 4.1f; J.y = HELD_Y - f * f * 220 - f * 30; J.sq = -0.3f * fabsf(sinf(f * 9)); }
      if (k > 5.4f) go(QUIET, t);
      break;
    case QUIET:        // fifteen seconds without it, after a print or a squash
      J.a = 0; camT = {W / 2, H / 2, 1}; if (k > 15) go(has ? ARRIVE : ASLEEP, t);
      break;
  }

  bl += (blT - bl) * fminf(1, dt * 4); analogWrite(PIN_BL, (int)bl);
  if (!draw && bl < 2) { delay(60); return; }

  /* the frame */
  shx = shake ? rnd1() * shake : 0; shy = shake ? rnd1() * shake : 0; if (mode != BURST) shake = 0;
  drawSea(t, dt);
  if (mode == AWAKE) {   // the code in front, the jellyfish behind its plate: nothing ever covers what is scanned
    drawJelly(t); drawQR(230, H / 2, 5, fminf(1, (t - modeAt) * 2));
    g->setTextSize(1); g->setTextColor(ink(0.7f, 160)); g->setCursor(194, 160); g->print("novel.global");
  } else drawJelly(t);
  if (mode == BURST) { drawParts(k); if (k < 0.35f) { float r = k / 0.35f; g->drawCircle(PX(HELD_X), PY(48), 20 + r * 90, ink(0.8f * (1 - r), 50)); g->drawCircle(PX(HELD_X), PY(48), 10 + r * 60, ink(0.5f * (1 - r), 50)); } }
  if (mode == SQUISH) drawParts(0);

  /* what waits: its heading large, its code, how many more */
  if (mode == HELD || mode == SQUISH || (mode == ARRIVE && k > 3.6f)) {
    int y = 28; y = words(slip.say.length() ? slip.say : slip.code, 150, y, W - 158, 2, ink(0.97f, 40), 4) + 8;
    if (slip.n) y = words(slip.wish[0], 150, y, W - 158, 1, ink(0.6f, y), 2) + 6;
    g->setTextSize(2); g->setTextColor(ink(0.75f, 150)); g->setCursor(150, H - 24); g->print(slip.code);
  }
  if (mode == PRINTING) {  // the paper, out of the bell's foot: each line appears as it is printed, the newest just under the bell
    float feed = ease(k / 3.6f), Lp = feed * 150, y0 = bBot + 4, fall = k > 4.1f ? k - 4.1f : 0, pw = 84, x0 = HELD_X - pw / 2;
    y0 += fall * fall * 300; if (y0 < H) {
      g->fillRect(x0, y0, pw, Lp, PAPER);
      g->setTextSize(1); g->setTextColor(PAPERINK);
      for (int i = 0; i < nPrint; i++) { float ly = y0 + 6 + i * 10; if (ly + 9 < y0 + Lp && ly < H) { g->setCursor(x0 + 5, ly); g->print(printLines[i]); } }
      if (k > 3.6f && k < 4.3f) for (int i = 0; i < 12; i++) g->fillTriangle(x0 + i * 7, y0, x0 + i * 7 + 7, y0, x0 + i * 7 + 3.5f, y0 + 3, seaC[clampi((int)y0, 0, H - 1)]);   // torn off
    }
    g->setTextSize(2); g->setTextColor(ink(0.75f, 120)); g->setCursor(150, H - 24); g->print(slip.code);
    g->setTextSize(1); g->setTextColor(ink(0.8f, 150)); g->setCursor(150, 74); g->print(k < 4.1f ? "printing" : "printed");
    for (int i = 0; i < 3; i++) if (k < 4.1f && fmodf(k * 2, 3) > i) { g->setCursor(198 + i * 6, 74); g->print("."); }
  }
  if (mode == SETUP) {
    g->setTextSize(1); g->setTextColor(ink(0.7f, 20)); g->setCursor(130, 16); g->print("join this Wi-Fi from a phone");
    g->setTextSize(2); g->setTextColor(ink(1, 40)); g->setCursor(130, 34); g->print("NOVEL TOUCH");
    g->setTextSize(1); g->setTextColor(ink(0.7f, 64)); g->setCursor(130, 64); g->print("password");
    g->setTextSize(2); g->setTextColor(ink(1, 80)); g->setCursor(130, 78); g->print(apPass);
    g->setTextSize(1); g->setTextColor(ink(0.7f, 110)); g->setCursor(130, 108); g->print("a page opens, or go to");
    g->setTextSize(2); g->setTextColor(ink(1, 124)); g->setCursor(130, 122); g->print("192.168.4.1");
  }
  if (mode != SETUP) counts();
  if (mode != SETUP && netErr) { g->drawCircle(W - 10, H - 10, 4, ink(0.6f, H - 10)); if (netErr == 3) { g->setTextSize(1); g->setTextColor(ink(0.7f, H - 10)); g->setCursor(W - 30, H - 14); g->print("?"); } }
  g->flush();
  delay(8);
}
