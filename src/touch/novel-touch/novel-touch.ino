/* novel.global, the touch screen: a LilyGO T-Display-S3 (touch) beside a printer.
   Every slip sent to that printer waits here with the irukandji. One press of the jellyfish prints it;
   hold it and it is squashed flat and let go. Blueprint blue, chalk white, the same creature as the site.
   With nothing waiting it keeps itself busy: it swims up in pulses, wanders, sleeps, or leaves for a minute.

   Board: ESP32S3 Dev Module, USB CDC On Boot enabled, PSRAM OPI. Libraries: GFX Library for Arduino (moononournation),
   ArduinoJson (bblanchon). The three NG_ lines come from the approval page (TOUCH SCREEN ON), the two WIFI_ lines are yours. */
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Arduino_GFX_Library.h>

#define WIFI_SSID  "your wi-fi"
#define WIFI_PASS  "its password"
#define NG_HOST    "novel.global"
#define NG_PRINTER "printer id"
#define NG_TOKEN   "touch token"
#define NG_BUZZ    -1   // a small vibration motor on a free pin (43 or 44) for a felt tap; -1 for none

/* the T-Display-S3's own wiring */
#define PIN_POWER 15
#define PIN_BL    38
#define TP_SDA    18
#define TP_SCL    17
#define TP_RST    21
#define TP_ADDR   0x15
#define KEY_A     14

Arduino_DataBus *bus = new Arduino_ESP32PAR8Q(7, 6, 8, 9, 39, 40, 41, 42, 45, 46, 47, 48);
Arduino_GFX *tft = new Arduino_ST7789(bus, 5, 0, true, 170, 320, 35, 0, 35, 0);
Arduino_Canvas *g = new Arduino_Canvas(170, 320, tft);

const uint16_t BLUE = 0x122F;   // #17457F
const uint16_t INK = 0xF79D;    // #F4F1E8
const uint16_t FAINT = 0x7C38;  // the ink half over the blue
const int W = 170, H = 320;

/* what is waiting: the first held slip, its words and lines; how many wait for a touch, how many are printing */
struct Slip { String job, code, say, life, wish[4]; int n = 0; } slip;
int waiting = 0, printing = 0;
unsigned long lastPoll = 0, lastTouch = 0;

enum Mode { IDLE, HELD, PRINTING, SQUASHING, GONE } mode = IDLE;
float t0 = 0, squash = 0;          // squash: 0 round … 1 flat (below 0, drawn in for a pulse)
float lift = 0;                    // how far it has risen, printing
float snowX[24], snowY[24];

/* alone: drifting, then one of its own doings, then drifting again */
enum Doing { DRIFT, JET, WANDER, DOZE, AWAY } doing = DRIFT;
float doingAt = 0, doingNext = 12;

/* ───────── touch: the CST816, read straight off the wire ─────────
   Kept awake and from resetting itself mid-hold (its own defaults: asleep after 2 s, reset after 5 s held),
   as in CST816_TouchLib (github.com/mjdonders/CST816_TouchLib, public domain) */
void tpWrite(uint8_t reg, uint8_t v) { Wire.beginTransmission(TP_ADDR); Wire.write(reg); Wire.write(v); Wire.endTransmission(); }
bool touchAt(int &x, int &y) {
  Wire.beginTransmission(TP_ADDR); Wire.write(0x02); if (Wire.endTransmission(false)) return false;
  if (Wire.requestFrom((uint8_t)TP_ADDR, (uint8_t)5) != 5) return false;
  uint8_t f = Wire.read(), xh = Wire.read(), xl = Wire.read(), yh = Wire.read(), yl = Wire.read();
  if (!(f & 0x0F)) return false; x = ((xh & 0x0F) << 8) | xl; y = ((yh & 0x0F) << 8) | yl; return true;
}
void buzz(int ms) { if (NG_BUZZ < 0) return; digitalWrite(NG_BUZZ, HIGH); delay(ms); digitalWrite(NG_BUZZ, LOW); }

