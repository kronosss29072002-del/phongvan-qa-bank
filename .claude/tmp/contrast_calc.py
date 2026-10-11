#!/usr/bin/env python3
# WCAG contrast computation for OKLCH design tokens (light + dark).
# OKLCH -> OKLab -> LMS -> linear sRGB -> sRGB hex -> WCAG 2.x relative luminance.
# Also auto-fits chroma into sRGB gamut when clipping detected.
import math

def oklch_to_srgb(L, C, hdeg):
    h = math.radians(hdeg)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    def gamma(c):
        return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    vals = [gamma(r), gamma(g), gamma(bb)]
    clipped = any(v < -0.0005 or v > 1.0005 for v in vals)
    return clipped, [min(1.0, max(0.0, v)) for v in vals]

def fit_gamut(L, C, hdeg):
    """Reduce chroma until the color fits sRGB."""
    c = C
    while c > 0.004:
        clipped, vals = oklch_to_srgb(L, c, hdeg)
        if not clipped:
            return c, vals
        c -= 0.003
    clipped, vals = oklch_to_srgb(L, c, hdeg)
    return c, vals

def vals_to_hex(vals):
    return "#" + "".join(f"{round(v * 255):02X}" for v in vals)

def luminance(hexv):
    hexv = hexv.lstrip("#")
    lin = []
    for i in (0, 2, 4):
        c = int(hexv[i:i+2], 16) / 255
        lin.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = lin
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(h1, h2):
    l1, l2 = luminance(h1), luminance(h2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)

# Hue plan: primary h=230 (azure/sky blue), accent h=58 (amber-orange), neutrals h=238 (blue-grey).
LIGHT = {
    "bg":            (0.972, 0.007, 238),
    "surface":       (1.000, 0.000, 0),
    "text":          (0.235, 0.032, 238),
    "text-muted":    (0.505, 0.038, 238),
    "primary":       (0.478, 0.145, 230),
    "primary-btn":   (0.455, 0.150, 230),
    "fg-on-primary": (0.975, 0.006, 230),
    "accent":        (0.545, 0.128, 58),
    "accent-bg":     (0.935, 0.055, 58),
    "accent-ink":    (0.420, 0.125, 58),
    "border-subtle": (0.870, 0.012, 238),   # decorative hairline
    "border-strong": (0.640, 0.020, 238),   # interactive controls, must hit 3:1
    "focus":         (0.560, 0.155, 58),
}
DARK = {
    "bg":            (0.168, 0.018, 241),
    "surface":       (0.222, 0.020, 241),
    "text":          (0.930, 0.010, 235),
    "text-muted":    (0.685, 0.020, 235),
    "primary":       (0.745, 0.118, 230),
    "primary-btn":   (0.745, 0.118, 230),
    "fg-on-primary": (0.168, 0.018, 241),
    "accent":        (0.825, 0.130, 58),
    "accent-bg":     (0.310, 0.070, 58),
    "accent-ink":    (0.930, 0.075, 58),
    "border-subtle": (0.330, 0.020, 241),   # decorative hairline
    "border-strong": (0.520, 0.030, 241),   # interactive controls, must hit 3:1
    "focus":         (0.800, 0.145, 58),
}

# (fg, bg, min_ratio, requirement source, description)
PAIRS = [
    ("text", "bg", 4.5, "WCAG 1.4.3 AA", "body text on page bg"),
    ("text", "surface", 4.5, "WCAG 1.4.3 AA", "body text on card surface"),
    ("text-muted", "bg", 4.5, "WCAG 1.4.3 AA", "meta text (tech tags, dates) on bg"),
    ("text-muted", "surface", 4.5, "WCAG 1.4.3 AA", "meta text on card surface"),
    ("primary", "bg", 4.5, "WCAG 1.4.3 AA", "link / primary text on bg"),
    ("primary", "surface", 4.5, "WCAG 1.4.3 AA", "link / primary text on card"),
    ("accent", "bg", 4.5, "WCAG 1.4.3 AA", "accent text (rank number) on bg"),
    ("accent", "surface", 4.5, "WCAG 1.4.3 AA", "accent text on card"),
    ("fg-on-primary", "primary-btn", 4.5, "WCAG 1.4.3 AA", "button label on primary button fill"),
    ("accent-ink", "accent-bg", 4.5, "WCAG 1.4.3 AA", "badge label on accent badge fill"),
    ("focus", "bg", 3.0, "WCAG 1.4.11 non-text", "focus ring vs page bg"),
    ("focus", "surface", 3.0, "WCAG 1.4.11 non-text", "focus ring vs card surface"),
    ("border-strong", "bg", 3.0, "WCAG 1.4.11 non-text", "input/control border vs bg"),
    ("border-strong", "surface", 3.0, "WCAG 1.4.11 non-text", "input/control border vs card surface"),
    ("primary-btn", "bg", 3.0, "WCAG 1.4.11 non-text", "primary button fill vs page bg"),
    ("accent", "surface", 3.0, "WCAG 1.4.11 non-text", "accent icon/graphic on card"),
]

def run(name, toks):
    hexes, fitted = {}, {}
    print(f"\n===== {name.upper()} MODE =====")
    for k, (L, C, h) in toks.items():
        C_fit, vals = fit_gamut(L, C, h)
        C_fit = round(C_fit, 3)
        hx = vals_to_hex(vals)
        hexes[k] = hx
        fitted[k] = C_fit
        note = f" (chroma fitted {C} -> {C_fit} for sRGB gamut)" if abs(C_fit - C) > 1e-6 else ""
        print(f"  --{k}: oklch({L} {C_fit} {h}) = {hx}{note}")
    print("  pairs:")
    fails = []
    for fg, bg, req, src, desc in PAIRS:
        ratio = contrast(hexes[fg], hexes[bg])
        ok = ratio >= req
        if not ok:
            fails.append((name, fg, bg, round(ratio, 2), req))
        print(f"    {'PASS' if ok else 'FAIL'} {ratio:5.2f}:1 (need {req}) [{src}] {fg} on {bg} — {desc}")
    # decorative border report
    r = contrast(hexes["border-subtle"], hexes["bg"])
    print(f"    INFO {r:5.2f}:1  border-subtle on bg — decorative hairline (exempt: grouping conveyed by surface+content)")
    return hexes, fails

lh, lf = run("light", LIGHT)
dh, df = run("dark", DARK)
print("\nFAILS:", lf + df if (lf or df) else "none")

for mode, t in (("light", LIGHT), ("dark", DARK)):
    d = abs(t["primary"][2] - t["accent"][2])
    d = min(d, 360 - d)
    print(f"{mode}: hue delta primary(h={t['primary'][2]}) vs accent(h={t['accent'][2]}) = {d} deg (need >= 20)")
