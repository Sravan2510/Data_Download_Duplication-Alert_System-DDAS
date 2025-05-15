from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app)

def calculate_file_hash(filepath):
    """Calculate MD5 hash of file."""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def scan_directory(directory):
    """Scan directory for duplicate files."""
    files_dict = {}
    duplicates = []
    total_files = 0
    space_wasted = 0
    
    # Convert relative path to absolute path
    directory = os.path.abspath(directory)
    
    for root, _, files in os.walk(directory):
        for filename in files:
            filepath = os.path.join(root, filename)
            try:
                # Skip hidden files and system files
                if filename.startswith('.') or filename.startswith('__'):
                    continue
                    
                file_hash = calculate_file_hash(filepath)
                file_size = os.path.getsize(filepath)
                file_date = datetime.fromtimestamp(os.path.getctime(filepath))
                
                # Use relative path for location
                relative_path = os.path.relpath(root, directory)
                if relative_path == '.':
                    relative_path = ''
                
                file_info = {
                    "name": filename,
                    "location": relative_path,
                    "size": file_size,
                    "date_added": file_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "status": "UNIQUE"
                }
                
                if file_hash in files_dict:
                    files_dict[file_hash]["status"] = "DUPLICATE"
                    file_info["status"] = "DUPLICATE"
                    duplicates.append(file_info)
                    space_wasted += file_size
                else:
                    files_dict[file_hash] = file_info
                
                total_files += 1
                
            except (IOError, OSError) as e:
                print(f"Error processing file {filepath}: {str(e)}")
                continue
    
    all_files = list(files_dict.values()) + duplicates
    return {
        "total_files": total_files,
        "duplicate_files": len(duplicates),
        "space_wasted": space_wasted,
        "files": all_files
    }

@app.route('/scan', methods=['POST'])
def scan():
    try:
        data = request.get_json()
        directory = data.get('directory', '.')
        
        # Convert relative path to absolute path
        directory = os.path.abspath(directory)
        
        # Check if directory exists
        if not os.path.exists(directory):
            return jsonify({"error": f"Directory not found: {directory}"}), 404
            
        result = scan_directory(directory)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download', methods=['GET'])
def download_file():
    try:
        requested_path = request.args.get('path')
        base_dir = '/Users/akashreddy/Downloads/Data'  # Updated path
        
        if not requested_path:
            return jsonify({"error": "No path provided"}), 400
                
        # Security check before path conversion
        if not is_safe_path(base_dir, requested_path):
            return jsonify({"error": "Access denied: Path outside allowed directory"}), 403
                
        # Safe path joining
        abs_path = os.path.abspath(os.path.join(base_dir, requested_path))
            
        if os.path.exists(abs_path):
            return send_file(
                abs_path,
                as_attachment=True,
                download_name=os.path.basename(abs_path)
            )
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete', methods=['POST'])
def delete_file():
    try:
        data = request.get_json()
        requested_path = data.get('path')
        base_dir = '/Users/akashreddy/Downloads/Data'  # Updated path
        
        if not requested_path:
            return jsonify({"error": "No path provided"}), 400
        
        # For files in root directory, just use the filename
        if requested_path.startswith('Root Directory/'):
            requested_path = requested_path.replace('Root Directory/', '')
            
        # Safe path joining
        abs_path = os.path.abspath(os.path.join(base_dir, requested_path))
        
        # Security check after path construction
        if not is_safe_path(base_dir, requested_path):
            return jsonify({"error": "Access denied: Path outside allowed directory"}), 403
        
        if os.path.exists(abs_path):
            os.remove(abs_path)
            return jsonify({"message": "File deleted successfully"})
        return jsonify({"error": f"File not found: {abs_path}"}), 404
    except Exception as e:
        print(f"Delete error: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return jsonify({"message": "DDAS API is running"})

def is_safe_path(basedir, path):
    """Check if the path is safe (within base directory)"""
    # Normalize both paths for comparison
    abs_basedir = os.path.abspath(basedir)
    abs_path = os.path.abspath(os.path.join(basedir, path))
    return abs_path.startswith(abs_basedir)

if __name__ == '__main__':
    app.run(debug=True)