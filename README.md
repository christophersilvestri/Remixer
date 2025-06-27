# Content Remixer

A powerful React application that helps you transform and remix content for different platforms using AI. Perfect for content creators, marketers, and podcast producers who need to adapt their content across multiple channels.

## Features

- **Multi-Platform Content Transformation**: Convert your content for WordPress, YouTube, Instagram, LinkedIn, Facebook, Twitter, podcast, and email
- **AI-Powered Generation**: Uses OpenAI and Anthropic AI to intelligently remix your content
- **Custom Templates**: Pre-configured templates for different content types and platforms
- **Real-time Preview**: See your transformed content before exporting
- **Export Options**: Copy to clipboard or download your remixed content
- **Settings Management**: Configure API keys and customize templates
- **Local Storage**: Saves your templates and settings locally

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- OpenAI API key and/or Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd remixer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Configuration

1. Click the Settings icon (⚙️) in the top right
2. Add your API keys for OpenAI and/or Anthropic
3. Customize your content templates as needed
4. Save your settings

## Usage

1. **Input Your Content**: Paste your original content into the main text area
2. **Select Platform**: Choose which platform you want to remix for
3. **Generate**: Click the "Remix Content" button to transform your content
4. **Review & Edit**: Preview the generated content and make any adjustments
5. **Export**: Copy to clipboard or download your remixed content

## Scheduled Posting (Coming Soon)

You will soon be able to:

- **Post Directly to Platforms**: Connect your accounts and publish content to WordPress, YouTube, Instagram, LinkedIn, Facebook, Twitter/X, and more, right from the app.
- **Schedule Posts**: Select a date and time from a calendar view to schedule your posts for later. The app will automatically publish your content at the scheduled time.

**Note:** Scheduling and direct posting will require connecting your accounts and a backend service to securely store scheduled posts and handle publishing. Stay tuned for updates!

## Supported Platforms

- **WordPress**: Blog post formatting with SEO optimization
- **YouTube**: Video descriptions with timestamps and tool stack
- **Instagram**: Engaging social media posts with hashtags
- **LinkedIn**: Professional business-focused posts
- **Facebook**: Community-oriented posts encouraging discussion
- **Twitter/X**: Concise, attention-grabbing tweets
- **Podcast**: Episode descriptions and show notes
- **Email**: Newsletter-style content formatting

## Tech Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: OpenAI API, Anthropic Claude API
- **Build Tool**: Vite

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── App.jsx          # Main application component
├── main.jsx         # Application entry point
├── index.css        # Global styles
└── assets/          # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

+## Debugging LinkedIn OAuth
+
+If you encounter issues with LinkedIn OAuth scopes (e.g., unauthorized_scope_error for r_emailaddress):
+
+1. **Check the scope in your backend code** (backend/src/index.ts):
+   - It should be: `const scope = 'w_member_social';`
+2. **Add a debug log** to print the actual LinkedIn OAuth URL being generated:
+   ```js
+   console.log('Redirecting to LinkedIn OAuth URL:', authUrl);
+   ```
+   Place this in the `/auth/linkedin` route handler.
+3. **Restart your backend server** after any code change.
+4. **Visit http://localhost:3001/auth/linkedin** and check your terminal for the printed URL.
+5. **Verify the scope in the printed URL** is only `w_member_social`.
+6. **If the error persists**, ensure no other servers or proxies are running and try in an incognito window.
+
+This helps ensure the correct scope is being sent to LinkedIn and can help debug persistent OAuth errors.