/* ───────── the server: what is held for this printer; print or squash one ───────── */
bool getHeld() {
  if (WiFi.status() != WL_CONNECTED) return false;
  WiFiClientSecure c; c.setInsecure(); HTTPClient h;
  if (!h.begin(c, String("https://") + NG_HOST + "/api/touch/" + NG_PRINTER)) return false;
  h.addHeader("authorization", String("Bearer ") + NG_TOKEN); int code = h.GET();
  if (code != 200) { h.end(); return false; }
  String got = h.getString(); h.end(); JsonDocument d; if (deserializeJson(d, got)) return false;
  JsonArray held = d["held"].as<JsonArray>(); waiting = d["waiting"] | (int)held.size(); printing = d["printing"] | 0;
  if (!held.size()) { slip = Slip(); return true; }
  JsonObject s = held[0]; if (slip.job == s["job"].as<String>()) return true;
  slip = Slip(); slip.job = s["job"].as<String>(); slip.code = s["code"].as<String>(); slip.say = s["say"].as<String>(); slip.life = s["life"].as<String>();
  JsonArray w = s["wish"].as<JsonArray>(); for (JsonVariant v : w) if (slip.n < 4) slip.wish[slip.n++] = v.as<String>();
  return true;
}
bool act(const char *what) {
  if (WiFi.status() != WL_CONNECTED || !slip.job.length()) return false;
  WiFiClientSecure c; c.setInsecure(); HTTPClient h;
  if (!h.begin(c, String("https://") + NG_HOST + "/api/touch/" + NG_PRINTER + "/" + slip.job)) return false;
  h.addHeader("authorization", String("Bearer ") + NG_TOKEN); h.addHeader("content-type", "application/json");
  int code = h.POST(String("{\"action\":\"") + what + "\"}"); h.end(); return code == 200;
}

