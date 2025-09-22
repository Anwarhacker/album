# Mehndi Album

A beautiful, responsive photo album web application for storing and viewing mehndi design photos. Built with Next.js, Tailwind CSS, MongoDB, and Cloudinary.

## Features

- **Secure Authentication**: Email and password authentication with user registration
- **Image Upload**: Upload photos to Cloudinary with automatic folder organization
- **Gallery View**: Masonry grid layout with responsive design
- **Timeline View**: Browse photos grouped by date (today, last 7 days, by month)
- **Photo Details**: Modal with full-size image, metadata, share, and download options
- **Albums**: Create and organize photos into named collections
- **Search**: Find photos by caption or tags
- **Responsive Design**: Works beautifully on mobile and desktop
- **Romantic Theme**: Soft pastel colors, rounded corners, and elegant styling

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js (Email/Password)
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud like MongoDB Atlas)
- Cloudinary account
- Google OAuth credentials (for Google login)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd mehndi-album
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/mehndi-album

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Database Setup

1. Start MongoDB locally or use MongoDB Atlas
2. The app will automatically create collections when you first upload photos

### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Add them to your `.env.local`

### User Registration

Users can register directly through the sign-in page. The app supports email and password authentication.

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Register a new account or sign in with existing email/password
2. **Upload Photos**: Go to Upload page, select image, add caption/tags/date
3. **View Gallery**: Browse photos in masonry grid or timeline view
4. **Search**: Use the search bar to find photos by caption or tags
5. **Create Albums**: Organize photos into collections
6. **Photo Details**: Click any photo to see full details, download, or share

## Project Structure

```
mehndi-album/
├── app/
│   ├── api/
│   │   ├── albums/          # Album CRUD operations
│   │   ├── auth/            # NextAuth configuration
│   │   ├── photos/          # Photo fetching
│   │   └── upload/          # Image upload to Cloudinary
│   ├── albums/              # Albums page
│   ├── auth/
│   │   └── signin/          # Sign in page
│   ├── gallery/             # Main gallery page
│   ├── upload/              # Upload page
│   ├── globals.css          # Global styles
│   ├── layout.js            # Root layout
│   └── page.js              # Home page
├── components/
│   └── Providers.js         # NextAuth session provider
├── lib/
│   └── mongodb.js           # Database connection
├── models/
│   ├── Album.js             # Album schema
│   ├── Photo.js             # Photo schema
│   └── User.js              # User schema
├── .env.local.example       # Environment variables template
└── README.md
```

## API Endpoints

- `GET/POST /api/albums` - Manage albums
- `GET /api/photos` - Fetch photos with search/pagination
- `POST /api/upload` - Upload images
- `/api/auth/[...nextauth]` - Authentication

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXTAUTH_SECRET` - Generate a secure random string
- `NEXTAUTH_URL` - Your production URL
- `MONGODB_URI` - Production MongoDB connection string
- `CLOUDINARY_*` - Your Cloudinary credentials
- Passwords are securely hashed using bcrypt

### MongoDB Atlas

For production, use MongoDB Atlas:

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get connection string
3. Whitelist your Vercel IP or use 0.0.0.0/0 for testing
4. Add connection string to environment variables

## Security Notes

- Images are uploaded securely to Cloudinary
- User authentication required for all operations
- Environment variables keep secrets safe
- No sensitive data exposed in client-side code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open a GitHub issue or contact the maintainer.
