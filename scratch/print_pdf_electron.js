const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({ show: false });
    const htmlPath = 'file:///' + path.resolve(__dirname, '../manual_temp.html').replace(/\\/g, '/');
    await win.loadURL(htmlPath);
    
    const options = {
      margins: {
        top: 0.4,
        bottom: 0.6,
        left: 0.6,
        right: 0.6
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 1px; color: transparent;"></div>',
      footerTemplate: '<div style="font-size: 10px; font-family: \'Outfit\', sans-serif; text-align: center; width: 100%; color: #64748b; padding-bottom: 5px;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
      pageSize: 'A4'
    };

    const data = await win.webContents.printToPDF(options);
    const pdfPath = path.resolve(__dirname, '../Manual_Usuario_Distribuidora.pdf');
    fs.writeFileSync(pdfPath, data);
    console.log('PDF successfully generated at: ' + pdfPath);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  } finally {
    app.quit();
  }
});
