# GNDU-Attendance-System-Nextjs
>>>>>>> a3a9c786680d4ffa6d7ce0b4a8a614b415e5aef7
# GNDU Attendance System (Next.js)

A modern, web-based attendance management system designed for Guru Nanak Dev University (GNDU), specifically for the Department of Computer Engineering & Technology. This system provides a seamless way for teachers to manage student attendance and for students to mark their attendance using a secure, location-based check-in system.

## Features

### For Teachers:
- **Secure Authentication** - Firebase-based authentication system
- **Session Management** - Create and manage attendance sessions
- **Real-time Updates** - View attendance updates in real-time
- **Student Management** - Track and manage student attendance records
- **Export Capabilities** - Export attendance data to Excel and PDF formats
- **Print Functionality** - Print attendance sheets directly from the system

### For Students:
- **Easy Check-in** - Simple interface for marking attendance
- **Location Verification** - Ensures students are within campus boundaries
- **Session Validation** - Validates session codes for security
- **Attendance History** - View personal attendance records

## Technologies Used

- **Frontend**: Next.js 14.2.13, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore Database)
- **Libraries**:
  - Firebase Web SDK (v10.13.1)
  - ExcelJS (for Excel export)
  - jsPDF (for PDF generation)
  - html2pdf.js (for PDF conversion)

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KingSahil/GNDU-Attendance-System-Nextjs.git
   ```

2. Navigate to the project directory:
   ```bash
   cd GNDU-Attendance-System-Nextjs
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Email/Password authentication
   - Set up Firestore Database in test mode
   - Add your web app to the Firebase project and get the configuration object

5. Create a `.env.local` file in the root directory and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # Location Configuration for GNDU
   NEXT_PUBLIC_UNIVERSITY_LAT=31.634801
   NEXT_PUBLIC_UNIVERSITY_LNG=74.824416
   NEXT_PUBLIC_ALLOWED_RADIUS_METERS=10000
   NEXT_PUBLIC_REQUIRED_ACCURACY=50
   
   # App Configuration
   NEXT_PUBLIC_APP_NAME="GNDU Attendance System"
   NEXT_PUBLIC_DEPARTMENT="Department of Computer Engineering & Technology"
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Usage

### Teacher Login
1. Open the application in a web browser
2. Log in using your teacher credentials
3. Create a new attendance session or load an existing one
4. Share the session link with students
5. Monitor attendance in real-time
6. Export or print attendance records as needed

### Student Check-in
1. Click on the session link provided by your teacher
2. Enter your details (Roll Number, Name)
3. Allow location access when prompted
4. Submit your attendance

## Security Features

- **Content Security Policy (CSP)** - Protects against XSS attacks
- **Location Verification** - Ensures attendance is marked from within campus
- **Session Expiry** - Automatic session expiration after a set period
- **Secure Authentication** - Firebase Authentication with email/password
- **Environment Variables** - Sensitive configuration protected in .env files

## Project Structure

```
src/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── checkin/         # Student check-in page
│   ├── dashboard/       # Teacher dashboard
│   └── ...
├── components/          # Reusable UI components
├── contexts/            # React contexts
├── data/               # Static data
├── lib/                # Firebase configuration
└── utils/              # Utility functions
```

## Browser Support

The system is compatible with all modern web browsers including:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Guru Nanak Dev University for the opportunity to develop this system
- Firebase for providing a robust backend infrastructure
- Next.js team for the excellent React framework
- Open-source community for valuable libraries and resources
=======
# GNDU-Attendance-System-Nextjs
>>>>>>> a3a9c786680d4ffa6d7ce0b4a8a614b415e5aef7
