# CareSync AI - Healthcare Follow-up Management Platform

CareSync AI is a comprehensive SaaS platform that helps healthcare professionals automatically send patient follow-up reminders via Email/SMS/WhatsApp and uses AI to summarize and categorize patient responses.

## Features

- **Patient Management**: Add, edit, and manage patient records
- **Automated Reminders**: Schedule and send follow-up reminders via Email, SMS, and WhatsApp
- **AI-Powered Insights**: Analyze patient responses with OpenAI GPT-4o-mini
- **Subscription Management**: Multiple pricing tiers with Paystack integration
- **Real-time Dashboard**: Monitor patient status and urgent cases
- **Patient Portal**: Secure portal for patients to respond to follow-ups

## Tech Stack

### Frontend
- React 18 with React Router
- Tailwind CSS for styling
- Lucide React for icons
- React Hot Toast for notifications

### Backend
- Node.js with Express
- Supabase (PostgreSQL) for database
- OpenAI GPT-4o-mini for AI analysis
- Twilio for SMS/WhatsApp
- Resend for email delivery
- Paystack for payments
- Node-cron for scheduled tasks

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Supabase account
- OpenAI API key
- Twilio account
- Resend account
- Paystack account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd caresync
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   **Backend (.env in server directory):**
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # Resend Configuration
   RESEND_API_KEY=your_resend_api_key_here

   # Paystack Configuration
   PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here

   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

   **Frontend (.env in client directory):**
   ```env
   # API Configuration
   REACT_APP_API_URL=http://localhost:5000

   # Supabase Configuration
   REACT_APP_SUPABASE_URL=your_supabase_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # Paystack Configuration (for frontend)
   REACT_APP_PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
   ```

4. **Set up the database**
   ```bash
   # Run the SQL schema in your Supabase SQL editor
   # File: server/database/schema.sql
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

## Project Structure

```
caresync/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   ├── database/          # Database schema
│   └── package.json
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new clinic
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get single patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create new reminder
- `POST /api/reminders/:id/send` - Send reminder immediately

### AI Insights
- `GET /api/insights/dashboard` - Get dashboard insights
- `GET /api/insights/trends` - Get response trends
- `GET /api/insights/keywords` - Get keyword analysis

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions/initialize-payment` - Initialize payment
- `POST /api/subscriptions/verify-payment` - Verify payment

## Subscription Plans

- **Free**: 10 patients, 50 reminders/month, Email only
- **Basic ($19/month)**: 100 patients, 500 reminders/month, Email + SMS
- **Pro ($49/month)**: 500 patients, 2000 reminders/month, All channels
- **Enterprise ($99/month)**: Unlimited, Custom integrations

## AI Response Analysis

The platform uses OpenAI GPT-4o-mini to analyze patient responses and categorize them as:
- ✅ **Fine**: Patient is doing well
- ⚠️ **Mild Issue**: Minor concerns or questions
- 🚨 **Urgent**: Needs immediate medical attention

## Automated Features

- **Daily Reminder Processing**: Runs at 9 AM daily
- **Daily Summary Emails**: Sent at 6 PM to clinics
- **Overdue Follow-up Alerts**: Checked every 6 hours
- **Log Cleanup**: Weekly cleanup of old notification logs

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a web service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@caresync.ai or create an issue in the repository.
