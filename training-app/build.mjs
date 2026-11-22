// Génère public/training/index.html (version autonome, installable sur l'écran d'accueil iPhone)
// à partir de training-app/index.html (source publiée en Artifact).
// Usage : node training-app/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, "index.html"), "utf8");
const splitAt = src.indexOf("<main");
const head = src.slice(0, splitAt).replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "");
const body = src.slice(splitAt);

const out = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Densité">
<meta name="theme-color" content="#0a0e16">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${head}</head>
<body>
${body}
</body>
</html>
`;
const dest = resolve(here, "../public/training/index.html");
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, out);
console.log("écrit", dest);
