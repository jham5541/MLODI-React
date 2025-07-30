# Use the official TensorFlow serving image as base
FROM tensorflow/serving:latest

# Copy the saved model to the container
COPY ./model /models/daily_mix_model

# Set environment variables
ENV MODEL_NAME=daily_mix_model

# Expose the port
EXPOSE 8501

# Start TensorFlow Serving
CMD ["tensorflow_model_server", "--rest_api_port=8501", "--model_name=daily_mix_model", "--model_base_path=/models/daily_mix_model"]
