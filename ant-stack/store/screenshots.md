# Screenshots — Ant Stack Store Listing

## Required (4-6)

| # | Name | Description | Resolution |
|---|------|-------------|------------|
| 1 | screenshot1.png | Main menu / lobby view | 1280x720 |
| 2 | screenshot2.png | 12x12 grid during draft phase | 1280x720 |
| 3 | screenshot3.png | Anteater strike animation | 1280x720 |
| 4 | screenshot4.png | Match end / payout screen | 1280x720 |
| 5 | screenshot5.png | Heatmap telemetry overlay | 1280x720 |
| 6 | screenshot6.png | LAN discovery (Avahi) | 1280x720 |

## Screenshot Generation

```bash
# Generate placeholder screenshots with ImageMagick
convert -size 1280x720 xc:#1E1E1C \
  -font Syne -pointsize 48 -fill "#CC7722" \
  -annotate +640+360 "🐜 ANT STACK" screenshot1.png

# Or capture actual gameplay
scrot -d 5 screenshot2.png
```
