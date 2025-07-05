from flask import Flask, jsonify, request
from flask_cors import CORS
from pyflightdata import FlightData
import requests

app = Flask(__name__)
CORS(app)  # Autorise les requêtes depuis Angular

f = FlightData()

AVWX_TOKEN = "pCJJlVSPAHzmrS-1kdizPeQ-MRBGfCLRdPJ-8xB_plw"

@app.route('/api/flightradar/history/<flight_number>')
def get_history(flight_number):
    try:
        data = f.get_history_by_flight_number(flight_number)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/flightradar/photo/<registration>')
def get_photo(registration):
    try:
        photos = f.get_images_by_tail_number(registration)
        if not photos or (isinstance(photos, dict) and not any(photos.values())):
            return jsonify({'error': 'No photo found'}), 404
        return jsonify(photos)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/flightradar/metar/<iata>')
def get_metar(iata):
    try:
        metar = f.get_airport_metars(iata)
        if not metar:
            return jsonify({'error': 'No METAR found'}), 404
        return jsonify(metar)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/flightradar/metar/decoded/<iata>')
def get_metar_decoded(iata):
    try:
        metar = f.get_airport_metars(iata)
        if not metar or not isinstance(metar, list) or not metar:
            return jsonify({'error': 'No METAR found'}), 404
        raw_metar = metar[0] if isinstance(metar[0], str) else metar[0].get('raw_metar', '')
        decoded = f.decode_metar(raw_metar)
        return jsonify(decoded)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/flightradar/images/<tail_number>')
def get_images(tail_number):
    try:
        images = f.get_images_by_tail_number(
            tail_number,
            page=int(request.args.get('page', 1)),
            limit=int(request.args.get('limit', 10))
        )
        return jsonify(images)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/flightradar/airport_weather/<iata>')
def get_airport_weather(iata):
    try:
        metar = f.get_airport_metars(iata)
        if not metar or not isinstance(metar, list) or not metar:
            return jsonify({'error': 'No METAR found'}), 404
        # On prend le premier METAR (le plus récent)
        raw_metar = metar[0] if isinstance(metar[0], str) else metar[0].get('raw_metar', '')
        decoded = f.decode_metar(raw_metar)
        return jsonify(decoded)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/flightradar/airport_metars_hist/<string:iata>')
def get_metars_hist(iata):
    try:
        data = f.get_airport_metars_hist(iata)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/flightradar/airport_weather/<string:iata>')
def get_weather(iata):
    try:
        data = f.get_airport_weather(iata)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/flightradar/airport_metars/<string:iata>')
def get_latest_metar(iata):
    try:
        metars = f.get_airport_metars(iata, page=1, limit=1)
        if not metars:
            return jsonify({'error': 'No METAR found'}), 404

        latest = metars[0]
        # Cas où la méthode renvoie un dict contenant raw_metar + time
        if isinstance(latest, dict) and 'raw_metar' in latest:
            raw = latest['raw_metar']
            ts  = latest.get('time')
        else:
            # Sinon c'est très probablement une string brute
            raw = str(latest)
            ts  = None

        # On tente de décoder, mais on continue même si ça échoue
        try:
            decoded = f.decode_metar(raw)
        except Exception:
            decoded = {}

        # On renvoie toujours au moins raw_metar (+ time si dispo)
        response = {'raw_metar': raw}
        if ts is not None:
            response['time'] = ts
        # On ajoute les champs décodés, s'il y en a
        response.update(decoded)

        return jsonify(response)

    except Exception as e:
        # en dernier recours on renvoie l'erreur
        return jsonify({'error': str(e)}), 500

@app.route('/api/metar/<string:iata>', methods=['GET'])
def metar_latest(iata):
    # 1. Essaye AVWX
    try:
        headers = {"Authorization": AVWX_TOKEN}
        url = f"https://avwx.rest/api/metar/{iata}?format=json"
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            return jsonify(resp.json())
    except Exception as e:
        pass  # On tente le fallback
    # 2. Fallback pyflightdata
    try:
        mets = f.get_airport_metars(iata, page=1, limit=1)
        if not mets:
            return jsonify({'error': 'No METAR found'}), 404
        raw = mets[0]
        return jsonify({'raw_metar': raw})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metar/<string:iata>/history', methods=['GET'])
def metar_history(iata):
    # 1. Essaye AVWX
    try:
        headers = {"Authorization": AVWX_TOKEN}
        url = f"https://avwx.rest/api/metar/{iata}/history?format=json&hours=72"
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            return jsonify(resp.json())
    except Exception as e:
        pass  # On tente le fallback
    # 2. Fallback pyflightdata
    try:
        data = f.get_airport_metars_hist(iata)
        if not data:
            return jsonify({'error': 'No history found'}), 404
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metar/<string:iata>')
def get_metar_avwx(iata):
    try:
        headers = {"Authorization": AVWX_TOKEN}
        url = f"https://avwx.rest/api/metar/{iata}?format=json"
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code != 200:
            return jsonify({'error': f'AVWX error {resp.status_code}'}), 404
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metar/<string:iata>/history')
def get_metar_history_avwx(iata):
    try:
        headers = {"Authorization": AVWX_TOKEN}
        # Récupère les METAR des dernières 72h
        url = f"https://avwx.rest/api/metar/{iata}/history?format=json&hours=72"
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code != 200:
            return jsonify({'error': f'AVWX error {resp.status_code}'}), 404
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 