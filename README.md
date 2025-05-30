# Admin Site with Content Management

A simple admin site with content management capabilities, built with Express.js and EJS.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Visit `http://localhost:3000` for the homepage
4. Visit `http://localhost:3000/admin` for the admin interface

## Deployment to AWS Amplify

1. Create a new repository on GitHub and push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to AWS Amplify Console:
   - Sign in to the AWS Management Console
   - Navigate to AWS Amplify
   - Click "New app" > "Host web app"
   - Choose GitHub as your repository source
   - Select your repository and branch
   - Click "Next"

3. Configure build settings:
   - The `amplify.yml` file is already configured
   - Review the settings and click "Next"
   - Click "Save and deploy"

4. Wait for the deployment to complete
   - AWS Amplify will automatically build and deploy your application
   - You can monitor the build progress in the Amplify Console

5. Access your deployed application:
   - Once deployment is complete, you'll get a URL like `https://main.xxxxx.amplifyapp.com`
   - The admin interface will be available at `/admin`

## Important Notes

1. File Storage:
   - The application uses the local file system for content storage
   - In production, consider using AWS S3 for file storage
   - Update the image upload configuration to use S3 instead of local storage

2. Security:
   - Add authentication to the admin interface
   - Use environment variables for sensitive data
   - Consider using AWS Cognito for user management

3. Environment Variables:
   - Set up environment variables in AWS Amplify Console
   - Required variables:
     - `NODE_ENV=production`
     - `PORT=3000`

## Project Structure

```
.
├── content/              # Content files
│   └── homepage-data.json
├── public/              # Static files
│   └── uploads/        # Uploaded images
├── views/              # EJS templates
│   ├── admin.ejs
│   └── index.ejs
├── index.js            # Main application file
├── package.json        # Project dependencies
├── amplify.yml         # AWS Amplify configuration
└── README.md          # This file
```