/* ───────── the drawing ───────── */
/* the irukandji: a bell with an eye, four tentacles of beads swaying; squash flattens and widens it, below 0 draws it in tall */
void jelly(float cx, float cy, float t, float sq, uint16_t col, bool shut) {
  float bw = 34 * (1 + 0.55 * sq) * (1 + 0.04 * sinf(t * 2.2)), bh = 30 * (1 - 0.8 * sq) * (1 - 0.05 * sinf(t * 2.2));
  for (int a = 0; a < 36; a++) { float an = PI + PI * a / 36.0, an2 = PI + PI * (a + 1) / 36.0;
    g->drawLine(cx + cosf(an) * bw, cy + sinf(an) * bh, cx + cosf(an2) * bw, cy + sinf(an2) * bh, col); }
  g->drawLine(cx - bw, cy, cx + bw, cy, col);
  float ey = cy - bh * 0.45, er = 7 * (1 - 0.5 * sq);
  if (shut) { g->drawLine(cx - er, ey, cx + er, ey, col); g->drawLine(cx - er, ey, cx - er + 2, ey + 2, col); g->drawLine(cx + er, ey, cx + er - 2, ey + 2, col); }
  else { g->drawCircle(cx, ey, er, col); g->fillCircle(cx, ey, 3, col); }
  for (int i = 0; i < 4; i++) {
    float x0 = cx - bw * 0.66 + i * bw * 0.44, len = 70 * (1 - 0.7 * sq);
    for (int k = 1; k <= 9; k++) { float yy = cy + 4 + k * len / 9, xx = x0 + sinf(t * 1.6 + k * 0.5 + i) * k * 1.1; g->fillCircle(xx, yy, k % 3 == 0 ? 2 : 1, col); }
  }
}
/* words, wrapped to the screen, in the small square type */
int words(const String &s, int x, int y, int w, uint8_t size, uint16_t col, int maxLines) {
  g->setTextSize(size); g->setTextColor(col); int cw = 6 * size, lh = 9 * size, per = max(1, w / cw), lines = 0; String rest = s;
  while (rest.length() && lines < maxLines) {
    int cut = (int)rest.length() <= per ? (int)rest.length() : rest.lastIndexOf(' ', per); if (cut <= 0) cut = min((int)rest.length(), per);
    g->setCursor(x, y + lines * lh); g->print(rest.substring(0, cut)); rest = rest.substring(cut); rest.trim(); lines++;
  }
  return y + lines * lh;
}
/* how many wait for a touch (large, left) and how many are on their way out of the printer (right) */
void counts() {
  if (!waiting && !printing) return;
  g->setTextSize(3); g->setTextColor(INK); g->setCursor(10, 10); g->print(waiting);
  g->setTextSize(1); g->setTextColor(FAINT); g->setCursor(10, 37); g->print("waiting");
  if (printing) { String n = String(printing); g->setTextSize(2); g->setTextColor(INK); g->setCursor(W - 10 - 12 * n.length(), 10); g->print(n);
    g->setTextSize(1); g->setTextColor(FAINT); g->setCursor(W - 10 - 48, 30); g->print("printing"); }
}
/* alone: choose the next doing when the drift is over, and back to drifting when it is done */
void idleStep(float t) {
  if (doing == DRIFT && t > doingNext) { doing = (Doing)(JET + random(4)); doingAt = t; }
  float len = doing == JET ? 4.2 : doing == WANDER ? 9 : doing == DOZE ? 12 : 67;
  if (doing != DRIFT && t - doingAt > len) { doing = DRIFT; doingNext = t + 10 + random(9); }
}
/* where each doing puts it, and how it looks */
void idlePose(float t, float &x, float &y, float &sq, uint16_t &col, bool &shut, bool &hide) {
  float k = t - doingAt; x = W / 2; y = 110 + sinf(t * 0.9) * 6; sq = 0; col = INK; shut = false; hide = false;
  if (doing == JET) {          // three pulses up, then sinking back
    float p = fmodf(k, 1.4) / 1.4; sq = p < 0.18 ? -0.4 * p / 0.18 : -0.4 * (1 - (p - 0.18) / 0.82);
    y -= sinf(PI * min(1.0f, k / 4.2f)) * 70;
  } else if (doing == WANDER) { // a slow figure of eight
    float a = 2 * PI * k / 9; x += sinf(a) * 46; y += sinf(2 * a) * 16;
  } else if (doing == DOZE) {  // eye shut, dimmed, bubbles going up
    shut = true; col = FAINT; y = 118 + sinf(t * 0.5) * 3;
    for (int i = 0; i < 3; i++) { float b = fmodf(k * 18 + i * 22, 66); g->drawCircle(x + 10 + sinf(k * 2 + i) * 3, y - 34 - b, 1 + i % 2, FAINT); }
  } else if (doing == AWAY) {   // off the top, gone a minute, then sinking back in
    if (k < 3) y -= k * k * 30; else if (k < 63) hide = true; else y = -80 + (y + 80) * min(1.0f, (k - 63) / 4);
  }
}
void frame(float t) {
  g->fillScreen(BLUE);
  for (int i = 0; i < 24; i++) { snowY[i] += 0.15 + (i % 3) * 0.05; snowX[i] += sinf(t + i) * 0.1; if (snowY[i] > H) { snowY[i] = 0; snowX[i] = random(W); } g->drawPixel(snowX[i], snowY[i], FAINT); }
  if (mode == GONE) { /* the splat: what is left of it, spreading */ float k = min(1.0f, (t - t0) / 0.8f);
    for (int i = 0; i < 14; i++) { float an = i * 2 * PI / 14; g->fillCircle(W / 2 + cosf(an) * 20 * (1 + k * 2), 110 + sinf(an) * 6 * (1 + k), 2, FAINT); } }
  else if (mode == IDLE) { float x, y, sq; uint16_t col; bool shut, hide; idlePose(t, x, y, sq, col, shut, hide); if (!hide) jelly(x, y, t, sq, col, shut); }
  else jelly(W / 2, 92 - lift, t, squash, mode == PRINTING && fmodf(t * 8, 2) < 1 ? FAINT : INK, false);
  if (mode == HELD || mode == SQUASHING) {
    int y = 182; if (slip.say.length()) y = words(slip.say, 10, y, W - 20, 2, INK, 4) + 6;
    for (int i = 0; i < slip.n && y < H - 40; i++) y = words(slip.wish[i], 10, y, W - 20, 1, FAINT, 2) + 3;
    g->setTextSize(1); g->setTextColor(FAINT); g->setCursor(10, H - 16); g->print(slip.code);
  }
  counts();
  if (WiFi.status() != WL_CONNECTED) g->drawCircle(W - 10, H - 12, 4, FAINT);
  g->flush();
}

