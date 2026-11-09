#!/bin/bash
S=~/.claude/skills/taste-skill; P=$TEMP/gz-chrome-$2; OUT=/d/Projects/halvet/gallery/shots
while read -r id url; do
  [ -z "$id" ] && continue
  for w in 1440 390; do
    h=900; [ $w = 390 ] && h=844
    timeout 240 node $S/scripts/shoot.mjs --url "$url" --w $w --h $h --out "$OUT/$id-$w-full.png" --profile "$P" --wait 4000 --no-tiles > "$OUT/$id-$w.log" 2>&1
    echo "$id $w exit=$?"
  done
done < "$1"
