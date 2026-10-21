#!/bin/sh
# FOE: sets up a Raspberry Pi to print what is put on a USB stick (and, with BT=1, what a phone sends by Bluetooth)
# on an Epson receipt printer on USB. Run on the Pi:
#   curl -fsSL https://raw.githubusercontent.com/novelglobal/front/staging/receiver/foe/install.sh | sh
#   curl -fsSL https://raw.githubusercontent.com/novelglobal/front/staging/receiver/foe/install.sh | BT=1 sh
# For Wi-Fi chosen from a phone and an off button, run receiver/setup/install.sh afterwards.
set -e
BASE=https://raw.githubusercontent.com/novelglobal/front/staging/receiver/foe
sudo apt-get update
sudo apt-get install -y python3-pil poppler-utils
sudo mkdir -p /opt/foe /var/lib/foe/inbox
sudo curl -fsSL "$BASE/foe.py" -o /opt/foe/foe.py
sudo curl -fsSL "$BASE/foe.service" -o /etc/systemd/system/foe.service
if [ "${BT:-0}" = 1 ]; then
  sudo apt-get install -y bluez bluez-tools obexpushd
  sudo mkdir -p /etc/systemd/system/bluetooth.service.d
  printf '[Service]\nExecStart=\nExecStart=/usr/libexec/bluetooth/bluetoothd --compat\nExecStartPost=/bin/sh -c "sleep 2; chmod 777 /var/run/sdp"\n' | sudo tee /etc/systemd/system/bluetooth.service.d/foe.conf >/dev/null
  sudo sed -i 's/^#\{0,1\} *DiscoverableTimeout *=.*/DiscoverableTimeout = 0/' /etc/bluetooth/main.conf
  sudo curl -fsSL "$BASE/foe-bt.service" -o /etc/systemd/system/foe-bt.service
fi
sudo systemctl daemon-reload
sudo systemctl enable --now foe
[ "${BT:-0}" = 1 ] && sudo systemctl restart bluetooth && sudo systemctl enable --now foe-bt
sudo python3 /opt/foe/foe.py --test || echo "No printer on /dev/usb/lp0 yet: plug it in, then: sudo python3 /opt/foe/foe.py --test"
echo "FOE is set up."