void setup() {
  pinMode(PIN_POWER, OUTPUT); digitalWrite(PIN_POWER, HIGH);
  pinMode(KEY_A, INPUT_PULLUP); if (NG_BUZZ >= 0) { pinMode(NG_BUZZ, OUTPUT); digitalWrite(NG_BUZZ, LOW); }
  pinMode(TP_RST, OUTPUT); digitalWrite(TP_RST, LOW); delay(20); digitalWrite(TP_RST, HIGH); delay(100);
  Wire.begin(TP_SDA, TP_SCL);
  tpWrite(0xFE, 0xFF);   // never asleep, so every read is answered
  tpWrite(0xFB, 0);      // no reset after a touch with no gesture
  tpWrite(0xFC, 0);      // nor after a long hold
  g->begin(); g->fillScreen(BLUE); g->flush();
  pinMode(PIN_BL, OUTPUT); analogWrite(PIN_BL, 200);
  randomSeed(esp_random());
  for (int i = 0; i < 24; i++) { snowX[i] = random(W); snowY[i] = random(H); }
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASS);
}

unsigned long downAt = 0; bool down = false;
void loop() {
  float t = millis() / 1000.0;
  /* every five seconds, what is held (not while a press is under way) */
  if ((mode == IDLE || mode == HELD) && millis() - lastPoll > 5000) {
    lastPoll = millis();
    if (getHeld()) { Mode m = slip.job.length() ? HELD : IDLE; if (m == IDLE && mode != IDLE) { doing = DRIFT; doingNext = t + 8; } mode = m; }
  }
  if (mode == IDLE) idleStep(t);

  int x, y; bool now = touchAt(x, y) || digitalRead(KEY_A) == LOW;
  if (now) lastTouch = millis();
  analogWrite(PIN_BL, millis() - lastTouch > 60000 && mode == IDLE ? 40 : 200);   // dims when left alone
  if (mode == IDLE && now && doing == DOZE) { doing = DRIFT; doingNext = t + 10; }   // a touch wakes it
  if (mode == HELD || mode == SQUASHING) {
    if (now && !down) { down = true; downAt = millis(); buzz(12); }
    if (now && down) { float held = (millis() - downAt) / 900.0; if (held > 0.15) { mode = SQUASHING; squash = min(1.0f, held); } }
    if (!now && down) {
      down = false;
      if (squash >= 1.0) { buzz(60); mode = GONE; t0 = t; act("squash"); }          // held all the way: squashed, let go
      else if (millis() - downAt < 400) { buzz(25); mode = PRINTING; t0 = t; act("print"); } // a press: printed
      else { mode = HELD; }
      if (mode == HELD) squash = 0;
    }
  } else down = false;
  if (mode == SQUASHING && !down) { squash = max(0.0f, squash - 0.08f); if (squash <= 0) mode = HELD; }
  if (mode == PRINTING) { lift += 4 + lift * 0.06; if (lift > 260) { lift = 0; mode = IDLE; doing = DRIFT; doingNext = t + 8; slip = Slip(); lastPoll = 0; } }
  if (mode == GONE && t - t0 > 1.0) { squash = 0; mode = IDLE; doing = DRIFT; doingNext = t + 8; slip = Slip(); lastPoll = 0; }
  frame(t);
  delay(16);
}
