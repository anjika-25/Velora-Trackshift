 FROM python:3.11-slim

 WORKDIR /app

 COPY requirements.txt ./
 RUN pip install --no-cache-dir -r requirements.txt

 COPY app ./app

 EXPOSE 8000
 ENV VELORA_HOST=0.0.0.0
 ENV VELORA_PORT=8000

 CMD ["python", "-m", "app.main", "--host", "0.0.0.0", "--port", "8000"]



