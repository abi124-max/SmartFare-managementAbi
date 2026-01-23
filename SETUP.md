# Smart Fare Management System - Setup Guide

## Prerequisites
- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- Modern web browser

## Database Setup

1. **Install MySQL** and create database:
```sql
CREATE DATABASE smart_fare_db;
CREATE USER 'smartfare'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON smart_fare_db.* TO 'smartfare'@'localhost';
FLUSH PRIVILEGES;
```

2. **Run database schema**:
```bash
mysql -u root -p smart_fare_db < database/schema.sql
```

3. **Insert sample data**:
```bash
mysql -u root -p smart_fare_db < database/sample_data.sql
```

## Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Update database credentials** in `src/main/resources/application.properties`:
```properties
spring.datasource.username=smartfare
spring.datasource.password=password123
```

3. **Build and run the application**:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

## Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Start a local web server** (choose one):

**Option A: Using Python**:
```bash
python -m http.server 3000
```

**Option B: Using Node.js (if you have it)**:
```bash
npx http-server -p 3000
```

**Option C: Using Live Server extension in VS Code**

3. **Open browser** and go to `http://localhost:3000`

## Testing the Application

### 1. Location Selection
- Select "Central Bus Station, Mumbai" as From
- Select "Pune Station, Pune" as To
- Choose today's date
- Click "Search Buses"

### 2. Bus Selection
- You should see available buses with different operators
- Click on any bus to select it

### 3. Passenger Details
- Enter passenger name and phone number
- Select a seat
- Click "Proceed to Payment"

### 4. Payment
- Enter any UPI ID (e.g., test@paytm)
- Click "Pay Now"
- Wait for processing

### 5. Ticket Generation
- View the generated ticket with QR code
- Download ticket as text file

## API Endpoints

### Bus Operations
- `GET /api/buses/locations` - Get all locations
- `GET /api/buses/search` - Search available buses
- `GET /api/buses/schedule/{id}` - Get bus schedule details

### Booking Operations
- `POST /api/bookings/create` - Create new booking
- `GET /api/bookings/{reference}` - Get booking by reference
- `GET /api/bookings/passenger/{phone}` - Get bookings by phone
- `POST /api/bookings/{reference}/payment` - Update payment status
- `GET /api/bookings/{reference}/qr` - Get QR code

## Sample API Calls

### Search Buses
```bash
curl "http://localhost:8080/api/buses/search?fromLocationId=1&toLocationId=2&travelDate=2024-01-15"
```

### Create Booking
```bash
curl -X POST http://localhost:8080/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "passengerName": "John Doe",
    "passengerPhone": "9876543210",
    "scheduleId": 1,
    "seatNumber": "S01"
  }'
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check MySQL is running
   - Verify credentials in application.properties
   - Ensure database exists

2. **CORS Error**:
   - Backend includes CORS configuration
   - Ensure frontend is running on allowed origin

3. **Port Already in Use**:
   - Change port in application.properties: `server.port=8081`
   - Update API_BASE_URL in frontend script.js

4. **QR Code Not Generating**:
   - Check ZXing dependencies in pom.xml
   - Verify QRCodeService is working

### Development Tips

1. **Hot Reload**: Use Spring Boot DevTools for backend hot reload
2. **Database Changes**: Use `spring.jpa.hibernate.ddl-auto=update` for development
3. **Logging**: Enable SQL logging with `spring.jpa.show-sql=true`
4. **Testing**: Use Postman or curl to test API endpoints

## Next Steps for Production

1. **Security**:
   - Add authentication/authorization
   - Implement proper payment gateway
   - Add input validation and sanitization

2. **Performance**:
   - Add database indexing
   - Implement caching
   - Add connection pooling

3. **Features**:
   - Real-time seat availability
   - Email/SMS notifications
   - Booking cancellation
   - Route management admin panel

4. **Deployment**:
   - Containerize with Docker
   - Set up CI/CD pipeline
   - Configure production database
   - Add monitoring and logging