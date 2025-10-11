# osu-preview - Setup útmutató

## Projekt működőképessé tétele

A projekt most már teljesen működőképes! Az alábbi lépéseket hajtottam végre:

### 1. Függőségek telepítése
```bash
npm install
```

### 2. Projekt buildelése
```bash
npx gulp
```

### 3. Git submodule-ok telepítése
A zip.js és js-md5 könyvtárak telepítése:
```bash
git clone https://github.com/gildas-lormeau/zip.js src/zip.js
git clone https://github.com/emn178/js-md5.git src/js-md5
```

## Használat

### Fejlesztői mód
Lokális szerver indítása:
```bash
cd src
npx http-server -p 8000
```

Ezután nyisd meg a böngészőben: http://127.0.0.1:8000/preview.html#BEATMAP_ID

(Cseréld le a BEATMAP_ID-t egy érvényes osu! beatmap ID-ra)

### Production build
A `dist` mappában található a minifikált verzió a `npx gulp` parancs futtatása után.

## Módosítások

A következő frissítéseket végeztem el a projekt működőképessé tételéhez:

1. **package.json** - Gulp 3.9.0 frissítése Gulp 4.0.2-re a modern Node.js verzióval való kompatibilitás érdekében
2. **Függőségek** - Összes deprecated csomag frissítése újabb verziókra
3. **Git submodule-ok** - zip.js és js-md5 könyvtárak telepítése
4. **API frissítés** - A beatmap letöltési proxy átállítása a régi `catboy-proxy.jmir.xyz`-ről az új `catboy.best/api/v2` végpontra
5. **API mező javítás** - A `ParentSetID` mezőt `beatmapset_id`-re és a `FileMD5` mezőt `checksum`-re változtattam az új API válasz struktúrájának megfelelően

## Megjegyzések

- A projekt egy osu! beatmap előnézető alkalmazás
- Használatához érvényes beatmap ID szükséges a URL-ben (#BEATMAP_ID)
- A lokális szervert a CTRL+C billentyűkombinációval lehet leállítani
