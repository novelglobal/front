#!/bin/sh
# Setup for any of our Pis, the novel.global receiver or FOE: Wi-Fi chosen from a phone, and safe ways to turn it off.
#   curl -fsSL https://raw.githubusercontent.com/novelglobal/front/staging/receiver/setup/install.sh | sh
#
# 1. Wi-Fi from a phone: with no Wi-Fi for two minutes, the Pi opens one of its own, <NAME> SETUP, and the printer
#    prints its password and a code to scan. A page on the phone chooses the Wi-Fi. Known Wi-Fi is kept (setup/wifi.py).
# 2. An off button: a push button on pins 5 and 6 turns the Pi off safely, and on again (the Pi's own gpio-shutdown).
# 3. On the novel.global receiver: TURN OFF on the approval page, and the latest bridge (pull.py, da-off.path).
# Run it again at any time to update; the setup Wi-Fi's password is kept.
set -e
BASE=https://raw.githubusercontent.com/novelglobal/front/staging/receiver
command -v nmcli >/dev/null || { echo "This needs NetworkManager: Raspberry Pi OS Bookworm or newer."; exit 1; }

# 1. Wi-Fi from a phone
# dnsmasq-base hands the phone its address; it is often here already
dpkg -s dnsmasq-base >/dev/null 2>&1 || { sudo apt-get update -q && sudo apt-get install -y -q dnsmasq-base; }
sudo mkdir -p /opt/wifi-setup /etc/NetworkManager/dnsmasq-shared.d
sudo curl -fsSL "$BASE/setup/wifi.py" -o /opt/wifi-setup/wifi.py
sudo curl -fsSL "$BASE/setup/wifi-setup.service" -o /etc/systemd/system/wifi-setup.service
if [ ! -f /etc/wifi-setup.env ]; then
  NAME=$(sed -n 's/^DA_PRINTER=//p' /etc/da-pull.env 2>/dev/null | tr a-z A-Z)
  if [ -z "$NAME" ] && [ -f /opt/foe/foe.py ]; then NAME=FOE; fi
  [ -n "$NAME" ] || NAME=$(hostname | tr a-z A-Z)
  PASS=$(tr -dc 'abcdefghijkmnpqrstuvwxyz23456789' </dev/urandom | head -c 10)
  printf 'WIFI_NAME=%s\nWIFI_PASSWORD=%s\n' "$NAME" "$PASS" | sudo tee /etc/wifi-setup.env >/dev/null
  sudo chmod 600 /etc/wifi-setup.env
fi
# while the setup Wi-Fi is open, every address a phone asks for points to this Pi, so the page opens by itself
echo 'address=/#/10.42.0.1' | sudo tee /etc/NetworkManager/dnsmasq-shared.d/wifi-setup.conf >/dev/null

# 2. The off button
CFG=/boot/firmware/config.txt; [ -f "$CFG" ] || CFG=/boot/config.txt
grep -q '^dtoverlay=gpio-shutdown' "$CFG" || printf '\n[all]\ndtoverlay=gpio-shutdown\n' | sudo tee -a "$CFG" >/dev/null

# 3. The novel.global receiver, where there is one
if [ -f /opt/da-pull/pull.py ]; then
  sudo curl -fsSL "$BASE/pull.py" -o /opt/da-pull/pull.py
  sudo curl -fsSL "$BASE/da-pull.service" -o /etc/systemd/system/da-pull.service
  sudo curl -fsSL "$BASE/da-off.path" -o /etc/systemd/system/da-off.path
  sudo curl -fsSL "$BASE/da-off.service" -o /etc/systemd/system/da-off.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now da-off.path
  sudo systemctl restart da-pull
fi

sudo systemctl daemon-reload
sudo systemctl enable wifi-setup >/dev/null 2>&1
sudo systemctl restart wifi-setup
echo
echo "Done. With no Wi-Fi it can join, this Pi opens: $(sudo sed -n 's/^WIFI_NAME=//p' /etc/wifi-setup.env) SETUP"
echo "Its password: $(sudo sed -n 's/^WIFI_PASSWORD=//p' /etc/wifi-setup.env)   (the printer prints it too, when needed)"
echo "The off button works after the next restart: sudo reboot"
