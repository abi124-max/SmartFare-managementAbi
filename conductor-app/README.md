# Smart Fare Conductor Application

## Phase 3 - Conductor Side Application

This is the conductor-side application for the Smart Fare Management System. It enables bus conductors to manage ticket validation, issue manual tickets, and monitor real-time passenger data.

## Features

### 🎯 Core Features

1. **Real-time Dashboard**
   - Live display of bus stop data from Firebase
   - Automatic refresh when database updates
   - Shows headcount, ticket distribution, and checked status

2. **QR Ticket Scanner**
   - Camera-based QR code scanning
   - Validates passenger tickets from Phase 1
   - Updates ticket distribution count automatically

3. **Manual Ticket Issuing**
   - Issue tickets for passengers without mobile booking
   - Automatic fare calculation based on route and bus type
   - Generate QR codes for manual tickets

4. **Validation System**
   - Compare AI headcount vs ticket distribution
   - Automatic checked status updates
   - Detect discrepancies and potential fraud

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No frameworks, pure JS implementation

### Backend Integration
- **Java Spring Boot** - REST API endpoints
- **Firebase Realtime Database** - Live data synchronization
- **Google ZXing** - QR code generation and scanning

## Database Structure

The application connects to Firebase Realtime Database with the following structure:

```json
{
  "bus_stops": {
    "stop_id_1": {
      "stopping_name": "Poonamallee",
      "headcount": 5,
      "ticket_distribution": 3,
      "checked_status": "unchecked"
    },
    "stop_id_2": {
      "stopping_name": "Porur",
      "headcount": 2,
      "ticket_distribution": 2,
      "checked_status": "checked"
    }
  }
}
```

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Copy your Firebase configuration
4. Update the `firebaseConfig` object in `script.js`

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 2. Backend API Setup

The conductor app requires a Spring Boot backend with the following endpoints:

- `POST /api/conductor/validate-ticket` - Validate QR ticket
- `POST /api/conductor/issue-ticket` - Issue manual ticket
- `GET /api/conductor/bus-stops` - Get stop data

### 3. Run the Application

1. Open `index.html` in a web browser
2. Allow camera permissions for QR scanning
3. Ensure Firebase database rules allow read/write access

## Usage Guide

### Real-time Dashboard

1. **View Live Data**: Dashboard automatically updates from Firebase
2. **Manual Refresh**: Click "🔄 Refresh" to update data manually
3. **Auto Refresh**: Toggle automatic updates with "⏸️ Auto Refresh"

### QR Ticket Scanning

1. **Start Scanner**: Click "📷 Start Scanning" to activate camera
2. **Position QR Code**: Align passenger's QR code within the scanner frame
3. **Validate**: Click "✅ Validate Ticket" to confirm and update database
4. **Stop Scanner**: Click "⏹️ Stop Scanning" when done

### Manual Ticket Issuing

1. **Select Route**: Choose source and destination stops
2. **Choose Bus Type**: Select AC Deluxe, Ordinary, AC Express, or Volvo AC
3. **Enter Details**: Add passenger name
4. **Confirm Fare**: System calculates fare automatically
5. **Issue Ticket**: Click "💳 Issue Ticket" to generate QR ticket

### Validation Summary

The validation summary shows:
- **Total Stops**: Number of bus stops monitored
- **Checked/Unchecked**: Stops with matching/mismatching counts
- **Total Headcount**: Sum of AI-detected passengers
- **Total Tickets**: Sum of validated tickets
- **Discrepancy**: Difference between headcount and tickets

## Fare Matrix

The system uses a predefined fare matrix:

| Source → Destination | AC Deluxe | Ordinary | AC Express | Volvo AC |
|---------------------|-----------|----------|------------|-----------|
| Koyambedu → Tambaram | ₹45 | ₹35 | ₹40 | ₹50 |
| Koyambedu → Velachery | ₹35 | ₹25 | ₹30 | ₹40 |
| Koyambedu → Broadway | ₹25 | ₹20 | ₹22 | ₹28 |
| Tambaram → Velachery | ₹28 | ₹25 | ₹25 | ₹30 |
| Tambaram → Broadway | ₹40 | ₹38 | ₹38 | ₹45 |
| Velachery → Broadway | ₹32 | ₹28 | ₹30 | ₹35 |

## API Integration

### Validate Ticket Endpoint

```javascript
POST /api/conductor/validate-ticket
Content-Type: application/json

{
  "bookingId": "BK123456",
  "source": "Koyambedu",
  "destination": "Tambaram",
  "busNumber": "TN09N2345",
  "fare": "45",
  "date": "2026-03-07",
  "time": "14:30"
}
```

### Issue Ticket Endpoint

```javascript
POST /api/conductor/issue-ticket
Content-Type: application/json

{
  "sourceStop": "Koyambedu",
  "destStop": "Tambaram",
  "busType": "ac_deluxe",
  "passengerName": "John Doe",
  "fare": "45",
  "busNumber": "TN09N2345"
}
```

## Security Considerations

1. **Firebase Security Rules**: Implement proper read/write rules
2. **Camera Permissions**: Ensure HTTPS for camera access
3. **Data Validation**: Validate all inputs on backend
4. **QR Code Security**: Verify ticket authenticity

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14+)
- **Edge**: Full support

## Troubleshooting

### Camera Not Working
1. Check browser permissions
2. Ensure HTTPS connection
3. Try different browser
4. Check camera hardware

### Firebase Connection Issues
1. Verify Firebase configuration
2. Check database rules
3. Ensure network connectivity
4. Check API key validity

### QR Code Not Scanning
1. Ensure good lighting
2. Hold camera steady
3. Clean QR code surface
4. Check QR code quality

## Future Enhancements

1. **Offline Support**: Cache data for offline operation
2. **Print Integration**: Direct ticket printing
3. **Multi-language Support**: Regional language support
4. **Advanced Analytics**: Detailed reporting dashboard
5. **GPS Integration**: Real-time bus location tracking

## Support

For technical support or issues:
1. Check browser console for errors
2. Verify Firebase connection
3. Ensure backend API is running
4. Review network connectivity

---

**Note**: This application is part of the Smart Fare Management System Phase 3 implementation.
