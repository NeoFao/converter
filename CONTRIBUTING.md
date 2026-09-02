# 🤝 Guía de Contribución a Converter

¡Gracias por tu interés en contribuir a **Converter**! Queremos mantener este proyecto seguro, limpio y de alto rendimiento.

## 🛡️ Política de Seguridad y Pull Requests Obligatorios

Por motivos estrictos de seguridad e integridad del código:
1. **Nadie puede hacer `push` directo a la rama `main`**.
2. **Todas las contribuciones deben realizarse mediante un Pull Request (PR)** desde un `fork` de este repositorio.
3. **Solo el mantenedor del repositorio (@NeoFao) tiene permisos de aprobación y fusión (`merge`)**.
4. Cada Pull Request será auditado automáticamente mediante GitHub Actions para verificar:
   - Que no existan vulnerabilidades de seguridad (`npm audit`).
   - Que no se introduzcan dependencias maliciosas ni scripts de ejecución oculta.
   - Que la sintaxis y los estándares de código pasen las pruebas de validación (`node --check`).

---

## 📋 Pasos para Contribuir

1. **Haz un Fork del Repositorio**:
   - Haz clic en el botón **Fork** en la esquina superior derecha de GitHub.

2. **Clona tu Fork**:
   ```bash
   git clone https://github.com/TU-USUARIO/converter.git
   cd converter
   ```

3. **Crea una Rama (`branch`) para tu funcionalidad o corrección**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # o para un bugfix:
   git checkout -b fix/correccion-error
   ```

4. **Realiza tus cambios y pruébalos localmente**:
   ```bash
   npm install
   npm start
   ```

5. **Haz Commit con mensajes claros**:
   ```bash
   git add .
   git commit -m "feat: descripcion clara de los cambios"
   ```

6. **Envía tus cambios a tu Fork**:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

7. **Abre un Pull Request en GitHub**:
   - Completa la plantilla del PR detallando qué cambios hiciste y confirmando la lista de verificación de seguridad.
