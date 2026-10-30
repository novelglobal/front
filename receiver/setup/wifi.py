#!/usr/bin/env python3
"""Wi-Fi setup: a printer that finds no Wi-Fi opens one of its own, so a phone can tell it which to join.

No screen, keyboard or computer. When this Pi has had no network for two minutes, it opens a Wi-Fi called
<NAME> SETUP, and the printer prints a slip with its password and a code to scan. Join it with a phone: a page opens by
itself (or go to http://10.42.0.1), choose the Wi-Fi and type its password. The Pi joins it, remembers it, and prints a
slip to say so. Every Wi-Fi it already knows is kept: this only adds. If nobody comes, the setup Wi-Fi closes after ten
minutes and the Wi-Fi it knows is looked for again, so a router that was slow to start is still found.

To move it to another Wi-Fi, three ways: CHANGE WI-FI on the approval page (the bridge leaves a note in /run/da-pull/wifi);
plug it in and, within two minutes, unplug it and plug it in again (a start cut short is noticed at the next); or
sudo python3 wifi.py --now. Its page marks a Wi-Fi too weak for the touch screen, and the slip saying it joined carries a
code a phone's camera reads to join the same Wi-Fi (WIFI_SHARE=0 in /etc/wifi-setup.env leaves it off).

Built on NetworkManager's own hotspot (Raspberry Pi OS Bookworm and later). Standard library only. Runs as root.
Settings come from /etc/wifi-setup.env (receiver/setup/install.sh writes it); slips go through printd where this Pi
has it (/etc/printd.env), else straight to the printer.

  sudo python3 wifi.py          what the service runs
  sudo python3 wifi.py --now    open the setup Wi-Fi now (it drops the Wi-Fi this Pi is on, and an ssh with it)
  python3 wifi.py --demo        the page alone, on http://127.0.0.1:8080, touching nothing: to see it on a computer
"""
import base64, html, json, os, subprocess, sys, time, urllib.parse, urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

NAME = os.environ.get('WIFI_NAME', 'PRINTER').upper()[:24]
SSID = f'{NAME} SETUP'
PASS = os.environ.get('WIFI_PASSWORD', '')
IFACE = os.environ.get('WIFI_IFACE', 'wlan0')
WAIT = int(os.environ.get('WIFI_WAIT', '120'))       # seconds with no network before the setup Wi-Fi opens
WINDOW = int(os.environ.get('WIFI_WINDOW', '600'))   # seconds it stays open before the known Wi-Fi is looked for again
SLIPS = os.environ.get('WIFI_SLIPS', '1') == '1'
DEVICE = os.environ.get('FOE_PRINTER', '/dev/usb/lp0')
PRINTD = f"http://{os.environ.get('PRINTD_HOST', '127.0.0.1')}:{os.environ['PRINTD_PORT']}" if os.environ.get('PRINTD_PORT') else ''
PRINTD_KEY = os.environ.get('PRINTD_API_KEY', '')
COLS = 42
CON = 'wifi-setup'   # NetworkManager's name for the setup Wi-Fi
MINE = 'setup: '     # and the start of the name of each Wi-Fi added from the page
ADDR = '10.42.0.1'
DEMO = '--demo' in sys.argv
SHARE = os.environ.get('WIFI_SHARE', '1') == '1'                    # the joined Wi-Fi's code on its slip
WANT = os.environ.get('WIFI_WANT', '/run/da-pull/wifi')           # CHANGE WI-FI, from the approval page through the bridge
QUICK = os.environ.get('WIFI_QUICK', '/var/lib/wifi-setup/quick')  # written at start, gone after two minutes up
WEAK = 50   # NetworkManager's percent below which the touch screen, a smaller radio, may not reach it
slipped = False      # the setup slip prints once a start, however often the setup Wi-Fi opens
failed = ''          # why the setup Wi-Fi last failed to open, printed once a start


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def stamp():
    return datetime.now().strftime('%d.%m.%y %H:%M')


