from flask import Flask, request, jsonify
import pandas as pd
import joblib


app = Flask(__name__)


# ==========================================
# LOAD TRAINED MODEL
# ==========================================

model = joblib.load("blood_demand_model.pkl")


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():
    return jsonify({
        "message": "Blood Demand Prediction API is running"
    })


# ==========================================
# PREDICTION API
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        blood_group = data["blood_group"]
        date = pd.to_datetime(data["date"])

        # Create input features
        input_data = pd.DataFrame([
            {
                "blood_group": blood_group,
                "day": date.day,
                "month": date.month,
                "day_of_week": date.dayofweek
            }
        ])

        # Predict
        prediction = model.predict(input_data)[0]

        # Round prediction
        predicted_quantity = max(
            0,
            round(prediction)
        )

        return jsonify({
            "blood_group": blood_group,
            "date": date.strftime("%Y-%m-%d"),
            "predicted_demand": predicted_quantity,
            "unit": "units"
        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 400


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )