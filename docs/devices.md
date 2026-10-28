# Devices: the touch screen and the radio

Two small things that sit beside a printer. The touch screen holds each slip until someone decides: one press of the jellyfish prints it, a long press squashes it. The radio sends each slip's signal line over Meshtastic, and signal lines that arrive can be read back into the site.

---

## The touch screen: LilyGO T-Display-S3 (touch)

The screen lies on its side: one flat blueprint blue, chalk lines and dots, the site's own type (Archivo Narrow and Departure Mono). The irukandji is the one on the site: the box bell, the eye of dots, four tentacles of beads. A small screen bands any shading or glow, so nothing on it is shaded. Its light is a scatter of fine dots round the bell, and marine snow drifts up.

**When a slip arrives**
- The jellyfish swims up from below. The camera goes in close to its eye, then draws back.
- It stays on the left. On the right are the slip's heading in large type, its first line, and its code.
- At the top right: how many slips are waiting, and how many are printing.
- A second ring breathes round its pupil, and now and then one thin ring goes out from it. That is the cue to touch it.

**One press prints it** (a tap, under half a second)
- Rings go out, its eye opens wide, and light runs down the tentacles.
- Over about four seconds, the paper feeds out of its bell, line by line, as the printer prints it.
- A line for the radios alone ("to the radios") has no paper: thin rings go out instead, and nothing prints.
- The paper tears off and falls, and the jellyfish jets away.

**Holding squashes it** (about three seconds)
- It is pressed slowly flatter and shakes harder. Its eye squeezes shut (> <) and beads are pressed out of its sides. With a vibration motor, you feel a knock at each third.
- Let go early and it springs back.
- Hold on and it pops. The bell breaks into pieces, its eye rolls out with an X, and the tentacles snap.
- A current sweeps the pieces away, and a fish drawn in one line swims through eating them.
- The slip is deleted.

**After either one,** it stays away for 15 seconds.

**With nothing waiting**
- The screen sleeps, dark, for 30 seconds.
- Then it wakes for 10 seconds: novel.global's code, large enough to scan, with the jellyfish swimming round behind it.
- Each wake shows it differently: circling the code, passing close by the camera, or rising from below for a look.
- A touch wakes it early. A slip arriving wakes it at once.

**Signs at the bottom right**
- A small ring: no Wi-Fi.
- A ring with **?**: the site refused its token. Turn TOUCH SCREEN off and on again, and give the screen the new lines.

The board has no vibration motor of its own, so the squash and the bounce are what you feel. For a felt tap, see "A vibration motor" below.

### 1. Turn it on for the printer

1. Open the approval page (`/admin`) and sign in.
2. Find the printer this screen sits beside.
3. Click **TOUCH SCREEN OFF**. It changes to **TOUCH SCREEN ON** and shows three lines once:

   ```
   #define NG_HOST "…"
   #define NG_PRINTER "…"
   #define NG_TOKEN "…"
   ```

4. Copy all three now. The token is not shown again. If you lose it, click OFF then ON for a new one.

While the screen is on, that printer holds every slip for the screen. **AUTO** is turned off.

**Staging and live are separate.** The staging site keeps its own stories and queue, so nothing made there reaches a real printer. The Pi prints from **novel.global**. So, for real use:
- turn the screen on from novel.global's approval page;
- give the screen **those** three lines, with `NG_HOST "novel.global"`;
- make the pieces on novel.global.

A screen given staging's lines shows staging's slips, and pressing them prints nothing, because no Pi reads staging.

### 2. Set up Arduino (once)

1. Install **Arduino IDE 2** from arduino.cc/en/software.
2. Open **File → Preferences**. In **Additional boards manager URLs**, paste:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. Open **Tools → Board → Boards Manager**. Search for **esp32**, then install **esp32 by Espressif Systems**.
4. Open **Tools → Manage Libraries**. Install:
   - **GFX Library for Arduino** (by Moon On Our Nation)
   - **ArduinoJson** (by Benoit Blanchon), version 7

**LilyGO's leaflet** warns about two things:

- **Replacing TFT_eSPI, and "do not upgrade":** this does not apply here. That is for LilyGO's own examples, which draw with the TFT_eSPI library. This sketch draws with GFX Library for Arduino instead, so you don't need their TFT_eSPI, and an installed one does no harm. If Arduino offers to update libraries, saying yes is fine.
- **Entering upload mode by hand:** this does apply when the port does not show. See step 5.

