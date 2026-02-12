# Banda Cabeceirense — Website (Estático)

Website estático (HTML + CSS + JS) com 6 páginas:
- Início · História · Banda · Direção · Calendário · Contactos

Inclui:
- Header sticky + menu mobile
- Vídeo em destaque + grelha de mini-vídeos (thumbnails + fallback automático)
- Secção de Parcerias (grelha)
- Footer comum em todas as páginas (assinatura + redes sociais)
- Estrutura preparada para substituir conteúdos e imagens

### Imagens
Substituir ficheiros em `assets/img/` (logo, heróis, história, banda, direção, parceiros).

### YouTube (Início)
Em `index.html`, trocar:
- `FEATURED_ID`
- `VIDEO_ID_1` ... `VIDEO_ID_4`

### Redes sociais / assinatura
No footer (todas as páginas), atualizar:
- Links Facebook / Instagram / YouTube
- Créditos “DEVOTION” (nome + link)

## Correr localmente

```bash
python -m http.server 8080
