# 🌐 Guía de Despliegue en Línea (100% Gratis y Permanente)

Esta guía te explica cómo poner tu aplicación **MD to PDF Converter Pro** en internet de forma **100% gratuita y permanente**, accesible desde cualquier lugar del mundo (móvil, tablet, PC o por cualquier Inteligencia Artificial vía API).

---

## 🏆 ¿Por qué Vercel es la mejor opción?

- **100% Gratis de por vida** (Plan Hobby gratuito para proyectos personales).
- **Enlace público permanente**: `https://tu-proyecto.vercel.app` (con certificado de seguridad SSL/HTTPS incluido).
- **Soporte para Serverless Functions**: Tus endpoints para IA (`POST /api/convert`) funcionarán en la nube.
- **Red CDN Global**: Carga instantánea desde cualquier país.
- **Cero mantenimiento**: No se apaga por inactividad.

---

## 🚀 Método 1: Despliegue Rápido con `desplegar-vercel.bat` (El más fácil)

1. Abre la carpeta del proyecto:
   `C:\Users\andre\Documents\BIBLIOTECA APPS\Convertidor md a pdf`
2. Haz doble clic sobre el archivo **`desplegar-vercel.bat`**.
3. En la terminal que se abre:
   - Si es tu primera vez, te pedirá presionar `Enter` para autenticarte en tu navegador (puedes entrar con tu cuenta de GitHub, Google o Correo de forma gratuita).
   - Presiona `Y` (Yes) a las preguntas por defecto del proyecto.
4. En menos de 1 minuto te entregará tu enlace público (por ejemplo: `https://md-to-pdf-converter.vercel.app`).
5. ¡Listo! Ya puedes compartir tu enlace o usarlo desde cualquier dispositivo.

---

## 🐙 Método 2: Despliegue Continuo con GitHub + Vercel (Recomendado para desarrolladores)

Si ya usas GitHub:

### Paso 1: Subir tu código a GitHub
1. Entra a [github.com/new](https://github.com/new) y crea un nuevo repositorio llamado `md-to-pdf-converter` (puedes ponerlo Público o Privado).
2. Abre la terminal en esta carpeta y ejecuta:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/md-to-pdf-converter.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Conectar con Vercel
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio `md-to-pdf-converter` de la lista.
4. Haz clic en **"Deploy"**.
5. ¡Listo! Vercel construirá tu app y cada vez que hagas un cambio en GitHub se actualizará automáticamente en la nube.

---

## 🤖 ¿Cómo consumirá una IA tu app en la nube?

Una vez desplegada en Vercel, cualquier agente o script puede usar tu URL pública:

```bash
# Llamada cURL a tu app en la nube
curl -X POST https://tu-proyecto.vercel.app/api/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Reporte en la Nube\nGenerado por IA.", "theme": "executive"}' \
  --output reporte_nube.pdf
```

```python
# Ejemplo en Python desde cualquier servidor o IA
import requests

url = "https://tu-proyecto.vercel.app/api/convert"
payload = {
    "markdown": "# Reporte Automático\nGenerado vía API en la nube.",
    "theme": "academic",
    "format": "A4"
}

res = requests.post(url, json=payload)
with open("salida.pdf", "wb") as f:
    f.write(res.content)
```