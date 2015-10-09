FONTURL=https://concord-consortium.github.io/codap-ivy-icons/
FONTNAME=CodapIvy
DEST=src/assets

curl $FONTURL/style.css > $DEST/codap-ivy-fonts.css
for ext in svg ttf woff eot
do
  curl $FONTURL/fonts/$FONTNAME.$ext > $DEST/fonts/$FONTNAME.$ext
done
