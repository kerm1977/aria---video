# aria - video

Reproductor de video y audio construido con Electron. Un reproductor multimedia moderno y elegante que soporta todos los formatos de video y audio populares.

## Características

- **Reproducción de video y audio**: Soporta formatos como MP4, MKV, AVI, MOV, WMV, FLV, WebM, MP3, WAV, OGG, FLAC, AAC, M4A, WMA
- **Lista de reproducción**: Añade carpetas completas o archivos individuales
- **Control de velocidad**: Deslizador de velocidad de 0.1x a 3x con preajustes rápidos (0.25x, 0.5x, 1x, 1.5x, 2x)
- **Controles de reproducción**: Play, Pausa, Stop, Adelantar 10s, Retroceder 10s
- **Información del video**: Muestra nombre, ruta, tamaño, duración y resolución
- **Interfaz flotante**: Botón flotante elegante para acceder a todas las opciones
- **Atajos de teclado**: Espacio (play/pausa), Flechas (seek/volumen), F (pantalla completa)
- **Barra de título personalizada**: Muestra "aria - video"

## Instalación

### Requisitos previos

- Node.js (v14 o superior)
- npm o yarn

### Pasos de instalación

1. Navega al directorio del proyecto:
```bash
cd aria-video-player
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la aplicación:
```bash
npm start
```

## Uso

### Abrir archivos

- **Añadir carpeta**: Haz clic en el botón "Añadir Carpeta" para cargar todos los archivos multimedia de una carpeta
- **Añadir archivos**: Haz clic en "Añadir Archivos" para seleccionar archivos específicos
- **Abrir archivo directamente**: También puedes abrir archivos haciendo doble clic en ellos (después de instalar la aplicación)

### Controles principales

- **Botón flotante** (esquina inferior derecha): Abre el panel de opciones
- **Play/Pausa**: Reproduce o pausa el video actual
- **Stop**: Detiene la reproducción y reinicia al inicio
- **Adelantar/Retroceder**: Salta 10 segundos adelante o atrás
- **Barra de progreso**: Arrastra para navegar por el video
- **Control de volumen**: Ajusta el volumen del video

### Control de velocidad

En el panel de opciones:
- Usa los botones de preajuste para velocidades comunes (0.25x, 0.5x, 1x, 1.5x, 2x)
- Usa el deslizador para ajustar la velocidad con precisión (0.1x a 3x)

### Lista de reproducción

- Ver todos los archivos en la lista de reproducción
- Haz clic en cualquier archivo para reproducirlo
- Elimina archivos individuales con el botón ×
- La reproducción automática continúa con el siguiente archivo

### Atajos de teclado

- **Espacio**: Play/Pausa
- **Flecha izquierda**: Retroceder 10 segundos
- **Flecha derecha**: Adelantar 10 segundos
- **Flecha arriba**: Subir volumen
- **Flecha abajo**: Bajar volumen
- **F**: Pantalla completa

## Construir para distribución

Para crear un paquete instalable:

```bash
npm run build
```

Esto generará archivos AppImage y deb para Linux en la carpeta `dist/`.

## Formatos soportados

### Video
- MP4
- MKV
- AVI
- MOV
- WMV
- FLV
- WebM

### Audio
- MP3
- WAV
- OGG
- FLAC
- AAC
- M4A
- WMA

## Estructura del proyecto

```
aria-video-player/
├── main.js           # Proceso principal de Electron
├── renderer.js       # Proceso de renderizado (lógica de UI)
├── index.html        # Estructura HTML
├── styles.css        # Estilos CSS
├── package.json      # Configuración del proyecto
├── assets/
│   ├── icon.svg      # Icono de la aplicación (SVG)
│   └── icon.png      # Icono de la aplicación (PNG)
└── README.md         # Este archivo
```

## Personalización

### Cambiar el icono

El icono se encuentra en `assets/icon.png`. Puedes reemplazarlo con tu propio icono de 512x512 píxeles.

### Cambiar colores

Los colores principales se definen en `styles.css`. Busca los colores hexadecimales para personalizar:
- `#6366f1` - Color principal (índigo)
- `#1a1a1a` - Fondo oscuro
- `#2d2d2d` - Fondo de paneles
- `#3d3d3d` - Fondo de elementos interactivos

## Licencia

MIT

## Créditos

Desarrollado con ❤️ usando Electron
