import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.text('PDV FÁBRICA - ROMANEIO DE ENTREGA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Pedido: #${order.displayId}`, 15, 35);
    doc.text(`Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}`, 15, 40);
    
    // Client Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 15, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${order.user.name}`, 15, 57);
    doc.text(`CNPJ: ${order.user.cnpj || 'Não informado'}`, 15, 62);
    doc.text(`Telefone: ${order.user.phone || 'Não informado'}`, 15, 67);
    doc.text(`E-mail: ${order.user.email}`, 15, 72);

    // Items Table
    const tableData = order.items.map(item => [
      item.product.name,
      item.quantity.toString(),
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Produto', 'Qtd', 'Preço Un.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const totalText = `TOTAL DO PEDIDO: R$ ${order.totalPrice.toFixed(2)}`;
    doc.text(totalText, pageWidth - 15, finalY + 15, { align: 'right' });

    // QR Code for Signature
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const qrUrl = `${baseUrl}/receipt/${order.id}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURA DE RECEBIMENTO', 15, finalY + 30);
    
    doc.addImage(qrDataUrl, 'PNG', 15, finalY + 35, 40, 40);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Escaneie o QR Code acima para confirmar', 15, finalY + 80);
    doc.text('o recebimento e assinar digitalmente.', 15, finalY + 84);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Este documento é um romaneio de simples conferência.', pageWidth / 2, 285, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');
    let finalPdfBuffer: any = pdfBuffer;

    if (order.asaasPaymentUrl && order.asaasPaymentUrl.startsWith('http')) {
      try {
        console.log(`[PDF Merge] Fetching boleto from: ${order.asaasPaymentUrl}`);
        const boletoRes = await fetch(order.asaasPaymentUrl);
        if (boletoRes.ok) {
          const boletoBuffer = await boletoRes.arrayBuffer();

          const mergedPdf = await PDFDocument.create();
          
          const romaneioDoc = await PDFDocument.load(pdfBuffer);
          const romaneioPages = await mergedPdf.copyPages(romaneioDoc, romaneioDoc.getPageIndices());
          romaneioPages.forEach((page) => mergedPdf.addPage(page));

          const boletoDoc = await PDFDocument.load(boletoBuffer);
          const boletoPages = await mergedPdf.copyPages(boletoDoc, boletoDoc.getPageIndices());
          boletoPages.forEach((page) => mergedPdf.addPage(page));

          const mergedPdfBytes = await mergedPdf.save();
          finalPdfBuffer = mergedPdfBytes.buffer; 
          console.log("[PDF Merge] PDF merged successfully!");
        } else {
           console.warn(`[PDF Merge] Failed to fetch boleto: ${boletoRes.status}`);
        }
      } catch (mergeErr) {
        console.error("[PDF Merge] Error combining PDFs, returning romaneio only:", mergeErr);
      }
    }

    return new NextResponse(finalPdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=romaneio_pedido_${order.displayId}.pdf`,
      },
    });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: 'Erro ao gerar PDF', details: error.message }, { status: 500 });
  }
}
