# ?? Gu?a de Contribuci?n a Converter

?Gracias por tu inter?s en contribuir a **Converter**! Queremos mantener este proyecto seguro, limpio y de alto rendimiento.

## ??? Pol?tica de Seguridad y Pull Requests Obligatorios

Por motivos estrictos de seguridad e integridad del c?digo:
1. **Nadie puede hacer `push` directo a la rama `main`**.
2. **Todas las contribuciones deben realizarse mediante un Pull Request (PR)** desde un `fork` de este repositorio.
3. **Solo el mantenedor del repositorio (@NeoFao) tiene permisos de aprobaci?n y fusi?n (`merge`)**.
4. Cada Pull Request ser? auditado autom?ticamente mediante GitHub Actions para verificar:
   - Que no existan vulnerabilidades de seguridad (`npm audit`).
   - Que no se introduzcan dependencias maliciosas ni scripts de ejecuci?n oculta.
   - Que la sintaxis y los est?ndares de c?digo pasen las pruebas de validaci?n.

---

## ?? Pasos para Contribuir

1. **Haz un Fork del Repositorio**:
   - Haz clic en el bot?n **Fork** en la esquina superior derecha de GitHub.

2. **Clona tu Fork**:
   ```bash
   git clone https://github.com/TU-USUARIO/converter.git
   cd converter
   ```

3. **Crea una Rama (`branch`) para tu funcionalidad o correcci?n**:
   ```bash
   git checkout -b feature/nuevo-conversor-word
   # o para un bugfix:
   git checkout -b fix/correccion-estilo
   ```

4. **Realiza tus cambios y pru?balos localmente**:
   ```bash
   npm install
   npm start
   ```
   Abre `http://localhost:3000` y verifica que todo funcione sin errores.

5. **Haz Commit con mensajes claros y descriptivos**:
   ```bash
   git add .
   git commit -m "feat: agregar soporte inicial para conversi?n Word a PDF"
   ```

6. **Env?a tus cambios a tu Fork**:
   ```bash
   git push origin feature/nuevo-conversor-word
   ```

7. **Abre un Pull Request en GitHub**:
   - Ve a la pesta?a **Pull Requests** del repositorio principal.
   - Haz clic en **New Pull Request**.
   - Completa la plantilla del PR detallando qu? cambios hiciste y por qu? son seguros.

---

## ?? Reglas de C?digo
- No agregues paquetes o dependencias npm sin justificaci?n t?cnica clara.
- Mant?n el c?digo limpio, comentado y modular.
- Respeta la estructura del Dashboard y la UI existente.
