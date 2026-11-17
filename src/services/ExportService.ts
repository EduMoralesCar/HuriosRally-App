import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PedidoLocal, Repuesto } from '../types';

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
      pedido.documentoNumero || (esFactura ? '20608542191' : '72080490');
    const cliente = pedido.clienteNombre || 'Cliente General';
    const fecha = pedido.fechaCreacion || new Date().toLocaleDateString('es-PE');
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
            width: 15%;
            vertical-align: middle;
            text-align: center;
          }
          .logo-badge {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0066FF, #0044BB);
            border: 3px solid #E11D48;
            color: #FFFFFF;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 16px;
            line-height: 1;
            letter-spacing: -0.5px;
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
              <td class="logo-cell">
                <div class="logo-badge">HR</div>
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
   * Genera el PDF de la Boleta y abre el diálogo nativo para previsualizar, imprimir o compartir por WhatsApp/Drive
   */
  async exportarBoletaPdf(pedido: PedidoLocal): Promise<string> {
    const html = this.generarBoletaHtml(pedido);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const fileName = `Comprobante_${pedido.id}_HuriosRally.pdf`;
    const newPath = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${fileName}`;

    try {
      await FileSystem.copyAsync({ from: uri, to: newPath });
    } catch {
      // Si falla copia usa uri original
    }

    const sharePath = newPath || uri;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(sharePath, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Compartir ${pedido.comprobanteTipo || 'Boleta'} - ${pedido.id}`,
      });
    }

    return sharePath;
  },

  /**
   * Imprime directamente o previsualiza la boleta en la pantalla sin guardar archivo
   */
  async imprimirBoleta(pedido: PedidoLocal): Promise<void> {
    const html = this.generarBoletaHtml(pedido);
    await Print.printAsync({ html });
  },

  /**
   * Exporta el catálogo completo de repuestos a un archivo Excel (.CSV formateado con UTF-8 BOM)
   */
  async exportarCatalogoExcel(repuestos: Repuesto[]): Promise<string> {
    const BOM = '\uFEFF';
    const encabezados = [
      'Código OEM',
      'Nombre del Repuesto',
      'Categoría',
      'Precio Unitario (S/)',
      'Stock Actual',
      'Compatibilidad',
      'Calificación',
      'Valorización Total (S/)',
    ].join(';');

    const filas = repuestos.map((r) => {
      const valorTotal = (Number(r.precio || 0) * Number(r.stock || 0)).toFixed(2);
      const escape = (txt: string) => `"${(txt || '').replace(/"/g, '""')}"`;
      return [
        escape(r.codigoOEM || 'S/N'),
        escape(r.nombre),
        escape(r.categoria),
        Number(r.precio || 0).toFixed(2),
        r.stock,
        escape(r.compatibilidad || 'Universal'),
        r.rating || 5.0,
        valorTotal,
      ].join(';');
    });

    const csvContent = BOM + [encabezados, ...filas].join('\r\n');
    const path = `${FileSystem.cacheDirectory}Catalogo_HuriosRally_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(path, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Catálogo de Repuestos a Excel',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return path;
  },

  /**
   * Exporta el listado completo de pedidos y órdenes a Excel (.CSV con BOM)
   */
  async exportarPedidosExcel(pedidos: PedidoLocal[]): Promise<string> {
    const BOM = '\uFEFF';
    const encabezados = [
      'N° Pedido',
      'Fecha',
      'Cliente',
      'Comprobante',
      'N° Documento',
      'Método de Pago',
      'N° Operación',
      'Estado',
      'Cant. Repuestos',
      'Subtotal (S/)',
      'IGV (18%) (S/)',
      'Total (S/)',
    ].join(';');

    const filas = pedidos.map((p) => {
      const escape = (txt?: string) => `"${(txt || '').replace(/"/g, '""')}"`;
      const cantItems = (p.items || []).reduce((acc, curr) => acc + (curr.cantidad || 1), 0);
      return [
        escape(p.id),
        escape(p.fechaCreacion),
        escape(p.clienteNombre),
        escape(p.comprobanteTipo || 'Boleta'),
        escape(p.documentoNumero || '-'),
        escape(p.metodoPago || '-'),
        escape(p.numOperacion || '-'),
        escape(p.estado),
        cantItems,
        (p.subtotal || 0).toFixed(2),
        (p.igv || 0).toFixed(2),
        (p.totalCotizado || 0).toFixed(2),
      ].join(';');
    });

    const csvContent = BOM + [encabezados, ...filas].join('\r\n');
    const path = `${FileSystem.cacheDirectory}Historial_Pedidos_HuriosRally_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(path, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Registro de Pedidos a Excel',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return path;
  },

  /**
   * Genera y exporta un informe gerencial formal en PDF con las estadísticas y KPIs del Administrador
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

    const html = `
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
          <div>
            <div class="title">HURIOS RALLY E.I.R.L.</div>
            <div class="subtitle">Reporte Ejecutivo de Ventas, Órdenes y Rendimiento Comercial</div>
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

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const sharePath = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}Reporte_Gerencial_${Date.now()}.pdf`;

    try {
      await FileSystem.copyAsync({ from: uri, to: sharePath });
    } catch {
      // Fallback
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(sharePath || uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Reporte Ejecutivo en PDF',
      });
    }

    return sharePath || uri;
  },
};
