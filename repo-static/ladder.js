/* A Moog ladder filter for the radio's voices, as an audio worklet. After Aaron Krajeski's model, which he placed under no
   copyright ("You may use it however you might like"), as collected in github.com/ddiakopoulos/MoogLadders (Unlicense).
   Four one-pole stages, the input pushed through tanh, the last stage fed back: resonance near 1 sings, drive above 1 blows
   the input out. Parameters: cutoff (Hz), resonance (0 to 1.2), drive (0.1 to 10) */
class Ladder extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'cutoff', defaultValue: 1000, minValue: 20, maxValue: 20000 }, { name: 'resonance', defaultValue: 0.1, minValue: 0, maxValue: 1.2 }, { name: 'drive', defaultValue: 1, minValue: 0.1, maxValue: 10 }];
  }
  /* keep: one ladder shared by many voices stays when nothing feeds it for a while */
  constructor(o) { super(); this.keep = !!(o && o.processorOptions && o.processorOptions.keep); this.s = new Float64Array(5); this.d = new Float64Array(4); this.seen = false; this.idle = 0; this.lc = -1; this.lr = -1; this.g = 0; this.gr = 0; }
  coef(c, r) {
    if (c === this.lc && r === this.lr) return; this.lc = c; this.lr = r;
    const wc = 2 * Math.PI * Math.min(c, sampleRate * 0.45) / sampleRate, w2 = wc * wc, w3 = w2 * wc, w4 = w3 * wc;
    this.g = 0.9892 * wc - 0.4342 * w2 + 0.1381 * w3 - 0.0202 * w4;
    this.gr = r * (1.0029 + 0.0526 * wc - 0.926 * w2 + 0.0218 * w3);
  }
  process(inputs, outputs, p) {
    const inp = inputs[0], out = outputs[0]; if (!out || !out.length) return true;
    /* a voice played once: when nothing feeds it any more and its tail has rung out, it goes */
    if (!inp || !inp.length) { if (!this.keep && this.seen && ++this.idle > 200) return false; } else { this.seen = true; this.idle = 0; }
    const x = inp && inp[0], o = out[0], n = o.length, s = this.s, d = this.d;
    const C = p.cutoff, R = p.resonance, D = p.drive;
    for (let i = 0; i < n; i++) {
      this.coef(C.length > 1 ? C[i] : C[0], R.length > 1 ? R[i] : R[0]); const drv = D.length > 1 ? D[i] : D[0];
      const v = x ? x[i] : 0; const g = this.g;
      s[0] = Math.tanh(drv * (v - 4 * this.gr * (s[4] - v)));
      for (let k = 0; k < 4; k++) { s[k + 1] = g * (0.3 / 1.3 * s[k] + 1 / 1.3 * d[k] - s[k + 1]) + s[k + 1]; d[k] = s[k]; }
      o[i] = s[4];
    }
    for (let c = 1; c < out.length; c++) out[c].set(o);
    return true;
  }
}
registerProcessor('ladder', Ladder);