# ───────── NetworkManager, through nmcli ─────────
def nm(*args, timeout=60):
    """nmcli's exit code and output; it never raises"""
    try:
        r = subprocess.run(['nmcli', *args], capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout + r.stderr
    except (OSError, subprocess.SubprocessError) as e:
        return 1, str(e)


def fields(line):
    """one line of nmcli -t, split at its colons, with its \\: and \\\\ undone"""
    out, cur, esc = [], '', False
    for ch in line:
        if esc:
            cur += ch; esc = False
        elif ch == '\\':
            esc = True
        elif ch == ':':
            out.append(cur); cur = ''
        else:
            cur += ch
    return out + [cur]


def online():
    """on a Wi-Fi or a cable, other than its own setup Wi-Fi"""
    _, out = nm('-t', '-f', 'NAME,TYPE,STATE', 'connection', 'show', '--active', timeout=15)
    return any(len(f) >= 3 and f[0] != CON and f[1] in ('802-11-wireless', '802-3-ethernet') and f[2] == 'activated'
               for f in map(fields, out.splitlines()))


def scan():
    """the Wi-Fi around: each name once, strongest first, with its signal and whether it has a password"""
    _, out = nm('-t', '-f', 'SSID,SIGNAL,SECURITY', 'device', 'wifi', 'list', 'ifname', IFACE, '--rescan', 'yes', timeout=40)
    best = {}
    for f in map(fields, out.splitlines()):
        if len(f) < 3 or not f[0] or f[0] == SSID:
            continue
        sig = int(f[1]) if f[1].isdigit() else 0
        if f[0] not in best or sig > best[f[0]][0]:
            best[f[0]] = (sig, f[2] not in ('', '--'))
    return sorted(((n, s, locked) for n, (s, locked) in best.items()), key=lambda x: -x[1])[:20]


def make_setup():
    """the setup Wi-Fi as NetworkManager keeps it: WPA2 with its password, its own address, never started by itself"""
    nm('connection', 'delete', CON, timeout=20)
    code, out = nm('connection', 'add', 'type', 'wifi', 'ifname', IFACE, 'con-name', CON, 'autoconnect', 'no', 'ssid', SSID,
                   '802-11-wireless.mode', 'ap', '802-11-wireless.band', 'bg', 'ipv4.method', 'shared', 'ipv4.addresses', f'{ADDR}/24',
                   'ipv6.method', 'disabled', 'wifi-sec.key-mgmt', 'wpa-psk', 'wifi-sec.psk', PASS,
                   'wifi-sec.proto', 'rsn', 'wifi-sec.pairwise', 'ccmp', 'wifi-sec.group', 'ccmp', timeout=20)
    if code:
        log('the setup Wi-Fi could not be made:', out.strip()[:300]); fail(out)
    return code == 0


def setup_wifi(on):
    code, out = nm('--wait', '50', 'connection', 'up' if on else 'down', CON, timeout=60)
    if on and code:
        log('the setup Wi-Fi did not open:', out.strip()[:300]); fail(out)
    return code == 0


def fail(out):
    """the first time a start the setup Wi-Fi cannot open, the printer says so, with nmcli's reason"""
    global failed
    if failed or not SLIPS:
        return
    failed = ' '.join(out.split())[:160] or 'no reason given'
    send(slip(NAME, ['NO WI-FI', 'THE SETUP WI-FI DID NOT OPEN', '', failed, '', stamp()]))


def join(name, pw, hidden):
    """add this Wi-Fi to those this Pi knows, and join it; one that fails is taken out again"""
    con = MINE + name
    nm('connection', 'delete', con, timeout=20)
    args = ['connection', 'add', 'type', 'wifi', 'ifname', IFACE, 'con-name', con, 'ssid', name, 'connection.autoconnect', 'yes']
    if pw:
        args += ['wifi-sec.key-mgmt', 'wpa-psk', 'wifi-sec.psk', pw]
    if hidden:
        args += ['802-11-wireless.hidden', 'yes']
    code, out = nm(*args, timeout=20)
    if code:
        log('not added:', out.strip()[:300])
        return False
    for _ in range(3):  # the radio was a hotspot a moment ago: it looks around first
        nm('device', 'wifi', 'rescan', 'ifname', IFACE, timeout=20)
        time.sleep(6)
        code, out = nm('--wait', '45', 'connection', 'up', con, timeout=60)
        if code == 0:
            return True
        log('could not join', name, out.strip()[:300])
        if 'ecrets' in out:   # the password was wrong: trying again will not help
            break
    nm('connection', 'delete', con, timeout=20)
    return False


# ───────── slips ─────────
def qr_code(data):
    """ESC/POS's own QR code (GS ( k): model 2, 6 dots a module, middle error correction"""
    d = data.encode('utf-8'); n = len(d) + 3
    return (b'\x1d(k\x04\x001A2\x00' + b'\x1d(k\x03\x001C\x06' + b'\x1d(k\x03\x001E1'
            + b'\x1d(k' + bytes([n & 255, n >> 8]) + b'1P0' + d + b'\x1d(k\x03\x001Q0')


def wifi_qr(ssid, pw):
    """the code a phone's camera reads to join a Wi-Fi"""
    e = lambda s: ''.join('\\' + c if c in '\\;,:"' else c for c in s)
    return f'WIFI:T:WPA;S:{e(ssid)};P:{e(pw)};;'


def slip(head, lines, qr=None, at=0):
    """a short slip: its heading, its lines, and a code to scan before line `at`"""
    out = bytearray(b'\x1b@\x1bt\x00\x1ba\x01\x1bE\x01' + head.encode('ascii', 'replace') + b'\n\x1bE\x00\x1ba\x00\n')
    for i, line in enumerate(lines):
        if qr and i == at:
            out += b'\x1ba\x01' + qr_code(qr) + b'\n\x1ba\x00'
        while len(line) > COLS:
            out += line[:COLS].encode('ascii', 'replace') + b'\n'; line = line[COLS:]
        out += line.encode('ascii', 'replace') + b'\n'
    return bytes(out + b'\x1bd\x04\x1dVB\x00')


def send(data):
    if DEMO:
        log('slip:', len(data), 'bytes'); return
    try:
        if PRINTD:
            req = urllib.request.Request(PRINTD + '/print/raw', data=json.dumps({'bytes_b64': base64.b64encode(data).decode()}).encode(), method='POST',
                                         headers={'content-type': 'application/json', **({'authorization': f'Bearer {PRINTD_KEY}'} if PRINTD_KEY else {})})
            urllib.request.urlopen(req, timeout=30).read()
            return
        for i in range(5):  # the printer may be busy with another slip for a moment
            try:
                with open(DEVICE, 'wb') as p:
                    p.write(data)
                return
            except OSError:
                if i == 4:
                    raise
                time.sleep(2)
    except Exception as e:  # a slip that does not print never stops the Wi-Fi
        log('no slip:', e)


# ───────── the page a phone sees ─────────
CSS = """:root{color-scheme:light dark;--fg:#141414;--bg:#f2f1ed;--line:rgba(20,20,20,.16)}
@media (prefers-color-scheme:dark){:root{--fg:#ebe9e3;--bg:#0e0f10;--line:rgba(235,233,227,.16)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.03em}
main{max-width:420px;margin:0 auto;padding:28px 16px 40px}h1{font-size:12px;font-weight:600;letter-spacing:.14em;margin:0 0 20px}
.n{display:flex;align-items:center;gap:12px;padding:14px 2px;border-bottom:1px solid var(--line)}.n:first-of-type{border-top:1px solid var(--line)}
.n input{margin:0;accent-color:currentColor}.n span{flex:1;overflow-wrap:anywhere}.n i{font-style:normal;opacity:.5;letter-spacing:0}
.f{display:block;margin:20px 0 0;font-size:11px;letter-spacing:.14em}
.f input{display:block;width:100%;margin:6px 0 0;padding:12px;font:15px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:inherit;background:transparent;border:1px solid var(--line);border-radius:4px}
button{width:100%;margin:26px 0 0;padding:15px;font:inherit;font-weight:600;letter-spacing:.16em;color:var(--bg);background:var(--fg);border:0;border-radius:4px}
.e{margin:0 0 18px;padding:10px 12px;border:1px solid currentColor;border-radius:4px}p{margin:0 0 12px}"""


def page(body):
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{html.escape(NAME)} · WI-FI</title><style>{CSS}</style></head><body><main><h1>{html.escape(NAME)} · WI-FI</h1>{body}</main></body></html>')


def bars(sig):
    return '▂▄▆█'[:max(1, min(4, (sig + 24) // 25))]


def choose_page(nets, error):
    rows = ''.join(f'<label class="n"><input type="radio" name="net" value="{html.escape(n, True)}"{" checked" if i == 0 else ""}>'
                   f'<span>{html.escape(n)}</span><i>{"" if locked else "OPEN "}{"WEAK " if s < WEAK else ""}{bars(s)}</i></label>' for i, (n, s, locked) in enumerate(nets))
    tip = '<p>PICK A STRONG ONE: THE SCREEN NEEDS TO REACH IT TOO.</p>' if any(s < WEAK for _, s, _ in nets) else ''
    return page((f'<p class="e">{html.escape(error)}</p>' if error else '') + tip + f'<form method="post" action="/join">{rows}'
                '<label class="f">OTHER<input type="text" name="other" autocomplete="off" autocapitalize="off" spellcheck="false"></label>'
                '<label class="f">PASSWORD<input type="password" name="pw" autocomplete="off"></label><button>JOIN</button></form>')


def joining_page(name):
    return page(f'<p>JOINING {html.escape(name)}.</p><p>THE PRINTER PRINTS A SLIP ONCE IT IS ON.</p>')


class Page(BaseHTTPRequestHandler):
    nets, error, note, want = [], '', '', None   # error: why the last Wi-Fi was not joined; note: a form to fix, shown once
    timeout = 15   # a phone that goes quiet never holds the page up

    def log_message(self, *a):
        pass

    def reply(self, code, body='', where=None):
        data = body.encode('utf-8')
        self.send_response(code)
        self.send_header('content-type', 'text/html; charset=utf-8'); self.send_header('content-length', str(len(data))); self.send_header('cache-control', 'no-store')
        if where:
            self.send_header('location', where)
        self.end_headers(); self.wfile.write(data)

    def do_GET(self):
        # a phone checking for the internet asks for its own address: sent here instead, it opens this page by itself
        if not DEMO and (self.headers.get('host') or '').split(':')[0] != ADDR:
            return self.reply(302, where=f'http://{ADDR}/')
        if self.path.split('?')[0] != '/':
            return self.reply(404)
        self.reply(200, choose_page(Page.nets, Page.note or Page.error)); Page.note = ''

    def do_POST(self):
        q = urllib.parse.parse_qs(self.rfile.read(min(int(self.headers.get('content-length') or 0), 4096)).decode('utf-8', 'replace'))
        other, net, pw = (q.get('other') or [''])[0].strip(), (q.get('net') or [''])[0], (q.get('pw') or [''])[0]
        name = other or net
        if not name or len(name.encode()) > 32:
            Page.note = 'CHOOSE A WI-FI.'
        elif pw and not 8 <= len(pw) <= 63:
            Page.note = 'A WI-FI PASSWORD HAS 8 TO 63 CHARACTERS.'
        else:
            Page.want = (name, pw, bool(other) and all(n != name for n, _, _ in Page.nets))
            return self.reply(200, joining_page(name))
        self.reply(303, where='/')


def serve(nets, error='', forever=False):
    """the page, until a Wi-Fi is chosen or its time is up: the choice, or None"""
    Page.nets, Page.error, Page.note, Page.want = nets, error, '', None
    srv = None
    for _ in range(10):  # the setup Wi-Fi's address can take a moment to appear
        try:
            srv = HTTPServer(('127.0.0.1', 8080) if DEMO else (ADDR, 80), Page); break
        except OSError as e:
            log('the page is not open yet:', e); time.sleep(1)
    if not srv:
        return None
    srv.timeout = 1
    end = time.time() + WINDOW
    try:
        while Page.want is None and (forever or time.time() < end):
            srv.handle_request()
    finally:
        srv.server_close()
    return Page.want


# ───────── the round: the setup Wi-Fi open, a choice, joined ─────────
def setup_round():
    """True once a Wi-Fi is joined; False if nobody came; None if the setup Wi-Fi could not open"""
    global slipped
    if not os.path.exists(f'/sys/class/net/{IFACE}'):
        log('no Wi-Fi on this Pi:', IFACE); return None
    nets = scan()   # looked at before the radio becomes a hotspot, as it cannot look around while it is one
    if not make_setup() or not setup_wifi(True):
        return None
    log('the setup Wi-Fi is open:', SSID)
    if SLIPS and not slipped:
        slipped = True
        send(slip(NAME, ['NO WI-FI', '', f'1  JOIN  {SSID}', f'   PASSWORD  {PASS}', '', f'2  A PAGE OPENS. IF NOT: {ADDR}',
                         '3  CHOOSE THE WI-FI, TYPE ITS PASSWORD', '', stamp()], qr=wifi_qr(SSID, PASS), at=5))
    error = ''
    while True:
        want = serve(nets, error)
        time.sleep(2)   # the phone gets its answer before the setup Wi-Fi closes
        setup_wifi(False)
        if not want:
            return False
        name, pw, hidden = want
        log('joining', name)
        if join(name, pw, hidden):
            log('on', name)
            if SLIPS:
                share = SHARE and pw
                send(slip(NAME, ['ON WI-FI', name, 'REMEMBERED'] + (['', 'SCAN TO JOIN THE SAME WI-FI', '(FOR THE SCREEN, OR A PHONE)'] if share else []) + ['', stamp()],
                          qr=wifi_qr(name, pw) if share else None, at=4))
            return True
        if SLIPS:
            send(slip(NAME, ['COULD NOT JOIN', name, 'CHECK ITS PASSWORD, THEN JOIN', SSID, 'AGAIN', '', stamp()]))
        error = f'COULD NOT JOIN {name}. CHECK ITS PASSWORD.'
        if not setup_wifi(True):
            return False


def quick_start():
    """True when the last start was cut short: plugged back in within two minutes of being plugged in. No clock is needed
    (a Pi has none that survives a move): the mark left at start is only taken away once it has been up two minutes"""
    try:
        bid = open('/proc/sys/kernel/random/boot_id').read().strip()
    except OSError:
        return False
    try:
        prev = open(QUICK).read().strip()
    except OSError:
        prev = ''
    try:
        os.makedirs(os.path.dirname(QUICK), exist_ok=True)
        with open(QUICK, 'w') as f:
            f.write(bid)
        os.sync()
    except OSError:
        return False
    return bool(prev) and prev != bid


def up_long():
    """the mark taken away once this start has lasted two minutes"""
    try:
        if float(open('/proc/uptime').read().split()[0]) > 120 and os.path.exists(QUICK):
            os.remove(QUICK); os.sync()
    except (OSError, ValueError):
        pass


def asked():
    """CHANGE WI-FI from the approval page: the note, taken"""
    try:
        if os.path.exists(WANT):
            os.remove(WANT); return True
    except OSError:
        pass
    return False


def main():
    if DEMO:
        log('the page, as a phone sees it: http://127.0.0.1:8080')
        while True:
            name, pw, hidden = serve([('Hehe', 84, True), ('Telstra5G-2A1F', 61, True), ('Library Free Wi-Fi', 33, False)], forever=True)
            log('chosen:', name, '(with a password)' if pw else '(no password)', '(hidden)' if hidden else '')
    if len(PASS) < 8:
        log('WIFI_PASSWORD, of 8 or more characters, is missing from /etc/wifi-setup.env'); return 2
    setup_wifi(False)   # a setup Wi-Fi left open by an earlier run is closed
    force, lost = '--now' in sys.argv or quick_start(), None
    if force:
        log('opening the setup Wi-Fi now')
    log('watching the network; the setup Wi-Fi opens after', WAIT, 'seconds without one')
    while True:
        up_long()
        if asked():
            log('CHANGE WI-FI, from the approval page'); force = True
        if not force and online():
            lost = None; time.sleep(5); continue
        lost = lost or time.time()
        if not force and time.time() - lost < WAIT:
            time.sleep(5); continue
        force = False
        joined = setup_round()
        # nobody came: the Wi-Fi it knows gets a minute, then the setup Wi-Fi again; one that could not open, ten minutes
        lost = None if joined else time.time() - WAIT + (60 if joined is False else 600)


if __name__ == '__main__':
    sys.exit(main())
