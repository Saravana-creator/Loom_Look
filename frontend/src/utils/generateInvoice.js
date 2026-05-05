import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoice = (order) => {
    const doc = new jsPDF();
    
    // Emerald Green Theme Color
    const emerald = [6, 78, 59];
    
    // Header
    doc.setFillColor(...emerald);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('LOOM LOOK', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('The Art of Authentic Weaving', 20, 32);
    
    doc.setFontSize(12);
    doc.text(`INVOICE: #${order.order_number || order.orderId}`, 140, 25);
    doc.text(`DATE: ${new Date(order.created_at || order.createdAt).toLocaleDateString()}`, 140, 32);

    // Order Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // We don't have the shipping address details in the order summary usually, 
    // but we can add what we have.
    doc.text(`Customer ID: ${order.user_id || 'N/A'}`, 20, 68);
    doc.text(`Payment: ${order.payment_method?.toUpperCase()}`, 20, 74);
    doc.text(`Status: ${order.payment_status?.toUpperCase()}`, 20, 80);

    // Table
    const tableColumn = ["Piece Name", "Price", "Qty", "Subtotal"];
    const tableRows = [];

    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
    items.forEach(item => {
        const rowData = [
            item.name || item.productId,
            `INR ${item.price.toLocaleString()}`,
            item.quantity,
            `INR ${item.subtotal.toLocaleString()}`
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        theme: 'grid',
        headStyles: { fillColor: emerald },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 }
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: INR ${order.subtotal?.toLocaleString() || order.total_amount?.toLocaleString()}`, 140, finalY);
    doc.text(`Shipping: INR ${order.shipping_cost?.toLocaleString() || '0'}`, 140, finalY + 7);
    doc.text(`Tax (GST): INR ${order.tax?.toLocaleString() || '0'}`, 140, finalY + 14);
    
    doc.setFontSize(14);
    doc.setTextColor(...emerald);
    doc.text(`Total Amount: INR ${order.total_amount?.toLocaleString()}`, 140, finalY + 25);

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for supporting authentic artisanal heritage.', 105, 280, { align: 'center' });
    doc.text('This is a computer generated invoice.', 105, 285, { align: 'center' });

    doc.save(`LoomLook_Invoice_${order.order_number || order.orderId}.pdf`);
};
