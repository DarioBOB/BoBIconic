from flask import Flask, jsonify
from flask_cors import CORS
from pyflightdata import FlightData

app = Flask(__name__)
CORS(app)  # Autorise les requêtes depuis Angular

f = FlightData()

@app.route('/api/flightradar/history/<flight_number>')
def get_history(flight_number):
    try:
        data = f.get_history_by_flight_number(flight_number)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001) 