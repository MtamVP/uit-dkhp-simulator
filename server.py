import os
import requests
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

UIT_API_URL = "https://dkhpapi.uit.edu.vn/courses"

@app.route('/')
def serve_index():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return send_file(os.path.join(current_dir, 'index.html'))

@app.route('/<path:filename>')
def serve_static(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, filename)
    if os.path.exists(file_path):
        return send_file(file_path)
    return "Not Found", 404

@app.route('/api/courses', methods=['GET'])
def get_courses():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Thiếu Authorization Token"}), 401

    headers = {
        "Authorization": auth_header,
        "Accept": "application/json",
        "Origin": "https://dkhp.uit.edu.vn",
        "Referer": "https://dkhp.uit.edu.vn/"
    }
    
    try:
        response = requests.get(UIT_API_URL, headers=headers, timeout=10)
        
        if response.status_code == 401:
            return jsonify({"error": "Token hết hạn hoặc không hợp lệ"}), 401
            
        response.raise_for_status()
        
        return jsonify(response.json())
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("   BACKEND SERVER IS RUNNING AT LOCALHOST         ")
    print("=" * 50)
    print(" => Please open your browser: http://127.0.0.1:5000")
    print("=" * 50)
    app.run(host='127.0.0.1', port=5000, debug=False)
