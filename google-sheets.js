const { GoogleSpreadsheet } = require('googleapis').sheets;
const { google } = require('googleapis');

class SheetsManager {
    constructor() {
        // Parse the service account key from environment variable
        try {
            this.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (error) {
            console.error('Error parsing Google credentials:', error);
            this.credentials = null;
        }
        
        this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    }

    async addOrder(orderData) {
        try {
            if (!this.credentials || !this.spreadsheetId) {
                console.error('Missing Google Sheets credentials or sheet ID');
                return false;
            }

            // Create auth client
            const auth = new google.auth.GoogleAuth({
                credentials: this.credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const sheets = google.sheets({ version: 'v4', auth });

            // Prepare row data
            const values = [[
                orderData.name || 'N/A',
                orderData.phone || 'N/A', 
                orderData.items || 'N/A',
                orderData.total || 'N/A',
                orderData.status || 'New Order',
                new Date().toLocaleString(),
                orderData.address || 'N/A'
            ]];

            // Append to sheet
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Sheet1!A:G',
                valueInputOption: 'RAW',
                resource: {
                    values: values,
                },
            });

            console.log('Order saved to Google Sheets successfully');
            return true;

        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            return false;
        }
    }

    async updateOrderStatus(rowNumber, newStatus) {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: this.credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const sheets = google.sheets({ version: 'v4', auth });

            await sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `Sheet1!E${rowNumber}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[newStatus]],
                },
            });

            console.log(`Order status updated to: ${newStatus}`);
            return true;

        } catch (error) {
            console.error('Error updating order status:', error);
            return false;
        }
    }
}

module.exports = SheetsManager;