FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY logic.py .
COPY api.py .
COPY app.py .

RUN mkdir -p /app/scanlogs

EXPOSE 5001

CMD ["python", "api.py"]
