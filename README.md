# Data Download Duplication Alert System (DDAS)

## Project Overview
DDAS is a web application that helps users identify and manage duplicate files in their download directory. It consists of a Python Flask backend and a React frontend.

## Prerequisites
- Python 3.x
- Node.js and npm
## Installation Steps
### 1. Clone or Download the Repository
```
git clone https://github.com/Sravan2510/data-download-duplication-alert-system.git
cd data-download-duplication-alert-system
```
### 2. Backend Setup
1. Navigate to the backend directory:
2. Create and activate a virtual environment (optional but recommended):
3. Install Python dependencies:
4. Configure the base directory:
   Open app.py and modify the base_dir variable in the download and delete routes to point to your downloads directory:
5. Start the Flask server:
The backend server will run on http://127.0.0.1:5000

### 3. Frontend Setup
1. Navigate to the frontend directory:
2. Install Node.js dependencies:
3. Configure the API endpoint:
   
   - The frontend is configured to connect to http://127.0.0.1:5000 by default
   - If your backend runs on a different address, update the API URLs in src/App.jsx
4. Start the development server:
The frontend will be accessible at http://localhost:5173

## Usage
1. Open your web browser and navigate to http://localhost:5173
2. The application will automatically scan your configured downloads directory
3. Use the search bar to filter files by name
4. View file statistics in the top cards
5. Manage files using the action buttons:
   - 🗑️ Delete files
   - ⬇️ Download files
6. Files are categorized as:
   - UNIQUE: No duplicates found
   - ORIGINAL: The first instance of a duplicated file
   - DUPLICATE: Subsequent copies of an original file
