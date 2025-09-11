import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ProcessedTransaction } from "@/types/transactions";
import { formatAmount } from "./transactions";

interface PDFExportOptions {
  title?: string;
  includeStats?: boolean;
  walletAddress?: string;
}

export const exportTransactionsToPDF = (
  transactions: ProcessedTransaction[],
  options: PDFExportOptions = {},
) => {
  const {
    title = "Transaction History",
    includeStats = true,
    walletAddress,
  } = options;

  const doc = new jsPDF();

  doc.setProperties({
    title: title,
    subject: "Canopy Swap Transaction History",
    author: "Canopy Swap",
    creator: "Canopy Swap Application",
  });

  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, yPosition);
  yPosition += 10;

  if (walletAddress) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Wallet: ${walletAddress}`, 14, yPosition);
    yPosition += 8;
  }

  doc.setFontSize(10);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 8;

  if (includeStats && transactions.length > 0) {
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
    const avgFee = totalFees / transactions.length;
    const completedTransactions = transactions.filter(
      (tx) => tx.status === "Completed",
    ).length;
    const successRate = (completedTransactions / transactions.length) * 100;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Transactions: ${transactions.length}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Total Volume: $${formatAmount(totalVolume, 2)}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Success Rate: ${formatAmount(successRate, 1)}%`, 14, yPosition);
    yPosition += 6;
    doc.text(`Average Fee: $${formatAmount(avgFee, 2)}`, 14, yPosition);
    yPosition += 12;
  }

  const tableHeaders = [
    "Date & Time",
    "Tx Hash",
    "Pair",
    "Type",
    "Amount",
    "Price",
    "Total",
    "Fee",
    "Status",
  ];

  const tableData = transactions.map((tx) => [
    tx.dateTime.toLocaleDateString() +
      " " +
      tx.dateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    tx.txHash.slice(0, 12) + "...",
    tx.pair,
    tx.type,
    `${formatAmount(tx.amount)} ${tx.tradingPairInfo.baseAsset.symbol}`,
    formatAmount(tx.price, 4),
    `${formatAmount(tx.total, 2)} ${tx.tradingPairInfo.quoteAsset.symbol}`,
    `$${formatAmount(tx.fee, 2)}`,
    tx.status,
  ]);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPosition,
    theme: "striped",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Date & Time
      1: { cellWidth: 20 }, // Tx Hash
      2: { cellWidth: 20 }, // Pair
      3: { cellWidth: 18 }, // Type
      4: { cellWidth: 25 }, // Amount
      5: { cellWidth: 18 }, // Price
      6: { cellWidth: 25 }, // Total
      7: { cellWidth: 15 }, // Fee
      8: { cellWidth: 18 }, // Status
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10,
    );
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `transaction-history-${timestamp}.pdf`;

  doc.save(filename);

  return filename;
};
