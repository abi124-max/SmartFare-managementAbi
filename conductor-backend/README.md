# Smart Fare Conductor Backend

## Phase 3 - Conductor Backend API

This is the Spring Boot backend for the Smart Fare Conductor Application. It provides REST APIs for ticket validation, manual ticket issuance, and Firebase integration.

## Features

### 🎯 Core APIs

1. **Ticket Validation API**
   - Validates QR tickets from Phase 1
   - Updates Firebase ticket distribution
   - Automatic checked status calculation

2. **Manual Ticket Issuance API**
   - Issues tickets for offline passengers
   - Calculates fare automatically
   - Generates QR codes for manual tickets

3. **Bus Stops API**
   - Retrieves real-time bus stop data
   - Integrates with Firebase database

## Technology Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **Firebase Admin SDK**
- **Google ZXing** (QR Code Generation)
- **Maven** (Build Tool)

## API Endpoints

### 1. Validate QR Ticket
```http
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

**Response:**
```json
{
  "success": true,
  "message": "Ticket validated successfully",
  "bookingId": "BK123456",
  "updatedStop": "stop_tambaram",
  "newTicketCount": 4,
  "checkedStatus": "checked"
}
```

### 2. Issue Manual Ticket
```http
POST /api/conductor/issue-ticket
Content-Type: application/json

{
  "sourceStop": "Koyambedu",
  "destStop": "Tambaram",
  "busType": "ac_deluxe",
  "passengerName": "John Doe",
  "busNumber": "TN09N2345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket issued successfully",
  "ticket": {
    "bookingId": "CD1234567890",
    "passengerName": "John Doe",
    "sourceStop": "Koyambedu",
    "destStop": "Tambaram",
    "busNumber": "TN09N2345",
    "busType": "ac_deluxe",
    "fare": 45.00,
    "timestamp": "2026-03-07T14:30:00",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "qrData": "{\"bookingId\":\"CD1234567890\",\"passenger\":\"John Doe\"...}",
    "status": "ACTIVE"
  },
  "updatedStop": "stop_tambaram",
  "newTicketCount": 5,
  "checkedStatus": "checked"
}
```

### 3. Get All Bus Stops
```http
GET /api/conductor/bus-stops
```

**Response:**
```json
{
  "success": true,
  "message": "Bus stops retrieved successfully",
  "data": [
    {
      "id": "stop_koyambedu",
      "stoppingName": "Koyambedu Bus Terminal",
      "headcount": 5,
      "ticketDistribution": 5,
      "checkedStatus": "checked",
      "lastUpdated": "2026-03-07T14:30:00"
    }
  ]
}
```

### 4. Health Check
```http
GET /api/conductor/health
```

## Setup Instructions

### 1. Prerequisites
- Java 17 or higher
- Maven 3.6 or higher
- Firebase project with Realtime Database

### 2. Firebase Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project or use existing
   - Enable Realtime Database

2. **Service Account Configuration**
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file
   - Set environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-file.json"
     ```

3. **Database Rules**
   - Set appropriate read/write rules in Firebase Console:
     ```json
     {
       "rules": {
         "bus_stops": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
     ```

### 3. Application Configuration

Update `application.properties`:

```properties
# Firebase Configuration
firebase.database.url=https://your-project-id-default-rtdb.firebaseio.com
firebase.project.id=your-project-id
```

### 4. Run the Application

```bash
# Using Maven
mvn spring-boot:run

# Or build and run
mvn clean package
java -jar target/smart-fare-conductor-backend-1.0.0.jar
```

The application will start on `http://localhost:8082`

## Architecture

### Service Layer

#### ConductorService
- **validateQRTicket()**: Validates QR codes and updates Firebase
- **issueManualTicket()**: Creates manual tickets with QR codes
- **getAllBusStops()**: Retrieves bus stop data from Firebase
- **calculateFare()**: Calculates ticket fare based on route and bus type

#### FirebaseService
- **updateBusStop()**: Updates bus stop data in Firebase
- **getBusStop()**: Retrieves specific bus stop data
- **getAllBusStops()**: Gets all bus stops
- **isFirebaseAvailable()**: Checks Firebase connectivity

#### QRCodeService
- **generateQRCodeBase64()**: Generates QR code as Base64
- **generateQRCodeDataURL()**: Generates QR code as Data URL

### Model Layer

#### BusStop
- Represents bus stop data from Firebase
- Includes headcount, ticket distribution, checked status
- Auto-updates checked status based on counts

#### ConductorTicket
- Represents manually issued tickets
- Contains QR code data and ticket details
- Auto-generates booking ID and QR data

## Fare Matrix

The system uses the same fare matrix as the frontend:

| Source → Destination | AC Deluxe | Ordinary | AC Express | Volvo AC |
|---------------------|-----------|----------|------------|-----------|
| Koyambedu → Tambaram | ₹45 | ₹35 | ₹40 | ₹50 |
| Koyambedu → Velachery | ₹35 | ₹25 | ₹30 | ₹40 |
| Koyambedu → Broadway | ₹25 | ₹20 | ₹22 | ₹28 |
| Tambaram → Velachery | ₹28 | ₹25 | ₹25 | ₹30 |
| Tambaram → Broadway | ₹40 | ₹38 | ₹38 | ₹45 |
| Velachery → Broadway | ₹32 | ₹28 | ₹30 | ₹35 |

## Error Handling

The API returns appropriate HTTP status codes:

- **200 OK**: Successful operation
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Server-side error

Error Response Format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Considerations

1. **Firebase Authentication**: Configure proper auth rules
2. **Input Validation**: All inputs are validated
3. **CORS**: Configured for cross-origin requests
4. **Rate Limiting**: Consider implementing for production

## Testing

### Run Tests
```bash
mvn test
```

### Test with Postman
Import the provided Postman collection or use curl commands:

```bash
# Health check
curl http://localhost:8082/api/conductor/health

# Validate ticket
curl -X POST http://localhost:8082/api/conductor/validate-ticket \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"BK123456","source":"Koyambedu","destination":"Tambaram","busNumber":"TN09N2345","fare":"45","date":"2026-03-07","time":"14:30"}'
```

## Deployment

### Docker Deployment
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/smart-fare-conductor-backend-1.0.0.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Environment Variables
- `FIREBASE_DATABASE_URL`: Firebase database URL
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account file

## Monitoring

### Health Endpoints
- `/api/conductor/health`: Application health
- `/actuator/health`: Spring Boot health (if enabled)

### Logging
- Application logs: INFO level
- Web requests: DEBUG level
- Firebase operations: INFO level

## Troubleshooting

### Firebase Connection Issues
1. Check service account credentials
2. Verify database URL
3. Check Firebase project permissions
4. Review database rules

### QR Code Generation Issues
1. Check ZXing library dependencies
2. Verify input data format
3. Check memory availability

### Performance Issues
1. Monitor Firebase connection pool
2. Check for memory leaks
3. Review async operation handling

## Future Enhancements

1. **Authentication**: Add conductor authentication
2. **Caching**: Implement Redis caching
3. **Analytics**: Add detailed reporting
4. **WebSockets**: Real-time updates
5. **Mobile API**: Dedicated mobile endpoints

---

**Note**: This backend is designed to work with the Conductor Frontend and Firebase Realtime Database.