### 3. Load the sketch

Arduino keeps every sketch in a folder with the same name as the file: `novel-touch.ino` must sit in a folder called `novel-touch`. If the file is on its own, Arduino offers to make that folder for you, and that is fine.

**If you downloaded `novel-touch.ino` on its own:**

1. In Arduino IDE, click **File → Open…**.
2. Choose `novel-touch.ino` (in Downloads) and click **Open**.
3. Arduino asks: *"The file novel-touch.ino needs to be inside a sketch folder named novel-touch. Create this folder, move the file, and continue?"* Click **OK**.
4. The sketch opens in a new window, with a tab called `novel-touch.ino`. The file now lives in `Downloads/novel-touch/novel-touch.ino`, and that is where it is saved from now on.

**Or, without any folder question:**

1. In Arduino IDE, click **File → New Sketch**. A new window opens with an empty `setup()` and `loop()`.
2. Click in the code, press **Ctrl+A** (**Cmd+A** on a Mac), then **Delete**. The window is empty.
3. Open `novel-touch.ino` on GitHub (`src/touch/novel-touch/novel-touch.ino`). Click the **Copy raw file** button (two overlapping squares, top right of the code).
4. Back in Arduino, press **Ctrl+V** (**Cmd+V**).
5. Click **File → Save As…**, name it `novel-touch` and click **Save**.

**Then give it the Wi-Fi and the three lines,** in either of two ways.

**From a phone (easiest; no typing in Arduino).** Upload the sketch as it is. With no Wi-Fi or printer set, it opens its own Wi-Fi instead, and the screen shows a code to scan and the password:

1. Point your phone's camera at the code on the screen, and tap to join **NOVEL TOUCH**. Or join it in **Settings → Wi-Fi**; the password is **novelglobal**.
2. A page opens by itself. If it doesn't, open **192.168.4.1** in the browser.
3. Choose your Wi-Fi, which must be 2.4 GHz, and type its password.
4. Paste the three lines from the approval page into the box below. Paste all three as they are.
5. Tap **Save and restart**. The screen restarts, joins your Wi-Fi, and goes to work.

The page also shows the printer and the Wi-Fis the screen already knows:
- If your Wi-Fi isn't in the list, tap **Scan again**.
- To change nothing, tap **Done, change nothing**, or press **BOOT** once on the board.

**Or in the sketch.** At the top, change the words between the quotation marks, and keep the quotation marks:

```
#define WIFI_SSID  "your wi-fi"     → your Wi-Fi's name, exactly, capitals and spaces included (2.4 GHz)
#define WIFI_PASS  "its password"   → its password
#define NG_HOST    "novel.global"   → from the approval page
#define NG_PRINTER "printer id"     → from the approval page
#define NG_TOKEN   "touch token"    → from the approval page
```

The approval page gave you the last three ready-made, so you can paste them over these three lines whole.

`NG_HOST` is whichever site's approval page you used. A token made on the staging site works only with the staging host. The touch screen works on novel.global only once staging is merged into main.

Press **Ctrl+S** (**Cmd+S**) to save.

**Upside down?** If the picture is upside down for the way the screen sits, change `#define NG_TURN 1` to `3` and upload again.

### 4. Choose the board

Under **Tools**, set:

| Setting | Value |
|---|---|
| Board | ESP32S3 Dev Module |
| USB CDC On Boot | Enabled |
| Flash Size | 16MB (128Mb) |
| Partition Scheme | 16M Flash (3MB APP/9.9MB FATFS) |
| PSRAM | OPI PSRAM |
| Port | the one that appears when the board is plugged in |

### 5. Upload

1. Plug the board in by USB-C, using a data cable.
2. Click **Upload** (the → arrow).
3. If no port shows under **Tools → Port**, or the upload says it cannot connect, put the board in upload mode by hand. The button names are printed on the board beside them.
   1. Keep the USB cable plugged in.
   2. Press and hold **BOOT**.
   3. While still holding BOOT, press and release **RST**.
   4. Let go of BOOT. The screen stays dark; that is upload mode.
   5. Choose the port that now shows under **Tools → Port**.
   6. Click **Upload**.
   7. When it says **Done uploading**, press **RST** once. The sketch starts.

The screen turns blue and a small jellyfish dozes while it joins the Wi-Fi. Within a few seconds of joining, it shows any waiting slip, or wakes once to show novel.global's code and then sleeps.

