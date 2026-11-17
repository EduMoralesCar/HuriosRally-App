import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PedidoLocal, Repuesto } from '../types';
import { UMBRAL_STOCK_CRITICO } from '../utils/catalog';

/**
 * Conversor numérico a texto formal en mayúsculas para comprobantes de pago peruanos (SUNAT)
 * Ej: 470.00 -> "CUATROCIENTOS SETENTA CON 00/100 SOLES"
 */
function numeroALetras(monto: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales: Record<number, string> = {
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISÉIS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
    21: 'VEINTIÚN',
    22: 'VEINTIDÓS',
    23: 'VEINTITRÉS',
    24: 'VEINTICUATRO',
    25: 'VEINTICINCO',
    26: 'VEINTISÉIS',
    27: 'VEINTISIETE',
    28: 'VEINTIOCHO',
    29: 'VEINTINUEVE',
  };
  const decenas = [
    '',
    '',
    '',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const centenas = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertirCentenas(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let texto = '';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (c > 0) texto += centenas[c] + ' ';
    if (resto > 0) {
      if (resto < 10) {
        texto += unidades[resto];
      } else if (especiales[resto]) {
        texto += especiales[resto];
      } else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        texto += decenas[d];
        if (u > 0) texto += ' Y ' + unidades[u];
      }
    }
    return texto.trim();
  }

  function convertirMiles(n: number): string {
    if (n === 0) return 'CERO';
    let texto = '';
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    if (miles === 1) {
      texto += 'UN MIL ';
    } else if (miles > 1) {
      texto += convertirCentenas(miles) + ' MIL ';
    }
    if (resto > 0) {
      texto += convertirCentenas(resto);
    }
    return texto.trim();
  }

  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const centavosStr = (centavos < 10 ? '0' : '') + centavos;
  const textoEntero = convertirMiles(entero) || 'CERO';

  return `${textoEntero} CON ${centavosStr}/100 SOLES`;
}

/**
 * Retorna la ruta base autorizada en el sandbox de Expo para lectura y escritura
 */
function getDirectorioAlmacenamiento(): string {
  const base = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return base.endsWith('/') ? base : `${base}/`;
}

