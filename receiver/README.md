# The receiver: a printer at a partner place

A Raspberry Pi beside a partner's receipt printer. It asks novel.global for the next slip sent to that place, prints it, and says how it went. It only pulls, so it needs no open ports and nothing installed by staff, and it works behind any shop's Wi-Fi.

```text
phone ── DIRECT ACTION ──► novel.global ── approval ──► the printer's queue
                                                            ▲
Raspberry Pi: pull.py ── asks every few seconds ────────────┘
     │
     ├── printd on 127.0.0.1:8080 ── USB ── Epson TM-T88V   (the slip)
     └── Meshtastic radio, optional ── USB                    (the slip's mesh line)
```

Two open-source projects do the work with the hardware:

- **printd** (<https://github.com/HansF/printd>, MIT) drives the ESC/POS printer. It is installed straight from GitHub, as it is not on PyPI. `pull.py` sends each slip's bytes to its `POST /print/raw`.
- **Meshtastic's Python library** (<https://github.com/meshtastic/python>, GPL-3.0) sends a slip's mesh line over a LoRa radio. It runs as its own program on the Pi, apart from the website's code.

## What you need

- A Raspberry Pi 3 Model A+ (or any Pi with Wi-Fi), a 5 V 2.5 A supply and a 32 GB microSD card.
- An Epson TM-T88V with its PS-180 supply, 80 mm paper, and a USB-A to USB-B cable.
- *Optional:* a Meshtastic radio with a USB cable.
- *Optional:* a push button with two female jumper wires, to turn the Pi off and on again.

## 1. The printer

Load the paper, connect the PS-180 supply, then hold **FEED** while switching the printer on. It prints a self-test. Note the paper width and the dots it lists. 80 mm paper should show about 512 dots. If it shows 576, change `dots` for `80` in `src/config.js`.

## 2. The Pi

1. With Raspberry Pi Imager, write **Raspberry Pi OS Lite (64-bit)** to the card. In the Imager's settings:
   - set the Wi-Fi of the place;
   - set a user and password;
   - turn on **SSH**, with a public key if you have one.
2. Start the Pi, then connect from a computer on the same Wi-Fi: `ssh <user>@<the Pi's name>.local`.
3. Make a user for the bridge, and let it use the printer:

   ```sh
   sudo apt update && sudo apt install -y python3-venv git
   sudo useradd --system --create-home --groups lp,dialout da
   echo 'SUBSYSTEM=="usbmisc", KERNEL=="lp*", GROUP="lp", MODE="0660"' | sudo tee /etc/udev/rules.d/99-escpos.rules
   sudo udevadm control --reload && sudo udevadm trigger
   ```

4. Plug the printer's USB cable into the Pi. `ls -l /dev/usb/lp0` should show the group `lp`.

## 3. printd

```sh
sudo mkdir -p /opt/printd && sudo chown da /opt/printd
sudo -u da python3 -m venv /opt/printd/venv
sudo -u da /opt/printd/venv/bin/pip install git+https://github.com/HansF/printd
```

Write its settings, with a long random key of your own in place of `<a long random key>`:

```sh
sudo tee /etc/printd.env >/dev/null <<'EOF'
PRINTD_HOST=127.0.0.1
PRINTD_PORT=8080
PRINTD_PRINTER_KIND=usb
PRINTD_DEVICE=/dev/usb/lp0
PRINTD_PRINT_WIDTH=512
PRINTD_API_KEY=<a long random key>
EOF
sudo chmod 640 /etc/printd.env && sudo chgrp da /etc/printd.env
```

Then keep it running:

```sh
sudo tee /etc/systemd/system/printd.service >/dev/null <<'EOF'
[Unit]
Description=printd: the receipt printer, on this Pi only
After=network.target
[Service]
User=da
EnvironmentFile=/etc/printd.env
WorkingDirectory=/opt/printd
ExecStart=/opt/printd/venv/bin/python -m printd
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now printd
curl -s http://127.0.0.1:8080/healthz
```

The last line should answer with `"ok": true`.

## 4. The bridge

1. On novel.global, open `/admin`, then **PRINTERS**, and choose this place's **PAIR A PRINTER**. It shows three lines once: `DA_SERVER`, `DA_PRINTER` and `DA_TOKEN`.
2. On the Pi:

   ```sh
   sudo mkdir -p /opt/da-pull && sudo chown da /opt/da-pull
   sudo -u da git clone --depth 1 https://github.com/novelglobal/front /tmp/front && sudo cp /tmp/front/receiver/pull.py /opt/da-pull/
   sudo cp /tmp/front/receiver/da-pull.env.example /etc/da-pull.env && sudo chmod 640 /etc/da-pull.env && sudo chgrp da /etc/da-pull.env
   sudo nano /etc/da-pull.env
   ```

3. In the editor, paste the three lines from the approval page, set `PRINTD_API_KEY` to printd's key, and save.
4. Start it:

   ```sh
   sudo cp /tmp/front/receiver/da-pull.service /etc/systemd/system/
   sudo systemctl enable --now da-pull
   journalctl -u da-pull -f
   ```

The printer prints a **READY** slip with this place's name. On the approval page, **TEST PRINT** prints a short slip within a few seconds.

## 5. Optional: a Meshtastic radio

```sh
sudo -u da python3 -m pip install --user meshtastic
```

Then set `DA_MESH=auto` in `/etc/da-pull.env` for a radio plugged into the Pi by USB (best: no address to change from place to place), or its device, such as `/dev/ttyACM0`. For a radio on the same Wi-Fi instead, `DA_MESH=tcp:auto` finds it by the name it announces on that Wi-Fi, wherever it is (it needs `avahi-utils`, on Raspberry Pi OS already). Turn **MESH ON** for this printer on the approval page, and run `sudo systemctl restart da-pull`. Each slip's mesh line, 200 bytes at most, now also goes out on the radio's primary channel.

## 6. Wi-Fi from a phone, and turning it off

For a printer that moves from place to place. One line sets up both, on this Pi or on FOE. Run it again at any time to update:

```sh
curl -fsSL https://raw.githubusercontent.com/novelglobal/front/staging/receiver/setup/install.sh | sh
```

**Wi-Fi from a phone** (`setup/wifi.py`). When the Pi has found no Wi-Fi it knows for two minutes, it opens its own, `<NAME> SETUP`, and the printer prints its password and a code to scan. Join it with a phone: a page opens by itself (or go to `http://10.42.0.1`). Choose the Wi-Fi, type its password and press **JOIN**. The printer prints **ON WI-FI** once the Pi has joined, and the Pi remembers it. Every Wi-Fi the Pi already knows is kept. If nobody comes, the setup Wi-Fi closes after ten minutes and the Wi-Fi it knows is looked for again. It is built on NetworkManager's own hotspot, so it needs Raspberry Pi OS Bookworm or newer, and nothing else to install. `python3 wifi.py --demo` shows the page on a computer, at `http://127.0.0.1:8080`.

**Moving it to another Wi-Fi**, even while it is on one. Any of three ways opens the setup Wi-Fi and prints its slip:

- **CHANGE WI-FI** on the approval page, under **PRINTERS** (shown once the Pi has the latest bridge).
- **The plug**: plug it in, and within a minute unplug it and plug it in again. A start cut short is noticed at the next one; no clock or screen is needed.
- `sudo python3 /opt/wifi-setup/wifi.py --now`, over ssh (`ssh novel@da-novelglobal.local` finds it on any Wi-Fi by its name).

**Forgetting a Wi-Fi.** The same page lists every Wi-Fi the Pi keeps under **SAVED · TICK TO FORGET**: tick one and press **FORGET TICKED**, and the Pi never joins it by itself again. (The touch screen has its own list, ticked the same way on its own setup page; a forgotten one stays forgotten there too, even after a restart.)

Its page marks a Wi-Fi too **WEAK** for the touch screen, which has a smaller radio: pick a strong one. The **ON WI-FI** slip carries a code a phone's camera reads to join the same Wi-Fi, so the screen can be set to match (`WIFI_SHARE=0` in `/etc/wifi-setup.env` leaves it off). The approval page's printer card shows which Wi-Fi the Pi and the screen are each on, how strongly, the Pi's address, and whether they share one.

**Turning it off**, so its card is never cut off mid-write:

- **TURN OFF** on the approval page, under **PRINTERS**, shows while the Pi is listening. The printer prints **TURNING OFF**, and the Pi shuts down. Unplug it once the green light stops. A TURN OFF that the Pi has not heard within two minutes is dropped, so a printer moved and switched on later is never turned off by it.
- **A push button** on pins 5 and 6 (GPIO 3 and ground) turns the Pi off, and on again. This is the Pi's own `gpio-shutdown`, switched on by the line above after one restart.
- **FOE**: a USB stick with a file called `OFF` on it.

## When something is wrong

| What you see | What to do |
|---|---|
| `the token was refused` in the log | Make a new token on the approval page and put it in `/etc/da-pull.env` |
| `printd answered 401` | `PRINTD_API_KEY` in `/etc/da-pull.env` and `/etc/printd.env` must match |
| `no signal` in the log | The Wi-Fi dropped. The bridge keeps asking, and prints what is waiting when the signal returns |
| Nothing prints, and no errors | Check that the slip was approved. A printer set to print after approval holds each slip until then |
| The Wi-Fi it knows is out of range | With the setup line above, it opens `<NAME> SETUP` after two minutes and prints how to join it. Without it: a network cable, then `sudo nmcli device wifi connect "<name>" password "<password>"` |

## Privacy

The Pi keeps nothing. Each slip is fetched, printed and forgotten, and the server keeps only that it was printed, for a week. The token lets this Pi read its own queue and nothing else. Unpairing it on the approval page stops it at once.
