const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure required directories exist
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(publicDir, 'uploads');
fs.ensureDirSync(publicDir);
fs.ensureDirSync(uploadsDir);

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename and ensure unique name
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
    }
});

// Add file filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper function to get homepage data
async function getHomepageData() {
    try {
        const filePath = path.join(__dirname, 'content', 'homepage-data.json');
        const data = await fs.readJson(filePath);
        return data;
    } catch (error) {
        console.error('Error reading homepage data:', error);
        return null;
    }
}

// Save homepage data to JSON file
async function saveHomepageData(data) {
    try {
        console.log('=== SAVE HOMEPAGE DATA START ===');
        console.log('Data to save:', JSON.stringify(data, null, 2));
        
        const filePath = path.join(__dirname, 'content', 'homepage-data.json');
        console.log('Target file path:', filePath);
        
        // Check file permissions
        try {
            await fs.access(filePath, fs.constants.W_OK);
            console.log('File exists and is writable');
        } catch (err) {
            console.error('File access error:', err);
            throw new Error(`File access error: ${err.message}`);
        }

        // Write the file
        console.log('Attempting to write file...');
        await fs.writeJson(filePath, data, { spaces: 2 });
        console.log('File write completed');
        
        // Verify the write
        console.log('Verifying file contents...');
        const savedData = await fs.readJson(filePath);
        console.log('Verification successful');
        console.log('=== SAVE HOMEPAGE DATA END ===');
        
        return true;
    } catch (error) {
        console.error('=== SAVE HOMEPAGE DATA ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR LOG ===');
        return false;
    }
}

// Homepage route
app.get('/', async (req, res) => {
    try {
        const data = await getHomepageData();
        if (!data) {
            throw new Error('Could not load homepage data');
        }
        res.render('index', { data });
    } catch (error) {
        console.error('Error rendering homepage:', error);
        res.status(500).send('Error loading homepage');
    }
});

// Admin routes
app.get('/admin', async (req, res) => {
    try {
        const data = await getHomepageData();
        if (!data) {
            throw new Error('Could not load homepage data');
        }
        res.render('admin', { 
            data,
            message: req.flash('message'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error rendering admin page:', error);
        res.status(500).send('Error loading admin page');
    }
});

// Update text content
app.post('/admin/update-text', async (req, res) => {
    try {
        console.log('Update request received:', req.body);
        const { section } = req.body;
        const data = await getHomepageData();
        
        console.log('Current data:', data);
        
        if (!data || !data[section]) {
            throw new Error('Invalid section');
        }

        // Handle hero section updates
        if (section === 'hero') {
            if (req.body.hero_title) data.hero.title = req.body.hero_title;
            if (req.body.hero_subtitle) data.hero.subtitle = req.body.hero_subtitle;
            if (req.body.hero_ctaText) data.hero.ctaText = req.body.hero_ctaText;
            if (req.body.hero_ctaLink) data.hero.ctaLink = req.body.hero_ctaLink;
        }
        // Handle about section updates
        else if (section === 'about') {
            if (req.body.about_title) data.about.title = req.body.about_title;
            if (req.body.about_content) data.about.content = req.body.about_content;
        }
        // Handle contact section updates
        else if (section === 'contact') {
            if (req.body.contact_title) data.contact.title = req.body.contact_title;
            if (req.body.contact_email) data.contact.email = req.body.contact_email;
            if (req.body.contact_phone) data.contact.phone = req.body.contact_phone;
            if (req.body.contact_address) data.contact.address = req.body.contact_address;
        }
        // Handle features section updates
        else if (section === 'features') {
            // Look for feature_* fields in the request
            Object.keys(req.body).forEach(key => {
                if (key.startsWith('feature_')) {
                    const [_, index, field] = key.split('_');
                    if (data.features[index]) {
                        data.features[index][field] = req.body[key];
                    }
                }
            });
        }

        console.log('Saving updated data:', data);
        const saveResult = await saveHomepageData(data);
        console.log('Save result:', saveResult);
        
        if (saveResult) {
            req.flash('message', 'Content updated successfully');
        } else {
            throw new Error('Failed to save data');
        }
    } catch (error) {
        console.error('Error updating content:', error);
        req.flash('error', 'Failed to update content: ' + error.message);
    }
    res.redirect('/admin');
});

// Update image
app.post('/admin/update-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const { section, imageType } = req.body;
        const data = await getHomepageData();
        
        if (!data || !data[section]) {
            throw new Error('Invalid section');
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        if (imageType === 'background') {
            data[section].backgroundImage = imageUrl;
        } else {
            data[section].image = imageUrl;
        }

        await saveHomepageData(data);
        req.flash('message', 'Image updated successfully');
    } catch (error) {
        console.error('Error updating image:', error);
        req.flash('error', 'Failed to update image');
    }
    res.redirect('/admin');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
}); 