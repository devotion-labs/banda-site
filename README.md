# Banda Cabeceirense — Site Estático (Premium)

Estrutura pronta (HTML + CSS + JS) com:
- 6 páginas: Início, História, Banda, Direção, Calendário, Contactos
- Header sticky + menu mobile
- Secção **Featured Video** (1 destaque + 4 mini) com thumbnails automáticas e fallback
- Secção **Parcerias** com grelha de parceiros
- Footer premium em todas as páginas (assinatura + ícones de redes)
- Placeholders de imagens em `assets/img/` (substituir pelos ficheiros reais)

## Onde trocar conteúdo rapidamente

### 1) Imagens
Coloca/substitui:
- `assets/img/logo.png`
- `assets/img/hero-banda.jpg`
- `assets/img/historia-1.jpg`, `assets/img/historia-2.jpg`
- `assets/img/banda-1.jpg`, `assets/img/banda-2.jpg`
- `assets/img/direcao-1.jpg`, `assets/img/direcao-2.jpg`
- `assets/img/partners/parceiro-1.png` ... `parceiro-4.png`

### 2) YouTube
Em `index.html`, procura:
- `FEATURED_ID`
- `VIDEO_ID_1` ... `VIDEO_ID_4`
E substitui pelos IDs dos vídeos.

Também troca os links:
- `https://www.youtube.com/@SEU_CANAL`
- `https://www.youtube.com/@SEU_CANAL/videos`

### 3) Redes sociais + assinatura
No footer (todas as páginas), troca:
- `https://facebook.com/SEU_LINK`
- `https://instagram.com/SEU_LINK`
- `https://youtube.com/@SEU_CANAL`
- `DEVOTION` e `https://github.com/devotion-labs`

## Como correr localmente

### Opção A (Python)
Na pasta do site:
```bash
python -m http.server 8080
```
Depois abre: `http://localhost:8080`

### Opção B (VS Code)
Extensão **Live Server** → abrir `index.html`.

## Publicar
- GitHub Pages (recomendado para estático)
- Netlify (drag & drop da pasta)

Bom trabalho 🎺
