# Devices: the touch screen and the radio

Two small things that sit beside a printer. The touch screen holds each slip until someone decides: one press of the jellyfish prints it, a long press squashes it. The radio sends each slip's signal line over Meshtastic, and signal lines that arrive can be read back into the site.

---

## The touch screen: LilyGO T-Display-S3 (touch)

The screen is blueprint blue with the chalk-white irukandji drifting in it. When a slip is waiting, the jellyfish shows its intention and its four lines, the code at the foot and a dot for each slip in line.

- **One press** (a tap, under half a second): the jellyfish rises off the top of the screen and the slip prints.
- **Press and hold:** the jellyfish flattens under your finger. Hold until it is flat (about a second) and let go: it splats and the slip is deleted. Let go early and it springs back.
- **The numbers at the top:** the large one on the left is how many slips are waiting for a touch. The one on the right is how many are printing or queued at the printer. Nothing waiting, nothing shows.
- **With nothing coming in,** the jellyfish keeps itself busy. Every 10–20 seconds it does one of four things:
  - swims up in three pulses and sinks back;
  - wanders in a slow figure of eight;
  - dozes with its eye shut while bubbles rise (a touch wakes it);
  - swims off the top and stays away for a minute, then sinks back in.

  A new slip brings it straight back.
- Left alone for a minute with nothing waiting, the screen dims.
- A small ring in the bottom corner means it has no Wi-Fi.

The board has no vibration motor of its own. The squash and the bounce are what you feel. For a felt tap, see "A vibration motor" below.

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

### 2. Set up Arduino (once)

1. Install **Arduino IDE 2** from arduino.cc/en/software.
2. Open **File → Preferences**. In **Additional boards manager URLs**, paste:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. Open **Tools → Board → Boards Manager**. Search for **esp32**, then install **esp32 by Espressif Systems**.
4. Open **Tools → Manage Libraries**. Install:
   - **GFX Library for Arduino** (by Moon On Our Nation)
   - **ArduinoJson** (by Benoit Blanchon), version 7

### 3. Load the sketch

1. Open `src/touch/novel-touch/novel-touch.ino` from this repository. Download the folder from GitHub, or use your clone in GitHub Desktop.
2. At the top, replace the three `NG_` lines with the three you copied.
3. Put your Wi-Fi name and password in `WIFI_SSID` and `WIFI_PASS`. The Wi-Fi must be 2.4 GHz.

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
3. If it will not connect:
   1. Hold the **BOOT** button (the one beside the USB port).
   2. Press and release **RST** (the other button).
   3. Let go of BOOT.
   4. Upload again.
   5. Press RST once when the upload finishes.

The screen turns blue and the jellyfish appears. Within five seconds of Wi-Fi joining, it shows any waiting slip.

### 6. Try it

1. On the site, make a piece and print it to this printer.
2. The jellyfish appears with its words. Tap it: the slip prints.
3. Print another. Hold the jellyfish until it is flat and let go: it is squashed, and nothing prints.

The side button (KEY, GPIO 14) works like a press on the screen.

### A vibration motor (optional)

1. Get a small coin vibration motor module with its own driver (a "vibration motor module", 3–5 V, with a signal pin).
2. Wire its **VCC** to **3V3**, its **GND** to **GND**, and its **IN** to **GPIO 43** (or 44).
3. In the sketch, set `#define NG_BUZZ 43`.
4. Upload again.

A tap now gives a short knock, a print a firmer one, and a squash a long one.

### If something is wrong

| What you see | What to do |
|---|---|
| A ring in the top corner | No Wi-Fi. Check the name and password. Use 2.4 GHz only. |
| Blue, but no slip ever appears | Check the three `NG_` lines. Is TOUCH SCREEN ON for this printer? Is the slip going to this printer? |
| A blank or white screen | Check that PSRAM is set to OPI PSRAM and the board is ESP32S3 Dev Module. |
| Touch does nothing | Use the touch version of the board. The side button still works. The sketch keeps the touch chip awake and stops it resetting itself mid-hold, following CST816_TouchLib (github.com/mjdonders/CST816_TouchLib). That library is worth trying if a board still misses touches. |

---

## The radio: LilyGO T-Beam Supreme (Meshtastic, 915 MHz)

With the radio on the same Wi-Fi as the printer's Raspberry Pi (no cable: the Pi's USB is taken by the printer), every slip that printer prints also goes out over the mesh as its signal line: `ng:` followed by about 200 characters, which is everything needed to make the piece again. A signal can also be sent to the radios without printing.

Any Meshtastic user on the channel receives the line. Paste it into the site, and the piece comes back: its words, its life, its place and its marks. When online, the photograph is fetched again too.

**Before you power the T-Beam, screw the antenna on.** Running the radio without an antenna can damage it.

### 1. Put Meshtastic on it

