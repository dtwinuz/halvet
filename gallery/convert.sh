#!/bin/bash
# Full-page PNG skrinshotlarni JPG'ga aylantiradi, hero kesimini oladi va list.js yozadi.
cd "$(dirname "$0")/shots" || exit 1
list=()
for f in *-full.png; do
  [ -s "$f" ] || continue
  base=${f%-full.png}
  id=${base%-*}; w=${base##*-}
  ffmpeg -loglevel error -y -i "$f" -q:v 4 "$base.jpg" || continue
  if [ "$w" = 1440 ]; then
    ffmpeg -loglevel error -y -i "$f" -vf "crop=1440:900:0:0,scale=960:-1" -q:v 3 "$id-hero.jpg"
  fi
  list+=("\"$base\"")
done
(IFS=,; echo "window.SHOTS=[${list[*]}];") > list.js
cat list.js
