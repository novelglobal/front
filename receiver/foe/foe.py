#!/usr/bin/env python3
"""FOE: a receipt printer that prints what it is given, no internet needed.

Plug in a USB stick: every picture (.png .jpg .jpeg .gif .bmp .webp), text (.txt .md), PDF and raw printer file (.bin) on it
prints, once, on the Epson on /dev/usb/lp0. Files sent to the Pi by Bluetooth land in the inbox and print the same way.
Standard library, Pillow, and pdftoppm for PDFs.

  sudo python3 foe.py --test     a test receipt
  sudo python3 foe.py FILE ...   print files now
  sudo python3 foe.py            watch for sticks and the inbox (what the service runs)
"""
import glob, hashlib, os, shutil, subprocess, sys, tempfile, textwrap, time

PRINTER = os.environ.get('FOE_PRINTER', '/dev/usb/lp0')
NAME = os.environ.get('FOE_NAME', 'FOE')
DOTS = int(os.environ.get('FOE_DOTS', '512'))      # TM-T88V, 80 mm paper: 512 dots across
COLS = int(os.environ.get('FOE_COLS', '42'))       # characters a line in its standard font
STATE = '/var/lib/foe'
INBOX = os.path.join(STATE, 'inbox')
DONE = os.path.join(STATE, 'printed.txt')
MNT = '/mnt/foe'
PICS = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')
TEXT = ('.txt', '.md')
ESC, GS = b'\x1b', b'\x1d'


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def send(data):
    with open(PRINTER, 'wb') as p:
        p.write(data)


def cut():
    return b'\n' * 4 + GS + b'V\x42\x00'


def raster(img):
    """a picture as the printer's own raster (GS v 0), in bands, dithered to black and white"""
    from PIL import Image
    img = img.convert('L')
    if img.width != DOTS:
        img = img.resize((DOTS, max(1, round(img.height * DOTS / img.width))))
    img = img.convert('1')                         # Floyd–Steinberg
    w8 = DOTS // 8
    out = b''
    for top in range(0, img.height, 255):
        band = img.crop((0, top, DOTS, min(img.height, top + 255)))
        h = band.height
        bits = bytes(b ^ 0xFF for b in band.tobytes())   # PIL: 1 = white; printer: 1 = black
        out += GS + b'v0\x00' + bytes([w8 & 255, w8 >> 8, h & 255, h >> 8]) + bits
    return out


def header():
    return ESC + b'@' + ESC + b'a\x01' + ESC + b'E\x01' + NAME.encode() + ESC + b'E\x00' + b'\n' + ESC + b'a\x00'


def text_bytes(s):
    lines = []
    for line in s.replace('\r\n', '\n').split('\n'):
        lines += textwrap.wrap(line, COLS) or ['']
    return '\n'.join(lines).encode('cp437', 'replace') + b'\n'


def print_file(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == '.bin':
        send(open(path, 'rb').read()); return True
    if ext in PICS:
        from PIL import Image
        with Image.open(path) as im:
            im.seek(0)
            send(header() + raster(im) + cut())
        return True
    if ext in TEXT:
        send(header() + text_bytes(open(path, encoding='utf-8', errors='replace').read()) + cut()); return True
    if ext == '.pdf':
        from PIL import Image
        with tempfile.TemporaryDirectory() as d:
            subprocess.run(['pdftoppm', '-r', '180', '-png', '-l', '10', path, os.path.join(d, 'p')], check=True)
            pages = sorted(glob.glob(os.path.join(d, 'p*.png')))
            for i, pg in enumerate(pages):
                with Image.open(pg) as im:
                    send((header() if i == 0 else b'') + raster(im) + (cut() if i == len(pages) - 1 else b''))
        return True
    return False


def printed():
    try:
        return set(open(DONE).read().split())
    except FileNotFoundError:
        return set()


def mark(h):
    with open(DONE, 'a') as f:
        f.write(h + '\n')


def digest(path):
    return hashlib.sha1(open(path, 'rb').read()).hexdigest()


def wanted(path):
    n = os.path.basename(path)
    return not n.startswith('.') and n.lower().endswith(PICS + TEXT + ('.pdf', '.bin'))


def run_batch(files, once=True):
    seen = printed()
    for f in sorted(files):
        if not wanted(f):
            continue
        try:
            h = digest(f)
            if once and h in seen:
                continue
            log('printing', f)
            if print_file(f):
                mark(h); seen.add(h)
        except Exception as e:  # one bad file never stops the rest
            log('skipped', f, e)


def stick_files(root):
    out = []
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if not x.startswith('.') and x != 'System Volume Information']
        out += [os.path.join(d, f) for f in files]
    return out


def in_use():
    """the disks this Pi is running from (or has mounted itself): never treated as a stick to print from"""
    disks = set()
    try:
        for line in open('/proc/mounts'):
            dev = line.split()[0]
            if dev.startswith('/dev/sd'):
                disks.add(dev.rstrip('0123456789'))
    except OSError:
        pass
    return disks


def watch():
    os.makedirs(INBOX, exist_ok=True); os.makedirs(MNT, exist_ok=True)
    known = set()
    log(NAME, 'watching for USB sticks and', INBOX)
    while True:
        busy = in_use()
        devs = {d for d in (set(glob.glob('/dev/sd[a-z][0-9]')) or set(glob.glob('/dev/sd[a-z]'))) if d.rstrip('0123456789') not in busy}
        for dev in sorted(devs - known):
            time.sleep(1.5)
            if subprocess.run(['mount', '-o', 'ro', dev, MNT]).returncode == 0:
                log('stick', dev)
                try:
                    run_batch(stick_files(MNT))
                finally:
                    subprocess.run(['umount', MNT])
                    log('done: the stick can come out')
        known = devs
        files = [os.path.join(INBOX, f) for f in os.listdir(INBOX) if os.path.isfile(os.path.join(INBOX, f))]
        if files:
            run_batch(files, once=False)
            for f in files:
                os.makedirs(os.path.join(INBOX, 'printed'), exist_ok=True)
                shutil.move(f, os.path.join(INBOX, 'printed', os.path.basename(f)))
        time.sleep(2)


if __name__ == '__main__':
    os.makedirs(STATE, exist_ok=True)
    if sys.argv[1:] == ['--test']:
        send(header() + text_bytes(f'{NAME} is ready.\nUSB stick: pictures, text, PDF, .bin\nprint once each.\n' + time.strftime('%d.%m.%y %H:%M')) + cut())
        log('test receipt sent to', PRINTER)
    elif sys.argv[1:]:
        run_batch(sys.argv[1:], once=False)
    else:
        watch()
