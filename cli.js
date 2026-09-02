#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { convertFile, convertMarkdownToPdf } = require('./engine/converter');
const { getThemeList } = require('./engine/themes');
const { PDFDocument } = require('pdf-lib');

program
  .name('md-pdf')
  .description('Convierte uno o multiples archivos Markdown (.md) a PDF de alta calidad')
  .version('1.0.0')
  .argument('[files...]', 'Archivos Markdown (.md) o directorios a convertir')
  .option('-o, --output <path>', 'Ruta de salida del PDF o carpeta de destino')
  .option('-t, --theme <theme>', 'Tema visual: github, academic, dark, minimal, executive', 'github')
  .option('-f, --format <format>', 'Formato de papel: A4, Letter, Legal, A3', 'A4')
  .option('-m, --margin <margin>', 'Margen: normal, compact, wide, none', 'normal')
  .option('-l, --landscape', 'Orientacion horizontal', false)
  .option('--no-header-footer', 'Desactivar encabezado y pie de pagina')
  .option('--merge', 'Combinar todos los archivos convertidos en un unico PDF')
  .option('--stdin', 'Leer markdown directamente desde standard input (ideal para IAs o pipes)')
  .option('--list-themes', 'Listar todos los temas disponibles')
  .action(async (files, options) => {
    try {
      if (options.listThemes) {
        console.log('\n🎨 Temas disponibles:');
        getThemeList().forEach(t => {
          console.log(`  - \x1b[36m${t.id.padEnd(12)}\x1b[0m: ${t.name} (${t.description})`);
        });
        console.log('');
        process.exit(0);
      }

      // STDIN mode for AI / pipelines
      if (options.stdin || (!files.length && !process.stdin.isTTY)) {
        let inputMarkdown = '';
        process.stdin.setEncoding('utf8');
        for await (const chunk of process.stdin) {
          inputMarkdown += chunk;
        }

        if (!inputMarkdown.trim()) {
          console.error('❌ Error: No se recibió contenido Markdown por stdin.');
          process.exit(1);
        }

        const pdfBuffer = await convertMarkdownToPdf(inputMarkdown, {
          theme: options.theme,
          format: options.format,
          margin: options.margin,
          landscape: options.landscape,
          headerFooter: options.headerFooter,
          title: options.output ? path.basename(options.output, '.pdf') : 'Documento'
        });

        if (options.output) {
          fs.writeFileSync(options.output, pdfBuffer);
          console.log(`✅ PDF guardado exitosamente en: ${options.output}`);
        } else {
          process.stdout.write(pdfBuffer);
        }
        process.exit(0);
      }

      if (!files || files.length === 0) {
        console.error('❌ Error: Debes especificar al menos un archivo .md o usar --stdin');
        program.help();
        process.exit(1);
      }

      // Collect all markdown files
      const mdFiles = [];
      for (const item of files) {
        if (fs.existsSync(item)) {
          const stat = fs.statSync(item);
          if (stat.isDirectory()) {
            const dirFiles = fs.readdirSync(item)
              .filter(f => f.endsWith('.md'))
              .map(f => path.join(item, f));
            mdFiles.push(...dirFiles);
          } else if (item.endsWith('.md') || item.endsWith('.markdown')) {
            mdFiles.push(item);
          } else {
            console.warn(`⚠️ Advertencia: ${item} no parece ser un archivo .md`);
            mdFiles.push(item);
          }
        } else {
          console.error(`❌ Archivo no encontrado: ${item}`);
        }
      }

      if (mdFiles.length === 0) {
        console.error('❌ No se encontraron archivos Markdown válidos.');
        process.exit(1);
      }

      console.log(`\n🚀 Procesando ${mdFiles.length} archivo(s)...`);
      console.log(`⚙️ Configuración: Tema=${options.theme}, Formato=${options.format}, Margen=${options.margin}\n`);

      const generatedPdfs = [];

      for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        let outPath;

        if (options.output) {
          if (options.merge) {
            // Merging later
            outPath = path.join(path.dirname(file), `temp_${i}_` + path.basename(file, path.extname(file)) + '.pdf');
          } else if (mdFiles.length === 1 && options.output.endsWith('.pdf')) {
            outPath = options.output;
          } else {
            const outDir = options.output.endsWith('.pdf') ? path.dirname(options.output) : options.output;
            if (!fs.existsSync(outDir)) {
              fs.mkdirSync(outDir, { recursive: true });
            }
            outPath = path.join(outDir, path.basename(file, path.extname(file)) + '.pdf');
          }
        } else {
          outPath = file.replace(/\.md$/i, '.pdf');
        }

        process.stdout.write(`  [${i + 1}/${mdFiles.length}] Convirtiendo ${path.basename(file)}... `);
        const startTime = Date.now();
        await convertFile(file, outPath, {
          theme: options.theme,
          format: options.format,
          margin: options.margin,
          landscape: options.landscape,
          headerFooter: options.headerFooter
        });
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\x1b[32mOK\x1b[0m (${elapsed}s) -> ${path.basename(outPath)}`);
        generatedPdfs.push(outPath);
      }

      // If merge requested
      if (options.merge && generatedPdfs.length > 0) {
        const mergedPdf = await PDFDocument.create();
        for (const pdfPath of generatedPdfs) {
          const pdfBytes = fs.readFileSync(pdfPath);
          const doc = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach(p => mergedPdf.addPage(p));
        }

        const mergedOutputPath = (options.output && options.output.endsWith('.pdf')) 
          ? options.output 
          : 'documentos_combinados.pdf';

        const mergedBytes = await mergedPdf.save();
        fs.writeFileSync(mergedOutputPath, mergedBytes);

        // Remove temp pdfs if created during merge
        if (options.output) {
          for (const tempPdf of generatedPdfs) {
            try { fs.unlinkSync(tempPdf); } catch(e){}
          }
        }

        console.log(`\n🎉 \x1b[32mTodos los archivos fueron combinados en: ${mergedOutputPath}\x1b[0m`);
      } else {
        console.log(`\n🎉 \x1b[32m¡Conversión completada con éxito!\x1b[0m\n`);
      }

      process.exit(0);
    } catch (err) {
      console.error('\n❌ Error durante la conversión:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
