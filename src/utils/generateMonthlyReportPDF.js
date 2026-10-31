import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONTHS_ID, DAYS_ID } from './constants';
import { formatCurrency } from './formatters';

/**
 * Format string tanggal (YYYY-MM-DD atau ISO) ke format Indonesia yang rapi:
 * Contoh: "Kamis, 01 Okt 2026"
 */
function formatIndonesianDateRow(dateStr) {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIdx, day);
      const dayName = DAYS_ID[d.getDay()] || '';
      const monthShort = (MONTHS_ID[monthIdx] || '').substring(0, 3);
      const formattedDay = String(day).padStart(2, '0');
      return `${dayName}, ${formattedDay} ${monthShort} ${year}`;
    }
  } catch {
    // fallback jika parsing gagal
  }
  return String(dateStr);
}

/**
 * Generate dan unduh PDF Laporan Rekapitulasi & Rincian Absensi Bulanan
 * Lengkap dengan ringkasan total dan rincian per hari untuk setiap karyawan.
 */
export async function generateMonthlyReportPDF({
  recapData = [],
  allDailyRecords = [],
  selectedMonth = '1',
  selectedYear = String(new Date().getFullYear()),
  storeName = 'GIBY MART',
  totals = null,
}) {
  if (!recapData || recapData.length === 0) {
    throw new Error('Tidak ada data rekap untuk dicetak ke PDF.');
  }

  // 1. Tentukan Nama Bulan
  const monthIdx = parseInt(selectedMonth, 10) - 1;
  const monthName = MONTHS_ID[monthIdx] || `Bulan ${selectedMonth}`;
  const filename = `Laporan_Rekap_Absensi_${storeName.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.pdf`;

  // 2. Hitung totals jika belum ada
  const calculatedTotals = totals || recapData.reduce(
    (acc, item) => {
      acc.daysPresent += item.daysPresent || 0;
      acc.totalMinutes += item.totalMinutes || 0;
      acc.totalHours = Number(((acc.totalHours || 0) + (item.totalHours || 0)).toFixed(1));
      acc.totalMealAllowance += item.totalMealAllowance || 0;
      acc.totalPay += item.totalPay || 0;
      return acc;
    },
    { daysPresent: 0, totalMinutes: 0, totalHours: 0, totalMealAllowance: 0, totalPay: 0 }
  );

  // 3. Waktu cetak
  const now = new Date();
  const printDateStr = formatIndonesianDateRow(now.toISOString().split('T')[0]);
  const printTimeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/\./g, ':');

  // Inisialisasi jsPDF Landscape A4 (297 x 210 mm)
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 269mm

  // Palette Warna
  const COLOR_PRIMARY = [30, 58, 138];    // #1e3a8a Deep Navy
  const COLOR_SECONDARY = [71, 85, 105];  // #475569 Slate Muted
  const COLOR_TEXT = [15, 23, 42];        // #0f172a Dark text
  const COLOR_BORDER = [226, 232, 240];   // #e2e8f0 Border
  const COLOR_BG_LIGHT = [248, 250, 252]; // #f8fafc Light zebra
  const COLOR_BLUE = [37, 99, 235];       // #2563eb Accent blue
  const COLOR_AMBER = [217, 119, 6];      // #d97706 Amber
  const COLOR_EMERALD = [5, 150, 105];    // #059669 Emerald

  // ==========================================
  // HEADER HALAMAN PERTAMA
  // ==========================================
  // Bar dekoratif di paling atas dokumen
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Nama Toko
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(storeName.toUpperCase(), marginX, 15);

  // Subtitle / Tagline
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('SISTEM ABSENSI & PERHITUNGAN UPAH KARYAWAN', marginX, 20);

  // Judul Laporan
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_TEXT);
  doc.text('LAPORAN REKAPITULASI & RINCIAN ABSENSI BULANAN', marginX, 27);

  // Periode Laporan
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(`Periode: ${monthName} ${selectedYear}`, marginX, 33);

  // Metadata di sisi kanan atas
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Cetak: ${printDateStr}`, pageWidth - marginX, 16, { align: 'right' });
  doc.text(`Pukul: ${printTimeStr} WIB`, pageWidth - marginX, 21, { align: 'right' });
  doc.text(`Total Karyawan: ${recapData.length} Orang`, pageWidth - marginX, 26, { align: 'right' });

  // Garis pemisah header
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.5);
  doc.line(marginX, 36, pageWidth - marginX, 36);

  // ==========================================
  // KOTAK RINGKASAN METRIK (SUMMARY KPI CARDS)
  // ==========================================
  const cardY = 40;
  const cardH = 15;
  const cardGap = 4.5;
  const cardW = (contentWidth - (3 * cardGap)) / 4;

  const cards = [
    {
      label: 'TOTAL HARI HADIR',
      val: `${calculatedTotals.daysPresent} Hari`,
      sub: 'Akumulasi kehadiran',
      color: COLOR_BLUE
    },
    {
      label: 'TOTAL JAM KERJA DIBAYAR',
      val: `${calculatedTotals.totalHours || 0} Jam`,
      sub: `${Math.floor(calculatedTotals.totalMinutes / 60)}j ${calculatedTotals.totalMinutes % 60}m total`,
      color: COLOR_AMBER
    },
    {
      label: 'TOTAL UANG MAKAN',
      val: formatCurrency(calculatedTotals.totalMealAllowance),
      sub: 'Biaya uang makan',
      color: [180, 83, 9]
    },
    {
      label: 'TOTAL UPAH KESELURUHAN',
      val: formatCurrency(calculatedTotals.totalPay),
      sub: 'Total pengeluaran gaji',
      color: COLOR_EMERALD
    }
  ];

  cards.forEach((c, idx) => {
    const x = marginX + idx * (cardW + cardGap);
    // Background kotak
    doc.setFillColor(...COLOR_BG_LIGHT);
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'FD');

    // Label kartu
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 3.5, cardY + 4.5);

    // Nilai kartu
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...c.color);
    doc.text(c.val, x + 3.5, cardY + 10);

    // Sub label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, x + 3.5, cardY + 13.5);
  });

  let currentY = cardY + cardH + 7;

  // ==========================================
  // BAGIAN I: TABEL REKAP BULANAN SEMUA KARYAWAN
  // ==========================================
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('I. RINGKASAN REKAPITULASI BULANAN SEMUA KARYAWAN', marginX, currentY);
  currentY += 3;

  const recapTableHead = [
    ['NO', 'KODE', 'NAMA KARYAWAN', 'HARI HADIR', 'TOTAL JAM', 'TARIF / JAM', 'UANG MAKAN/HARI', 'TOTAL UANG MAKAN', 'TOTAL UPAH']
  ];

  const recapTableBody = recapData.map((item, idx) => [
    String(idx + 1),
    item.employeeCode || item.employeeId || '-',
    item.employeeName || '-',
    `${item.daysPresent || 0} Hari`,
    `${item.totalHours || 0} Jam`,
    formatCurrency(item.hourlyRate),
    formatCurrency(item.mealAllowance || 0),
    formatCurrency(item.totalMealAllowance || 0),
    formatCurrency(item.totalPay || 0)
  ]);

  const recapTableFoot = [
    [
      '',
      '',
      'TOTAL KESELURUHAN',
      `${calculatedTotals.daysPresent} Hari`,
      `${calculatedTotals.totalHours || 0} Jam`,
      '-',
      '-',
      formatCurrency(calculatedTotals.totalMealAllowance),
      formatCurrency(calculatedTotals.totalPay)
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: recapTableHead,
    body: recapTableBody,
    foot: recapTableFoot,
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLOR_TEXT,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: COLOR_BG_LIGHT,
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: COLOR_TEXT,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 47 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 34 },
      7: { halign: 'right', cellWidth: 38 },
      8: { halign: 'right', cellWidth: 42 },
    },
    margin: { top: 20, bottom: 18, left: marginX, right: marginX }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ==========================================
  // BAGIAN II: RINCIAN ABSENSI HARIAN PER KARYAWAN
  // ==========================================
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 22;
  }

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('II. RINCIAN ABSENSI & UPAH HARIAN PER KARYAWAN', marginX, currentY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text(
    'Rincian detail catatan kehadiran per hari, jam masuk, jam pulang, durasi jam kerja efektif, uang makan, dan perhitungan upah harian:',
    marginX,
    currentY + 4
  );
  currentY += 8;

  // Iterasi Setiap Karyawan
  recapData.forEach((emp, empIdx) => {
    // Filter record absensi harian milik karyawan ini
    const empRecords = allDailyRecords
      .filter((r) => {
        return (
          r.employeeId === emp.employeeId ||
          r.employeeCode === emp.employeeCode ||
          r.rawEmployeeId === emp.rawId ||
          r.employeeName === emp.employeeName
        );
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Cek apakah halaman masih cukup untuk Banner + Minimal beberapa baris tabel
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 22;
    }

    // Banner Karyawan
    const bannerH = 9.5;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(marginX, currentY, contentWidth, bannerH, 'FD');

    // Strip aksen biru di sebelah kiri banner
    doc.setFillColor(...COLOR_BLUE);
    doc.rect(marginX, currentY, 3, bannerH, 'F');

    // Nama Karyawan & Kode
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT);
    const empTitle = `${empIdx + 1}. ${emp.employeeName} (Kode: ${emp.employeeCode || emp.employeeId || '-'})`;
    doc.text(empTitle, marginX + 6, currentY + 4.2);

    // Ringkasan singkat karyawan
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const empSummary = `Total Hadir: ${emp.daysPresent || 0} Hari   |   Jam Kerja: ${emp.totalHours || 0} Jam   |   Tarif/Jam: ${formatCurrency(emp.hourlyRate)}   |   Uang Makan/Hari: ${formatCurrency(emp.mealAllowance || 0)}   |   Total Upah: ${formatCurrency(emp.totalPay || 0)}`;
    doc.text(empSummary, marginX + 6, currentY + 8);

    currentY += bannerH + 2;

    // Header Tabel Harian Karyawan
    const dailyHead = [
      ['NO', 'HARI & TANGGAL', 'MASUK', 'PULANG', 'JAM KERJA', 'TARIF / JAM', 'UANG MAKAN', 'UPAH HARIAN', 'STATUS / CATATAN']
    ];

    let dailyBody = [];
    if (empRecords.length === 0) {
      dailyBody = [
        ['-', 'Tidak ada rekaman absensi pada periode ini', '-', '-', '-', '-', '-', '-', '-']
      ];
    } else {
      dailyBody = empRecords.map((r, rIdx) => {
        const isAttended = r.status === 'HADIR' || r.status === 'SELESAI' || (r.checkOut && r.checkOut !== '-');
        const statusText = r.status || (isAttended ? 'HADIR' : '-');
        const notesText = r.notes ? ` (${r.notes})` : '';

        return [
          String(rIdx + 1),
          formatIndonesianDateRow(r.date),
          r.checkIn || '-',
          r.checkOut || '-',
          r.totalHours ? `${r.totalHours} Jam` : (isAttended ? '0 Jam' : '-'),
          formatCurrency(r.hourlyRate || emp.hourlyRate),
          formatCurrency(r.mealAllowance !== undefined ? r.mealAllowance : emp.mealAllowance),
          formatCurrency(r.totalPay || 0),
          `${statusText}${notesText}`
        ];
      });
    }

    const dailyFoot = [
      [
        '',
        `Subtotal ${emp.employeeName}`,
        '',
        '',
        `${emp.totalHours || 0} Jam`,
        '',
        formatCurrency(emp.totalMealAllowance || 0),
        formatCurrency(emp.totalPay || 0),
        `${emp.daysPresent || 0} Hari Hadir`
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      head: dailyHead,
      body: dailyBody,
      foot: dailyFoot,
      theme: 'grid',
      showHead: 'everyPage',
      headStyles: {
        fillColor: [51, 65, 85], // Slate dark
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: COLOR_TEXT,
        cellPadding: 1.8,
      },
      alternateRowStyles: {
        fillColor: COLOR_BG_LIGHT,
      },
      footStyles: {
        fillColor: [226, 232, 240],
        textColor: COLOR_TEXT,
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 1.8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 42 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 28 },
        6: { halign: 'right', cellWidth: 34 },
        7: { halign: 'right', cellWidth: 42 },
        8: { halign: 'center', cellWidth: 48 },
      },
      margin: { top: 20, bottom: 18, left: marginX, right: marginX }
    });

    currentY = doc.lastAutoTable.finalY + 6;
  });

  // ==========================================
  // BAGIAN III: LEMBAR PENGESAHAN / TANDA TANGAN
  // ==========================================
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  } else {
    currentY += 4;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SECONDARY);

  // Kolom tanda tangan kiri
  const signLeftX = 30;
  doc.text('Dibuat Oleh,', signLeftX, currentY);
  doc.text('Petugas / Administrator Sistem', signLeftX, currentY + 4);
  doc.line(signLeftX, currentY + 22, signLeftX + 55, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_TEXT);
  doc.text('( ............................................ )', signLeftX, currentY + 26);

  // Kolom tanda tangan kanan
  const signRightX = pageWidth - marginX - 70;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text(`Dicetak pada: ${printDateStr}`, signRightX, currentY);
  doc.text(`Mengetahui, Pimpinan ${storeName}`, signRightX, currentY + 4);
  doc.line(signRightX, currentY + 22, signRightX + 55, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_TEXT);
  doc.text('( ............................................ )', signRightX, currentY + 26);

  // ==========================================
  // HEADER & FOOTER DI SELURUH HALAMAN
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header di halaman 2 ke atas
    if (i > 1) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${storeName.toUpperCase()}  •  Laporan Rekapitulasi & Rincian Absensi Bulanan (Periode: ${monthName} ${selectedYear})`,
        marginX,
        10
      );
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.3);
      doc.line(marginX, 12, pageWidth - marginX, 12);
    }

    // Running Footer di semua halaman
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 9, pageWidth - marginX, pageHeight - 9);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistem Absensi ${storeName}  •  Laporan Resmi Rekapitulasi & Upah Bulanan  •  ${printDateStr} ${printTimeStr} WIB`,
      marginX,
      pageHeight - 5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 5, { align: 'right' });
  }

  // Unduh dokumen PDF ke perangkat pengguna
  doc.save(filename);
  return { success: true, filename };
}