export const ExportService = {
  /**
   * Genera el HTML de la Boleta o Factura de Venta Electrónica con el diseño oficial SUNAT
   * exactamente idéntico al estándar de comprobantes de pago de Hurios Rally E.I.R.L.
   */
  generarBoletaHtml(pedido: PedidoLocal): string {
    const esFactura = (pedido.comprobanteTipo || '').toLowerCase().includes('factura');
    const tipoComprobante = esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
    const seriePrefijo = esFactura ? 'F001' : 'B001';
    const correlativoNumerico = (pedido.id || '1').replace(/[^0-9]/g, '').slice(-4) || '0001';
    const numeroComprobante = `${seriePrefijo}-${parseInt(correlativoNumerico, 10)}`;

    const tipoDoc = esFactura ? 'RUC' : 'DNI';
    const documento =
      pedido.documentoNumero && pedido.documentoNumero !== 'undefined' && pedido.documentoNumero !== '-'
        ? pedido.documentoNumero
        : esFactura
        ? '20608542191'
        : '72080490';
    const cliente =
      pedido.clienteNombre && pedido.clienteNombre !== 'undefined' && pedido.clienteNombre.trim() !== ''
        ? pedido.clienteNombre
        : pedido.creadoPorNombre || 'Cliente General';
    const fecha = pedido.fechaCreacion && pedido.fechaCreacion !== 'undefined'
      ? pedido.fechaCreacion
      : new Date().toLocaleDateString('es-PE');
    const metodoPago = pedido.metodoPago || 'Efectivo / Mostrador';

    const subtotal = pedido.subtotal || 0;
    const igv = pedido.igv || 0;
    const total = pedido.totalCotizado || 0;
    const textoMonto = numeroALetras(total);

    const filasHtml = (pedido.items || [])
      .map(
        (item) => `
        <tr>
          <td style="text-align: center; padding: 7px 4px; border-bottom: 1px solid #E2E8F0;">${item.cantidad}</td>
          <td style="text-align: center; padding: 7px 4px; border-bottom: 1px solid #E2E8F0;">UND</td>
          <td style="padding: 7px 8px; border-bottom: 1px solid #E2E8F0;">
            <div style="font-weight: 600; color: #1E293B;">${item.repuesto.nombre}</div>
            <div style="font-size: 10px; color: #64748B;">OEM: ${item.repuesto.codigoOEM || 'GENÉRICO'} • ${item.repuesto.categoria || 'Repuesto'}</div>
          </td>
          <td style="text-align: right; padding: 7px 8px; border-bottom: 1px solid #E2E8F0; white-space: nowrap;">S/ ${Number(item.repuesto.precio || 0).toFixed(2)}</td>
          <td style="text-align: right; padding: 7px 8px; border-bottom: 1px solid #E2E8F0; font-weight: 600; white-space: nowrap;">S/ ${(Number(item.repuesto.precio || 0) * item.cantidad).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${tipoComprobante} - ${numeroComprobante}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            padding: 24px;
            font-size: 11px;
            line-height: 1.35;
          }
          .container {
            max-width: 680px;
            margin: 0 auto;
            border: 1px solid #E2E8F0;
            padding: 20px;
            background: #FFFFFF;
          }
          .header-table {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
          }
          .logo-cell {
            width: 90px;
            vertical-align: middle;
            text-align: center;
          }
          .company-cell {
            width: 50%;
            padding-left: 12px;
            vertical-align: middle;
          }
          .company-name {
            font-size: 18px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .company-details {
            font-size: 10px;
            color: #475569;
            line-height: 1.3;
          }
          .ruc-box-cell {
            width: 35%;
            vertical-align: middle;
          }
          .ruc-box {
            border: 2px solid #0F172A;
            border-radius: 4px;
            text-align: center;
            padding: 8px 6px;
            background: #FAFAFA;
          }
          .ruc-title {
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 3px;
          }
          .comp-type {
            font-size: 11px;
            font-weight: 800;
            color: #0066FF;
            text-transform: uppercase;
            padding: 2px 0;
            border-top: 1px solid #CBD5E1;
            border-bottom: 1px solid #CBD5E1;
            margin: 3px 0;
          }
          .comp-num {
            font-size: 13px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: 0.5px;
          }

          .section-box {
            margin-bottom: 12px;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            padding: 8px 10px;
            background: #F8FAFC;
          }
          .section-title {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0066FF;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 2px;
          }
          .data-row {
            display: flex;
            margin-bottom: 2px;
          }
          .data-label {
            width: 90px;
            font-weight: 700;
            color: #475569;
          }
          .data-val {
            flex: 1;
            color: #0F172A;
            font-weight: 600;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 12px;
          }
          .items-table th {
            background: #0F172A;
            color: #FFFFFF;
            padding: 6px 8px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .son-letras-box {
            font-size: 9px;
            font-weight: 700;
            color: #1E293B;
            padding: 6px 8px;
            background: #F1F5F9;
            border-radius: 4px;
            margin-bottom: 12px;
          }

          .totals-table-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 16px;
          }
          .totals-table {
            width: 250px;
            border-collapse: collapse;
            border: 1px solid #0F172A;
          }
          .totals-table td {
            padding: 5px 8px;
            border: 1px solid #CBD5E1;
            font-size: 10px;
          }
          .totals-label {
            font-weight: 700;
            color: #334155;
            background: #F8FAFC;
          }
          .totals-val {
            text-align: right;
            font-weight: 600;
          }
          .total-highlight {
            background: #0F172A;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 900;
          }
          .total-highlight-val {
            background: #0F172A;
            color: #FFFFFF;
            font-size: 12px;
            font-weight: 900;
            text-align: right;
          }

          .footer-note {
            text-align: center;
            font-size: 9px;
            font-style: italic;
            color: #64748B;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #CBD5E1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Encabezado con Logo, Empresa y Recuadro RUC -->
          <table class="header-table">
            <tr>
              <td class="logo-cell" style="width: 85px; vertical-align: middle; text-align: center;">
                <div style="width: 76px; height: 76px; border-radius: 50%; border: 3px solid #0052CC; outline: 2px solid #60A5FA; outline-offset: -5px; background: #FFFFFF; margin: 0 auto; text-align: center; box-sizing: border-box; padding-top: 6px;">
                  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 900; color: #0A3981; line-height: 22px; letter-spacing: -1px;">HR</div>
                  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8px; font-weight: 900; color: #0A3981; line-height: 9px; letter-spacing: 0.8px; margin-top: 1px;">HURIOS</div>
                  <table border="0" cellpadding="0" cellspacing="1" style="margin: 2px auto 0 auto; border-collapse: separate;">
                    <tr>
                      <td style="width: 4px; height: 2.5px; background: #EF4444;"></td>
                      <td style="width: 4px; height: 2.5px; background: #0F172A;"></td>
                      <td style="width: 4px; height: 2.5px; background: #EF4444;"></td>
                      <td style="width: 4px; height: 2.5px; background: #0F172A;"></td>
                      <td style="width: 4px; height: 2.5px; background: #EF4444;"></td>
                    </tr>
                    <tr>
                      <td style="width: 4px; height: 2.5px; background: #0F172A;"></td>
                      <td style="width: 4px; height: 2.5px; background: #EF4444;"></td>
                      <td style="width: 4px; height: 2.5px; background: #0F172A;"></td>
                      <td style="width: 4px; height: 2.5px; background: #EF4444;"></td>
                      <td style="width: 4px; height: 2.5px; background: #0F172A;"></td>
                    </tr>
                  </table>
                  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; font-weight: 900; font-style: italic; color: #DC2626; line-height: 11px; letter-spacing: 0.5px; margin-top: 1px;">RALLY</div>
                </div>
              </td>
              <td class="company-cell">
                <div class="company-name">HURIOS RALLY E.I.R.L.</div>
                <div class="company-details">
                  Av. Perú 2450, San Martín de Porres, Lima<br>
                  Telf: (01) 534-8920 / +51 978 451 154<br>
                  ventas@huriosrally.com • www.huriosrally.com
                </div>
              </td>
              <td class="ruc-box-cell">
                <div class="ruc-box">
                  <div class="ruc-title">RUC: 20608542191</div>
                  <div class="comp-type">${tipoComprobante}</div>
                  <div class="comp-num">N° ${numeroComprobante}</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Datos del Cliente -->
          <div class="section-box">
            <div class="section-title">Datos del Cliente</div>
            <div class="data-row">
              <span class="data-label">Cliente / Razón:</span>
              <span class="data-val">${cliente}</span>
            </div>
            <div class="data-row">
              <span class="data-label">${tipoDoc}:</span>
              <span class="data-val">${documento}</span>
            </div>
            ${pedido.clienteTelefono ? `
            <div class="data-row">
              <span class="data-label">Teléfono:</span>
              <span class="data-val">${pedido.clienteTelefono}</span>
            </div>
            ` : ''}
          </div>

          <!-- Observaciones y Logística -->
          <div class="section-box">
            <div class="section-title">Información de la Operación</div>
            <div class="data-row">
              <span class="data-label">Fecha de Emisión:</span>
              <span class="data-val">${fecha}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Forma de Pago:</span>
              <span class="data-val">${metodoPago} ${pedido.numOperacion ? `(Op: ${pedido.numOperacion})` : ''}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Modalidad:</span>
              <span class="data-val">Retiro en Almacén Central SMP (Lima Norte)</span>
            </div>
          </div>

          <!-- Tabla de Repuestos / Items -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">Cant.</th>
                <th style="width: 10%; text-align: center;">U.M.</th>
                <th style="width: 52%; text-align: left;">Descripción</th>
                <th style="width: 15%; text-align: right;">P. unit.</th>
                <th style="width: 15%; text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml}
            </tbody>
          </table>

          <!-- Monto en Letras -->
          <div class="son-letras-box">
            SON: ${textoMonto}
          </div>

          <!-- Tabla de Totales (O.P Gravada, IGV 18%, Total) -->
          <div class="totals-table-wrapper">
            <table class="totals-table">
              <tr>
                <td class="totals-label">O.P. GRAVADA (S/)</td>
                <td class="totals-val">S/ ${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="totals-label">TOTAL IGV (18%) (S/)</td>
                <td class="totals-val">S/ ${igv.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="total-highlight">IMPORTE TOTAL (S/)</td>
                <td class="total-highlight-val">S/ ${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer-note">
            Representación impresa del comprobante de venta electrónico generado en Hurios Rally App.<br>
            Consulte la autenticidad con su código ${pedido.id} • ¡Gracias por su preferencia!
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Genera el comprobante electrónico en PDF y abre el diálogo nativo del sistema operativo
   * garantizando que el archivo sea accesible por WhatsApp, Google Drive, Edge y visores de PDF.
   */
  async exportarBoletaPdf(pedido: PedidoLocal): Promise<string> {
    const html = this.generarBoletaHtml(pedido);
    let printResult: { uri: string; base64?: string };
    try {
      printResult = await Print.printToFileAsync({
        html,
        base64: true,
      });
    } catch (printErr) {
      console.warn('Reintentando printToFileAsync con base64:false:', printErr);
      printResult = await Print.printToFileAsync({
        html,
        base64: false,
      });
    }
    const { uri, base64 } = printResult;

    const cleanId = (pedido.id || 'PED').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Comprobante_${cleanId}_HuriosRally.pdf`;
    const targetPath = `${getDirectorioAlmacenamiento()}${fileName}`;

    let shareUri = targetPath;
    try {
      if (base64) {
        await FileSystem.writeAsStringAsync(targetPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: uri, to: targetPath });
      }
    } catch (e) {
      console.warn('Error al guardar comprobante PDF en sandbox:', e);
      shareUri = uri;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${pedido.comprobanteTipo || 'Boleta'} - ${pedido.id || cleanId}`,
      });
    }

    return shareUri;
  },

  /**
   * Imprime directamente o previsualiza en el motor de impresión nativo si se requiere
   */
  async imprimirBoleta(pedido: PedidoLocal): Promise<void> {
    const html = this.generarBoletaHtml(pedido);
    await Print.printAsync({ html });
  },

  /**
   * Exporta el catálogo completo de repuestos a un archivo Excel (.XLS) con tabla estructurada,
   * encabezados de color corporativo #0A3981, cuadrícula real y dashboard de métricas de inventario.
   */
  async exportarCatalogoExcel(repuestos: Repuesto[]): Promise<string> {
    const fechaHora = new Date().toLocaleString('es-PE');
    const totalRepuestos = repuestos.length;
    const stockTotal = repuestos.reduce((acc, r) => acc + (Number(r.stock) || 0), 0);
    const valorizacionTotal = repuestos.reduce(
      (acc, r) => acc + Number(r.precio || 0) * (Number(r.stock) || 0),
      0
    );
    const repuestosStockCritico = repuestos.filter(
      (r) => (Number(r.stock) || 0) <= UMBRAL_STOCK_CRITICO
    ).length;
    const precioPromedio =
      totalRepuestos > 0
        ? repuestos.reduce((acc, r) => acc + Number(r.precio || 0), 0) / totalRepuestos
        : 0;

    const filasHtml = repuestos
      .map((r, i) => {
        const stockNum = Number(r.stock) || 0;
        const precioNum = Number(r.precio) || 0;
        const valorTotal = (precioNum * stockNum).toFixed(2);
        const esPar = i % 2 === 0;
        const bgRow = esPar ? '#FFFFFF' : '#F8FAFC';
        const esCritico = stockNum <= UMBRAL_STOCK_CRITICO;
        const estadoStockBadge = esCritico
          ? `<span style="color: #DC2626; font-weight: bold; background-color: #FEE2E2; padding: 2px 6px; border-radius: 4px;">Alerta Crítica</span>`
          : `<span style="color: #15803D; font-weight: bold; background-color: #DCFCE7; padding: 2px 6px; border-radius: 4px;">Óptimo</span>`;

        return `
        <tr style="background-color: ${bgRow};">
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px;">${i + 1}</td>
          <td style="border: 0.5pt solid #CBD5E1; font-family: monospace; font-weight: bold; color: #0052CC; text-align: center; padding: 6px 8px;">${r.codigoOEM || 'S/N'}</td>
          <td style="border: 0.5pt solid #CBD5E1; font-weight: 600; color: #0F172A; padding: 6px 10px;">${r.nombre}</td>
          <td style="border: 0.5pt solid #CBD5E1; color: #475569; padding: 6px 8px;">${r.categoria}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 6px 10px; font-weight: 600; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${precioNum.toFixed(2)}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px; font-weight: bold; mso-number-format: '#\\,##0';">${stockNum}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px;">${estadoStockBadge}</td>
          <td style="border: 0.5pt solid #CBD5E1; color: #64748B; padding: 6px 8px;">${r.compatibilidad || 'Universal'}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px; font-weight: 600;">★ ${(r.rating || 5.0).toFixed(1)}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 6px 10px; font-weight: bold; color: #059669; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${valorTotal}</td>
        </tr>
      `;
      })
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Catálogo de Repuestos</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1E293B; margin: 0; padding: 15px; }
          .banner-title { font-size: 16pt; font-weight: bold; color: #0A3981; }
          .banner-sub { font-size: 10pt; color: #64748B; }
          .kpi-box { border: 1.5pt solid #CBD5E1; background-color: #F8FAFC; text-align: center; padding: 10px 14px; border-radius: 6px; }
          .kpi-lbl { font-size: 9pt; font-weight: bold; color: #64748B; text-transform: uppercase; }
          .kpi-val { font-size: 14pt; font-weight: bold; color: #0052CC; }
          .kpi-green { font-size: 14pt; font-weight: bold; color: #059669; }
          .kpi-red { font-size: 14pt; font-weight: bold; color: #DC2626; }
          .th-header { background-color: #0A3981; color: #FFFFFF; font-weight: bold; font-size: 11pt; border: 1pt solid #002D62; text-align: center; height: 32px; }
          .row-total { background-color: #E2E8F0; font-weight: bold; border-top: 2pt solid #0A3981; border-bottom: 2.5pt double #0A3981; }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <!-- Banner Corporativo -->
          <tr>
            <td colspan="10" class="banner-title" style="padding-bottom: 4px;">HURIOS RALLY E.I.R.L. &bull; RUC: 20608542191</td>
          </tr>
          <tr>
            <td colspan="10" class="banner-sub" style="padding-bottom: 16px;">Catálogo Oficial de Repuestos e Inventario Valorizado &bull; Emitido: ${fechaHora}</td>
          </tr>

          <!-- Dashboard de KPIs en Excel -->
          <tr>
            <td colspan="2" class="kpi-box">
              <div class="kpi-lbl">TOTAL REPUESTOS</div>
              <div class="kpi-val">${totalRepuestos} ítems</div>
            </td>
            <td colspan="2" class="kpi-box">
              <div class="kpi-lbl">STOCK FÍSICO TOTAL</div>
              <div class="kpi-val">${stockTotal} unidades</div>
            </td>
            <td colspan="3" class="kpi-box">
              <div class="kpi-lbl">VALORIZACIÓN TOTAL DEL INVENTARIO</div>
              <div class="kpi-green">S/ ${valorizacionTotal.toFixed(2)}</div>
            </td>
            <td colspan="3" class="kpi-box">
              <div class="kpi-lbl">STOCK CRÍTICO (&le; ${UMBRAL_STOCK_CRITICO} UND)</div>
              <div class="${repuestosStockCritico > 0 ? 'kpi-red' : 'kpi-green'}">${repuestosStockCritico} en alerta</div>
            </td>
          </tr>
          <tr><td colspan="10" style="height: 14px;"></td></tr>

          <!-- Encabezados de Tabla Real con Color Corporativo #0A3981 -->
          <tr>
            <th class="th-header" style="width: 45px;">N°</th>
            <th class="th-header" style="width: 120px;">Código OEM</th>
            <th class="th-header" style="width: 290px; text-align: left; padding-left: 10px;">Descripción del Repuesto</th>
            <th class="th-header" style="width: 130px;">Categoría</th>
            <th class="th-header" style="width: 120px;">Precio Unit. (S/)</th>
            <th class="th-header" style="width: 90px;">Stock</th>
            <th class="th-header" style="width: 110px;">Estado Stock</th>
            <th class="th-header" style="width: 180px;">Compatibilidad</th>
            <th class="th-header" style="width: 75px;">Rating</th>
            <th class="th-header" style="width: 140px;">Valor Total (S/)</th>
          </tr>

          <!-- Filas de Datos -->
          ${filasHtml}

          <!-- Fila de Totales Generales -->
          <tr class="row-total">
            <td colspan="4" style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 12px; font-weight: bold;">TOTALES GENERALES:</td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 10px; font-weight: bold; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${precioPromedio.toFixed(2)} (Prom.)</td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 8px 8px; font-weight: bold; mso-number-format: '#\\,##0';">${stockTotal} und.</td>
            <td style="border: 0.5pt solid #CBD5E1;"></td>
            <td style="border: 0.5pt solid #CBD5E1;"></td>
            <td style="border: 0.5pt solid #CBD5E1;"></td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 10px; font-weight: bold; color: #059669; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${valorizacionTotal.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fileName = `Catalogo_HuriosRally_${Date.now()}.xls`;
    const targetPath = `${getDirectorioAlmacenamiento()}${fileName}`;

    try {
      await FileSystem.writeAsStringAsync(targetPath, excelHtml, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (e) {
      console.warn('Error al guardar Excel catálogo:', e);
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(targetPath, {
        mimeType: 'application/vnd.ms-excel',
        dialogTitle: 'Exportar Catálogo de Repuestos a Excel',
        UTI: 'com.microsoft.excel.xls',
      });
    }

    return targetPath;
  },

  /**
   * Exporta el listado completo de pedidos y órdenes a un archivo Excel (.XLS) con tabla estructurada,
   * encabezados de color corporativo #0F172A, cuadrícula real y dashboard con métricas de ventas.
   */
  async exportarPedidosExcel(pedidos: PedidoLocal[]): Promise<string> {
    const fechaHora = new Date().toLocaleString('es-PE');
    const totalPedidos = pedidos.length;
    const totalRecaudado = pedidos.reduce((acc, p) => acc + (p.totalCotizado || 0), 0);
    const ticketPromedio = totalPedidos > 0 ? totalRecaudado / totalPedidos : 0;
    const totalItems = pedidos.reduce(
      (acc, p) => acc + (p.items || []).reduce((sum, item) => sum + (item.cantidad || 1), 0),
      0
    );
    const totalSubtotal = pedidos.reduce((acc, p) => acc + (p.subtotal || 0), 0);
    const totalIgv = pedidos.reduce((acc, p) => acc + (p.igv || 0), 0);

    const filasHtml = pedidos
      .map((p, i) => {
        const idOrden = p.id && p.id !== 'undefined' ? p.id : `PED-${4820 + i}`;
        const fechaOrden =
          p.fechaCreacion && p.fechaCreacion !== 'undefined' ? p.fechaCreacion : '23/09/2026';
        const clienteFinal =
          p.clienteNombre && p.clienteNombre !== 'undefined' && p.clienteNombre.trim() !== ''
            ? p.clienteNombre
            : p.creadoPorNombre || 'Cliente General (Mostrador)';
        const tipoComp = p.comprobanteTipo || 'Boleta Electrónica';
        const numDoc =
          p.documentoNumero && p.documentoNumero !== 'undefined' && p.documentoNumero !== '-'
            ? p.documentoNumero
            : tipoComp.includes('Factura')
            ? '20608542191'
            : '72080490';
        const metodo = p.metodoPago || 'Efectivo / Mostrador';
        const opRef =
          p.numOperacion && p.numOperacion !== 'undefined' && p.numOperacion !== '-'
            ? p.numOperacion
            : metodo.includes('Yape')
            ? `OP-782${i}0`
            : 'REF-CAJA';

        const cantItems = (p.items || []).reduce((acc, curr) => acc + (curr.cantidad || 1), 0);
        const esPar = i % 2 === 0;
        const bgRow = esPar ? '#FFFFFF' : '#F8FAFC';

        let colorEstado = '#1D4ED8';
        let bgEstado = '#DBEAFE';
        const st = String(p.estado || 'Pagado');
        if (st === 'Entregado' || st === 'Pagado') {
          colorEstado = '#15803D';
          bgEstado = '#DCFCE7';
        } else if (st === 'Pendiente') {
          colorEstado = '#B45309';
          bgEstado = '#FEF3C7';
        } else if (st === 'Confirmado') {
          colorEstado = '#1D4ED8';
          bgEstado = '#DBEAFE';
        }

        const estadoBadge = `<span style="color: ${colorEstado}; font-weight: bold; background-color: ${bgEstado}; padding: 2px 6px; border-radius: 4px;">${st}</span>`;

        return `
        <tr style="background-color: ${bgRow};">
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px;">${i + 1}</td>
          <td style="border: 0.5pt solid #CBD5E1; font-family: monospace; font-weight: bold; color: #0052CC; text-align: center; padding: 6px 8px;">${idOrden}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px; color: #475569;">${fechaOrden}</td>
          <td style="border: 0.5pt solid #CBD5E1; font-weight: 600; color: #0F172A; padding: 6px 10px;">${clienteFinal}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px;">${tipoComp}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px; font-family: monospace;">${numDoc}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px;">${metodo}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px; font-family: monospace; color: #64748B;">${opRef}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px;">${estadoBadge}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 6px 8px; font-weight: bold; mso-number-format: '#\\,##0';">${cantItems} und.</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 6px 10px; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${(p.subtotal || 0).toFixed(2)}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 6px 10px; color: #64748B; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${(p.igv || 0).toFixed(2)}</td>
          <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 6px 10px; font-weight: bold; color: #059669; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${(p.totalCotizado || 0).toFixed(2)}</td>
        </tr>
      `;
      })
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Historial de Órdenes</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1E293B; margin: 0; padding: 15px; }
          .banner-title { font-size: 16pt; font-weight: bold; color: #0F172A; }
          .banner-sub { font-size: 10pt; color: #64748B; }
          .kpi-box { border: 1.5pt solid #CBD5E1; background-color: #F8FAFC; text-align: center; padding: 10px 14px; border-radius: 6px; }
          .kpi-lbl { font-size: 9pt; font-weight: bold; color: #64748B; text-transform: uppercase; }
          .kpi-val { font-size: 14pt; font-weight: bold; color: #0052CC; }
          .kpi-green { font-size: 14pt; font-weight: bold; color: #059669; }
          .th-header { background-color: #0F172A; color: #FFFFFF; font-weight: bold; font-size: 11pt; border: 1pt solid #020617; text-align: center; height: 32px; }
          .row-total { background-color: #E2E8F0; font-weight: bold; border-top: 2pt solid #0F172A; border-bottom: 2.5pt double #0F172A; }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <!-- Banner Corporativo -->
          <tr>
            <td colspan="13" class="banner-title" style="padding-bottom: 4px;">HURIOS RALLY E.I.R.L. &bull; RUC: 20608542191</td>
          </tr>
          <tr>
            <td colspan="13" class="banner-sub" style="padding-bottom: 16px;">Registro Consolidado de Órdenes, Comprobantes y Ventas &bull; Emitido: ${fechaHora}</td>
          </tr>

          <!-- Dashboard de KPIs en Excel -->
          <tr>
            <td colspan="3" class="kpi-box">
              <div class="kpi-lbl">TOTAL RECAUDADO</div>
              <div class="kpi-green">S/ ${totalRecaudado.toFixed(2)}</div>
            </td>
            <td colspan="3" class="kpi-box">
              <div class="kpi-lbl">TOTAL DE ÓRDENES</div>
              <div class="kpi-val">${totalPedidos} transacciones</div>
            </td>
            <td colspan="3" class="kpi-box">
              <div class="kpi-lbl">TICKET PROMEDIO</div>
              <div class="kpi-val">S/ ${ticketPromedio.toFixed(2)}</div>
            </td>
            <td colspan="4" class="kpi-box">
              <div class="kpi-lbl">PIEZAS VENDIDAS</div>
              <div class="kpi-green">${totalItems} unidades</div>
            </td>
          </tr>
          <tr><td colspan="13" style="height: 14px;"></td></tr>

          <!-- Encabezados de Tabla Real con Color Corporativo #0F172A -->
          <tr>
            <th class="th-header" style="width: 40px;">N°</th>
            <th class="th-header" style="width: 110px;">N° Pedido</th>
            <th class="th-header" style="width: 140px;">Fecha y Hora</th>
            <th class="th-header" style="width: 220px; text-align: left; padding-left: 10px;">Cliente</th>
            <th class="th-header" style="width: 100px;">Comprobante</th>
            <th class="th-header" style="width: 110px;">N° Documento</th>
            <th class="th-header" style="width: 130px;">Método de Pago</th>
            <th class="th-header" style="width: 120px;">N° Operación</th>
            <th class="th-header" style="width: 110px;">Estado</th>
            <th class="th-header" style="width: 85px;">Cant. Rep.</th>
            <th class="th-header" style="width: 100px;">Subtotal (S/)</th>
            <th class="th-header" style="width: 95px;">IGV (18%) (S/)</th>
            <th class="th-header" style="width: 115px;">Total (S/)</th>
          </tr>

          <!-- Filas de Datos -->
          ${filasHtml}

          <!-- Fila de Totales -->
          <tr class="row-total">
            <td colspan="9" style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 12px; font-weight: bold;">TOTALES GENERALES:</td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: center; padding: 8px 8px; font-weight: bold; mso-number-format: '#\\,##0';">${totalItems} und.</td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 10px; font-weight: bold; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${totalSubtotal.toFixed(2)}</td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 10px; font-weight: bold; color: #64748B; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${totalIgv.toFixed(2)}</td>
            <td style="border: 0.5pt solid #CBD5E1; text-align: right; padding: 8px 10px; font-weight: bold; color: #059669; mso-number-format: '\\0022S/\\0022\\ #\\,##0\\.00';">S/ ${totalRecaudado.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fileName = `Historial_Pedidos_HuriosRally_${Date.now()}.xls`;
    const targetPath = `${getDirectorioAlmacenamiento()}${fileName}`;

    try {
      await FileSystem.writeAsStringAsync(targetPath, excelHtml, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (e) {
      console.warn('Error al guardar Excel pedidos:', e);
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(targetPath, {
        mimeType: 'application/vnd.ms-excel',
        dialogTitle: 'Exportar Registro de Pedidos a Excel',
        UTI: 'com.microsoft.excel.xls',
      });
    }

    return targetPath;
  },

  /**
   * Genera el HTML del informe gerencial formal con estadísticas y KPIs
   */
  generarReporteEstadisticasHtml(
    stats: {
      totalRecaudado: number;
      totalPedidos: number;
      ticketPromedio: number;
      unidadesVendidas: number;
      desgloseMetodos: Record<string, number>;
      topRepuestos: { nombre: string; cant: number; total: number }[];
    },
    pedidos: PedidoLocal[]
  ): string {
    const fecha = new Date().toLocaleString('es-PE');
    const metodosHtml = Object.entries(stats.desgloseMetodos)
      .map(
        ([metodo, monto]) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">${metodo}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700;">S/ ${monto.toFixed(2)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #64748B;">${stats.totalRecaudado > 0 ? ((monto / stats.totalRecaudado) * 100).toFixed(1) : 0}%</td>
        </tr>
      `
      )
      .join('');

    const topRepuestosHtml = stats.topRepuestos
      .map(
        (r, i) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 700;">#${i + 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">${r.nombre}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: center;">${r.cant} und.</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700;">S/ ${r.total.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte Gerencial de Ventas - Hurios Rally E.I.R.L.</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; padding: 24px; font-size: 11px; }
          .header { border-bottom: 2px solid #0066FF; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; }
          .title { font-size: 18px; font-weight: 900; color: #0F172A; }
          .subtitle { font-size: 10px; color: #64748B; margin-top: 2px; }
          .kpi-grid { display: flex; gap: 10px; margin-bottom: 16px; }
          .kpi-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; background: #F8FAFC; text-align: center; }
          .kpi-label { font-size: 9px; font-weight: 800; color: #64748B; text-transform: uppercase; }
          .kpi-val { font-size: 15px; font-weight: 900; color: #0066FF; margin-top: 4px; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 12px; font-weight: 800; color: #0F172A; margin-bottom: 8px; border-left: 3px solid #0066FF; padding-left: 6px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0F172A; color: #FFFFFF; padding: 6px 8px; font-size: 10px; font-weight: 700; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 58px; height: 58px; border-radius: 50%; border: 2.5px solid #0052CC; outline: 1.5px solid #60A5FA; outline-offset: -4px; background: #FFFFFF; text-align: center; box-sizing: border-box; padding-top: 4px; flex-shrink: 0;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 900; color: #0A3981; line-height: 17px; letter-spacing: -0.5px;">HR</div>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.5px; font-weight: 900; color: #0A3981; line-height: 7px; letter-spacing: 0.5px; margin-top: 1px;">HURIOS</div>
              <table border="0" cellpadding="0" cellspacing="1" style="margin: 1px auto 0 auto; border-collapse: separate;">
                <tr>
                  <td style="width: 3px; height: 2px; background: #EF4444;"></td>
                  <td style="width: 3px; height: 2px; background: #0F172A;"></td>
                  <td style="width: 3px; height: 2px; background: #EF4444;"></td>
                  <td style="width: 3px; height: 2px; background: #0F172A;"></td>
                </tr>
              </table>
              <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; font-weight: 900; font-style: italic; color: #DC2626; line-height: 8px; margin-top: 1px;">RALLY</div>
            </div>
            <div>
              <div class="title">HURIOS RALLY E.I.R.L.</div>
              <div class="subtitle">Reporte Ejecutivo de Ventas, Órdenes y Rendimiento Comercial</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700;">RUC: 20608542191</div>
            <div style="font-size: 10px; color: #64748B;">Fecha: ${fecha}</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Recaudación Total</div>
            <div class="kpi-val" style="color: #059669;">S/ ${stats.totalRecaudado.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Pedidos</div>
            <div class="kpi-val">${stats.totalPedidos}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ticket Promedio</div>
            <div class="kpi-val">S/ ${stats.ticketPromedio.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Piezas Vendidas</div>
            <div class="kpi-val">${stats.unidadesVendidas} und.</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Distribución por Método de Pago</div>
          <table>
            <thead>
              <tr>
                <th>Método de Liquidación</th>
                <th style="text-align: right;">Total Recaudado (S/)</th>
                <th style="text-align: right;">Participación (%)</th>
              </tr>
            </thead>
            <tbody>
              ${metodosHtml}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Ranking de Repuestos más Vendidos</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">Posición</th>
                <th style="width: 50%;">Repuesto</th>
                <th style="width: 20%; text-align: center;">Unidades</th>
                <th style="width: 20%; text-align: right;">Total Generado</th>
              </tr>
            </thead>
            <tbody>
              ${topRepuestosHtml || '<tr><td colspan="4" style="text-align: center; padding: 10px;">Sin transacciones registradas</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; font-size: 9px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 8px;">
          Documento confidencial emitido por el Sistema ERP de Administración de Hurios Rally App.
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Genera y exporta el informe gerencial formal en PDF con estadísticas y KPIs
   */
  async exportarReporteEstadisticasPdf(
    stats: {
      totalRecaudado: number;
      totalPedidos: number;
      ticketPromedio: number;
      unidadesVendidas: number;
      desgloseMetodos: Record<string, number>;
      topRepuestos: { nombre: string; cant: number; total: number }[];
    },
    pedidos: PedidoLocal[]
  ): Promise<string> {
    const html = this.generarReporteEstadisticasHtml(stats, pedidos);
    let printResult: { uri: string; base64?: string };
    try {
      printResult = await Print.printToFileAsync({ html, base64: true });
    } catch (printErr) {
      console.warn('Reintentando reporte gerencial con base64:false:', printErr);
      printResult = await Print.printToFileAsync({ html, base64: false });
    }
    const { uri, base64 } = printResult;
    const fileName = `Reporte_Gerencial_${Date.now()}.pdf`;
    const targetPath = `${getDirectorioAlmacenamiento()}${fileName}`;

    let sharePath = targetPath;
    try {
      if (base64) {
        await FileSystem.writeAsStringAsync(targetPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: uri, to: targetPath });
      }
    } catch (e) {
      console.warn('Error al guardar reporte gerencial PDF:', e);
      sharePath = uri;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(sharePath, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte Ejecutivo de Ventas - Hurios Rally',
      });
    }

    return sharePath;
  },
};
