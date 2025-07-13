from flask import Flask, request, jsonify, render_template
import tensorflow as tf
from tensorflow import keras
from keras import layers
from keras import Model
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import pickle
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

model = tf.keras.models.load_model("artifacts/churn_model.keras")
with open("artifacts/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/debug')
def debug():
    return render_template("debug.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        app.logger.info(f"Received data: {data}")
        
        required_fields = ['CreditScore', 'Gender', 'Age', 'Tenure', 'Balance', 
                          'HasCrCard', 'IsActiveMember', 'EstimatedSalary',
                          'Geography_France', 'Geography_Germany', 'Geography_Spain',
                          'NumOfProducts_1', 'NumOfProducts_2', 'NumOfProducts_3', 'NumOfProducts_4']
        
        for field in required_fields:
            if field not in data:
                app.logger.error(f"Missing field: {field}")
                return jsonify({"error": f"Missing field: {field}"})
        
        input_data = {
            'CreditScore': float(data["CreditScore"]),
            'Gender': int(data["Gender"]),
            'Age': float(data["Age"]),
            'Tenure': float(data["Tenure"]),
            'Balance': float(data["Balance"]),
            'HasCrCard': int(data["HasCrCard"]),
            'IsActiveMember': int(data["IsActiveMember"]),
            'EstimatedSalary': float(data["EstimatedSalary"]),
            'Geography_France': int(data["Geography_France"]),
            'Geography_Germany': int(data["Geography_Germany"]),
            'Geography_Spain': int(data["Geography_Spain"]),
            'NumOfProducts_1': int(data["NumOfProducts_1"]),
            'NumOfProducts_2': int(data["NumOfProducts_2"]),
            'NumOfProducts_3': int(data["NumOfProducts_3"]),
            'NumOfProducts_4': int(data["NumOfProducts_4"])
        }
        
        input_df = pd.DataFrame([input_data])
        app.logger.info(f"Input DataFrame:\n{input_df}")
        
        cols_to_scale = ['CreditScore', 'Age', 'Tenure', 'Balance', 'EstimatedSalary']
        
        manual_scaler = MinMaxScaler()
        
        for col in cols_to_scale:
            if col == 'CreditScore':
                input_df[col] = (input_df[col] - 300) / (850 - 300)
            elif col == 'Age':
                input_df[col] = (input_df[col] - 18) / (100 - 18)
            elif col == 'Tenure':
                input_df[col] = (input_df[col] - 0) / 10
            elif col == 'Balance':
                max_balance = 250000
                input_df[col] = input_df[col] / max_balance
            elif col == 'EstimatedSalary':
                max_salary = 200000
                input_df[col] = input_df[col] / max_salary
        
        app.logger.info(f"Scaled DataFrame:\n{input_df}")
        
        input_features = input_df.values
        app.logger.info(f"Input features shape: {input_features.shape}")

        prediction = model.predict(input_features)
        app.logger.info(f"Raw prediction: {prediction}")
        
        is_churn = bool(prediction[0][0] > 0.5)
        app.logger.info(f"Final prediction: {is_churn}")

        return jsonify({"churn": is_churn})

    except Exception as e:
        app.logger.error(f"Error processing request: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)