1. Screw on the LoRa antenna (the larger one).
2. On a computer, open **flasher.meshtastic.org** in Chrome or Edge.
3. Plug the T-Beam Supreme in by USB-C.
4. Under **Device**, choose **LILYGO T-Beam Supreme**.
5. Under **Firmware**, choose the latest **Stable**.
6. Click **Flash**, then pick the port.
7. Tick **Full Erase and Install** (the first time only).
8. Click **Continue** and wait for it to finish.

If no port appears:

1. Hold the **BOOT** button.
2. Press **RST**.
3. Let go of BOOT.
4. Try again.

### 2. Set its region and channel

1. Install the **Meshtastic** app on your phone (App Store or Google Play).
2. Turn on Bluetooth, open the app and pair with the T-Beam. The PIN shows on its screen.
3. Open **Settings → LoRa → Region** and choose **ANZ** (915 MHz).
4. Save. The radio restarts.
5. Leave **Channels** on the default (LongFast) to reach everyone nearby. For a private mesh:
   1. Add a channel with its own name and a random key.
   2. Make it the primary channel.
   3. Share its QR code with the other radios.

The Pi sends on the primary channel.

### 3. Put it on the Pi's Wi-Fi

The T-Beam and the Pi talk over the Wi-Fi they share. The radio needs only power: a USB-C charger, a power bank, or its own 18650 battery.

Do this last. Once the radio's Wi-Fi is on, its Bluetooth turns off (Meshtastic runs one or the other), so finish step 2 first.

1. In the Meshtastic app, open **Settings → Network**.
2. Turn **WiFi enabled** on.
3. Type the Wi-Fi name (**SSID**) and password (**PSK**). Use the Wi-Fi the Pi is on, 2.4 GHz.
4. Save. The radio restarts and joins the Wi-Fi. Its screen shows its address (for example `192.168.1.37`). It also answers to the name `meshtastic.local`.

### 4. Point the Pi at it

1. On the Pi, install Meshtastic's library:

   ```sh
   sudo -u da python3 -m pip install --user meshtastic
   ```

2. Open the settings file:

   ```sh
   sudo nano /etc/da-pull.env
   ```

3. Set this line, then save (Ctrl+O, Enter, Ctrl+X):

   ```
   DA_MESH=tcp:meshtastic.local
   ```

   If the name is not found, use the address on the radio's screen instead, such as `DA_MESH=tcp:192.168.1.37`. Then fix that address in your router, so it never changes. The router setting is usually called a DHCP reservation.

4. Restart the printer's service:

   ```sh
   sudo systemctl restart da-pull
   ```

5. Check that the Pi can see the radio:

   ```sh
   sudo -u da python3 -m meshtastic --host meshtastic.local --info
   ```

   It prints the radio's details. If it hangs, the two are not on the same Wi-Fi.

**Moving to another Wi-Fi.** The radio and the Pi must move together. The Pi learns a new Wi-Fi from a phone (see the receiver's README, "Wi-Fi from a phone"). To tell the radio:

1. Plug the radio into a computer by USB.
2. Open **client.meshtastic.org** in Chrome and connect by **Serial**.
3. Change **Network → WiFi** and save.

**Reading messages on your phone.** With its Bluetooth off, the phone app reaches this radio over Wi-Fi: add it by its address, `meshtastic.local` or its IP. Or keep a second radio for your phone on Bluetooth, on the same channel.

### 5. Turn it on for the printer

1. On the approval page, find the printer.
2. Click **MESH OFF**. It changes to **MESH ON**.
3. Click **TEST PRINT**.

The slip prints, and the Meshtastic app on your phone shows a test line arrive.

If nothing arrives, check the log on the Pi:

```sh
journalctl -u da-pull -f
```

Look for `mesh not sent` and the reason. `Connection refused` or a timeout means the Pi cannot reach the radio: check that the radio's Wi-Fi is on, that both are on the same Wi-Fi, and the address in `DA_MESH`.

### 6. Send and receive signals

**Send:**

1. On the site, go to print.
2. Under the piece, press the signal key (the small waves).
3. The signal sheet shows the piece as a QR code and as its `ng:` line, with its size out of 200. From there you can:
   - **send to the radios**: goes out from every printer whose MESH is on, with nothing printed;
   - **copy** the line;
   - **share** it, to put it in any message, including the Meshtastic app itself.

A printed slip sends its signal on its own.

**Receive:**

1. When an `ng:` line arrives in the Meshtastic app, copy it.
2. On the site, press the signal key and paste the line into the field.

Pasting anywhere on the site works too. The piece is rebuilt and opens in print, ready to print, save or change.

---

## Notes

- Neither device needs a cable to the Pi. The touch screen talks to this site over Wi-Fi. The radio talks to the Pi over the shared Wi-Fi, and the Pi talks to this site.
- Both devices talk only to this site's own server. The touch screen uses its own token, which is separate from the Pi's token. Turning TOUCH SCREEN OFF stops it at once.
- A held slip that nobody presses expires after a day, like any other.
- `src/touch/` is the sketch's source. It is not part of the website's build.