### 6. Try it

1. On the site, make a piece and print it to this printer.
2. The jellyfish appears with its words. Tap it: the slip prints.
3. It stays away for 15 seconds. Print another, and hold the jellyfish for about three seconds until it pops: it is squashed, and nothing prints.

The side button marked KEY (GPIO 14) works like a press on the screen. BOOT (GPIO 0), held three seconds, opens setup.

### Moving it to another Wi-Fi

It remembers up to five Wi-Fis and joins whichever one it finds. To add one:

- **Hold the BOOT button for three seconds**, at any time. A ring of dots fills round the word *setup*, then the screen shows **NOVEL TOUCH** and its code.
- Where it can't find a Wi-Fi it knows, it keeps looking and says which one at the bottom of the screen ("looking for …"). It never opens setup by itself; hold BOOT.

Setup never comes from the touch screen, so people playing with it can't change anything. The side button marked **KEY** is a press, like the screen.

Then follow "From a phone" above. The same page can forget old Wi-Fis, and takes three new lines if the token changes. The setup Wi-Fi closes after ten minutes, and the screen restarts.

The Pi learns a new Wi-Fi in the same way (see the receiver's README, "Wi-Fi from a phone"). Moving the printer means doing both. The two don't depend on each other, so either can go first.

### A vibration motor (optional)

1. Get a small coin vibration motor module with its own driver (a "vibration motor module", 3–5 V, with a signal pin).
2. Wire its **VCC** to **3V3**, its **GND** to **GND**, and its **IN** to **GPIO 43** (or 44).
3. In the sketch, set `#define NG_BUZZ 43`.
4. Upload again.

A tap now gives a short knock, a print a firmer one, and a squash a long one.

### If something is wrong

| What you see | What to do |
|---|---|
| A ring in the bottom-right corner | No Wi-Fi. Hold BOOT three seconds and set it from a phone. Use 2.4 GHz only. |
| A ring with ? | The site refused the token. Turn TOUCH SCREEN off and on again on the approval page, and paste the new lines on the setup page. |
| Blue, but no slip ever appears | Check the three `NG_` lines. Is TOUCH SCREEN ON for this printer? Is the slip going to this printer? |
| A blank or white screen | Press RST once after uploading. Check that PSRAM is set to OPI PSRAM and the board is ESP32S3 Dev Module. Still blank? Flash LilyGO's factory test (in the `firmware` folder of github.com/Xinyuan-LilyGO/T-Display-S3) to check the board itself. |
| Errors that name `Arduino_ESP32PAR8Q` when compiling | Update GFX Library for Arduino to its newest version. If the error stays, set the board package to 2.0.17: Tools → Board → Boards Manager → esp32, choose 2.0.17, then Install. |
| Touch does nothing | Use the touch version of the board. The side button still works. The sketch keeps the touch chip awake and stops it resetting itself mid-hold, following CST816_TouchLib (github.com/mjdonders/CST816_TouchLib). That library is worth trying if a board still misses touches. |

---

## The radio: LilyGO T-Beam Supreme (Meshtastic, 915 MHz)

**What it does.** Every slip this printer prints also goes out over the mesh as one line: `ng:` and up to 200 characters, which is everything needed to make the piece again. Any Meshtastic radio on the same channel receives it. Pasted into the site, the line becomes the piece again: its words, its life, its place, its marks, and online its photograph.

**How it connects.** The radio and the Pi share a Wi-Fi; no cable runs between them. The Pi's only free USB port is taken by the printer. The Pi hands each line to the radio over that Wi-Fi.

**What you need**
- the T-Beam Supreme and its LoRa antenna;
- a USB-C cable that carries data;
- a computer with Chrome or Edge;
- your phone with the **Meshtastic** app;
- power for the radio afterwards: a USB-C charger, a power bank, or an 18650 battery in its holder;
- the name and password of the Wi-Fi the Pi is on. It must be the main network, not a guest network, which keeps devices apart.

**Screw the antenna on before the radio is ever powered.** Running it without one can damage the radio.

Work through the steps in order. Each one ends with a check; don't go on until it passes.

### A. Put Meshtastic on it (computer, about 5 minutes)

1. Screw the antenna on.
2. Plug the radio into the computer by USB-C.
3. Open **flasher.meshtastic.org** in Chrome or Edge.
4. Click **Device** and choose **LILYGO T-Beam Supreme**.
5. Click **Firmware** and choose the newest version marked **Stable**.
6. Click **Flash**. The browser asks for a port; choose the one that appeared when you plugged the radio in, and click **Connect**.
7. Turn on **Full Erase and Install**, then click **Erase Flash and Install** (the wording can vary slightly).
8. Wait for it to finish (a few minutes).

**If no port appears:** keep it plugged in, hold **BOOT**, press and release **RST**, let go of BOOT, then click Flash again.

**Check:** the radio's little screen shows **Meshtastic**, then a page with its short name (four letters).

### B. Set its region, channel and name (phone, over Bluetooth)

1. On your phone, turn on Bluetooth and open the **Meshtastic** app.
2. Tap the **+** or **Connect** button, choose the radio, and type the **PIN** shown on the radio's screen.
3. Open **Settings → LoRa → Region**, choose **ANZ**, and save. The radio restarts.
4. Optional: open **Settings → User** and give it a name, such as **novel.global printer**.
5. Leave **Channels** on the default (**LongFast**), so anyone nearby on the default channel hears it.
   - For a private mesh instead: add a channel with its own name, tap **Generate** for a new key, and make it the **primary** channel. Then share its QR code with the other radios.
   - The Pi always sends on the primary channel.

**Check:** the radio's screen shows **ANZ** and the channel name (LongFast unless you changed it).

### C. Put the radio on the Pi's Wi-Fi (phone, last thing over Bluetooth)

The Meshtastic firmware runs Wi-Fi or Bluetooth, not both: once Wi-Fi is on, the phone can no longer reach the radio by Bluetooth. That is why B comes first.

1. In the app, open **Settings → Network**.
2. Turn on **WiFi enabled**.
3. Type the Wi-Fi name in **SSID** and the password in **PSK**, exactly. It must be the 2.4 GHz network the Pi is on.
4. Save. The radio restarts.

**Check:** within a minute, the radio's screen shows a Wi-Fi page with an address, such as `192.168.1.37`. Write the address down.

### D. Point the Pi at the radio (on the Pi)

Open a terminal on the Pi: on a screen and keyboard, or by `ssh` from your computer as you did when you set the Pi up. Then:

1. Make sure Python's installer is there (Raspberry Pi OS Lite leaves it out):

   ```sh
   sudo apt update && sudo apt install -y python3-pip
   ```

   Then install Meshtastic's library for the printer's user. This takes several minutes on a Pi:

   ```sh
   sudo -u da python3 -m pip install --user --break-system-packages meshtastic
   ```

   `--break-system-packages` is needed on Raspberry Pi OS Bookworm, which otherwise refuses with *externally-managed-environment*. With `--user`, the library goes only into the printer user's own folder, and the system's Python is untouched.

2. Check the Pi can reach the radio:

   ```sh
   sudo -u da python3 -m meshtastic --host meshtastic.local --info
   ```

   **Check:** it prints the radio's details: its name, `ANZ`, and its channels. If it says the name can't be found, try the address from step C instead of `meshtastic.local`. If it hangs, the two are not on the same Wi-Fi, or the network keeps devices apart (a guest network).

3. Send one line by hand:

   ```sh
   sudo -u da python3 -m meshtastic --host meshtastic.local --sendtext "novel.global test"
   ```

4. Tell the printer's service where the radio is:

   ```sh
   sudo nano /etc/da-pull.env
   ```

   Find the line `DA_MESH=` and make it:

   ```
   DA_MESH=tcp:meshtastic.local
   ```

   If step 2 only worked with the address, use the address instead, such as `DA_MESH=tcp:192.168.1.37`. Then give the radio a fixed address in your router; the setting is usually called a **DHCP reservation**. Save with **Ctrl+O**, **Enter**, then **Ctrl+X**.

5. Restart the service:

   ```sh
   sudo systemctl restart da-pull
   ```

### E. Turn it on for the printer (approval page)

1. On the approval page, find the printer and click **MESH OFF**. It changes to **MESH ON**.
2. Click **TEST PRINT**.

**Check:** a test slip prints, and nothing goes wrong in the Pi's log:

```sh
journalctl -u da-pull -n 30
```

- `DA-TEST printed` with no `mesh not sent` line before it: the line went out to the radio.
- `mesh not sent` with `Connection refused` or a timeout: the Pi can't reach the radio. Go back to D2.

**Seeing the lines.** A radio doesn't show what it sends itself. The Meshtastic app shows messages from *other* radios on the same channel, and lines the Pi hands to this radio aren't echoed back to it. To see them:
- **A second radio (the reliable way):** any Meshtastic radio paired to your phone by Bluetooth, set to **ANZ** on the **same channel**, within range. Each slip's `ng:` line appears in its **Messages → LongFast** (or your channel). Nearby public nodes on LongFast receive them too.
- **From the Pi**, to watch the radio's traffic as it happens:

  ```sh
  sudo -u da python3 -m meshtastic --host 192.168.1.182 --listen
  ```

  Press Ctrl+C to stop.

**The channel.** One channel always exists from the start, even though the app shows nothing until a radio is connected:

| | Default |
|---|---|
| Index | 0 (primary) |
| Name | blank, shown as **LongFast** |
| Preset | LONG_FAST |
| Key | the public default (`AQ==`) |
| Region | ANZ (915–928 MHz) |
| Hops | 3 |

To see this radio's channels, and the link that lets another radio join the same one:

```sh
sudo -u da python3 -m meshtastic --host 192.168.1.182 --info
```

Look for **Channels:** and **Primary channel URL** (`https://meshtastic.org/e/#…`). Open that link on the phone with the second radio, or turn it into a QR code, and that radio joins the same channel.

**A private channel** (optional; only radios with its key read it). Make it from the Pi, then share the new URL:

```sh
sudo -u da python3 -m meshtastic --host 192.168.1.182 --ch-index 0 --ch-set name novelglobal --ch-set psk random
sudo -u da python3 -m meshtastic --host 192.168.1.182 --info
```

Every radio that should read the lines must join with that URL.

### F. Using it

**Every printed slip** sends its line by itself, once MESH is on. With the touch screen, that is when the jellyfish is pressed.

**Sending without printing:**
1. On the site, go to print.
2. Press the signal key (the small waves) under the piece. The sheet shows its QR code, its `ng:` line, and its size out of 200.
3. Choose one:
   - **Send to the radios:** it goes out from every printer whose MESH is on. With the touch screen on, it waits there like a slip, marked **to the radios**. A press sends it, with rings going out and nothing printed; holding squashes it.
   - **Copy** the line.
   - **Share** the line into any message, including the Meshtastic app.

**Receiving:**
1. When an `ng:` line arrives in the Meshtastic app, copy it.
2. On the site, press the signal key and paste it into the field, or paste it anywhere on the site.

The piece is rebuilt and opens in print, ready to print, save or change. The site doesn't listen to the radio by itself; a line comes in when someone pastes it.

### Moving the printer

The Pi, the radio and the touch screen each need the new Wi-Fi:
- **The Pi:** from a phone; see the receiver's README, "Wi-Fi from a phone".
- **The touch screen:** from a phone; see "Moving it to another Wi-Fi" above.
- **The radio:** plug it into a computer, open **client.meshtastic.org** in Chrome, connect by **Serial**, then change **Config → Network → WiFi** and save. You can't do this by Bluetooth while its Wi-Fi is on.

If the radio's address changes and you used an address rather than `meshtastic.local`, update `DA_MESH` on the Pi.

### Sense check

- **Legal:** 915 MHz with region ANZ is licence-free in Australia, within Meshtastic's own limits.
- **Public:** on the default channel, anyone nearby with a radio can read the lines. They hold a piece's words and its place, rounded to about 10 m. For a closed group, use a private channel (B5).
- **Size:** 200 characters fits in one Meshtastic message (about 230 bytes at most). Longer pieces lose their longest words first, until the line fits.
- **Reach:** a few kilometres in the open, much less through buildings. Each radio passes messages on, up to three hops by default.
- **If the radio is off,** the slip still prints; only its line is lost, and the log says `mesh not sent`.

---

## Notes

- Neither device needs a cable to the Pi. The touch screen talks to this site over Wi-Fi. The radio talks to the Pi over the shared Wi-Fi, and the Pi talks to this site.
- Both devices talk only to this site's own server. The touch screen uses its own token, which is separate from the Pi's token. Turning TOUCH SCREEN OFF stops it at once.
- A held slip that nobody presses expires after a day, like any other.
- `src/touch/` is the sketch's source. It is not part of the website's build.
